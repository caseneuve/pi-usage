import { promises as fs } from "node:fs";
import type { ExtensionAPI, ExtensionCommandContext, ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";
import { type Component, visibleWidth } from "@earendil-works/pi-tui";
import { afterEach, expect, test, vi } from "vitest";
import usage from "../extensions/usage.ts";
import { createTestTui } from "./tui-fixture.ts";

type UsageComponent = Component & { dispose?: () => void };

type CustomFactory = Parameters<ExtensionUIContext["custom"]>[0];

const chatGpt = {
  email: "fixture@example.invalid",
  plan_type: "prolite",
  rate_limit: null,
  credits: null,
};

function ignoredCallbackValue<T>(): T {
  // SAFETY: The usage factory deliberately ignores the injected keybindings argument.
  return undefined as T;
}

function fixtureAuth() {
  vi.stubEnv("OPENROUTER_MANAGEMENT_KEY", "");
  vi.stubEnv("OPENROUTER_API_KEY", "");

  return vi
    .spyOn(fs, "readFile")
    .mockImplementation(async (file) =>
      String(file).includes(".codex")
        ? JSON.stringify({ tokens: { access_token: "fixture-codex" } })
        : JSON.stringify({ openrouter: { key: "fixture-router" } }),
    );
}

function fixtureFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    if (String(input).includes("chatgpt.com")) return Response.json(chatGpt);

    if (String(input).endsWith("/key")) {
      return Response.json({ data: { label: "fixture-openrouter-key", usage_daily: 1.25, is_free_tier: false } });
    }

    return Response.json({ data: { total_credits: "10", total_usage: "2.5" } });
  });
}

async function openOverlay(mode: ExtensionCommandContext["mode"] = "tui") {
  let handler: ((args: string, ctx: ExtensionCommandContext) => Promise<void>) | undefined;

  // SAFETY: Registration reads only registerCommand; the captured handler is checked before invocation.
  usage({
    registerCommand: (_name, command) => {
      handler = command.handler;
    },
  } as ExtensionAPI);

  if (!handler) throw new Error("usage command not registered");

  let component: UsageComponent | undefined;
  const requestRender = vi.fn();
  const done = vi.fn();
  const notify = vi.fn();

  const customCalls = vi.fn();

  async function custom<T>(factory: CustomFactory): Promise<T> {
    customCalls();
    // SAFETY: The factory reads only requestRender from TUI, fg/bold from theme, and ignores keybindings.
    component = await factory(
      createTestTui(requestRender),
      { fg: (_tone, text) => text, bold: (text) => text } as Theme,
      ignoredCallbackValue<Parameters<CustomFactory>[2]>(),
      done,
    );

    // SAFETY: The command ignores custom's result; the fixture closes through the captured done callback.
    return undefined as T;
  }

  // SAFETY: The command reads only these UI methods; TUI behavior is captured by the fixture above.
  const ui: Pick<ExtensionUIContext, "custom" | "notify"> = { custom, notify };

  // SAFETY: This test context supplies every member read by the command; no model is needed for these cases.
  await handler("", {
    mode,
    hasUI: mode === "tui" || mode === "rpc",
    // SAFETY: The handler only reads these two UI methods.
    ui: ui as ExtensionUIContext,
  } as ExtensionCommandContext);

  return { component, requestRender, done, notify, custom: customCalls };
}

async function ready(component: UsageComponent | undefined) {
  if (!component) throw new Error("missing usage component");

  await vi.waitFor(() => expect(component.render(120).join("\n")).toContain("Fetched"));

  return component;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test.each(["rpc", "print", "json"] as const)("rejects %s without fetching or invoking a TUI factory", async (mode) => {
  const auth = fixtureAuth();
  const fetch = fixtureFetch();
  const result = await openOverlay(mode);

  expect(result.custom).not.toHaveBeenCalled();
  expect(result.notify).toHaveBeenCalledWith("/usage requires interactive mode", "error");
  expect(auth).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

test("a missing ChatGPT credential leaves useful OpenRouter data visible", async () => {
  fixtureAuth().mockImplementation(async (file) => {
    if (String(file).includes(".codex")) throw new Error("Fixture: Codex credentials unavailable");

    return JSON.stringify({ openrouter: { key: "fixture-router" } });
  });
  fixtureFetch();
  const component = await ready((await openOverlay()).component);
  const text = component.render(120).join("\n");

  expect(text).toContain("ChatGPT subscription");
  expect(text).toContain("Fixture: Codex credentials unavailable");
  expect(text).toContain("OpenRouter credits");
  expect(text).toContain("$7.50");
  expect(text).toContain("$1.25");
});

test("empty ChatGPT usage does not invent windows, and every narrow line fits", async () => {
  fixtureAuth();
  fixtureFetch();
  const component = await ready((await openOverlay()).component);
  const text = component.render(120).join("\n");

  expect(text).toContain("Prolite");
  expect(text).not.toContain("usage limit");

  for (const width of [1, 2, 8, 20, 40, 47, 48, 80, 120]) {
    expect(
      component.render(width).every((line) => visibleWidth(line) <= width),
      `width ${width}`,
    ).toBe(true);
  }
});

test("OpenRouter management key wins and account-credits failure is best effort", async () => {
  fixtureAuth();
  vi.stubEnv("OPENROUTER_MANAGEMENT_KEY", "fixture-management");
  vi.stubEnv("OPENROUTER_API_KEY", "fixture-api");

  const fetch = fixtureFetch().mockImplementation(async (input, init) => {
    if (String(input).includes("chatgpt.com")) return Response.json(chatGpt);

    expect(init?.headers).toMatchObject({ Authorization: "Bearer fixture-management" });

    if (String(input).endsWith("/credits")) return new Response(null, { status: 403 });

    return Response.json({ data: { usage_daily: 0, is_free_tier: true } });
  });

  const component = await ready((await openOverlay()).component);
  const text = component.render(120).join("\n");

  expect(text).toContain("Free tier");
  expect(text).toContain("Unknown");
  expect(text).toContain("Account credits endpoint unavailable (403)");
  expect(fetch).toHaveBeenCalledTimes(3);
});

test("command-based OpenRouter credentials are never executed", async () => {
  fixtureAuth().mockImplementation(async (file) =>
    String(file).includes(".codex")
      ? JSON.stringify({ tokens: { access_token: "fixture-codex" } })
      : JSON.stringify({ openrouter: { key: "!do-not-execute" } }),
  );
  const fetch = fixtureFetch();
  const component = await ready((await openOverlay()).component);

  expect(component.render(120).join("\n")).toContain("command-based key resolution");
  expect(fetch).toHaveBeenCalledTimes(1);
});

test.each(["close", "dispose", "refresh"] as const)(
  "%s cancels pending fetches and stale results cannot repaint",
  async (action) => {
    fixtureAuth();
    const pending: Array<{ signal: AbortSignal | null | undefined; resolve: (value: Response) => void }> = [];

    fixtureFetch().mockImplementation(
      (_input, init) =>
        new Promise((resolve) => {
          pending.push({ signal: init?.signal, resolve });
        }),
    );
    const result = await openOverlay();
    const component = result.component;

    if (!component) throw new Error("missing usage component");

    await vi.waitFor(() => expect(pending).toHaveLength(2));
    expect(component.render(40).join("\n")).toContain("Fetching usage");

    const old = pending.slice();

    if (action === "close") component.handleInput?.("\u001b");
    else if (action === "dispose") component.dispose?.();
    else component.handleInput?.("r");

    expect(old.every((request) => request.signal?.aborted)).toBe(true);

    const renders = result.requestRender.mock.calls.length;

    for (const request of old) request.resolve(Response.json(chatGpt));

    await vi.waitFor(() => expect(result.requestRender).toHaveBeenCalledTimes(renders));
    expect(component.render(40).join("\n")).toContain("Fetching usage");

    if (action === "close") expect(result.done).toHaveBeenCalledOnce();

    component.dispose?.();
  },
);
