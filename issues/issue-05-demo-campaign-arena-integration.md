# Issue 5: Topic Demo Campaign Manifest & Encounter Arena Integration

**Type:** `AFK`
**Status:** Ready for Implementation

## What to build

1. Author `public/hexmaps/demo.yaml` declaring the full hex map campaign for the `demo` topic, referencing real OKF sections (`intro`, `quiz`, `reflection-sequence`, `tradeoffs`).
2. Refactor `src/core/supporting/gamification/components/GamificationDemoView.tsx` and encounter modals to replace hardcoded mock datasets with real sub-context components mounted dynamically.
3. Integrate live combat arena feedback, timed reflection decryption modal, trade-off forge preview, and multi-phase boss fight with item action buttons.

## Acceptance criteria

- [ ] Create `public/hexmaps/demo.yaml` referencing real `demo` OKF sections.
- [ ] Connect `GamificationDemoView.tsx` to `useGamification('demo')` port hook.
- [ ] Render real `<QuizSection>`, `<ReflectionSequenceSection>`, `<TradeoffSandboxSection>`, `<IntroSection>`, and `<TextSection>` inside encounter modals.
- [ ] Wire `onResultChange` to combat turn damage, sanctuary healing ticks, artifact crafting, and item unlocks.
- [ ] Enable Boss Lair unlock with Adapter Shield & Port Blade item special actions.
- [ ] E2E/Playwright test verifying complete demo campaign playthrough.
- [ ] `npm run typecheck`, `npm run test`, and `npm run build` pass.

## Blocked by

- Issue 1: Core Section Result Contract & Evaluation Interfaces
- Issue 2: Hex Map Campaign Schema, Ingestion & 3-Tier Validation Gateway Integration
- Issue 3: Gamification Domain Engine (Rules, Buff/Vulnerability Synthesis & Time-Decay Healing)
- Issue 4: Hexagonal Ports, Adapters & Dual-Tier State Persistence
