# Section: Flowchart

Auto-laid flowchart with pan/zoom, node drag, and animated journey playback. The most powerful section type.

A single `UnifiedFlowchartSchema` is defined in a single file: `src/topics/<topic-id>/data/flowchart-<flowchart-name>.ts`. It renders **seven distinct diagram views** that the user switches between via a view selector or views concurrently in a synchronized 2x2 grid.

## JSON Schema Blueprint

Scaffolding subagents must read and follow the official JSON schema layout defined in:
[.opencode/skills/create-topic/references/flowchart-schema.json](file:///Users/chanatipsaetia/Work/interactive-loom-learning-os/.opencode/skills/create-topic/references/flowchart-schema.json)

## Grid Coordinate Layout System

Instead of writing absolute pixel coordinates (`x`/`y`), subagents specify **logical grid coordinates** `grid: [col, row]` for node positions. The runtime layout engine compiles grid slots into pixel values per view:

| View Projection | Column Spacing (`col`) | Row Mappings (`row`) | Purpose / Meaning |
|---|---|---|---|
| **EVENT_STORMING** | `col * 140 + 60` (Stack X) | `0` = DB (y:50), `1` = Aggregate (y:150), `2` = Timeline (y:250), `3` = Branch 1 (y:450), `4` = Branch 2 (y:650) | **Domain Logic**: Business rules, commands, policies, events, aggregates. |
| **SWIMLANES** | `col * 140 + 160` (Swimlane X) | `0` = User (y:75), `1` = Orchestrator (y:270), `2` = Execution (y:460), `3` = Human (y:650) | **Control Flow**: Operational handoffs between User, System, and APIs. |
| **SYS_ARCH** | `col * 140 + 80` (System X) | `row * 100 + 100` (System Y) | **System Topology**: Services, databases, and network connection protocols. |
| **SEQUENCE** | `col * 140 + 100` (Lifeline X) | `row * 80 + 100` (Timeline Y) | **Execution Timeline**: Back-and-forth network API calls and requests. |
| **DATA_FLOW** | `col * 140 + 100` (DFD X) | `row * 100 + 100` (DFD Y) | **Data Mutation**: Payloads changing shape (e.g. JSON structures). |

*Note: Column spacing is set to exactly match standard node width (140px). This means consecutive coordinates (e.g. `col: 0` and `col: 1`) will touch edge-to-edge. To leave a spacing gap for connection arrows, the AI agent must skip a coordinate slot (e.g. place at `col: 0` and then `col: 2`). Floating point numbers (e.g. `grid: [1.5, 2]`) can also be used if fine visual adjustments are needed.*

## Data Shape (Collapsed Schema Layout)

Define the entire flowchart in a single typescript module:

```typescript
import { TYPES } from '../../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../../sections/flowchart'

export const schema: UnifiedFlowchartSchema = {
  entities: {
    user: {
      title: 'User',
      desc: 'The human initiating requests or reviewing outputs.',
      viewTypes: { EVENT_STORMING: TYPES.USER, SYS_ARCH: TYPES.USER, SWIMLANES: TYPES.USER }
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
  },
  relations: [
    { id: 'r_es_1', from: 'user', to: 'evt_goal', views: ['EVENT_STORMING'] },
    { id: 'r_es_4', from: 'planner', to: 'orch_plan', views: ['EVENT_STORMING'], handledBy: true }
  ],
  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'user', grid: [0, 2] },
        { id: 'evt_goal', grid: [1, 2] }
      ],
      groups: []
    },
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'user', grid: [0, 1] },
        { id: 'planner', grid: [2, 1] }
      ],
      groups: []
    }
  },
  journeys: [
    {
      id: 'happy-path',
      label: 'Agentic Problem Solving Loop',
      description: 'Follow the execution plan from user goal to memory storage.',
      steps: [
        { nodeIds: ['user', 'evt_goal'], description: 'Goal Submitted — User submits a task request.' }
      ]
    }
  ]
}
```

## Scoping & Relationship Rules

- **EVENT_STORMING is the source of truth:** Every entity that appears in SYS_ARCH, SWIMLANES, SEQUENCE, or DATA_FLOW **must already exist** in EVENT_STORMING. The other views are derived lenses.
- **Entity Collapsing (`collapsedTo`)**:
  When fine-grained aggregates or elements from Event Storming (e.g. `orch_plan` and `orch_eval`) collapse into a single component in structural views (e.g. `orchestrator`), you must define the `collapsedTo` property on the detailed entities:
  ```ts
  orch_plan: {
    title: 'Orchestrator',
    desc: 'Handles planning...',
    viewTypes: { EVENT_STORMING: TYPES.AGGREGATE },
    collapsedTo: 'orchestrator'
  }
  ```
  This ensures that when playing a journey, highlighting `orch_plan` automatically highlights `orchestrator` in views where the planner aggregate is collapsed.
- **Label journeys to indicate their view**: e.g., `Defense-in-Depth (Layers)` for SYS_ARCH, `Workflow Execution (Happy Path)` for EVENT_STORMING.
- A journey whose `nodeIds` don't exist in the current view will be **invisible** (no nodes highlight).
- Use `dashed: true` on relations for feedback loops or optional paths.
- Use `handledBy: true` for command→aggregate relations in EVENT_STORMING.
- Use `viewTitles` to override titles per-view: verb-based in EVENT_STORMING, noun-based elsewhere.
- **Sequence Diagram Condition Boundaries (Groups)**: To draw a UML alternative (`alt`) or optional (`opt`) condition boundary box in a sequence diagram, define a group under `views.SEQUENCE.groups`. Set `nodeIds` to the participants (lifelines) it spans, and specify custom `y` and `h` coordinates (in pixels, e.g. `y: 110, h: 80`) to vertically frame the target message arrows.

---

## Master Node Mapping Matrix
All other diagrams are derived from the master Event Storming schema according to the following mapping standard:

| Event Storming Node Type | System Architecture | Activity Swimlanes | Sequence Diagram | Data Flow (DFD) | State Machine | Entity-Relationship (ERD) | Infrastructure / Cloud |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🟠 **Event** | *Omitted* (not structural) | 🏷️ **Edge Label (Transition/Trigger)** | **Return Message / Transition Label** | 📄 **Data Object** *(Payload)* | ➡️ **State Transition (Arrow)** | *Omitted* (Stored as record logs) | *Omitted* |
| 🔵 **Command** | **Edge Interaction / Action Line** | 🟩 **Process Box** *(Action)* | ➡️ **Request Message (Call Arrow)** | 🏷️ **Edge Label (Transition/Process)** | *Omitted* | *Omitted* | *Omitted* |
| 🟣 **Policy** | **Router / Controller / Hotspot** | 🔶 **Decision Node** *(Branching)* | *Omitted* (Represented as a check step) | *Omitted* | 🛡️ **Transition Guard (Condition)** | *Omitted* | *Omitted* |
| 🔥 **Hotspot / Risk** | Warning Annotation / Omitted | Warning Indicator / Omitted | Failure / Error Annotation | Threat / Vulnerability Marker | **Error State / Guard** | *Omitted* | **Vulnerability / SPOF Area** |
| 🟡 **Aggregate / DB** | 🖥️ **Internal Service / DB node** | **Swimlane (Vertical / Horizontal)** | 💈 **Vertical Lifeline** | *Omitted* | *The Subject* (State Machine tracks this) | 🗃️ **Table Cluster / Aggregate Root** | 📦 **VPC Subnet / ECS Container** |
| 👤 **User / Actor** | 👤 **Client Node** | **Actors Lane** | 👤 **User Lifeline** | 👤 **Data Source / Sink** | *Omitted* | 🗃️ **User metadata table** | 🌐 **Web Browser / Client Zone** |
| 🛜 **External System** | 🛜 **External API Boundary** | **External Systems Lane** | 🛜 **External Lifeline** | *Omitted* | *Omitted* | *Omitted* (No data schema stored) | ☁️ **SaaS Endpoint (Public Internet)** |

