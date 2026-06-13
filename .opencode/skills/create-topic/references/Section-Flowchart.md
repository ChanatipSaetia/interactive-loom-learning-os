# Section: Flowchart

Auto-laid flowchart with pan/zoom, node drag, and animated journey playback. The most powerful section type.

A single `UnifiedFlowchartSchema` can render **four distinct diagram views** that the user switches between via a view selector. Each view reveals a different aspect of the system.

## The Four Views

| View | Purpose | See |
|---|---|---|
| **SYS_ARCH** | What components exist and how they connect | [Section-Flowchart-SysArch.md](Section-Flowchart-SysArch.md) |
| **EVENT_STORMING** | Temporal, behavioral flow of events through the domain | [Section-Flowchart-EventStorming.md](Section-Flowchart-EventStorming.md) |
| **DATA_FLOW** | How data transforms as it passes through the system | [Section-Flowchart-DataFlow.md](Section-Flowchart-DataFlow.md) |
| **SWIMLANES** | Which responsibility zone handles each step | [Section-Flowchart-Swimlanes.md](Section-Flowchart-Swimlanes.md) |

> [!TIP] Multi-View Pattern
> The most impactful flowcharts combine **SYS_ARCH** (structural: what exists) and **EVENT_STORMING** (behavioral: what happens over time). See `src/topics/ai-operating-model/data/flowchart/runtime-controls/` for a reference implementation.

### Multi-View Core Principle

**EVENT_STORMING is the source of truth.** Every entity that appears in SYS_ARCH, DATA_FLOW, or SWIMLANES **must already exist** in EVENT_STORMING. The other views are derived lenses.

## All Entity Types

| Type | Best View | Meaning |
|---|---|---|
| `USER` | All | External human or client system |
| `SERVICE` | SYS_ARCH, SWIMLANES | Running service component |
| `DATABASE` | SYS_ARCH, DFD, SWIMLANES | Data storage |
| `EXTERNAL` | SYS_ARCH, DFD | External system/API |
| `PROCESS` | DATA_FLOW, SWIMLANES | Data transformation step |
| `COMMAND` | EVENT_STORMING | Action taken by system |
| `DECISION` | All | Branch point |
| `DATA_OBJECT` | All | Data artifact |
| `EVENT` | EVENT_STORMING only | Domain event (past tense) |
| `AGGREGATE` | EVENT_STORMING | DDD aggregate root |
| `POLICY` | EVENT_STORMING only | Business rule / policy |

## Data Shape (Modular Schema Layout)

The flowchart schema is split into modular files under `src/topics/<topic-id>/data/flowchart/<flowchart-name>/`:

### 1. `index.ts` — Schema Assembly
```ts
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'
import { entities } from './entities'
import { relations } from './relations'
import { views } from './views'
import { happyPathJourney } from './journeys/happy-path'
import { recoveryPathJourney } from './journeys/recovery-path'

export const schema: UnifiedFlowchartSchema = {
  entities,
  relations,
  views,
  journeys: [happyPathJourney, recoveryPathJourney]
}
```

### 2. `entities.ts` — Node Definitions
```ts
import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  user: {
    title: 'User',
    desc: 'The human initiating requests or reviewing outputs.',
    viewTypes: { EVENT_STORMING: TYPES.USER, SYS_ARCH: TYPES.USER, DATA_FLOW: TYPES.USER, SWIMLANES: TYPES.USER }
  },
  planner: {
    title: 'Create Plan',
    desc: 'Generates execution steps dynamically based on goal.',
    viewTitles: { SYS_ARCH: 'Planner', DATA_FLOW: 'Planner', SWIMLANES: 'Planner' },
    viewTypes: { EVENT_STORMING: TYPES.COMMAND, SYS_ARCH: TYPES.SERVICE, DATA_FLOW: TYPES.PROCESS, SWIMLANES: TYPES.PROCESS }
  },
  evt_goal: {
    title: 'Goal Submitted',
    desc: 'Domain event: user submitted a new goal.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  }
}
```

### 3. `relations.ts` — Edges Between Nodes
```ts
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  { id: 'r_es_1', from: 'user', to: 'evt_goal', views: ['EVENT_STORMING'] },
  { id: 'r_es_4', from: 'planner', to: 'orch_plan', views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r_sa_1', from: 'user', to: 'planner', views: ['SYS_ARCH'] },
  { id: 'r_sa_5', from: 'tools', to: 'llm', views: ['SYS_ARCH'], dashed: true }
]
```

### 4. `views/` — Per-View Layouts
```ts
// views/index.ts
import type { UnifiedFlowchartSchema } from '../../../../../sections/flowchart'
import { eventStormingView } from './event-storming'
import { sysArchView } from './sys-arch'

export const views: UnifiedFlowchartSchema['views'] = {
  EVENT_STORMING: eventStormingView,
  SYS_ARCH: sysArchView
}
```

```ts
// views/sys-arch.ts
import type { FlowchartView } from '../../../../../sections/flowchart'

export const sysArchView: FlowchartView = {
  name: 'System Architecture',
  icon: 'Server',
  nodes: [
    { id: 'user', x: 80, y: 300 },
    { id: 'planner', x: 420, y: 300 }
  ],
  groups: []
}
```

### 5. `journeys/` — Animated Step Sequences
```ts
import type { FlowchartJourney } from '../../../../../sections/flowchart'

export const happyPathJourney: FlowchartJourney = {
  id: 'happy-path',
  label: 'Agentic Problem Solving Loop',
  description: 'Follow the execution plan from user goal to memory storage.',
  steps: [
    { nodeIds: ['user', 'evt_goal'], description: 'Goal Submitted — User submits a task request.' },
    { nodeIds: ['pol_plan', 'planner', 'orch_plan', 'memory'], description: 'Cognition & Planning — Policy triggers, planner creates steps, saved to memory.' }
  ]
}
```

## Journey Scoping Rules

- **Label journeys to indicate their view**: e.g., `Defense-in-Depth (Layers)` for SYS_ARCH, `Workflow Execution (Happy Path)` for EVENT_STORMING
- A journey whose `nodeIds` don't exist in the current view will be **invisible** (no nodes highlight)
- Never use the same entity IDs across both views — keep SYS_ARCH entities structural (nouns) and EVENT_STORMING entities behavioral

## Tips

- Each entity defines `viewTypes` per view — an entity can be a `SERVICE` in SYS_ARCH but a `PROCESS` in DATA_FLOW
- Entities only appear in views where they have a `viewTypes` entry
- Relations only render in views listed in their `views` array
- Use `dashed: true` on relations for feedback loops or optional paths
- Use `handledBy: true` for command→aggregate relations in EVENT_STORMING
- Node positions (`x`, `y`) are per-view — the same entity can be at different coordinates in different views
- Leave ~160px horizontal spacing between nodes for edge labels
- Use `viewTitles` to override per-view: verb-based in EVENT_STORMING, noun-based elsewhere
