# Section Type: `pillar-layer` (Layer Stacked Lego Architecture)

**Subdomain**: `progressive-content`  
**Mental Model Focus**: Pure Vertical Layer Stack & Lego Block Architecture. Maps system components as Lego building blocks that stack bottom-to-top across architectural layers (Y-axis), with multi-width spanning, L-shaped polygon geometries, relative offset matrices (`offsets`), and detailed inspection drawers.

---

## Wireframe & Visual Layout

![Layer Stacked Lego Architecture Wireframe](../assets/layer_stack_wireframe.jpg)

---

## File Structure & Placement

```
public/okf/[topic-id]/sections/pillar-layer/
├── section.md           # Section descriptor pointing to matrix.yaml
└── matrix.yaml          # Standard OKF Layer Stack / Lego Block schema definition
```

---

## Section Frontmatter (`section.md`)

```yaml
---
type: pillar-layer
title: "Layer Stacked Architecture"
description: "Vertical layer stack demonstrating Lego block building and polygon slotting."
resource: matrix.yaml
---
```

---

## Data Structure (`matrix.yaml`)

```yaml
type: pillar-layer
title: "Hexagonal Architecture (Layer Stack)"
description: "Architecture stack demonstrating how Lego blocks stack across layers and fit together without gaps."

layers:
  - id: "l-ui"
    title: "Channels & API Gateway Tier"
    description: "Inbound adapters, GraphQL, and REST Edge endpoints."

  - id: "l-services"
    title: "Application Services Tier"
    description: "Orchestration, session managers, and application services."

  - id: "l-infra"
    title: "Infrastructure Tier"
    description: "Database adapters, key vaults, and message queues."

matrix_blocks:
  - id: "b-l-controller"
    title: "L-Shaped IAM Controller"
    description: "Spans Application Services and Infrastructure layers."
    layer_id: "l-services"
    col_span: 2
    row_span: 2
    shape: "l-bottom-left"
    color: "mauve"

  - id: "b-corner-service"
    title: "Order Processor"
    description: "Slots into the top-right cutout of the L-block."
    layer_id: "l-services"
    col_span: 1
    row_span: 1
    offsets:
      - [0, 1]
    color: "green"
```

---

## Key Fields & Zod Schema Types

| Entity | Field | Type | Description |
|---|---|---|---|
| **Layer** | `id` | `string` | Unique layer row identifier |
| | `title` | `string` | Layer row title |
| | `description`| `string?` | Layer description text |
| **Matrix Block** | `id` | `string?` | Unique block identifier |
| | `title` | `string` | Component title |
| | `description`| `string?` | Detail description |
| | `layer_id` | `string?` | Primary anchor layer ID |
| | `col_span` | `number?` | Column span width |
| | `row_span` | `number?` | Row span height |
| | `shape` | `"rect"` \| `"l-bottom-left"` \| `"l-bottom-right"` \| `"l-top-left"` \| `"l-top-right"` | Preset Lego shape geometry |
| | `offsets` | `Array<[row_offset, col_offset]>?` | Relative offset tuples relative to anchor layer `[dr, dc]` |
| | `color` | `string?` | Catppuccin accent: `rosewater`, `flamingo`, `pink`, `mauve`, `red`, `maroon`, `peach`, `yellow`, `green`, `teal`, `sky`, `sapphire`, `blue`, or `lavender` |

---

## Pedagogical & UX Features

- **Pure Layer Stacking Engine**: System components are organized strictly into horizontal architectural layer rows.
- **Relative Offset Matrices (`offsets`)**: Authors define arbitrary Lego shapes via relative grid offsets `[dr, dc]` relative to the anchor layer.
- **L-Shape & Polygon Clip Paths**: Renders L-shaped blocks using CSS `clip-path` polygons while allowing smaller Lego pieces to slot into cutouts without collision errors.
- **Detail Drawer & Keyboard Accessibility**: Click or press `Enter`/`Space` to open detail drawer modal; press `Escape` or click close button to dismiss.
