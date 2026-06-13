# Section: Flowchart — DATA_FLOW View

Data Flow Diagram (DFD) shows how data transforms as it passes through the system.

## Purpose

Focuses on data movement and transformation, not component structure or timing. Answers:
- What data enters the system?
- How is it transformed at each stage?
- What data exits?

## Entity Types

| Type | Meaning |
|---|---|
| `USER` | External data source/sink |
| `PROCESS` | Data transformation step |
| `DATABASE` | Data store |
| `EXTERNAL` | External system |
| `DECISION` | Routing based on data content |
| `DATA_OBJECT` | Data artifact produced |

## Entity Type Mapping from EVENT_STORMING

| EVENT_STORMING | DATA_FLOW |
|---|---|
| `COMMAND` | `PROCESS` |
| `POLICY` | `DECISION` |
| `AGGREGATE` | — (omit) |
| `EVENT` | — (omit) |
| `USER` | `USER` |
| `EXTERNAL` | `EXTERNAL` |
| `DATABASE` | `DATABASE` |
| `DATA_OBJECT` | `DATA_OBJECT` |

## Layout Strategy

Use a **single horizontal track** with a **failure branch below**:

```
y ≈ 200:  User → Process → Process → Process → Output → User
y ≈ 100:          Database ↗ (reads into Process)
y ≈ 380:                          Process → Decision → External
```

- Everything flows strictly left to right
- Memory and databases sit **above** the main track (read by, not sequential to)
- Failure branch sits **below**, reading right-to-left from the evaluator
- **No groups** (`groups: []`)
- Column spacing: ~220px between stages

### Typical Node Positions

```ts
{ id: 'user',          x: 100,  y: 200 },
{ id: 'planner',       x: 320,  y: 200 },
{ id: 'memory',        x: 320,  y: 100 },    // above planner
{ id: 'tools',         x: 540,  y: 200 },
{ id: 'llm',           x: 760,  y: 200 },
{ id: 'executor',      x: 980,  y: 200 },
{ id: 'evaluator',     x: 1200, y: 200 },
{ id: 'output',        x: 1420, y: 200 },
{ id: 'pol_escalate',  x: 1200, y: 380 },    // below evaluator (failure)
{ id: 'human_reviewer',x: 1420, y: 380 },
```

## Groups

**Always `groups: []`** — DFDs should not have bounding groups.

## Relation Conventions

- Edges represent data movement, not control flow
- Use `dashed: true` for feedback loops
- Relation ID naming: `r_df_<n>`

## Tips

- Keep it flat — DFDs work best without deep branching
- Don't include event nodes — DFD is about data, not timing
- Use when you want to show how raw input becomes a finished output
- Each `PROCESS` node transforms input data into output data
