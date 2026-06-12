# Section: Multi-View Diagram Conventions

This document captures the conventions for creating, positioning, and connecting nodes
across the four flowchart views: **Event Storming**, **System Architecture (SYS_ARCH)**,
**Data Flow (DATA_FLOW)**, and **Activity Swimlanes (SWIMLANES)**.

---

## 1. Core Principle: Event Storming Is the Source of Truth

The Event Storming diagram is always defined **first and completely**.
Every entity that appears in SYS_ARCH, DATA_FLOW, or SWIMLANES **must already exist** in
Event Storming. The other views are derived lenses, not independent diagrams.

**Workflow:**
1. Define all entities in `entities.ts` with `EVENT_STORMING: TYPES.*`.
2. Add `SYS_ARCH / DATA_FLOW / SWIMLANES` viewType entries only for entities that have a
   meaningful role in that lens.
3. Define the layout (x, y) for each view in `views.ts`.

---

## 2. Entity Alignment Across Views

Each entity represents one conceptual thing. The same entity can render with a different
**type** and **title** in each view. Use the following mapping table as a guide:

| Event Storming Role | SYS_ARCH type   | DATA_FLOW type | SWIMLANES type |
|---------------------|-----------------|----------------|----------------|
| `COMMAND`           | `SERVICE`        | `PROCESS`      | `PROCESS`      |
| `POLICY`            | `SERVICE` / `HOTSPOT` | `DECISION` | `DECISION`  |
| `AGGREGATE`         | `AGGREGATE`      | —              | `AGGREGATE`    |
| `EVENT`             | — (omit)         | — (omit)       | — (omit)       |
| `USER`              | `USER`           | `USER`         | `USER`         |
| `EXTERNAL`          | `EXTERNAL`       | `EXTERNAL`     | `EXTERNAL`     |
| `DATABASE`          | `DATABASE`       | `DATABASE`     | `DATABASE`     |
| `DATA_OBJECT`       | — (omit)         | `DATA_OBJECT`  | — (omit)       |

> [!IMPORTANT]
> Events and Policies are **Event Storming only**. Do not include them in SYS_ARCH or
> DATA_FLOW — they carry no structural meaning there.

---

## 3. Per-View Title Overrides (`viewTitles`)

Event Storming uses **verb-based** naming (commands describe actions):
- `planner` → `"Create Plan"`
- `executor` → `"Run Tool"`
- `evaluator` → `"Evaluate Result"`

Other views use **noun-based** naming (components describe what they are):
- `planner` → `"Planner"` in SYS_ARCH / DATA_FLOW / SWIMLANES
- `executor` → `"Tool Executor"`
- `evaluator` → `"Evaluator"`

Use the `viewTitles` field on the entity to override per-view. The renderer falls back
to `title` when no override is present:

```ts
'planner': {
  title: 'Create Plan',             // used in EVENT_STORMING (verb / Command)
  viewTitles: {
    SYS_ARCH: 'Planner',            // noun / Service
    DATA_FLOW: 'Planner',
    SWIMLANES: 'Planner',
  },
  desc: 'Formulates multi-step actions dynamically.',
  viewTypes: {
    EVENT_STORMING: TYPES.COMMAND,
    SYS_ARCH: TYPES.SERVICE,
    DATA_FLOW: TYPES.PROCESS,
    SWIMLANES: TYPES.PROCESS,
  }
},
```

---

## 4. Deduplication: Collapsing Split Aggregates

Event Storming may split one system into **multiple aggregate instances** to represent
different bounded contexts (e.g., `orch_plan` for planning and `orch_eval` for evaluation).

In SYS_ARCH and SWIMLANES, these should collapse into a **single component node**:

```ts
// EVENT_STORMING only — keeps the split for DDD clarity
'orch_plan': { title: 'Orchestrator', viewTypes: { EVENT_STORMING: TYPES.AGGREGATE } },
'orch_eval': { title: 'Orchestrator', viewTypes: { EVENT_STORMING: TYPES.AGGREGATE } },

// SYS_ARCH + SWIMLANES — unified component
'orchestrator': {
  title: 'Orchestrator',
  desc: 'Core agent runtime owning the planning and evaluation loops.',
  viewTypes: {
    SYS_ARCH: TYPES.AGGREGATE,
    SWIMLANES: TYPES.AGGREGATE,
  }
},
```

**Rule:** If two entities have the same `title` in the same non-ES view, collapse them.

---

## 5. System Architecture — Layout and Grouping

### Layout Strategy

Use a **three-row pipeline** layout:

```
Row 1 (y ≈ 300):  User → [internal services pipeline] → User (response)
Row 2 (y ≈ 420):           [support services: Memory, Executor, etc.]
Row 3 (y ≈ 580):           [failure / recovery path]
```

- External actors (`USER`, `EXTERNAL`) sit **outside** and to the **left/above** the system.
- Internal services flow left to right inside the system boundary.

### System Boundary Group

Draw **one group** that acts as a system boundary box. Include all components the team
builds and controls. Exclude external actors and third-party APIs:

```ts
groups: [
  {
    id: 'sa_boundary',
    title: 'Agent System',
    desc: 'Everything built and operated within our control.',
    nodeIds: ['orchestrator', 'planner', 'memory', 'tools', 'executor', 'evaluator', 'pol_escalate'],
    color: 'rgba(129,200,190,0.06)',
    borderColor: '#81c8be',
    textColor: '#c6d0f5',
  }
]
```

**What goes inside the boundary:** services, databases, aggregates, decision nodes.  
**What stays outside:** `USER` actors, `EXTERNAL` APIs, `human_reviewer` SMEs.

### Relation Conventions for SYS_ARCH

Label comments on each edge with the boundary context:

```ts
{ id: 'r_sa_1', from: 'user',    to: 'orchestrator',  views: ['SYS_ARCH'] },  // actor → system
{ id: 'r_sa_5', from: 'tools',   to: 'llm',           views: ['SYS_ARCH'] },  // system → external API
{ id: 'r_sa_6', from: 'llm',     to: 'executor',      views: ['SYS_ARCH'] },  // external API → system
{ id: 'r_sa_9', from: 'evaluator', to: 'user',        views: ['SYS_ARCH'] },  // system → actor
{ id: 'r_sa_12', from: 'human_reviewer', to: 'orchestrator', views: ['SYS_ARCH'], dashed: true }, // external → system (feedback)
```

**Do NOT add groups** other than the boundary — no phase groups in SYS_ARCH.

### Typical SYS_ARCH Node Positions

```ts
// External actors — left side
{ id: 'user',          x: 80,   y: 300 },
{ id: 'human_reviewer',x: 80,   y: 520 },
// External API — above the boundary box
{ id: 'llm',           x: 960,  y: 100 },

// Internal — pipeline left to right
{ id: 'orchestrator',  x: 310,  y: 300 },
{ id: 'planner',       x: 560,  y: 220 },
{ id: 'memory',        x: 560,  y: 420 },  // support, below planner
{ id: 'tools',         x: 810,  y: 300 },
{ id: 'executor',      x: 1060, y: 300 },
{ id: 'evaluator',     x: 1310, y: 300 },
{ id: 'pol_escalate',  x: 1310, y: 480 },  // failure branch, below evaluator
```

**Column spacing:** ~250px between pipeline stages. Support nodes are ~180px below
their caller on the Y-axis.

---

## 6. Data Flow (DFD) — Layout and Grouping

### Layout Strategy

Use a **single horizontal track** with a **failure branch below**:

```
y ≈ 200:  User → Planner → Tools → LLM → Executor → Evaluator → Output → User
y ≈ 100:          Memory ↗ (reads into Planner)
y ≈ 380:                                             Evaluator → Escalate → Human Reviewer
```

- Everything flows strictly left to right.
- Memory and databases sit **above** the main track (they are read by, not sequential to).
- The failure branch sits **below**, reading right-to-left from the evaluator.
- **No groups** (`groups: []`).

### Typical DATA_FLOW Node Positions

```ts
{ id: 'user',          x: 100,  y: 200 },
{ id: 'planner',       x: 320,  y: 200 },
{ id: 'memory',        x: 320,  y: 100 },   // above planner
{ id: 'tools',         x: 540,  y: 200 },
{ id: 'llm',           x: 760,  y: 200 },
{ id: 'executor',      x: 980,  y: 200 },
{ id: 'evaluator',     x: 1200, y: 200 },
{ id: 'output',        x: 1420, y: 200 },
{ id: 'pol_escalate',  x: 1200, y: 380 },   // below evaluator (failure)
{ id: 'human_reviewer',x: 1420, y: 380 },
```

**Column spacing:** ~220px between stages on the main track.

---

## 7. Activity Swimlanes — Layout and Grouping

### Lane Design

Split lanes by **actor / system boundary** — not by phase. Each lane represents who
owns the work, not when it happens.

**Recommended lane structure for agent systems:**

| Lane | Who | Typical nodes |
|------|-----|--------------|
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

**Lane height rule:** Nodes within a lane must have their `y` coordinate within
`[lane.y + 30, lane.y + lane.h - 30]`.

### Typical SWIMLANES Node Positions

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

**Column spacing:** ~210px between stages. Cross-lane handoff arrows are the key
teaching points — comment each one with the boundary it crosses.

---

## 8. Relation Conventions Summary

| Pattern | How to write it |
|---------|----------------|
| Happy-path forward edge | `{ from: 'a', to: 'b', views: ['VIEW'] }` |
| Feedback / retry loop | `{ ..., dashed: true }` |
| Handled-by (Event Storming) | `{ from: 'cmd', to: 'agg', handledBy: true }` |
| Cross-boundary (SYS_ARCH) | Comment with `// actor → system` or `// system → external API` |
| Cross-lane (SWIMLANES) | Comment with `// Lane N → Lane M` |

**Relation ID naming:** `r_<view_abbr>_<n>` (e.g., `r_es_1`, `r_sa_3`, `r_df_7`, `r_sl_11`).

---

## 9. Quick-Reference Checklist

Before finalising any flowchart view, verify:

- [ ] Every entity in SYS_ARCH / DATA_FLOW / SWIMLANES also has `EVENT_STORMING` in its `viewTypes`.
- [ ] Events (`TYPES.EVENT`) are **not included** in SYS_ARCH, DATA_FLOW, or SWIMLANES.
- [ ] Entities with verb titles in EVENT_STORMING have noun `viewTitles` for other views.
- [ ] Duplicate-looking nodes are collapsed via a shared entity (no two nodes with the same label in one view).
- [ ] SYS_ARCH has exactly **one boundary group**; DATA_FLOW has `groups: []`.
- [ ] SWIMLANES lanes cover all node y-positions without gaps or overlaps.
- [ ] All feedback loops use `dashed: true`.
- [ ] `npm run typecheck` passes after changes.
