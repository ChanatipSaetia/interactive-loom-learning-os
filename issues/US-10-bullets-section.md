---
id: US-10
title: "Bullets Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: []
---

# US-10: Bullets Section

## What to build

Reusable section for bullet and numbered lists. Supports nested lists, checkable items, and styled bullet markers.

## Features

- Unordered lists with custom bullet markers
- Ordered/numbered lists
- Nested list support (up to 2 levels)
- Optional checkable items (user can check off)
- Optional anime.js stagger animation (items appear one by one)

## Configuration

```typescript
interface BulletsConfig {
  items: Array<{
    text: string
    checked?: boolean
    children?: BulletsConfig['items']
  }>
  type: 'unordered' | 'ordered' | 'checklist'
  animation?: 'stagger' | 'none'
}
```

## Design

- Bullet markers: primary `#17171c` dots or coral `#ff7759` for unordered
- Numbered: mono-label styling for numbers
- Checkable: pale-green `#edfce9` checkmark when checked
- Line height: 1.7 for list items
- Nested: 24px left indent

## Acceptance criteria

- [ ] Unordered list renders with custom bullet markers
- [ ] Ordered list renders with numbered items
- [ ] Nested lists indent correctly
- [ ] Checkable items toggle checked state
- [ ] Stagger animation reveals items sequentially
- [ ] Section registers with SectionRegistry
- [ ] Unit tests pass for list rendering

## E2E infrastructure required

None. Unit tests sufficient for list rendering.

## Blocked by

US-2.
