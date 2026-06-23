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

> **Note**: All node positions are computed automatically by the layout algorithm in `src/sections/flowchart/derivations.ts`. Manual `grid` coordinates in schema data are ignored. The algorithm assigns grid indices based on entity types and relation topology, then `flowchart-view.tsx` converts grid indices to pixel positions.

### Node Dimensions

All nodes are **140 × 100 px** (uniform size). This means the grid system (`grid: [col, row]`) provides zero-gap adjacency for all node types.

### Grid-to-Pixel Coordinate System

The layout algorithm assigns `grid: [col, row]` indices automatically. The renderer converts them to pixel positions:

| Grid Row | Y-Pixel | Usage |
|---|---|---|
| 0 | `y = 50` | Database (above Aggregate) |
| 1 | `y = 150` | Aggregate / Handler (above Command) |
| 2 | `y = 250` | Main timeline (Events, Policies, Commands, Actors) |
| 3 | `y = 450` | Failure branch 1 |
| 4 | `y = 650` | Failure branch 2 |

Column formula: `x = col * 140 + 60` (col is auto-computed)

### How the Layout Algorithm Works

1. **Central Chronology (Happy Path):** Timeline nodes (Event, Command, Policy, Actor) are placed at Row 2 (`y = 250`). Columns are assigned by topological ordering of relations.
2. **Command-Handler Stacking:** When a Command has a `handledBy` relation to an Aggregate/Handler, the Handler is placed in the same column at Row 1 (`y = 150`).
3. **Database Alignment:** Databases connected to a Handler are placed in the same column at Row 0 (`y = 50`).
4. **Branch Detection:** When a timeline node has multiple forward targets, the first target stays at the current branch level and subsequent targets diverge to Row 3 (`y = 450`), Row 4 (`y = 650`), etc.

### Resulting Layout (example)

```
                    [Database]     ← Row 0 (y:50), auto-stacked above handler
                        ↑
                    [Aggregate]    ← Row 1 (y:150), auto-stacked above command
                 ════[handled by]════
[Actor] [Event] [Policy] [Command] [Event]   ← Row 2 (y:250), auto-sequenced
  col:0   col:1   col:2    col:3    col:4
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
