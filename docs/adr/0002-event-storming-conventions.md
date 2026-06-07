# 0002 — Event Storming positioning and drawing conventions

## Context
The Flowchart component supports an Event Storming View. To produce correct, readable Event Storming diagrams, we need consistent positioning rules that follow the established Event Storming technique (Alberto Brandolini).

## Decision

### Row System

```
y:50     — Support layer (Database, Read Model)
y:120    — Handler layer (Aggregate, Actor, External System)
y:250    — Timeline (Event, Command, Policy — left to right, chronological)
y:400    — Branch row 1 (failure/alternative paths)
y:540    — Branch row 2 (further alternatives)
```

### What Goes Where

| Element | Row | Why |
|---------|-----|-----|
| **Event** (orange) | Timeline | Facts that happened, flow chronologically |
| **Command** (blue) | Timeline | Imperative verb, part of the flow sequence |
| **Policy** (green) | Timeline | Business rule, bridges event → command |
| **Aggregate** (brown) | Above timeline | Owns the command it handles |
| **Actor** (yellow) | Above/below timeline | Initiates or handles commands |
| **External System** (teal) | Above timeline | External service that handles commands |
| **Database** (teal) | Above handler | Supporting storage for the aggregate |
| **Branch paths** | Below timeline | Diverge from branch point, each at distinct y |

### Stacking Rule

A single logical unit stacks vertically:

```
          [Database]
              ↑
          [Aggregate]        ← HANDLER (above)
      ────[handled by]───
      [Policy] [Command] [Event]   ← TIMELINE (inline)
```

- Command and its handler share the **same x-coordinate**
- Handler sits directly above, connected by a **straight vertical arrow**
- Policy → Command → Event flow **horizontally** on the timeline

### Spacing Rules

```
Within a stack:   ~140px between elements (tight, adjacent)
Between stacks:   ~160px gap (visual separation)
Branch offset:    +150px per branch level (y:400, y:540, ...)
```

### Drawing Rules

| Connection | Style | Meaning |
|------------|-------|---------|
| Timeline flow | Curved bezier, dashed stroke | Sequential progression |
| `handled by` | Straight vertical, solid green (#a6d189), labeled | Command → handler ownership |
| Loop-back | Dashed line | Retry/replan cycle |
| Branch split | Diverge to lower y | Alternative paths |

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

- Schema uses `handledBy: boolean` on relations to mark command → handler connections
- Rendering draws `handledBy` as straight vertical lines when nodes share the same x
- Nodes are duplicated when the same aggregate appears in multiple stacks (e.g., `orch_plan`, `orch_eval`) rather than reused
- Branch paths (failure, alternative) shift to lower y-coordinates instead of inline
- Commands are always named as imperative verbs, not nouns (e.g., `Create Plan` not `Planner`)
