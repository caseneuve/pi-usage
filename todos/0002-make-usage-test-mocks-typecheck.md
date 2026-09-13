---
title: make usage test mocks typecheck
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

The moved Bun test passes under Vitest, but the package's stricter TypeScript
check rejects its mocked `ui.custom` factory: the mock is typed as returning a
possibly asynchronous component and its TUI argument is incomplete.

## Acceptance Criteria

- [x] Model the mocked `ui.custom` callback with the supported Pi 0.85.1 TUI and component types.
- [x] Preserve the existing command/render/refresh and GET-only assertions.
- [x] `npm run typecheck` passes.
- [x] `npm test` still passes.

## Affected Files

- `test/usage.test.ts` — typed Pi UI mock.

## Notes

This stricter-check failure was present in the extracted test shape and is a
release blocker. The test now supplies a complete typed TUI fixture, awaits the
potentially async custom-component factory, and uses the pinned Pi keybindings
manager implementation; no Pi UI contract is cast away.
