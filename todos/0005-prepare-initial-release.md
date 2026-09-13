---
title: prepare initial release
status: done
priority: high
type: chore
labels: [release]
created: 2026-09-13
parent: null
blocked-by: []
blocks: []
---

## Context

Prepare the first reviewed `pi-usage` release without creating a release,
pushing, or tagging. The package needs a CalVer release version, a changelog
entry, and current validation evidence.

## Acceptance Criteria

- [x] Set the package version to `2026.9.13`.
- [x] Move the initial extraction entry from Unreleased to a dated changelog release section.
- [x] Pass formatting, Oxlint, typecheck, tests, coverage, and package-content validation.
- [x] Validate an isolated local-path installation.
- [x] Record that immutable Git-ref validation and tag/push/release creation require explicit authorization.

## Affected Files

- `package.json` and `package-lock.json` — CalVer release candidate version.
- `CHANGELOG.md` — initial release entry.

## Notes

Do not create or push an annotated tag, publish, or create a GitHub release as
part of preparation.

Validation on 2026-09-13: `npm run check`, `npm run typecheck`, `npm test`
(34 tests), `npm run test:coverage`, and `npm run pack:check` passed. An
isolated `PI_CODING_AGENT_DIR` local-path installation succeeded. Immutable
Git-ref installation, tag creation/push, and GitHub release creation remain
explicit human-authorized release steps.
