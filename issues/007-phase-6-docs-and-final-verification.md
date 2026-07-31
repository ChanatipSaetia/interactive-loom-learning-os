# Issue 007: Phase 6 — Documentation Realignment & Final Workspace Audit

## What to build

Clean up all remaining legacy references to `src/sections/` in `AGENTS.md`, `docs/agents/domain.md`, and `grill-log-refactoring.md`. Run full workspace static typing, linting, and test suites (`npm run typecheck`, `npm run lint`, `npm run test`) to verify total realignment.

## Acceptance criteria

- [ ] `AGENTS.md` and `docs/agents/domain.md` updated to remove all legacy `src/sections/` re-export requirements.
- [ ] No remaining references to `src/sections/` in codebase or docs.
- [ ] `npm run typecheck`, `npm run lint`, and `npm run test` all pass cleanly with 0 errors.

## Blocked by

- #108 (Phase 5 practice-assessment & Directory Elimination)

