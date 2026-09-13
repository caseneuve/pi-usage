---
title: resolve anti slop lint findings
status: completed
priority: high
type: refactor
labels: [release-blocker, tooling]
created: 2026-09-13
parent: null
blocked-by: []
blocks: []
---

## Context

The configured anti-slop Oxlint plugin exposes pre-existing violations in the
literal source move and tests: readable-spacing rules, unparsed `unknown`
boundaries, runtime `typeof` narrowing, unsafe dictionary assertions, and test
assertions without safety explanations. The generated Prek hook now runs this
plugin for local checks.

## Acceptance Criteria

- [x] Resolve anti-slop findings in `extensions/usage.ts` by introducing explicit boundary parsing/types without changing provider, credential, endpoint, or display behavior.
- [x] Resolve test and script readability/safety findings while preserving existing assertions and mocked-HTTP coverage.
- [x] `npx oxlint` passes with every configured anti-slop rule enabled at error severity.
- [x] `npm run check` passes after the package's Biome and Oxlint checks.
- [x] Keep the vendored plugin local and untracked; retain its provenance record.

## Affected Files

- `extensions/usage.ts` — external response/auth parsing and readable spacing.
- `test/usage.test.ts` and `scripts/install-prek-hook.mjs` — test safety comments and readable spacing.
- `oxlint.config.ts` — enabled policy, if a documented configuration adjustment is necessary.

## Notes

This is a release blocker discovered while bootstrapping the required anti-slop
plugin. Do not suppress rules, weaken severities, or use casts to launder the
findings.

## Implementation Decisions

- Use the Pi-supported `typebox` peer package to decode auth files and HTTP JSON
  at their I/O boundaries; pin the development copy to the version used by the
  selected Pi API.
- Keep existing backend order, credential precedence, URLs, request method, and
  rendered labels/cards unchanged.
- Apply anti-slop's safe spacing fixes separately from semantic boundary work.

## Validation

- `npm ci`
- `npm run check`
- `npm run typecheck`
- `npm test` (31 tests)
- `npm run test:coverage` (86.15% statements, 90.65% lines)
- `npm run pack:check` (six intended package files)
- Local tarball installation and Jiti extension import
- Production-only install from immutable local Git commit `32ae66a`
- Vendored plugin remains ignored; `tools/oxlint/anti-slop/UPSTREAM.md`
  retains its provenance record.

## Review Follow-up

- Independent Herdr reviewer `usage-review` found that strict parsing of the
  optional reset-credit extension could fail the entire ChatGPT overlay.
- Preserve best-effort reset-count handling by decoding each optional count
  independently from the otherwise-required ChatGPT response contract.
- Add HTTP-level coverage proving malformed applicability does not suppress a
  valid available count or the rest of the overlay.
- Commit `c72808e` addressed the finding; independent re-review by
  `usage-review` approved the branch with no remaining findings. Review:
  `.reviews/dev-0004-resolve-anti-slop-2026-09-13-174744.md`.
