---
title: label usage windows by duration
status: open
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

- [ ] Derive each user-facing usage-window label from `limit_window_seconds`, not its primary/secondary position.
- [ ] Label the observed Prolite weekly primary window correctly.
- [ ] Preserve ordinary five-hour and weekly labels when their durations match.
- [ ] Use a truthful fallback for unknown durations without inventing a known period.
- [ ] Add focused normalization and render tests with Prolite and ordinary fixtures.
- [ ] Keep the first `pi-usage` release blocked until this is fixed and reviewed.

## Affected Files

- `extensions/usage.ts` — ChatGPT window normalization and card titles.
- `test/usage.test.ts` — duration fixtures and rendering assertions.

## Notes

This is intentionally deferred from the move-only extraction. Do not change
provider behavior, credentials, or endpoint handling while resolving it.
