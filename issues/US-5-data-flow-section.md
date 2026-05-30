---
id: US-5
title: "DataFlow Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: ["Playwright"]
---

# US-5: DataFlow Section

## What to build

Reusable section component that visualizes data flowing through a system with animated particles along paths. Shows request/response patterns, message passing, and data transformation.

## Features

- SVG canvas with defined flow paths
- Animated particles/dots moving along paths using anime.js motion paths
- Step-by-step mode: highlights one flow at a time
- Labels at flow origin and destination
- Play/pause/step controls via `useAnimation` hook

## Configuration

```typescript
interface DataFlowConfig {
  flows: Array<{
    id: string
    path: string  // SVG path data
    label: string
    color: string
    direction: 'left-to-right' | 'top-to-bottom' | 'custom'
  }>
  steps: string[]  // flow IDs for step mode
}
```

## Design

- Particle dots: 6-8px, action-blue `#1863dc` default
- Path lines: hairline `#d9d9dd`
- Flow labels: mono-label typography
- White canvas background

## Acceptance criteria

- [ ] Section renders SVG paths and particle animations
- [ ] Particles move along configured paths
- [ ] Step mode highlights one flow at a time
- [ ] Play/pause/step controls work correctly
- [ ] Section registers with SectionRegistry
- [ ] E2E: Playwright verifies animation renders and controls respond

## E2E infrastructure required

Playwright for animation rendering and control tests.

## Blocked by

US-2.
