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

| Size | Dimensions | Used For |
|---|---|---|
| Standard | `140 × 100` | Commands, Events, Aggregates, Databases, Policies, Processes |
| Small | `120 × 65` | Actors/Users, External Systems, Decisions, Hotspots |

### Horizontal Stacking (Zero Gap)

To place Node 2 immediately to the right of Node 1:

| From → To | X offset |
|---|---|
| Standard → Standard | `+140` |
| Small → Standard | `+130` |
| Standard → Small | `+130` |
| Small → Small | `+120` |

### Vertical Stacking (Zero Gap)

To stack Node 2 immediately above Node 1:

| From → To | Y offset |
|---|---|
| Standard → Standard | `-100` |
| Small → Standard | `-82.5` |
| Standard → Small | `-82.5` |
| Small → Small | `-65` |

### Standard Grid Layout

1. **Central Chronology (Happy Path):** Core timeline at `y = 250`
2. **Horizontal Sequence (Zero Gap):**
   - Actor (Small) at `x = 60, y = 250`
   - Event (Standard) at `x = 190, y = 250` (touches Actor)
   - Policy (Standard) at `x = 330, y = 250` (touches Event)
   - Command (Standard) at `x = 470, y = 250` (touches Policy)
   - Event (Standard) at `x = 610, y = 250` (touches Command)
3. **Gap Between Stacks:** ~100px horizontal gap between separate logical phases
4. **Vertical Stack Above Command:**
   - Command at `y = 250`
   - Aggregate above Command: `y = 150`
   - Database above Aggregate: `y = 50`
5. **Exceptions & Failure Branches:** Diverge vertically downward with ~100px gap between tracks
   - Main timeline: `y = 250`
   - First failure branch: `y = 450`
   - Second failure branch: `y = 650`

### Typical Node Positions

```ts
// Happy path — y = 250
{ id: 'user',    x: 60,   y: 250 },
{ id: 'evt_goal', x: 190, y: 250 },
{ id: 'pol_plan', x: 330, y: 250 },
{ id: 'planner',  x: 470, y: 250 },
{ id: 'evt_plan', x: 610, y: 250 },
// Vertical stack above Command
{ id: 'orch',     x: 470, y: 150 },  // Aggregate above planner
{ id: 'memory',   x: 470, y: 50  },  // Database above aggregate
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
