# pi-usage

Subscription usage and credit visibility for [Pi](https://pi.dev/).

## Resource

- `extensions/usage.ts` provides the `/usage` overlay.

The overlay fetches data only when opened. It supports the ChatGPT subscription
`/backend-api/wham/usage` endpoint and OpenRouter `/api/v1/key` plus
`/api/v1/credits` endpoints.

## Usage

- `/usage` — open the overlay
- `r` — refresh
- `q` or `esc` — close

It reads a ChatGPT subscription token from `~/.codex/auth.json`. OpenRouter
uses `OPENROUTER_MANAGEMENT_KEY` or `OPENROUTER_API_KEY`, falling back to the
`openrouter` entry in `~/.pi/agent/auth.json`. Command-based OpenRouter key
resolution is not supported; set an environment variable instead.

The display includes timed usage windows, separate available and currently
applicable usage-limit reset counts when supplied, ChatGPT add-on credits, and
OpenRouter key/account credit information. Opening and refreshing are GET-only
and do not consume resets. Model-to-backend highlighting is heuristic.

## Install

Install a reviewed immutable release in normal use:

```bash
pi install git:github.com/caseneuve/pi-usage@<reviewed-tag-or-commit-sha>
```

Use an annotated release tag or reviewed commit SHA. Do not use a moving branch
name for a reproducible installation.

Pi filters package resources through an object entry in `packages`. Omit a
resource key to load everything of that type; use an empty array to disable it.
For example:

```json
{
  "packages": [{
    "source": "git:github.com/caseneuve/pi-usage@<reviewed-tag-or-commit-sha>",
    "extensions": ["extensions/usage.ts"]
  }]
}
```

Use `pi config` (or `pi config -l` for project settings) to enable or disable
individual resources.

## Development

For a new local checkout, initialize Git and create the committed lockfile once:

```bash
npm install
```

Before committing the initial lockfile, install Dillon Mulroy's current
anti-slop skill rather than copying a plugin from another checkout:

```bash
npx skills add dmmulroy/anti-slop --skill install-anti-slop
```

Then use the installed `install-anti-slop` skill. It installs its plugin locally,
updates the matching Oxlint development dependencies, merges rules into the
tracked `oxlint.config.ts`, and validates the result.
`tools/oxlint/anti-slop/` is gitignored: commit only repository-specific
configuration, dependency changes, and the lockfile. Bootstrap the plugin after
each fresh clone before running local checks.

After the lockfile is committed, use clean installs:

```bash
npm ci
npm run verify
npm run test:coverage
npm run pack:check
```

`npm install` runs `prepare`, which installs the [Prek](https://github.com/j178/prek)
hook when the development dependency is present. Production-only Pi Git installs
skip hook installation safely. The hook runs Biome and may apply safe formatting
fixes. Review and stage any hook changes before committing again.

Run all hooks explicitly with:

```bash
npx prek run --all-files
```

`npm run check` applies Biome formatting/lint fixes and runs Oxlint with the
required local anti-slop plugin. `npm run typecheck` checks the pinned Pi API,
and Vitest provides extension tests and coverage. `npm run check:ci` intentionally
runs only the non-mutating Biome baseline; CI runs type checking and tests
separately without installing the local plugin.

## Releases

This project uses npm-compatible CalVer: `YYYY.M.D[.PATCH]`. Before a release:

1. Run `npm run verify`, `npm run test:coverage`, and `npm run pack:check`.
2. Update `CHANGELOG.md` and `package.json` with the release version.
3. Merge approved work to `master`.
4. Create an annotated tag named `v<version>`.
5. Verify installation with that immutable tag or a reviewed commit SHA.

## License

[MIT](LICENSE), Copyright (c) 2026 caseneuve.
