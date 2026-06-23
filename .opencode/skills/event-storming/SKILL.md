---
name: event-storming
description: Position and draw Event Storming diagrams correctly in the Flowchart View. Use when creating or editing Event Storming data, positioning nodes, or naming events/commands/policies.
---

# Event Storming Conventions

## When to Use

Use this skill when creating or editing Event Storming data in the Flowchart component, positioning nodes, or naming elements.

## Quick Reference

### Element Naming

| Type | Format | Example |
|---|---|---|
| Event | Past tense noun phrase | `Goal Submitted`, `Plan Generated` |
| Command | Imperative verb + noun | `Create Plan`, `Run Tool` |
| Policy | "When X, do Y" rule | `Plan on New Goal`, `Re-Plan on Failure` |
| Aggregate | Domain entity name | `Orchestrator`, `Order` |
| Actor | Role name | `User`, `Human Reviewer` |
| External | System name | `LLM`, `Payment Gateway` |

### Flow Pattern (always)

```
Event → Policy → Command ═══> Handler → Event
  (what)  (rule)  (action)  (who)     (result)
```

## Row System

> **Note**: Node positions are computed automatically by the layout algorithm in `derivations.ts`. The grid row indices below are assigned based on entity type; the pixel Y-coordinates are the rendered output in `flowchart-view.tsx`.

| Grid Row | Y-Pixel | Layer | Elements |
|---|---|---|---|
| 0 | 50 | Support | Database, Read Model |
| 1 | 150 | Handler | Aggregate, Actor, External System |
| 2 | 250 | Timeline | Event, Command, Policy |
| 3 | 450 | Branch 1 | Failure/alternative paths |
| 4 | 650 | Branch 2 | Second-level branches |

## Stacking Rule

```
          [Database]         ← row 0 (y:50), same column as Command
              ↑
          [Aggregate]        ← row 1 (y:150), same column as Command
      ────[handled by]───
      [Policy] [Command] [Event]   ← row 2 (y:250), inline
```

- Command and handler share the **same column** (auto-assigned by layout algorithm)
- Handler sits directly above, connected by **straight vertical arrow**
- Timeline elements connected by **curved bezier, dashed arrows**

## Spacing

```
Column formula:   x = col * 140 + 60  (auto-computed col index)
Within a stack:   ~140px between elements (tight, adjacent)
Between stacks:   ~160px gap (visual separation)
Branch offset:    +200px per branch level (y:450, y:650, ...)
```

## Schema Rules

- Use `handledBy: true` on relations for command → handler connections
- Duplicate nodes when same aggregate appears in multiple stacks (e.g., `orch_plan`, `orch_eval`)
- Branch paths shift to lower y-coordinates, not inline
- Commands are imperative verbs, never nouns

## Drawing Rules

| Connection | Style | Meaning |
|---|---|---|
| Timeline flow | Curved bezier, dashed stroke | Sequential progression |
| `handled by` | Straight vertical, solid green (#a6d189), labeled | Command → handler ownership |
| Loop-back | Dashed line | Retry/replan cycle |
| Branch split | Diverge to lower y | Alternative paths |

## Checklist

When creating Event Storming data, verify:

- [ ] Events use past tense (`Submitted`, `Generated`)
- [ ] Commands use imperative verbs (`Create`, `Run`, `Review`)
- [ ] Entity `type` field is set correctly (positions are auto-computed from type)
- [ ] `handledBy: true` on command → handler relations
- [ ] Loop-back relations use `dashed: true`
- [ ] Handlers/Databases are connected to their Commands via relations (stacking is auto-derived)
- [ ] Branch paths are connected via forward relations (branch levels are auto-derived)

> **Note**: Manual `grid` coordinates in schema data are ignored. The layout algorithm in `src/sections/flowchart/derivations.ts` computes all positions automatically based on entity types and relations.

## Reference Files

- `docs/adr/0002-event-storming-conventions.md` — Full ADR
- `src/sections/flowchart/derivations.ts` — Auto-layout algorithm (`layoutNodes`)
- `src/sections/flowchart/flowchart-view.tsx` — Grid-to-pixel rendering
- `src/topics/demo/data/agent-schema.ts` — Working example with all conventions applied
