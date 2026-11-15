# pi-usage

Subscription usage and credit visibility for [Pi](https://pi.dev/).

## Resource and usage

`extensions/usage.ts` provides `/usage` in Pi's interactive TUI (not RPC/print).

- `/usage` — open the dashboard; fetch only on opening
- `r` — refresh; superseded requests are cancelled
- `q` or `esc` — close; pending requests are cancelled

Supported backends are ChatGPT subscription `/backend-api/wham/usage` and
OpenRouter `/api/v1/key` plus best-effort `/api/v1/credits`. All requests are
GET-only; opening/refreshing does not consume resets. An unavailable backend
stays visible without hiding another backend's useful data.

ChatGPT reads `tokens.access_token` from `~/.codex/auth.json`. OpenRouter uses
`OPENROUTER_MANAGEMENT_KEY`, then `OPENROUTER_API_KEY`, then the `openrouter.key`
entry in `~/.pi/agent/auth.json` (a literal key or the name of an environment
variable). Command-based key resolution is not supported; set an environment
variable instead. These existing HOME-based paths are unchanged; the dashboard
does not refresh credentials, execute credential commands, or use model-provider
auth resolution. Do not share auth files or account identifiers in bug reports.

The white-panel display includes duration-labelled usage windows, separate
available/currently applicable reset counts when supplied, ChatGPT add-on
credits, and OpenRouter account credit/daily spend information. Missing windows
are not invented; unknown balances remain unknown. Model highlighting is
heuristic. Short terminals can clip a tall dashboard; widen/enlarge the terminal
to see all cards. Refresh and close remain available while loading.

## Install

Compatibility target: **Pi 1.5.2, Node >=22.19.0**. Host-provided API peers remain
`"*"` per Pi's package contract; this is not a claim of testing every host version.

Review extension source before loading: it runs with Pi's OS permissions and
can read credentials and access the network. For a local checkout:

```bash
cd /absolute/path/to/pi-usage
npm ci
pi install /absolute/path/to/pi-usage       # personal package declaration
# Alternatively, from a separate project:
pi install -l /absolute/path/to/pi-usage    # project .pi/settings.json
```

Local paths load in place, without copying. Pi does not install or modify local
package dependencies; checkout setup is a separate step. Project packages load
only after project trust is granted. Declining trust skips project resources;
`--approve` is a one-process trust override, not a sandbox. Restart or `/reload`
after resource/settings changes.

For reproducible managed installs, use a reviewed immutable tag or commit:

```bash
pi install git:github.com/caseneuve/pi-usage@<reviewed-tag-or-commit-sha>
```

Pi installs production dependencies for managed Git/npm sources, suppressing
automatic host peers. The guarded `prepare` helper exits successfully when the
local development-only Prek binary is absent; production installs need no Prek.

### Filters and identity

Package object filters narrow the explicit manifest; use manifest-relative paths:

```json
{
  "packages": [{
    "source": "/absolute/path/to/pi-usage",
    "extensions": ["extensions/usage.ts"]
  }]
}
```

Omitting `extensions` loads all declared extensions; `"extensions": []` disables
them. Filters cannot expose undeclared resources. `pi config` (or `pi config -l`)
controls resources interactively. Local package identity is its resolved absolute
path; another checkout, a managed Git install, or an old broad extension loader
can still duplicate `/usage`. Do not install both implementations.

`pi update` alone updates Pi itself. `pi update --extensions` reconciles packages;
local source changes belong to Git/checkouts. Pinned refs do not advance to new
refs. To roll back, restore the previous reviewed checkout/ref and reload or
restart. `pi remove [-l] /absolute/path/to/pi-usage` removes that declaration;
it does not delete the checkout.

## Development and provenance

```bash
npm ci
npm run verify
npm run test:coverage
npm run pack:check
```

Biome owns portable formatting/lint (`check` applies safe fixes, `check:ci` does
not mutate); TypeScript checks exact host API pins and Vitest provides V8
coverage. `prepare` installs the local Prek hook only when its development binary
exists. The hook runs Biome; review/stage any fixes. No private Oxlint/plugin
checkout is required by public scripts, CI, hooks or runtime. Separate local
centralized anti-slop checks use an explicit scope and baseline/candidate
fingerprints; they are not part of the portable gate.

The npm `files` allowlist ships only the extension, public docs/license and the
guarded lifecycle script; tests, todos, local settings, coverage and tooling are
not runtime resources. Reviewed root `.pi/docs/**` notes may be tracked; other
root `.pi` state remains ignored, without reopening nested globally ignored
`.pi` directories. Git ignores and npm filtering are independent.

`.copier-answers.yml` records original generation from template v0.3.0. This
migration manually adopts reviewed local Copier baseline `0835070` plus ignore
correction `7174522` (unpushed); it is **not** a remote `copier update`. Package
metadata, implementation and tests remain repository-owned.

Migration evidence is maintained separately from shipped resources. Fixture UI
proof does not establish real authenticated external-provider API compatibility;
those checks need separately authorized credentials.

## Releases

Use npm-compatible three-component CalVer `YYYY.M.D`, annotated `v<version>` tags,
and reviewed immutable installation refs. Agree a valid same-day version policy
before releasing; four-component versions are not npm SemVer. Run verify,
coverage, pack and installation checks before an approved release. No migration
work authorizes publication, push, merge, tag or user settings cutover.

## License

[MIT](LICENSE), Copyright (c) 2026 caseneuve.
