# Issue 1: Core Section Result Contract & Evaluation Interfaces

**Type:** `AFK`
**Status:** Ready for Implementation
**Source:** grill-log-gamification.md (Q2, Implied Story 1)

## What to build

Expose a standardized `SectionResultContract` interface and evaluation callbacks (`onResultChange`, `onEvent`) across all 5 Core Learning Sub-Context components (`QuizSection`, `ReflectionSequenceSection`, `TradeoffSandboxSection`, `ProcessSimulationSection`, and `ProgressiveContentSection`). This provides external bounded contexts (Gamification, Learner Progress) with a uniform, decoupled contract for reading interactive learning results in real time.

```typescript
export interface SectionResultContract<TPayload = unknown> {
  sectionId: string
  sectionType: string
  status: 'in_progress' | 'completed' | 'failed'
  score?: number // Normalized 0-100
  accuracy?: number // 0.0 to 1.0
  completedAt?: number
  payload: TPayload
}
```

## Acceptance criteria

- [ ] Define `SectionResultContract` in core contracts and sub-context type definitions.
- [ ] Implement `onResultChange` and `onEvent` props on `<QuizSection>` emitting score, accuracy, and question option selections.
- [ ] Implement `onResultChange` on `<ReflectionSequenceSection>` emitting completion status and decrypted challenges.
- [ ] Implement `onResultChange` on `<TradeoffSandboxSection>` emitting current calculated metric state and constraint satisfaction.
- [ ] Implement `onResultChange` on `<TextSection>` and `<IntroSection>` emitting reading engagement events.
- [ ] Unit tests verifying that core section components emit standardized result payloads on user interaction.
- [ ] `npm run typecheck` and `npm run test` pass.

## Blocked by

- None - can start immediately.
