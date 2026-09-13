import { promises as fs } from "node:fs";
import type { ExtensionAPI, ExtensionCommandContext, ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";
import { type Component, type Terminal, type TUI, visibleWidth } from "@earendil-works/pi-tui";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as usage from "../extensions/usage.ts";

type CustomCallback = Parameters<ExtensionUIContext["custom"]>[0];

type CustomKeybindings = Parameters<CustomCallback>[2];

type ResetCountFixture = number | string | boolean | null | undefined;

type ResetCreditsFixture =
  | { available_count?: ResetCountFixture; applicable_available_count?: ResetCountFixture }
  | number
  | readonly (readonly never[])[]
  | null
  | undefined;

function unreadCallbackValue<T>(): T {
  // SAFETY: The caller uses this only for custom-component callback values that the factory deliberately ignores.
  return undefined as T;
}

const FETCHED_AT = 1_788_685_700_000;

const responseFixture = {
  user_id: "test-user",
  account_id: "test-account",
  email: "test@example.invalid",
  plan_type: "pro",
  rate_limit: {
    allowed: true,
    limit_reached: false,
    primary_window: {
      used_percent: 20,
      limit_window_seconds: 18_000,
      reset_after_seconds: 3_600,
      reset_at: 1_788_689_300,
    },
    secondary_window: {
      used_percent: 89,
      limit_window_seconds: 604_800,
      reset_after_seconds: 63_000,
      reset_at: 1_788_748_700,
    },
  },
  code_review_rate_limit: null,
  additional_rate_limits: [],
  credits: {
    has_credits: false,
    unlimited: false,
    balance: "0",
    approx_local_messages: [0, 0],
    approx_cloud_messages: [0, 0],
  },
  promo: null,
};

const proliteResponseFixture = {
  ...responseFixture,
  plan_type: "prolite",
  rate_limit: {
    ...responseFixture.rate_limit,
    primary_window: {
      used_percent: 25,
      limit_window_seconds: 604_800,
      reset_after_seconds: 520_490,
      reset_at: 1_789_836_298,
    },
    secondary_window: null,
  },
};

function snapshot(resetCredits: ResetCreditsFixture) {
  // SAFETY: Malformed reset-credit fixtures deliberately exceed the decoded production type to verify defensive rendering.
  return usage.normalizeChatGptSnapshot(
    {
      ...responseFixture,
      rate_limit_reset_credits: resetCredits,
    } as Parameters<typeof usage.normalizeChatGptSnapshot>[0],
    FETCHED_AT,
  );
}

function resetCard(resetCredits: ResetCreditsFixture) {
  return snapshot(resetCredits).cards.find((card) => card.title === "Usage limit resets");
}

function createTestTui(requestRender: () => void): TUI {
  const terminal: Terminal = {
    start() {},
    stop() {},
    async drainInput() {},
    write() {},
    get columns() {
      return 120;
    },
    get rows() {
      return 40;
    },
    get kittyProtocolActive() {
      return false;
    },
    moveBy() {},
    hideCursor() {},
    showCursor() {},
    clearLine() {},
    clearFromCursor() {},
    clearScreen() {},
    setTitle() {},
    setProgress() {},
  };

  return {
    mode: "regular",
    children: [],
    terminal,
    fullRedraws: 0,
    render() {
      return [];
    },
    invalidate() {},
    addChild() {},
    removeChild() {},
    clear() {},
    getShowHardwareCursor() {
      return false;
    },
    setShowHardwareCursor() {},
    getClearOnShrink() {
      return false;
    },
    setClearOnShrink() {},
    setFocus() {},
    showOverlay() {
      throw new Error("Overlays are not used in this test");
    },
    hideOverlay() {},
    hasOverlay() {
      return false;
    },
    start() {},
    stop() {},
    renderNow() {},
    requestRender,
    addInputListener() {
      return () => {};
    },
    removeInputListener() {},
    onTerminalColorSchemeChange() {
      return () => {};
    },
    setTerminalColorSchemeNotifications() {},
    async queryTerminalBackgroundColor() {
      return undefined;
    },
    async queryTerminalColorScheme() {
      return undefined;
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("/usage reset credits", () => {
  test("the registered command renders ordinary and Prolite windows across refresh using only GET requests", async () => {
    let available = 3;
    let chatGptResponse: typeof responseFixture | typeof proliteResponseFixture = responseFixture;
    const requests: Array<{ url: string; method: string }> = [];
    vi.spyOn(fs, "readFile").mockImplementation(async (file) => {
      if (String(file).endsWith("/.codex/auth.json")) {
        return JSON.stringify({ tokens: { access_token: "test-codex-token" } });
      }

      if (String(file).endsWith("/.pi/agent/auth.json")) {
        return JSON.stringify({ openrouter: { key: "test-openrouter-key" } });
      }

      throw new Error(`Unexpected file read: ${file}`);
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      requests.push({ url, method: init?.method ?? "GET" });
      expect(init?.signal).toBeInstanceOf(AbortSignal);

      if (url === "https://chatgpt.com/backend-api/wham/usage") {
        return Response.json({
          ...chatGptResponse,
          rate_limit_reset_credits: {
            available_count: available,
            applicable_available_count: available === 3 ? 0 : "malformed",
          },
        });
      }

      if (url === "https://openrouter.ai/api/v1/key") {
        return Response.json({ data: { usage_daily: 0, is_free_tier: false } });
      }

      if (url === "https://openrouter.ai/api/v1/credits") {
        return Response.json({ data: { total_credits: 10, total_usage: 2 } });
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    let handler!: (args: string, ctx: ExtensionCommandContext) => Promise<void>;

    // SAFETY: The extension test double implements the only API member read during registration.
    usage.default({
      registerCommand(name, command) {
        expect(name).toBe("usage");
        handler = command.handler;
      },
    } as ExtensionAPI);

    let component!: Component;
    let ready!: () => void;

    const nextReadyRender = () =>
      new Promise<void>((resolve) => {
        ready = resolve;
      });

    // SAFETY: The component exercises only foreground coloring and bold styling from the injected theme.
    const theme = {
      fg: (_tone: string, text: string) => text,
      bold: (text: string) => text,
    } as Theme;

    let closed = false;

    // SAFETY: The command test double supplies every context member the /usage handler reads.
    await handler("", {
      hasUI: true,
      model: { provider: "openai-codex", id: "gpt-5" },
      ui: {
        async custom(factory) {
          const loaded = nextReadyRender();
          component = await factory(
            createTestTui(() => {
              if (component?.render(120).join("\n").includes("Fetched")) {
                ready();
              }
            }),
            theme,
            unreadCallbackValue<CustomKeybindings>(),
            () => {
              closed = true;
            },
          );
          await loaded;
        },
      },
    } as ExtensionCommandContext);

    for (const width of [80, 120]) {
      const lines = component.render(width);
      const text = lines.join("\n");
      expect(text).toContain("5 hour usage limit");
      expect(text).toContain("Weekly usage limit");
      expect(text).toContain("Usage limit resets");
      expect(text).toContain("3 available");
      expect(text).toContain("Currently applicable: 0");
      expect(text).toContain("Credits remaining");
      expect(lines.every((line) => visibleWidth(line) <= width)).toBe(true);
    }

    available = 2;
    chatGptResponse = proliteResponseFixture;
    const refreshed = nextReadyRender();
    component.handleInput?.("r");
    await refreshed;
    expect(component.render(120).join("\n")).toContain("Weekly usage limit");
    expect(component.render(120).join("\n")).not.toContain("5 hour usage limit");
    expect(component.render(120).join("\n")).toContain("2 available");
    expect(component.render(120).join("\n")).not.toContain("3 available");
    expect(component.render(120).join("\n")).not.toContain("Currently applicable");
    expect(requests).toHaveLength(6);
    expect(requests.every((request) => request.method === "GET")).toBe(true);
    expect(requests.filter((request) => request.url.includes("chatgpt.com"))).toEqual([
      { url: "https://chatgpt.com/backend-api/wham/usage", method: "GET" },
      { url: "https://chatgpt.com/backend-api/wham/usage", method: "GET" },
    ]);
    component.handleInput?.("q");
    expect(closed).toBe(true);
  });
});

describe("normalizeChatGptSnapshot usage-window titles", () => {
  test("labels ordinary windows from their five-hour and weekly durations", () => {
    const result = usage.normalizeChatGptSnapshot(responseFixture, FETCHED_AT);

    expect(result.cards.slice(0, 2).map((card) => card.title)).toEqual(["5 hour usage limit", "Weekly usage limit"]);
  });

  test("labels a Prolite weekly primary window as weekly", () => {
    const result = usage.normalizeChatGptSnapshot(proliteResponseFixture, FETCHED_AT);

    expect(result.planLabel).toBe("Prolite");
    expect(result.cards.map((card) => card.title)).toEqual(["Weekly usage limit", "Credits remaining"]);
  });

  test("uses a generic title for an unrecognized duration", () => {
    const result = usage.normalizeChatGptSnapshot(
      {
        ...proliteResponseFixture,
        rate_limit: {
          ...proliteResponseFixture.rate_limit,
          primary_window: {
            ...proliteResponseFixture.rate_limit.primary_window,
            limit_window_seconds: 86_400,
          },
        },
      },
      FETCHED_AT,
    );

    expect(result.cards[0]?.title).toBe("Usage limit");
  });
});

describe("normalizeChatGptSnapshot reset credits", () => {
  test("keeps total available separate from currently applicable", () => {
    expect(resetCard({ available_count: 3, applicable_available_count: 0 })).toEqual({
      title: "Usage limit resets",
      value: "3 available",
      subtitle: "Currently applicable: 0",
      tone: "accent",
    });
    expect(resetCard({ available_count: 3, applicable_available_count: 2 })?.subtitle).toBe("Currently applicable: 2");
  });

  test("shows an explicit zero rather than hiding exhausted reset credits", () => {
    expect(resetCard({ available_count: 0, applicable_available_count: 0 })).toEqual({
      title: "Usage limit resets",
      value: "0 available",
      subtitle: "Currently applicable: 0",
      tone: "muted",
    });
  });

  test.each([undefined, null, -1, 1.5, "2", true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 4])(
    "does not invent applicability from invalid/missing %p",
    (applicable) => {
      const card = resetCard({
        available_count: 3,
        applicable_available_count: applicable,
      });

      expect(card?.value).toBe("3 available");
      expect(card?.subtitle).toBeUndefined();
    },
  );

  test.each([
    undefined,
    null,
    {},
    3,
    [[]],
    { applicable_available_count: 3 },
    ...[null, -1, 1.5, "3", true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map((available_count) => ({
      available_count,
    })),
  ])("omits missing or malformed reset credits %p without changing other cards", (credits) => {
    expect(resetCard(credits)).toBeUndefined();
    expect(snapshot(credits).cards).toEqual(snapshot(undefined).cards);
  });

  test("preserves existing cards and uses the supplied fetch timestamp", () => {
    const baseline = usage.normalizeChatGptSnapshot(responseFixture, FETCHED_AT);
    const result = snapshot({ available_count: 3 });
    expect(baseline.cards.map((card) => card.title)).toEqual([
      "5 hour usage limit",
      "Weekly usage limit",
      "Credits remaining",
    ]);
    expect({
      ...result,
      cards: result.cards.filter((card) => card.title !== "Usage limit resets"),
    }).toEqual(baseline);
    expect(result.fetchedAt).toBe(FETCHED_AT);
  });
});
