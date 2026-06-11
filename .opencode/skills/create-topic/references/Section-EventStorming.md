# Section: Event Storming

Event Storming is a specialized behavioral view within the `flowchart` section. It focuses on the chronological progression of events, commands, policies, and aggregates in a Domain-Driven Design (DDD) model.

## Domain-Driven Design (DDD) Mappings

When structuring an Event Storming view, you must map your logical entities to the correct visual types:

| Entity Type | constant name | Meaning & Guidelines | Visual Appearance |
|---|---|---|---|
| **Actor/User** | `TYPES.USER` | The human actor initiating action (e.g. `"User"`, `"Operator"`). | Yellow box with person icon |
| **Command** | `TYPES.COMMAND` | Action/request initiated by user or policy (e.g. `"Create Plan"`, `"Run Tool"`). | Blue box with Terminal icon |
| **Aggregate** | `TYPES.AGGREGATE` | Domain boundary coordinating command validation and state (e.g. `"Orchestrator"`). | Gray box with thick border |
| **Event** | `TYPES.EVENT` | Something that happened. Must be in the **past tense** (e.g. `"Goal Submitted"`, `"Plan Ready"`). | Orange box with Zap icon |
| **Policy** | `TYPES.POLICY` | Reactive business rule triggered by an Event, routing to a Command (e.g. `"Plan on New Goal"`). | Mauve/purple box with ShieldAlert icon |
| **External System** | `TYPES.EXTERNAL` | Out-of-bounds or third-party APIs (e.g. `"LLM Engine"`, `"Stripe Gateway"`). | Green box with Cloud icon |
| **Database** | `TYPES.DATABASE` | Persistent store read/written by the Aggregate (e.g. `"Memory Storage"`). | Teal box with Database icon |
| **Data Object** | `TYPES.DATA_OBJECT` | Generated artifact/document (e.g. `"Final Response"`). | Pink box with FileText icon |
| **Decision** | `TYPES.DECISION` | Logical branch point. | Maroon diamond with GitBranch icon |

## The Canonical Behavior Chain

Maintain the chronological sequence of DDD interactions:
$$\text{User/Actor} \xrightarrow{\text{triggers}} \text{Command} \xrightarrow{\text{handled by}} \text{Aggregate} \xrightarrow{\text{saves to}} \text{Database}$$
$$\text{Aggregate} \xrightarrow{\text{emits}} \text{Event} \xrightarrow{\text{triggers}} \text{Policy} \xrightarrow{\text{routes to}} \text{Command} \dots$$

## Stack Layout and Coordinates Conventions

The **Stack Layout** is the primary design technique for Event Storming. Instead of drawing arrows between every related node, related components are positioned to **touch edge-to-edge**, forming visually grouped "stacks" or blocks that represent a cohesive unit of logic.

### Node Dimensions and Sizes

Two standard sizes are used for flowchart nodes:
- **Standard Node** (`NODE_W = 140`, `NODE_H = 100`): Used for Commands, Events, Aggregates, Databases, Policies, and Processes.
- **Small Node** (`SMALL_W = 120`, `SMALL_H = 65`): Used for Actors/Users, External Systems, Decisions, and Hotspots.

### Math for Zero-Gap Adjacent Stacking

To position nodes such that they touch border-to-border with no gap and no overlap, use the following formulas:

#### 1. Horizontal Stacking (Time / Sequence Flow)
To place Node 2 immediately to the right of Node 1:
$$\text{Center } X_2 = \text{Center } X_1 + \frac{\text{Width}_1}{2} + \frac{\text{Width}_2}{2}$$

- **Standard to Standard**: $\text{Center } X_2 = \text{Center } X_1 + 70 + 70 = \text{Center } X_1 + 140$
- **Small to Standard**: $\text{Center } X_2 = \text{Center } X_1 + 60 + 70 = \text{Center } X_1 + 130$
- **Standard to Small**: $\text{Center } X_2 = \text{Center } X_1 + 70 + 60 = \text{Center } X_1 + 130$
- **Small to Small**: $\text{Center } X_2 = \text{Center } X_1 + 60 + 60 = \text{Center } X_1 + 120$

#### 2. Vertical Stacking (Actors, Aggregates, and Databases)
To stack Node 2 immediately above Node 1:
$$\text{Center } Y_2 = \text{Center } Y_1 - \frac{\text{Height}_1}{2} - \frac{\text{Height}_2}{2}$$

- **Standard to Standard (e.g., Aggregate above Command)**: $\text{Center } Y_2 = \text{Center } Y_1 - 50 - 50 = \text{Center } Y_1 - 100$
- **Small above Standard (e.g., Actor above Command)**: $\text{Center } Y_2 = \text{Center } Y_1 - 50 - 32.5 = \text{Center } Y_1 - 82.5$
- **Standard above Small**: $\text{Center } Y_2 = \text{Center } Y_1 - 32.5 - 50 = \text{Center } Y_1 - 82.5$
- **Small above Small**: $\text{Center } Y_2 = \text{Center } Y_1 - 32.5 - 32.5 = \text{Center } Y_1 - 65$

---

### Standard Event Storming Grid Layout

1. **Central Chronology (Happy Path):** Place core timeline nodes horizontally at $y = 250$.
2. **Horizontal Sequence within a Stack (Zero Gap):**
   - Start: Actor/User (Small) at $x = 60, y = 250$.
   - Event (Standard): $x = 60 + 60 + 70 = 190, y = 250$ (touches Actor).
   - Policy (Standard): $x = 190 + 140 = 330, y = 250$ (touches Event).
   - Command (Standard): $x = 330 + 140 = 470, y = 250$ (touches Policy).
   - Event (Standard): $x = 470 + 140 = 610, y = 250$ (touches Command).
3. **Horizontal Spacing Between Stacks (Gap):**
   - Add a horizontal gap of $\sim 100\text{px}$ between separate logical stacks (phases).
   - For example, if Stack 1 ends at $x = 610$ (right edge $680$), Stack 2 starts with a gap of $100\text{px}$, placing its first node at $x = 680 + 100 + 70 = 850$.
4. **Vertical Stack above Command (Zero Gap):**
   - Command (Standard) at $y = 250$
   - Aggregate (Standard) stacked above Command: $y = 250 - 50 - 50 = 150$
   - Database (Standard) stacked above Aggregate: $y = 150 - 50 - 50 = 50$
5. **Exceptions & Failure Branches (Gaps for Branching):**
   - Diverge vertically downwards to keep the main happy path clean.
   - Apply a vertical gap of $\sim 100\text{px}$ between the main timeline and the branch track, and between different branch levels.
   - For example, if the timeline is at $y = 250$, the first failure branch track sits at $y = 250 + 50 + 100 + 50 = 450$. A second branch track sits at $y = 450 + 50 + 100 + 50 = 650$.
   - Apply horizontal spacing/gaps so that branching connections (e.g. diagonal/orthogonal arrows) have clear routing paths without overlapping other nodes.

---

## Modular Data Reference Template

Under the modular topic structure, Event Storming data is split as follows:

### 1. `data/flowchart/entities.ts`
```ts
import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const entities: UnifiedFlowchartSchema['entities'] = {
  user: {
    title: 'User',
    desc: 'End user initiating requests.',
    viewTypes: { EVENT_STORMING: TYPES.USER }
  },
  evt_goal: {
    title: 'Goal Submitted',
    desc: 'Domain event: new goal was submitted.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT }
  },
  pol_plan: {
    title: 'Plan on Goal',
    desc: 'Policy: trigger planning on new goals.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY }
  },
  planner: {
    title: 'Create Plan',
    desc: 'Command: generate plan steps.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND }
  },
  orch: {
    title: 'Orchestrator',
    desc: 'Aggregate: controls execution loop.',
    viewTypes: { EVENT_STORMING: TYPES.AGGREGATE }
  },
  memory: {
    title: 'Memory Storage',
    desc: 'Database: stores plan history.',
    viewTypes: { EVENT_STORMING: TYPES.DATABASE }
  }
}
```

### 2. `data/flowchart/relations.ts`
```ts
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const relations: UnifiedFlowchartSchema['relations'] = [
  { id: 'r1', from: 'user', to: 'evt_goal', views: ['EVENT_STORMING'] },
  { id: 'r2', from: 'evt_goal', to: 'pol_plan', views: ['EVENT_STORMING'] },
  { id: 'r3', from: 'pol_plan', to: 'planner', views: ['EVENT_STORMING'] },
  { id: 'r4', from: 'planner', to: 'orch', views: ['EVENT_STORMING'], handledBy: true },
  { id: 'r5', from: 'orch', to: 'memory', views: ['EVENT_STORMING'] }
]
```

### 3. `data/flowchart/views/event-storming.ts`
```ts
import type { FlowchartView } from '../../../../../sections/flowchart'

export const eventStormingView: FlowchartView = {
  name: 'Event Storming',
  icon: 'Component',
  nodes: [
    { id: 'user', x: 60, y: 250 },
    { id: 'evt_goal', x: 190, y: 250 },
    { id: 'pol_plan', x: 330, y: 250 },
    { id: 'planner', x: 470, y: 250 },
    { id: 'orch', x: 470, y: 150 },
    { id: 'memory', x: 470, y: 50 }
  ],
  groups: [
    {
      id: 'es_g1',
      title: 'Planning Cycle',
      desc: 'Orchestrating goal submission and plan synthesis.',
      nodeIds: ['evt_goal', 'pol_plan', 'planner', 'orch', 'memory'],
      color: 'rgba(140, 170, 238, 0.12)',
      borderColor: '#8caaee',
      textColor: '#c6d0f5'
    }
  ]
}
```

### 4. `data/flowchart/journeys/happy-path.ts`
```ts
import type { FlowchartJourney } from '../../../../../sections/flowchart'

export const happyPathJourney: FlowchartJourney = {
  id: 'happy-path',
  label: 'Happy Path Flow',
  description: 'Chronological path for successful plan generation.',
  steps: [
    { nodeIds: ['user', 'evt_goal'], description: 'User submits goal.' },
    { nodeIds: ['pol_plan', 'planner', 'orch', 'memory'], description: 'System processes and stores plan.' }
  ]
}
```
