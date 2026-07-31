# Issue 003: Phase 2 — tradeoff-sandbox Subdomain Migration

## What to build

Relocate `tradeoff-sandbox`, `formula-sandbox`, and `decision-tree` components and help modals from `src/sections/` into `src/core/subdomains/tradeoff-sandbox/`. Update all caller imports across editor forms, OKF pipeline, single-html embed adapter, and `libs/loom-sections.tsx`. Delete legacy directories `src/sections/tradeoff-sandbox/`, `formula-sandbox/`, and `decision-tree/`.

## Acceptance criteria

- [ ] `tradeoff-sandbox`, `formula-sandbox`, and `decision-tree` components & modals moved to `src/core/subdomains/tradeoff-sandbox/`.
- [ ] All editor form, OKF pipeline, and `libs/loom-sections.tsx` imports updated to use domain barrel or subdomain paths.
- [ ] Legacy directories `src/sections/tradeoff-sandbox/`, `src/sections/formula-sandbox/`, and `src/sections/decision-tree/` deleted.
- [ ] `npm run typecheck` and `npm run test` pass cleanly.

## Blocked by

- #103 (Phase 0 — Centralized Domain Barrel Export)

