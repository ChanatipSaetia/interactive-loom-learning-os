---
id: US-4
title: "ArchitectureFlow Section"
type: AFK
dependencies: ["US-2"]
e2eInfra: ["Playwright"]
---

# US-4: ArchitectureFlow Section

## What to build

Reusable section component that renders animated SVG architecture diagrams. Shows system components, connections, and data flow paths with anime.js animations.

## Features

- SVG-based rendering for precision diagrams
- Configurable nodes (boxes, circles, icons) and edges (lines, arrows)
- anime.js timeline for:
  - Sequential node appearance
  - Edge drawing animation (stroke-dasharray trick)
  - Pulse/glow effects on active paths
- Play/pause/step controls via `useAnimation` hook

## Configuration

```typescript
interface ArchitectureFlowConfig {
  nodes: Array<{id, label, x, y, shape, color}>
  edges: Array<{from, to, label, color}>
  animationOrder: string[]  // sequence of node/edge IDs
}
```

## Design

- Flat SVG, no shadows
- Primary `#17171c` for nodes on white canvas
- Coral `#ff7759` accent for highlights
- Thin-line geometric style per Cohere spec

## Acceptance criteria

- [ ] Section renders SVG diagram from config
- [ ] Nodes appear in configured sequence on animation play
- [ ] Edges draw with stroke animation
- [ ] Play/pause/step controls work correctly
- [ ] Section registers with SectionRegistry
- [ ] E2E: Playwright verifies SVG renders and animation controls respond

## E2E infrastructure required

Playwright for SVG rendering and animation control tests.

## Blocked by

US-2.
