---
name: create-topic
description: Scaffold a new topic for the Interactive Loom Learning OS by delegating to autonomous subagents that read Obsidian vault for content. Use when the user wants to create a new topic, add a new lesson, or scaffold topic files.
---

# Create Topic

Scaffold a new topic by discovering Obsidian content, defining bounded contexts, then delegating to autonomous subagents. The main agent surveys the vault to understand what exists, but does **not** deep-dive into content — subagents read Obsidian for their own scope.

## Workflow

### 1. Gather Requirements (Main Agent)

Ask the user for:
- **Topic ID** — kebab-case slug (e.g., `microservices-patterns`)
- **Topic Label** — display name for nav
- **Category** — grouping for Overview page
- **Description** — short summary for the topic table
- **Content outline** — what concepts the topic teaches

### 2. Discover Obsidian Content (Main Agent)

Survey the vault to understand what content exists:

```
1. obsidian_search_simple with topic keywords → find related notes
2. obsidian_vault_list → see note structure
3. obsidian_vault_read (small limit) → skim headings to understand coverage
4. Build map: "these notes cover concept A, these cover concept B"
```

**Purpose:** Align bounded contexts with actual Obsidian content. **Do not** read entire notes — subagents will do that.

### 3. Define Bounded Contexts and Delegate (Main Agent)

From the discovery, carve **independent bounded contexts** that map to Obsidian note clusters. Each bounded context becomes one subagent task:

| Bounded Context Has… | Section Type |
|---|---|
| 3+ related concepts with scope | `taxonomy-browser` |
| System components and connections | `flowchart` (SYS_ARCH) |
| Temporal flow, behavior | `flowchart` (EVENT_STORMING) |
| Both structure + behavior | `flowchart` (multi-view) |
| Design decisions with trade-offs | `tradeoff-sandbox` |
| Narrative explanation | `text` |
| Checklists, enumeration | `bullets` |

Run subagents **sequentially** (each waits for previous to finish). Give each a **self-contained bounded context** — it should not depend on other subagents' output.

### 4. Subagent Contract

Each subagent receives a bounded context with **Obsidian hints** from the discovery phase:

```
You are creating the <section-type> section for topic "<topic-id>".
Bounded context: <clear description of what this section covers>
Obsidian hints: <list of relevant note paths discovered by main agent>
Output path: src/topics/<topic-id>/data/<section-path>/

Before writing code:
1. Read the Obsidian notes mentioned in hints:
   - Use obsidian_vault_read to read relevant sections
   - Use obsidian_vault_get_document_map to find headings to target
   - Focus on content within your bounded context, not the whole note
2. If more content is needed, search Obsidian for related notes
3. Read your section schema: references/Section-<Type>.md
4. Create files following the schema
```

**Subagent Obsidian rules:** Start with hinted notes, search if needed. Read only relevant sections. If no content exists, ask the user — don't hallucinate.

### 5. Subagent Types

Each subagent reads its own `references/Section-<Type>.md` for schema. Flowchart subagents read `Section-Flowchart.md`.

### 6. Integrate and Verify (Main Agent)

Import topic in `src/main.tsx`, register route in `src/core/routes.ts`, run `npm run typecheck && npm run lint`.

## Gotchas

- `TopicRegistry.register` ID must match route `id`
- Flowchart journeys must reference entity IDs that exist in at least one view
- EVENT and POLICY types are Event Storming only
- Taxonomy `color` must be Frappé key
- **Event Storming Naming**: Events use past tense titles (e.g. `Goal Submitted`), Commands use imperative verbs (e.g. `Create Plan`), and Policies use rule titles (e.g. `Route Next Step`).
- **Entity Collapsing**: Event Storming aggregates or temporary nodes that merge/collapse in other structural views must declare `collapsedTo: 'collapsed_entity_id'` in their entity definitions so that journey steps highlight them correctly in all views.

## Reference Files

- [Section-Flowchart.md](references/Section-Flowchart.md) — Unified single-file schema and grid coordinate system (referencing flowchart-schema.json)
  - [Section-Flowchart-EventStorming.md](references/Section-Flowchart-EventStorming.md) — Chronological, zero-gap stacking, branching tree
  - [Section-Flowchart-Swimlanes.md](references/Section-Flowchart-Swimlanes.md) — Simplified 3-lane structure (Actors, System, External Systems)
  - [Section-Flowchart-SysArch.md](references/Section-Flowchart-SysArch.md) — Center-focused hub-and-spoke topologies
  - [Section-Flowchart-Sequence.md](references/Section-Flowchart-Sequence.md) — (NEW) Vertical lifelines and horizontal message calls
  - [Section-Flowchart-DataFlow.md](references/Section-Flowchart-DataFlow.md) — Data-format nodes and JSON payload transitions
  - [Section-Flowchart-StateMachine.md](references/Section-Flowchart-StateMachine.md) — (NEW) Interactive Orchestrator lifecycle states
  - [Section-Flowchart-ERD.md](references/Section-Flowchart-ERD.md) — (NEW) Relational database schemas for aggregates
- [Section-TaxonomyBrowser.md](references/Section-TaxonomyBrowser.md)
- [Section-TradeoffSandbox.md](references/Section-TradeoffSandbox.md)
- [Section-Text.md](references/Section-Text.md)
- [Section-Bullets.md](references/Section-Bullets.md)
- **Best example**: `src/topics/ai-operating-model/`

