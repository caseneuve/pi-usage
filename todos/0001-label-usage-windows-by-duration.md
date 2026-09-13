---
title: label usage windows by duration
status: in_progress
priority: high
type: bug
labels: [release-blocker, chatgpt]
created: 2026-09-13
parent: null
blocked-by: []
blocks: []
---

## Context

ChatGPT normalization assumes `primary_window` is a five-hour limit and
`secondary_window` is weekly. A live Prolite response instead reported a
weekly-duration primary window, so the overlay labeled a reset roughly six days
away as a five-hour limit.

## Acceptance Criteria

- [x] Derive each user-facing usage-window label from `limit_window_seconds`, not its primary/secondary position.
- [x] Label the observed Prolite weekly primary window correctly.
- [x] Preserve ordinary five-hour and weekly labels when their durations match.
- [x] Use a truthful fallback for unknown durations without inventing a known period.
- [x] Add focused normalization and render tests with Prolite and ordinary fixtures.
- [ ] Keep the first `pi-usage` release blocked until this is fixed and reviewed.

## Affected Files

- `extensions/usage.ts` — ChatGPT window normalization and card titles.
- `test/usage.test.ts` — duration fixtures and rendering assertions.

## Notes

This is intentionally deferred from the move-only extraction. Do not change
provider behavior, credentials, or endpoint handling while resolving it.

### Implementation plan and decisions

- Recognize the API's exact five-hour (`18_000`) and weekly (`604_800`)
  durations in one pure title-formatting helper.
- Render unknown durations as the generic `Usage limit`; omitting an unrecognized
  period is preferable to inventing a familiar period from window position.
- Keep primary/secondary ordering unchanged; only title selection changes.
- A sanitized live Prolite request on 2026-09-13 confirmed a `200` response with
  `plan_type: prolite`, a `604_800`-second `primary_window`, and no
  `secondary_window`. No account identifier or credential was retained.
- Cover ordinary, Prolite, and unknown-duration normalization, plus ordinary →
  Prolite command rendering across refresh.

### Validation

- `npm run verify` — passed (34 tests).
- `npm run check` — passed, including repository anti-slop rules.
- `npm run test:coverage` — passed; `extensions/usage.ts` has 90.79% line
  coverage and 98.24% function coverage.
- `npm run pack:check` — passed; the package contains the declared usage
  extension and expected public files only.
- Temporary-home local Pi install loaded the `usage` extension command in RPC
  mode.
- Temporary `git://localhost` install pinned to commit `cce8572` checked out a
  detached immutable commit and loaded the `usage` extension command in RPC
  mode.
- Automated render assertions cover both 80- and 120-column output. Human
  screenshot review remains pending under the repository UI review policy.
