---
id: US-7
title: "DragDrop Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: ["Playwright"]
---

# US-7: DragDrop Section

## What to build

Reusable interactive section where users drag items to drop zones. Used for matching exercises, categorization, and comparison activities.

## Features

- Draggable items (cards or chips)
- Drop zones with visual feedback on hover
- Validation: correct/incorrect placement with color feedback
- Reset button to restart exercise
- Score tracking (optional)
- Uses HTML5 drag-and-drop or @dnd-kit/core

## Configuration

```typescript
interface DragDropConfig {
  items: Array<{id: string, label: string, correctZone: string}>
  zones: Array<{id: string, label: string, icon?: string}>
  onValidate?: (placements: Record<string, string[]>) => void
}
```

## Design

- Draggable items: soft-stone `#eeece7` background, 8px radius
- Drop zones: bordered `#d9d9dd`, highlight on hover
- Correct: pale-green `#edfce9` feedback
- Incorrect: coral `#ff7759` feedback
- Reset: secondary button

## Acceptance criteria

- [ ] Items are draggable with cursor feedback
- [ ] Drop zones highlight on drag hover
- [ ] Items snap to drop zones on release
- [ ] Validation shows correct/incorrect feedback colors
- [ ] Reset button returns items to original positions
- [ ] Section registers with SectionRegistry
- [ ] E2E: Playwright drags item to zone and validates feedback

## E2E infrastructure required

Playwright for drag-and-drop interaction tests.

## Blocked by

US-2.
