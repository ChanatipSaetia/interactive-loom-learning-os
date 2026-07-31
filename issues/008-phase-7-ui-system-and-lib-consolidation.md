# Issue 008: Phase 7 — UI System & Lib Consolidation

## What to build

Consolidate top-level `src/lib/` and `src/context/` into `src/core/ui-system/` and `src/core/hooks/` to establish full alignment with Generic Subdomain #12 (Design System & Sensory Experience) in `docs/agents/domain.md`.

Specifically:
- Relocate `src/lib/ease.ts` -> `src/core/ui-system/motion/ease.ts` (or `src/core/ui-system/ease.ts`) and update callers.
- Relocate `src/context/SoundContext.tsx` -> `src/core/ui-system/sound/` and update callers.
- Relocate `src/lib/hooks/use-hover-capable.ts` -> `src/core/hooks/use-hover-capable.ts` or `src/core/ui-system/hooks/`.
- Relocate `src/lib/utils.ts` -> `src/core/ui-system/utils.ts` or `src/core/util/utils.ts`.
- Delete top-level legacy directories `src/lib/` and `src/context/`.

## Acceptance criteria

- [ ] `ease.ts` relocated into `src/core/ui-system/` and all imports updated.
- [ ] `SoundContext.tsx` consolidated under `src/core/ui-system/` and imports updated.
- [ ] `use-hover-capable.ts` and `utils.ts` relocated into `src/core/` domain packages.
- [ ] Top-level `src/lib/` and `src/context/` directories eliminated.
- [ ] `npm run typecheck` and `npm run test` pass cleanly with 0 errors.

## Blocked by

- #109 (Phase 6 Documentation & Final Verification)
