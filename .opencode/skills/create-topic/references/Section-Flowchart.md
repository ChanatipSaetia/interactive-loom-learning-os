# Section: Flowchart

Auto-laid flowchart with pan/zoom, node drag, and animated journey playback. The most powerful section type.

A single `UnifiedFlowchartSchema` can render **four distinct diagram views** that the user switches between via a view selector. Each view reveals a different aspect of the system.

## The Four Views

### 1. SYS_ARCH — System Architecture

**Purpose:** Show what components exist and how they connect structurally.

This is the default "box-and-line" architecture diagram. It answers:
- What services, databases, and external systems exist?
- Which components communicate with each other?
- What is the structural topology?

**Entity types to use:** `USER`, `SERVICE`, `DATABASE`, `EXTERNAL`, `DATA_OBJECT`

**Design guidance:**
- Position components by architectural layer (left = client, center = services, right = external)
- Use `groups` to highlight deployment boundaries (e.g., "runs in container", "on-premise")
- Edges represent communication channels (REST, gRPC, message queue)
- Keep it structural — avoid temporal ordering

**Example:**
```ts
entities: {
  api: {
    title: 'API Gateway',
    desc: 'Routes and authenticates requests',
    viewTypes: { SYS_ARCH: TYPES.SERVICE },
  },
  db: {
    title: 'PostgreSQL',
    desc: 'Primary data store',
    viewTypes: { SYS_ARCH: TYPES.DATABASE },
  },
}
```

---

### 2. EVENT_STORMING — Event Storming Diagram

**Purpose:** Show the temporal, behavioral flow of events through the domain.

Event Storming is a domain-driven design technique. This view separates structural components from the events and commands they produce. It answers:
- What happens first, second, third?
- What events trigger what actions?
- Where do decisions and policies create branches?

**Entity types to use:**
- `EVENT` — Things that happen (orange stickers). Named in past tense: "Goal Dispatched", "Order Placed"
- `COMMAND` — Actions taken by the system: "Send Email", "Process Payment"
- `AGGREGATE` — Domain objects that coordinate behavior: "Order", "Cart"
- `DECISION` — Branch points: "Payment Valid?", "User Authenticated?"
- `POLICY` — Rules that react to events: "If failed, retry 3 times"
- `EXTERNAL` — External systems that participate
- `DATABASE` — Data stores accessed during the flow

**Design guidance:**
- Define entities that are EVENT-only (not in other views) for timeline markers
- Use `dashed: true` on relations for feedback loops (e.g., retry paths)
- Use `groups` to cluster phases: "Cognition & Planning", "Execution", "Evaluation"
- Arrange nodes left-to-right in temporal order
- This view typically has the most nodes — events act as milestones between commands

**Example:**
```ts
entities: {
  'evt_order_placed': {
    title: 'Order Placed',
    desc: 'Customer submitted an order.',
    viewTypes: { EVENT_STORMING: TYPES.EVENT },
  },
  'cmd_charge': {
    title: 'Charge Card',
    desc: 'Payment processing command.',
    viewTypes: { EVENT_STORMING: TYPES.COMMAND },
  },
  'pol_retry': {
    title: 'Retry Policy',
    desc: 'If charge fails, retry up to 3 times.',
    viewTypes: { EVENT_STORMING: TYPES.POLICY },
  },
}
```

---

### 3. DATA_FLOW — Data Flow Diagram (DFD)

**Purpose:** Show how data transforms as it passes through the system.

A DFD focuses on data movement and transformation, not component structure or timing. It answers:
- What data enters the system?
- How is it transformed at each stage?
- What data exits?

**Entity types to use:**
- `USER` — External data source/sink
- `PROCESS` — Data transformation steps (circles)
- `DATABASE` — Data stores
- `EXTERNAL` — External systems
- `DECISION` — Routing based on data content
- `DATA_OBJECT` — Data artifacts produced

**Design guidance:**
- Arrange nodes in a linear or pipeline layout (left to right)
- Each `PROCESS` node transforms input data into output data
- Edges represent data movement, not control flow
- Keep it flat — DFDs work best without deep branching
- Don't include event nodes — DFD is about data, not timing
- Use when you want to show how raw input becomes a finished output

**Example:**
```ts
entities: {
  raw_input: {
    title: 'Raw Data',
    desc: 'Incoming user input',
    viewTypes: { DATA_FLOW: TYPES.DATA_OBJECT },
  },
  parse: {
    title: 'Parser',
    desc: 'Normalizes and validates input',
    viewTypes: { DATA_FLOW: TYPES.PROCESS },
  },
  store: {
    title: 'Indexed Store',
    desc: 'Persisted, searchable data',
    viewTypes: { DATA_FLOW: TYPES.DATABASE },
  },
}
```

---

### 4. SWIMLANES — Activity Swimlanes

**Purpose:** Show which responsibility zone handles each step.

Swimlane diagrams organize activities into horizontal bands, each representing a role, team, or system layer. It answers:
- Who (which component/role) is responsible for each step?
- Where does work cross boundaries between zones?
- How many handoffs occur?

**Entity types to use:** Same as SYS_ARCH for the nodes (`SERVICE`, `PROCESS`, `DATABASE`, `DECISION`, `EXTERNAL`, `DATA_OBJECT`, `USER`).

**Key difference:** Uses `isLane` groups to define horizontal bands.

**Design guidance:**
- Define 2-4 lanes. Each lane represents a responsibility boundary
- Position nodes inside their lane's y-range (use `y` and `h` in lane groups)
- Cross-lane edges highlight handoffs and integration points
- Good for showing client/server boundaries, human/AI handoffs, or tiered architectures
- Use when the "who does what" question matters more than component structure

**Lane group example:**
```ts
groups: [
  {
    id: 'lane-human',
    isLane: true,
    title: 'Human Interface',
    desc: 'User interactions and approvals',
    y: 50, h: 100,
    color: '#fef08a',
  },
  {
    id: 'lane-cognitive',
    isLane: true,
    title: 'Cognitive Loop',
    desc: 'Planning, routing, and validation',
    y: 150, h: 200,
    color: '#bae6fd',
  },
  {
    id: 'lane-actions',
    isLane: true,
    title: 'Execution Layer',
    desc: 'Side-effects and external calls',
    y: 350, h: 100,
    color: '#cbd5e1',
  },
]
```

---

## When to Use Each View

| Question | Best View |
|---|---|
| "What components exist?" | SYS_ARCH |
| "What happens over time?" | EVENT_STORMING |
| "How does data transform?" | DATA_FLOW |
| "Who handles each step?" | SWIMLANES |

You don't need all four. Start with SYS_ARCH for simple topics. Add EVENT_STORMING when temporal behavior matters. Add DATA_FLOW for pipeline-heavy systems. Add SWIMLANES when responsibility boundaries are the key teaching point.

## Data Shape (Full Schema)

```ts
import { TYPES } from '../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../sections/flowchart'

export const mySchema: UnifiedFlowchartSchema = {
  entities: {
    // Each entity maps a logical id to view-specific type rendering
    user: {
      title: 'User',
      desc: 'End user',
      viewTypes: {
        SYS_ARCH: TYPES.USER,
        EVENT_STORMING: TYPES.USER,
        DATA_FLOW: TYPES.USER,
        SWIMLANES: TYPES.USER,
      },
    },
    service: {
      title: 'Service',
      desc: 'Main processing service',
      viewTypes: {
        SYS_ARCH: TYPES.SERVICE,
        EVENT_STORMING: TYPES.AGGREGATE,
        DATA_FLOW: TYPES.PROCESS,
        SWIMLANES: TYPES.SERVICE,
      },
    },
  },
  relations: [
    // Each relation specifies which views it appears in
    { id: 'r1', from: 'user', to: 'service', views: ['SYS_ARCH', 'DATA_FLOW', 'SWIMLANES'] },
  ],
  views: {
    // Define each view you want (not all four required)
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'user', x: 100, y: 250 },
        { id: 'service', x: 300, y: 250 },
      ],
      groups: [],
    },
  },
  journeys: [
    {
      id: 'flow',
      label: 'Request Flow',
      description: 'How a request travels through the system',
      steps: [
        { nodeId: 'user', description: 'User sends request' },
        { nodeId: 'service', description: 'Service processes' },
      ],
    },
  ],
}
```

## All Entity Types

| Type | Visual | Best View | Meaning |
|---|---|---|---|
| `USER` | person icon | All | External human or client system |
| `SERVICE` | box | SYS_ARCH, SWIMLANES | Running service component |
| `DATABASE` | cylinder | SYS_ARCH, DFD, SWIMLANES | Data storage |
| `EXTERNAL` | cloud | SYS_ARCH, DFD | External system/API |
| `PROCESS` | circle | DATA_FLOW, SWIMLANES | Data transformation step |
| `COMMAND` | rectangle | EVENT_STORMING | Action taken by system |
| `DECISION` | diamond | All | Branch point |
| `DATA_OBJECT` | document | All | Data artifact |
| `EVENT` | orange sticker | EVENT_STORMING | Domain event (past tense) |
| `AGGREGATE` | thick border | EVENT_STORMING | DDD aggregate root |
| `POLICY` | rule icon | EVENT_STORMING | Business rule / policy |

## Journeys

Journeys are animated step sequences. The user clicks play and the diagram highlights each node in order. Define steps as ordered `nodeId` references. A journey can span any view that contains those nodes.

## Tips

- Each entity defines `viewTypes` per view — an entity can be a `SERVICE` in SYS_ARCH but a `PROCESS` in DATA_FLOW
- Entities only appear in views where they have a `viewTypes` entry
- Relations only render in views listed in their `views` array
- Use `dashed: true` on relations for feedback loops or optional paths
- Node positions (`x`, `y`) are per-view — the same entity can be at different coordinates in different views
- Leave ~160px horizontal spacing between nodes for edge labels

---

## Layout Strategy and Positioning Principles

Organizing nodes effectively is crucial for readability, especially when transitioning between different conceptual views. The entire canvas is built on a virtual grid — nodes are not placed randomly but aligned on specific axes.

### Core Principle: Grid-Based Alignment

- **X-Axis (Horizontal) = Time or Sequence:** In almost all views, flow moves left to right.
- **Y-Axis (Vertical) = Layers or Actors:** Vertical space separates different systems, domains, or actors.

### View-Specific Layout Strategies

#### Event Storming (Chronological Behavior)

Relies on the DDD "Triad" pattern: Command → Aggregate → Event.

- **Main Timeline (Center Track):** Core business flow on a central horizontal track (e.g., `y = 250`). Triad nodes placed horizontally adjacent.
- **Actors (Peripheral, Above):** Users placed slightly above the Command they initiate (e.g., `y = 185`), visually "dropping down" into the timeline.
- **External Systems:** Placed above or below the Event they react to.
- **Branching (Vertical Divergence):** "Happy Path" moves up (e.g., `y = 110`), "Exception Path" moves down (e.g., `y = 390`).

**Example coordinates:**
```
cmd_up (Command):    x = 120, y = 250  (Main Track)
agg_pipe (Aggregate): x = 260, y = 250  (Next to Command)
user_editor (Actor):  x = 130, y = 185  (Above Command)
```

#### System Architecture (Infrastructure Topology)

Disregards time, focuses on network topology and physical connections.

- **Concentric Layers:** Clients on far left, gateways middle-left, services/databases center-right.
- **Vertical Grouping by Domain:** Related services stacked vertically to show logical subsystems.

**Example coordinates:**
```
sys_gw (Gateway):    x = 450, y = 300  (Center Hub)
sys_worker (Service): x = 750, y = 150  (Behind Gateway, Top)
db_s3 (Storage):     x = 750, y = 300  (Behind Gateway, Middle)
```

#### Data Flow Diagram (DFD)

Focuses strictly on how data mutates through processes.

- **Strict Alternating Sequence:** Data Object → Process → Data Object → Process, horizontally.
- **Single Horizontal Track:** Everything on one continuous line to emphasize the transformation pipeline.

**Example coordinates:**
```
data_pdf (Object):   x = 150, y = 250
sys_worker (Process): x = 400, y = 250
data_raw_md (Object): x = 650, y = 250
```

#### Activity Swimlanes (Actor-Based Chronology)

Maps processes to the actor or system responsible.

- **Horizontal Lanes (Y-Axis Constraints):** Y-axis divided into distinct bands. Every node must sit within its lane's Y-boundaries.
- **Chronological Flow (X-Axis):** Time moves left to right. Connections jump vertically between lanes to show hand-offs.

**Example coordinates:**
```
Lane 1 (Editor): y boundaries 50 - 250
Lane 2 (System): y boundaries 250 - 450
cmd_up (Editor action):    x = 150, y = 120  (In Lane 1)
sys_worker (System action): x = 400, y = 320  (In Lane 2, shifted right)
```

### Node Dimensions and Spacing

Two standard sizes create visual hierarchy:

| Size | Dimensions | Used For |
|---|---|---|
| Standard | `NODE_W = 140`, `NODE_H = 100` | Commands, Events, Aggregates, Processes |
| Small | `SMALL_W = 120`, `SMALL_H = 65` | Actors, External Systems, Hotspots |

**Gap Calculation:** Node 1 X + Node 1 Width + Gap = Node 2 X. Use 40px-80px between elements on the same track.

### Decision Checklist for Node Placement

When adding a new node, ask:

1. **Which view am I editing?** — Rules change per lens.
2. **When does this happen?** — Determines X (later events go further right).
3. **Who does this, or what layer is it in?** — Determines Y (core process, user action above, exception path below).
4. **Is it part of a group?** — Ensure it sits near related nodes for automated bounding boxes.
