# Issue 005: Phase 4 — progressive-content Subdomain Migration

## What to build

Relocate `text`, `intro`, `bullets`, `taxonomy-browser`, and `image-gallery` components and help modals from `src/sections/` into `src/core/subdomains/progressive-content/`. Update all caller imports across editor forms, OKF pipeline, single-html embed adapter, and `libs/loom-sections.tsx`. Delete legacy directories `src/sections/text/`, `intro/`, `bullets/`, `taxonomy-browser/`, and `image-gallery/`.

## Acceptance criteria

- [ ] `text`, `intro`, `bullets`, `taxonomy-browser`, and `image-gallery` components & modals moved to `src/core/subdomains/progressive-content/`.
- [ ] All editor form, OKF pipeline, and `libs/loom-sections.tsx` imports updated to use domain barrel or subdomain paths.
- [ ] Legacy directories `src/sections/text/`, `intro/`, `bullets/`, `taxonomy-browser/`, and `image-gallery/` deleted.
- [ ] `npm run typecheck` and `npm run test` pass cleanly.

## Blocked by

- #103 (Phase 0 — Centralized Domain Barrel Export)

