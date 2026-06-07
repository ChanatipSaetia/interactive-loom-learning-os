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

| Y-Coordinate | Layer | Elements |
|---|---|---|
| 50 | Support | Database, Read Model |
| 120 | Handler | Aggregate, Actor, External System |
| 250 | Timeline | Event, Command, Policy |
| 400+ | Branch | Failure/alternative paths (+150px per level) |

## Stacking Rule

```
          [Database]
              ↑
          [Aggregate]        ← HANDLER (above command, same x)
      ────[handled by]───
      [Policy] [Command] [Event]   ← TIMELINE (inline, same y)
```

- Command and handler share the **same x-coordinate**
- Handler sits directly above, connected by **straight vertical arrow**
- Timeline elements connected by **curved bezier, dashed arrows**

## Spacing

```
Within a stack:   ~140px between elements (tight, adjacent)
Between stacks:   ~160px gap (visual separation)
Branch offset:    +150px per branch level (y:400, y:540, ...)
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
- [ ] Commands and handlers share same x-coordinate
- [ ] Handlers positioned above commands at y:120
- [ ] All timeline elements at y:250
- [ ] Branches diverge to lower y (400, 540, ...)
- [ ] `handledBy: true` on command → handler relations
- [ ] Loop-back relations use `dashed: true`
- [ ] Each stack is tightly grouped (~140px between elements)
- [ ] Stacks separated by ~160px gap

## Reference Files

- `docs/adr/0002-event-storming-conventions.md` — Full ADR
- `src/sections/flowchart/index.tsx` — Rendering implementation
- `src/topics/demo/data.ts` — Working example with all conventions applied
