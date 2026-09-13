---
title: align usage with package quality gates
status: done
priority: high
type: chore
labels: [release-blocker, tooling]
created: 2026-09-13
parent: null
blocked-by: []
blocks: []
---

## Context

The literal `usage.ts` move fails the generated package's Biome/Oxlint gate:
imports need organization/type-only syntax, the file is not formatted to the
package's Biome configuration, and `COLOR_TEXT` plus `formatModel` are unused.

## Acceptance Criteria

- [x] Apply the package's Biome formatting and import organization without changing behavior.
- [x] Resolve or deliberately remove the two unused source declarations.
- [x] Preserve `/usage`, provider matching, credentials, endpoints, rendering, and tests.
- [x] `npm run check:ci` passes.

## Affected Files

- `extensions/usage.ts` — formatting, imports, and unused declarations.

## Notes

This stricter quality-gate failure was a release blocker discovered during the
move-only extraction. Biome formatting and import organization are applied, and
the unused `COLOR_TEXT` and `formatModel` declarations were removed.
