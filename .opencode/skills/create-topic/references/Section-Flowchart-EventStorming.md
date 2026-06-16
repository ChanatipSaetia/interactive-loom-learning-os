# Section: Flowchart — EVENT_STORMING View

Event Storming is a domain-driven design (DDD) technique showing the chronological progression of events, commands, policies, and aggregates.

## Purpose

Separates structural components from the events and commands they produce. Answers:
- What happens first, second, third?
- What events trigger what actions?
- Where do decisions and policies create branches?

## DDD Entity Mappings

| Entity | Constant | Guidelines | Visual |
|---|---|---|---|
| **Actor/User** | `TYPES.USER` | Human initiating action | Yellow box with person icon |
| **Command** | `TYPES.COMMAND` | Action/request (verb-based: "Create Plan") | Blue box with Terminal icon |
| **Aggregate** | `TYPES.AGGREGATE` | Domain boundary coordinating state | Gray box with thick border |
| **Event** | `TYPES.EVENT` | Something that happened (**past tense**: "Goal Submitted") | Orange box with Zap icon |
| **Policy** | `TYPES.POLICY` | Reactive rule: "If event, then command" | Mauve box with ShieldAlert icon |
| **External** | `TYPES.EXTERNAL` | Out-of-bounds APIs | Green box with Cloud icon |
| **Database** | `TYPES.DATABASE` | Persistent store | Teal box with Database icon |
| **Data Object** | `TYPES.DATA_OBJECT` | Generated artifact | Pink box with FileText icon |
| **Decision** | `TYPES.DECISION` | Logical branch point | Maroon diamond with GitBranch icon |

## The Canonical Behavior Chain

Maintain the chronological sequence of DDD interactions:

```
User/Actor → Command → Aggregate → Database
Aggregate → Event → Policy → Command → ...
```

## Stack Layout and Coordinates

The **Stack Layout** is the primary design technique. Related components are positioned to **touch edge-to-edge**, forming visually grouped "stacks" or blocks.

### Node Dimensions

All nodes are **140 × 100 px** (uniform size). This means the grid system (`grid: [col, row]`) provides zero-gap adjacency for all node types.

### Grid Coordinate System

All nodes use `grid: [col, row]` coordinates. The runtime compiler converts them to pixel positions:

| Row | Y Position | Usage |
|---|---|---|
| 0 | `y = 50` | Database (above Aggregate) |
| 1 | `y = 150` | Aggregate / Handler (above Command) |
| 2 | `y = 250` | Main timeline (Events, Policies, Commands, Actors) |
| 3 | `y = 450` | Failure branch 1 |
| 4 | `y = 650` | Failure branch 2 |

Column formula: `x = col * 140 + 60`

### Standard Grid Layout

1. **Central Chronology (Happy Path):** Core timeline at Row 2 (`y = 250`)
2. **Horizontal Sequence:** Place nodes edge-to-edge in consecutive columns
   - Actor at `grid: [0, 2]`
   - Event at `grid: [1, 2]`
   - Policy at `grid: [2, 2]`
   - Command at `grid: [3, 2]`
   - Event at `grid: [4, 2]`
3. **Gap Between Phases:** Skip one column between separate logical phases (~140px gap)
4. **Vertical Stack Above Command:**
   - Command at Row 2
   - Aggregate above Command: Row 1 (same column)
   - Database above Aggregate: Row 0 (same column)
5. **Exceptions & Failure Branches:** Diverge vertically downward
   - Main timeline: Row 2
   - First failure branch: Row 3
   - Second failure branch: Row 4

### Typical Node Positions

```ts
// Happy path — Row 2
{ id: 'user',     grid: [0, 2] },
{ id: 'evt_goal', grid: [1, 2] },
{ id: 'pol_plan', grid: [2, 2] },
{ id: 'planner',  grid: [3, 2] },
{ id: 'evt_plan', grid: [4, 2] },
// Vertical stack above Command (same column)
{ id: 'orch',     grid: [3, 1] },  // Aggregate — Row 1
{ id: 'memory',   grid: [3, 0] },  // Database  — Row 0
// External handler above Command (same column)
{ id: 'llm',      grid: [7, 1] },  // External  — Row 1
```

## Groups

Use `groups` to cluster phases: "Cognition & Planning", "Execution", "Evaluation":

```ts
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
```

## Relation Conventions

```ts
{ id: 'r_es_1', from: 'user', to: 'evt_goal', views: ['EVENT_STORMING'] },
{ id: 'r_es_4', from: 'planner', to: 'orch', views: ['EVENT_STORMING'], handledBy: true },
{ id: 'r_es_7', from: 'evaluator', to: 'cmd_retry', views: ['EVENT_STORMING'], dashed: true }
```

- Use `handledBy: true` for command→aggregate relations
- Use `dashed: true` for feedback/retry loops
- Relation ID naming: `r_es_<n>`

## Node Order and Behavior Chain Guidelines

- **Strict Behavior Cycle**: The horizontal timeline flow must strictly follow:
  `Event (orange) → Policy (mauve) → Command (blue) ══(handled by)══> Handler (gray/green) → Event (orange)`
- **No Direct Policy-to-Event Connections**: A Policy represents a business rule, not an action. It cannot directly publish an Event. It must trigger an imperative Command, which is handled by an Aggregate/External System to produce the Event.

## Stacking and Alignment Guidelines

- **Command-Handler Stacks**: The Command (e.g. `planner` on Row 2) and its Handler (e.g. `orch_plan` on Row 1) must share the **exact same column coordinate** `col`. The Handler sits directly above the Command, connected by a straight vertical solid arrow (`handledBy: true`).
- **Database Alignment**: Backing databases (on Row 0) sit directly above their Aggregate handler (on Row 1) in the same column coordinate `col`.

## Branching Tree Guidelines

- **Vertically Diverging Timelines**: Alternative, exception, or failure flows must diverge vertically downward using Row 3 (`y: 450`) and Row 4 (`y: 650`).
- **Multi-Level Trees**: Each branch acts as a child timeline with its own sequence of Events, Policies, and Commands. Ensure you place branching timeline elements chronologically left-to-right (shifting columns rightward) and cleanly loop them back to main timeline commands (such as `planner`) with a dashed feedback relation.
