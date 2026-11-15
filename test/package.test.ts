import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

type PackageManifest = {
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  dependencies?: Record<string, string>;
  engines: { node: string };
  files: string[];
  keywords: string[];
  pi: { extensions: string[] };
  scripts: Record<string, string>;
};

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// SAFETY: This is repository-owned metadata; the relevant manifest contract is asserted below.
const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8")) as PackageManifest;

test("declares only the retained usage resource and ships it deliberately", () => {
  expect(packageJson.keywords).toContain("pi-package");
  expect(packageJson.pi).toEqual({ extensions: ["./extensions/usage.ts"] });
  expect(packageJson.files).toEqual(["README.md", "LICENSE", "CHANGELOG.md", "scripts", "extensions"]);

  for (const entry of packageJson.pi.extensions) {
    expect(existsSync(resolve(repositoryRoot, entry)), entry).toBe(true);
  }
});

test("uses host-provided peers and exact development compatibility pins", () => {
  expect(packageJson.engines.node).toBe(">=22.19.0");
  expect(packageJson.dependencies).toBeUndefined();
  expect(packageJson.peerDependencies).toEqual({
    "@earendil-works/pi-coding-agent": "*",
    "@earendil-works/pi-tui": "*",
    typebox: "*",
  });
  expect(packageJson.devDependencies).toMatchObject({
    "@earendil-works/pi-coding-agent": "1.5.2",
    "@earendil-works/pi-tui": "1.5.2",
    typebox: "1.3.27",
  });
});

test("portable checks have no private tooling dependency and prepare is shipped", () => {
  for (const script of ["check", "check:ci", "typecheck", "test", "test:coverage", "verify", "pack:check", "prepare"]) {
    expect(packageJson.scripts[script]).toBeTruthy();
  }

  expect(Object.values(packageJson.scripts).join("\n")).not.toMatch(/oxlint|anti-slop|\/home\//);
  expect(packageJson.devDependencies.oxlint).toBeUndefined();
  expect(packageJson.devDependencies["@oxlint/plugins"]).toBeUndefined();
  expect(existsSync(resolve(repositoryRoot, "oxlint.config.ts"))).toBe(false);
  expect(existsSync(resolve(repositoryRoot, "scripts/install-prek-hook.mjs"))).toBe(true);
});
