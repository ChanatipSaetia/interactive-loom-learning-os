# Issue 002: Phase 1 — process-simulation Subdomain Migration

## What to build

Relocate `flowchart` (including `abstract-flow/` sub-module) and `scenario` components and help modals from `src/sections/` into `src/core/subdomains/process-simulation/`. Update all caller imports across `src/components/editor/forms/`, `src/core/okf/`, `src/core/delivery/adapters/`, and `libs/loom-sections.tsx`. Delete `src/sections/flowchart/` and `src/sections/scenario/`.

## Acceptance criteria

- [ ] `flowchart` components & `abstract-flow/` sub-module moved to `src/core/subdomains/process-simulation/`.
- [ ] `scenario` components & modals moved to `src/core/subdomains/process-simulation/`.
- [ ] All editor form and OKF pipeline imports updated to use `src/core/subdomains/process-simulation` or domain barrel.
- [ ] Legacy directories `src/sections/flowchart/` and `src/sections/scenario/` deleted.
- [ ] `npm run typecheck` and `npm run test` pass cleanly.

## Blocked by

- #103 (Phase 0 — Centralized Domain Barrel Export)

