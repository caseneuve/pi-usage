---
title: resolve anti slop lint findings
status: open
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

- [ ] Resolve anti-slop findings in `extensions/usage.ts` by introducing explicit boundary parsing/types without changing provider, credential, endpoint, or display behavior.
- [ ] Resolve test and script readability/safety findings while preserving existing assertions and mocked-HTTP coverage.
- [ ] `npx oxlint` passes with every configured anti-slop rule enabled at error severity.
- [ ] `npm run check` passes after the package's Biome and Oxlint checks.
- [ ] Keep the vendored plugin local and untracked; retain its provenance record.

## Affected Files

- `extensions/usage.ts` — external response/auth parsing and readable spacing.
- `test/usage.test.ts` and `scripts/install-prek-hook.mjs` — test safety comments and readable spacing.
- `oxlint.config.ts` — enabled policy, if a documented configuration adjustment is necessary.

## Notes

This is a release blocker discovered while bootstrapping the required anti-slop
plugin. Do not suppress rules, weaken severities, or use casts to launder the
findings.
