# AGENTS.md — Pi package development

This repository contains a public Pi package for [pi-coding-agent](https://pi.dev/). Before changing code, read the relevant upstream Pi source and documentation in the installed `@earendil-works/pi-coding-agent` package, especially its package, extension, settings, and UI APIs. Treat the selected Pi API version as the compatibility contract.

## Development procedure

1. Discuss the problem and agree on scope.
2. Create or update a todo with concrete acceptance criteria. Record important design decisions and departures from the original plan in that todo.
3. Create a task branch; keep `master` stable.
4. Develop with checkpoint commits. Prefer red → green → refactor when testable.
5. Run checks, package validation, and installation checks, plus type checking, tests, and coverage.
6. Request peer review against the todo and this file.
7. Address findings in new commits, then merge only after approval.

Do not redesign behavior or expand platform support without an explicit todo.

## Tooling

- Use npm and the committed lockfile: `npm ci` for clean installs. Target Node >=22.19.0 and exact development Pi 1.5.2 APIs; keep host peers at `"*"`.
- Biome owns formatting and baseline linting. Use 2-space indentation; do not add Prettier or ESLint.
- `npm run check` may write safe Biome fixes. `npm run check:ci` must not modify files. Portable checks, hooks and CI must not require private anti-slop tooling or paths.
- Run any separate centralized local anti-slop checks against an explicit owned file scope; retain baseline/candidate diagnostics and require zero introduced findings. Do not vendor or bootstrap rules into this package; preserve existing ignored local tooling.
- Prek installs through a guarded `prepare` script during development and runs the mutating Biome check before commits. Production-only Pi Git installs skip hook installation.
- `npm run typecheck` verifies the pinned development Pi API surface.
- Use Vitest for tests and V8 coverage for extension code.


## Engineering discipline

- Prefer TDD. If automated testing is impractical, document focused manual testing.
- Use FCIS: isolate pure planning, parsing, transformation, and formatting from filesystem, process, network, and UI side effects.
- Design extension code with precise TypeScript types.

- Apply KISS, DRY, and YAGNI.
- Preserve public commands, tools, shortcuts, resource paths, settings, and platform limitations unless an approved todo changes them.
- Keep imported Pi APIs in `peerDependencies` with a `"*"` range and pin them in `devDependencies` for type checking. Keep non-Pi runtime imports in `dependencies`.

- Keep the `pi` manifest explicit. Package filtering must be documented and experimental resources must be manifest-excluded.

## Shared notes and provenance

Only reviewed root `.pi/docs/**` notes may be tracked; root settings and other
local `.pi` state remain ignored. Do not reopen nested globally ignored `.pi`
directories. Git ignores, lint scope and npm files allowlists are separate.

The v0.3.0 Copier answers record original generation. Pi 1.5.2 tooling is a
manual adoption of reviewed local baseline 0835070 plus ignore correction
7174522 (both unpushed), not a remote template update.

## Release procedure

Use npm-compatible three-component CalVer `YYYY.M.D`; release tags are annotated
`v<version>` tags. Same-day version policy requires owner agreement; do not
publish four-component versions.

1. Complete automated checks and focused local/Git install validation.
2. Update `CHANGELOG.md` and `package.json`.
3. Merge approved work.
4. Create and push the annotated release tag.
5. Verify installation using that immutable tag or its reviewed commit SHA.

## Review checklist

Reviewers must check:

- Conformance to the todo and acceptance criteria.
- Test coverage and manual-test evidence where appropriate.
- Manifest/resource paths, filtering, local installation, and immutable Git installation.
- Pi API compatibility, peer/runtime dependency placement, and package contents from `npm pack --dry-run`.
- FCIS, modularity, KISS, DRY, and YAGNI discipline.
- Preservation of public behavior and documented platform limits.
- For visible UI changes, screenshot review unless a human explicitly waives it.
