# 0001 — Unified Flowchart component replaces architecture-flow and data-flow

## Context
The project had two separate visualization components: `architecture-flow` (nodes + edges with sequential highlighting) and `data-flow` (paths + particles). Both were rigid, technology-specific, and could not express multiple journeys (e.g., Register, Checkout) through the same diagram.

## Decision
Replace both with a single **Flowchart** component that:

- Renders all nodes (rectangles with `<<stereotype>>`, Lucide icon, label) and edges (straight lines, arrowheads, no labels) visible from the start
- Supports multiple **journeys** — ordered step sequences through the nodes, selected via dropdown
- Animates step-by-step: highlights the current node, shows a particle traveling along the edge to the next node, and displays a description near the highlighted node
- Playback controls: Play (auto-advance), Pause, Next (advance one step). No Step Back, no Reset.
- Uses top-to-bottom auto-layout with barycenter distribution within layers; author can override layer assignments; nodes are draggable (session-only, connections follow)
- Smart placement for step descriptions (avoids overlap with other nodes/edges)
- Zoom + pan on mobile via SVG viewBox

## Consequences
- `src/sections/architecture-flow/` and `src/sections/data-flow/` will be removed
- New `src/sections/flowchart/` component with richer configuration model
- Existing demo topic sections using `architecture-flow` and `data-flow` must migrate to `flowchart`
- Auto-layout algorithm adds complexity but reduces authoring burden
- Session-only drag means no persistence layer needed
