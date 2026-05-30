---
id: US-8
title: "Choice Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: ["Playwright"]
---

# US-8: Choice Section

## What to build

Reusable section for presenting design choices with pros and cons. User selects options and sees comparison feedback.

## Features

- Multiple choice options displayed as cards
- Each option has pros (checkmarks) and cons (X marks)
- User clicks to select an option
- Selection reveals detailed explanation
- Side-by-side comparison when multiple selected
- Uses `useState` for selection state

## Configuration

```typescript
interface ChoiceConfig {
  question: string
  options: Array<{
    id: string
    title: string
    description: string
    pros: string[]
    cons: string[]
    details?: React.ReactNode
  }>
  mode: 'single' | 'multiple'
}
```

## Design

- Option cards: white with `#f2f2f2` border, 8px radius
- Selected: action-blue `#1863dc` border, pale-blue `#f1f5ff` background
- Pros: green checkmarks
- Cons: coral `#ff7759` X marks
- Card headings: 24px feature-heading

## Acceptance criteria

- [ ] Options render as selectable cards
- [ ] Click toggles selection (single mode: only one selected)
- [ ] Pros/cons display with icons
- [ ] Selected option shows expanded details
- [ ] Selection state persists during topic session
- [ ] Section registers with SectionRegistry
- [ ] E2E: Playwright clicks options and verifies selection state

## E2E infrastructure required

Playwright for click interaction and state verification.

## Blocked by

US-2.
