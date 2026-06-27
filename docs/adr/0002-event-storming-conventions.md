# 0002 — Event Storming positioning and drawing conventions

## Context
The Flowchart component supports an Event Storming View. To produce correct, readable Event Storming diagrams, we need consistent positioning rules that follow the established Event Storming technique (Alberto Brandolini).

## Decision

### Layout Algorithm

The Event Storming layout is computed dynamically from the schema's entities and relations, not from hardcoded grid coordinates. The algorithm proceeds in phases:

**Phase 1: Grouping** (see [grouping.ts](../../src/sections/flowchart/derivations/event-storming/grouping.ts))
- Groups are built per-command via directional BFS: `Command → Handler → Events → Policies`
- Each group contains a command, its handler, connected events, policies, actors, externals, and DBs
- BFS stops at the next command (which starts its own group)
- Orphan nodes (not reachable from any command) become single-node groups

**Phase 2: Positioning** (see [positions.ts](../../src/sections/flowchart/derivations/event-storming/positions.ts))

### Root Identification

- The root group is identified by a `root: true` flag on a `FlowchartViewNode` in the schema
- Fallback: first group by schema order with no incoming edges

### X-Axis: Chronological Depth Columns

- BFS from root assigns each group a depth (root = 0, children = parent depth + 1)
- Groups at the same depth share an X column
- Column width = max group width in that layer + gap (1.5 units)
- Flow progresses left to right chronologically

### Y-Axis: Symmetric Branching

- Root group is centered at Y = 0
- Children spread symmetrically around their parent's Y position
- For N siblings: offsets = `-(N-1)/2` to `+(N-1)/2` in steps of 1
- Multiple parents: child's Y = average of all parents' Y positions
- Example: parent at Y=0 with 3 children → children at Y = -1, 0, 1

### Collision Resolution (Post-Layout)

- After initial Y assignment, detect groups in the same X column with overlapping Y ranges
- Push apart by minimum spacing (1.0 units) iteratively until no collisions remain
- Groups sorted by Y; each group pushed below the previous group's bounding box + padding

### Within-Group Layout

Each group's internal layout uses a 3-column grid:

| Column | Content | X |
|--------|---------|---|
| -1 | Actor (triggers command) | CMD_COL - 1 |
| 0 | Handler (above), Command (below) | CMD_COL |
| 1 | Events | EVT_COL |
| 2 | Policies | POL_COL |

- Commands and handlers share the same X column
- Actors sit to the left of their command
- Events stack in column 1
- Policies in column 2; branching policies get extra horizontal offset
- DBs and externals positioned relative to their connected handler

### Flow Pattern (always)

```
Event → Policy → Command ═══> Handler → Event
  (what)  (rule)  (action)  (who)     (result)
```

- **Event** (something happened) triggers a **Policy** (business rule)
- **Policy** issues a **Command** (what to do)
- **Command** is handled by an **Aggregate/Actor/External** (who does it)
- **Handler** produces the next **Event** (outcome)

### Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Event | Past tense noun phrase | `Goal Submitted`, `Plan Generated` |
| Command | Imperative verb + noun | `Create Plan`, `Run Tool`, `Review Result` |
| Policy | "When X, do Y" rule | `Plan on New Goal`, `Re-Plan on Failure` |
| Aggregate | Domain entity name | `Orchestrator`, `Order`, `Cart` |
| Actor | Role name | `User`, `Human Reviewer`, `Admin` |
| External | System name | `LLM`, `Payment Gateway`, `OpenSearch DB` |

## Consequences

- Schema uses `root: true` on `FlowchartEntity` (propagates to `FlowchartViewNode` during auto-derivation) or directly on `FlowchartViewNode` for explicit views
- Schema uses `handledBy: boolean` on relations to mark command → handler connections
- Rendering draws `handledBy` as straight vertical lines when nodes share the same x
- Nodes are duplicated when the same aggregate appears in multiple groups rather than reused
- Layout is computed at runtime, not stored in schema grid coordinates
- Commands are always named as imperative verbs, not nouns (e.g., `Create Plan` not `Planner`)
- Branching flows spread symmetrically above and below the parent, not just below
