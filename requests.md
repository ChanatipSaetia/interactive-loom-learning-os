# Situation-Based Choice Section

## Problem

The current `choice` and `drag-drop` sections present options in isolation. The learner sees pros/cons but lacks **context** — they don't know which choice applies to *their* situation, or why one would be preferred over another in a real-world scenario.

- `choice` — lists options with pros/cons; learner picks one at random to expand
- `drag-drop` — matches items to categories; tests rote memorization, not judgment

Neither teaches **decision-making**, which is the actual skill needed.

## Vision

Replace both with a **situation-based recommendation** flow:

```
Situation (scenario description)
  ↓
Recommended Choice (highlighted, with reasoning)
  ↓
Alternative Choices (with pros/cons relative to the situation)
```

The learner reads a real-world scenario, sees what an experienced engineer would choose, and understands *why* — including what the alternatives offer and when they'd be appropriate instead.

## New Section: `situation-choice`

### Data Model

```ts
export interface ChoiceOption {
  id: string
  label: string
  description: string
  pros: string[]
  cons: string[]
  /** For non-recommended choices: when to use instead. */
  whenToUse?: string
}

export interface RecommendationDetail {
  /** Why this choice is recommended for THIS situation */
  why: string
}

export interface SituationChoice {
  /** Short label for dropdown and heading */
  title: string
  /** Real-world scenario the learner is facing */
  situation: string
  /** ID of the recommended choice (references choices[].id) */
  recommended: string
  /** Why the recommended choice fits — always visible, separate from choice cards */
  recommendationDetail: RecommendationDetail
  /** All choices — one matches the recommended ID */
  choices: ChoiceOption[]
}

export interface SituationChoiceSectionProps {
  title?: string
  situations: SituationChoice[]
}
```

### UX Flow

1. **Situation card** appears with a scenario description (e.g., "You need to build a real-time collaboration feature for a document editor used by 10K concurrent users.")
2. **Recommendation detail** (always visible) — a persistent card/banner showing `why` the recommended choice fits this situation. This stays on screen even when selecting other alternatives.
3. **Choice cards** render as an **accordion** — exactly one card always open, with the recommended card open by default:
   - The recommended card is highlighted with a "Recommended" badge
   - Non-recommended cards show their `whenToUse` as "When to use instead"
   - When expanded: shows description, pros (green bullets), cons (red bullets)
4. **Summary modal** — a "Compare All" button opens a modal showing every choice side-by-side in a 2-column grid with as many rows as needed. Each choice in the summary shows only:
   - Label as a bullet point
   - Pros listed with a green Lucide `Check` icon
   - Cons listed with a red Lucide `X` icon
   - The recommended choice is highlighted with a "Recommended" badge
   - The `recommendationDetail.why` text appears above the grid as a persistent note
   - Modal is dismissible with Escape key and clicking outside
   - Focus returns to the previously selected choice card on close
5. If multiple situations exist, a **dropdown** lets the learner select which situation to view

### Example Content

**Situation:** "You're building a dashboard that needs to show live stock prices updating every second to 50K concurrent users."

**Recommended: WebSocket**
- Why: Real-time push with low latency; server controls update frequency; efficient for high-frequency data to many clients
- Pros: Sub-second latency, bidirectional, efficient at scale
- Cons: More complex server infrastructure, connection management overhead

**Alternative: REST Polling**
- Pros: Simple to implement, works behind any firewall, browser-native
- Cons: Wasteful bandwidth (polling empty states), higher latency, server load scales with poll frequency
- When to use instead: When updates are infrequent (< once/minute) or when you can't control the client

**Alternative: Server-Sent Events (SSE)**
- Pros: Simpler than WebSocket (unidirectional), auto-reconnect built-in, works over HTTP
- Cons: One-way only (server→client), not all browsers support equally well
- When to use instead: When you only need server→client updates and want simpler code than WebSocket

## Implementation Plan

### Phase 1: New section component

1. Install `@radix-ui/react-dialog` for accessible modal
2. Reuse the custom dropdown pattern from `flowchart` for situation selection
3. Create `src/sections/situation-choice/` with:
   - `index.tsx` — component with situation display, recommended choice highlight, expandable alternatives, summary modal
   - `situation-choice.css` — styling per COHERE design system
4. Register in `SectionRegistry`
5. Add to `src/core/routes.ts` type union

### Phase 2: Replace existing sections in AI Agent topic

Replace the `drag-drop` and `choice` sections in `src/topics/ai-agent/sections.ts` with `situation-choice` sections:

**Situation 1 — Orchestration Strategy**
- Situation: "You're building an AI agent to research and summarize a topic. The task is well-defined, linear, and doesn't require parallel work."
- Recommended: ReAct Loop
- Alternatives: Multi-Agent Pipeline

**Situation 2 — Component Placement**
- Situation: "You're designing the memory subsystem for an AI agent that needs to recall facts across sessions."
- Recommended: Vector DB + Embeddings (Memory Layer)
- Alternatives: Code Sandbox (Tool Layer), Chain-of-Thought (Reasoning Layer)

### Phase 3: Cleanup

- Remove `drag-drop` section and its tests
- Remove `choice` section and its tests

## Design Details

### Visual Hierarchy

- Situation: contextual banner with a scenario icon, subtle background
- Recommendation detail: persistent card with a green accent, always visible, shows `why` the pick is recommended
- Recommended choice: elevated card with a "Recommended" badge, green accent
- Alternative choices: accordion items, muted until expanded
- Compare All button: placed below situation dropdown, above accordion; triggers summary modal with 2-column grid
- Summary modal: compact view showing only label, pros (Lucide `Check`), and cons (Lucide `X`) per choice
- Pros: green bullet, Cons: red bullet (consistent with existing choice section)

### Animations

- Situation card fades/slides in
- Recommendation detail banner fades in
- Recommended choice reveals with a subtle emphasis animation
- Accordion expand/collapse uses anime.js for smooth height animation

## Benefits Over Current Approach

| Aspect | Current (choice + drag-drop) | New (situation-choice) |
|--------|------------------------------|------------------------|
| Teaches | Memorization of pros/cons | Decision-making under context |
| Engagement | Click to expand | Read scenario → understand recommendation |
| Realism | Options in vacuum | Mirrors real engineering trade-offs |
| Retention | Low (rote recall) | High (story-based learning) |
| Reuse | Generic list | Situation-driven, more specific |
