# Issue 001: Phase 0 — Centralized Domain Barrel Export & AGENTS.md Update

## What to build

Create the centralized domain barrel export at `src/core/subdomains/index.ts` re-exporting all subdomains (process-simulation, tradeoff-sandbox, reflection-synthesis, progressive-content, practice-assessment). Update `AGENTS.md` rule #1 to establish `src/core/subdomains/` as the canonical source for section components and schemas, marking `src/sections/` as deprecated.

## Acceptance criteria

- [ ] `src/core/subdomains/index.ts` created, cleanly re-exporting bounded context contracts and renderers.
- [ ] `AGENTS.md` updated declaring `src/core/subdomains/` as canonical.
- [ ] Workspace compiles cleanly with `npm run typecheck`.

## Blocked by

None - can start immediately.
