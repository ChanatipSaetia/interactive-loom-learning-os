# Section: Flowchart — SWIMLANES View

Activity Swimlanes organize activities into horizontal bands, each representing a role, team, or system layer.

## Purpose

Shows which responsibility zone handles each step. Answers:
- Who (which component/role) is responsible for each step?
- Where does work cross boundaries between zones?
- How many handoffs occur?

## Entity Types

Same as SYS_ARCH for nodes: `SERVICE`, `PROCESS`, `DATABASE`, `DECISION`, `EXTERNAL`, `DATA_OBJECT`, `USER`, `AGGREGATE`.

## Entity Type Mapping from EVENT_STORMING

| EVENT_STORMING | SWIMLANES |
|---|---|
| `COMMAND` | `PROCESS` |
| `POLICY` | `DECISION` |
| `AGGREGATE` | `AGGREGATE` |
| `EVENT` | — (omit) |
| `USER` | `USER` |
| `EXTERNAL` | `EXTERNAL` |
| `DATABASE` | `DATABASE` |

## Lane Design

Split lanes by **actor / system boundary** — not by phase. Each lane represents who owns the work, not when it happens. Define 2-4 lanes.

### Recommended Lane Structure

| Lane | Who | Typical nodes |
|---|---|---|
| 1 (top) | **User** | `user`, `output` |
| 2 | **Orchestrator (Agent Core)** | `orchestrator`, `memory`, `evaluator` |
| 3 | **Execution Layer** | `tools`, `llm`, `executor` |
| 4 (bottom) | **Human Reviewer** | `pol_escalate`, `human_reviewer` |

### Lane Group Schema

```ts
groups: [
  { id: 'sl_l1', isLane: true, title: 'User',                      y: 30,  h: 110, color: 'rgba(239,159,118,0.10)' },
  { id: 'sl_l2', isLane: true, title: 'Orchestrator (Agent Core)', y: 200, h: 160, color: 'rgba(153,209,219,0.10)' },
  { id: 'sl_l3', isLane: true, title: 'Execution Layer',           y: 390, h: 160, color: 'rgba(186,187,241,0.10)' },
  { id: 'sl_l4', isLane: true, title: 'Human Reviewer',            y: 590, h: 110, color: 'rgba(231,130,132,0.10)' },
]
```

**Lane height rule:** Nodes within a lane must have their `y` coordinate within `[lane.y + 30, lane.y + lane.h - 30]`.

### Typical Node Positions

```ts
// Lane 1 — User
{ id: 'user',          x: 160,  y: 75  },
{ id: 'output',        x: 1340, y: 75  },
// Lane 2 — Orchestrator
{ id: 'orchestrator',  x: 390,  y: 270 },
{ id: 'memory',        x: 600,  y: 270 },
{ id: 'evaluator',     x: 990,  y: 270 },
// Lane 3 — Execution
{ id: 'tools',         x: 600,  y: 460 },
{ id: 'llm',           x: 810,  y: 460 },
{ id: 'executor',      x: 1010, y: 460 },
// Lane 4 — Human Reviewer
{ id: 'pol_escalate',  x: 810,  y: 650 },
{ id: 'human_reviewer',x: 1010, y: 650 },
```

- Column spacing: ~210px between stages
- Cross-lane handoff arrows are the key teaching points
- Horizontal flow (X-Axis): time moves left to right
- Vertical positioning (Y-Axis): determines which lane the node belongs to

## Relation Conventions

Comment each cross-lane relation with the boundary it crosses:

```ts
{ id: 'r_sl_1', from: 'user', to: 'orchestrator', views: ['SWIMLANES'] },      // Lane 1 → Lane 2
{ id: 'r_sl_4', from: 'orchestrator', to: 'tools', views: ['SWIMLANES'] },       // Lane 2 → Lane 3
{ id: 'r_sl_7', from: 'evaluator', to: 'pol_escalate', views: ['SWIMLANES'] },   // Lane 2 → Lane 4
```

- Relation ID naming: `r_sl_<n>`

## Tips

- Good for showing client/server boundaries, human/AI handoffs, or tiered architectures
- Use when "who does what" matters more than component structure
- Cross-lane edges highlight handoffs and integration points
- Position nodes inside their lane's y-range
