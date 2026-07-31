# Issue 004: Phase 3 — reflection-synthesis Subdomain Migration

## What to build

Relocate `reflection-sequence` and `reflection-template` components and help modals from `src/sections/` into `src/core/subdomains/reflection-synthesis/`. Update all caller imports across editor forms, OKF pipeline, single-html embed adapter, and `libs/loom-sections.tsx`. Delete legacy directories `src/sections/reflection-sequence/` and `src/sections/reflection-template/`.

## Acceptance criteria

- [ ] `reflection-sequence` and `reflection-template` components & modals moved to `src/core/subdomains/reflection-synthesis/`.
- [ ] All editor form, OKF pipeline, and `libs/loom-sections.tsx` imports updated to use domain barrel or subdomain paths.
- [ ] Legacy directories `src/sections/reflection-sequence/` and `src/sections/reflection-template/` deleted.
- [ ] `npm run typecheck` and `npm run test` pass cleanly.

## Blocked by

- #103 (Phase 0 — Centralized Domain Barrel Export)

