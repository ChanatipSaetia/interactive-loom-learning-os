# Issue 006: Phase 5 — practice-assessment Subdomain Migration & Legacy Directory Elimination

## What to build

Relocate `quiz`, `flashcards`, and `concept-map` components and help modals from `src/sections/` into `src/core/subdomains/practice-assessment/`. Update all caller imports across editor forms, OKF pipeline, single-html embed adapter, and `libs/loom-sections.tsx`. Delete `src/sections/quiz/`, `flashcards/`, `concept-map/`, and remove the legacy `src/sections/` directory completely.

## Acceptance criteria

- [ ] `quiz`, `flashcards`, and `concept-map` components & modals moved to `src/core/subdomains/practice-assessment/`.
- [ ] All editor form, OKF pipeline, and `libs/loom-sections.tsx` imports updated to use domain barrel or subdomain paths.
- [ ] Parent legacy directory `src/sections/` completely deleted.
- [ ] `npm run typecheck` and `npm run test` pass cleanly.

## Blocked by

- #104 (Phase 1 process-simulation)
- #105 (Phase 2 tradeoff-sandbox)
- #106 (Phase 3 reflection-synthesis)
- #107 (Phase 4 progressive-content)

