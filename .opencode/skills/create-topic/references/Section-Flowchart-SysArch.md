# Section: Flowchart — SYS_ARCH View

System Architecture view shows what components exist and how they connect structurally.

## Purpose

The default "box-and-line" architecture diagram. Answers:
- What services, databases, and external systems exist?
- Which components communicate with each other?
- What is the structural topology?

## Entity Types

| Type | Meaning |
|---|---|
| `USER` | External human or client |
| `SERVICE` | Running service component |
| `DATABASE` | Data storage |
| `EXTERNAL` | External system/API |
| `DATA_OBJECT` | Data artifact |
| `DECISION` | Branch point |
| `AGGREGATE` | Domain boundary (from EVENT_STORMING) |

## Entity Type Mapping from EVENT_STORMING

When an entity exists in EVENT_STORMING with these types, map to SYS_ARCH:

| EVENT_STORMING | SYS_ARCH |
|---|---|
| `COMMAND` | `SERVICE` |
| `POLICY` | `SERVICE` or `HOTSPOT` |
| `AGGREGATE` | `AGGREGATE` |
| `EVENT` | — (omit) |
| `USER` | `USER` |
| `EXTERNAL` | `EXTERNAL` |
| `DATABASE` | `DATABASE` |

## Layout Strategy

Use a **three-row pipeline** layout:

```
Row 1 (y ≈ 300):  User → [internal services pipeline] → User (response)
Row 2 (y ≈ 420):           [support services: Memory, Executor, etc.]
Row 3 (y ≈ 580):           [failure / recovery path]
```

- External actors (`USER`, `EXTERNAL`) sit **outside** and to the **left** of the system
- Internal services flow left to right inside the system boundary
- Column spacing: ~250px between pipeline stages
- Support nodes: ~180px below their caller on the Y-axis

### Typical Node Positions

```ts
// External actors — left side
{ id: 'user',          x: 80,   y: 300 },
{ id: 'human_reviewer',x: 80,   y: 520 },
// External API — above the boundary box
{ id: 'llm',           x: 960,  y: 100 },
// Internal — pipeline left to right
{ id: 'orchestrator',  x: 310,  y: 300 },
{ id: 'planner',       x: 560,  y: 220 },
{ id: 'memory',        x: 560,  y: 420 },
{ id: 'tools',         x: 810,  y: 300 },
{ id: 'executor',      x: 1060, y: 300 },
{ id: 'evaluator',     x: 1310, y: 300 },
{ id: 'pol_escalate',  x: 1310, y: 480 },
```

## System Boundary Group

Draw **exactly one group** that acts as a system boundary box. Include all components the team builds. Exclude external actors and third-party APIs:

```ts
groups: [
  {
    id: 'sa_boundary',
    title: 'Agent System',
    desc: 'Everything built and operated within our control.',
    nodeIds: ['orchestrator', 'planner', 'memory', 'tools', 'executor', 'evaluator'],
    color: 'rgba(129,200,190,0.06)',
    borderColor: '#81c8be',
    textColor: '#c6d0f5',
  }
]
```

> [!IMPORTANT]
> Do NOT add groups other than the boundary — no phase groups in SYS_ARCH.

## Relation Conventions

Label comments on each edge with the boundary context:

```ts
{ id: 'r_sa_1', from: 'user',    to: 'orchestrator', views: ['SYS_ARCH'] },  // actor → system
{ id: 'r_sa_5', from: 'tools',   to: 'llm',          views: ['SYS_ARCH'] },  // system → external API
{ id: 'r_sa_6', from: 'llm',     to: 'executor',     views: ['SYS_ARCH'] },  // external API → system
{ id: 'r_sa_9', from: 'evaluator', to: 'user',       views: ['SYS_ARCH'] },  // system → actor
{ id: 'r_sa_12', from: 'human_reviewer', to: 'orchestrator', views: ['SYS_ARCH'], dashed: true }, // external → system (feedback)
```

- Use `dashed: true` for feedback/retry loops
- Relation ID naming: `r_sa_<n>`
