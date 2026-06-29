# Guideline: How to Create a New Topic

## Objective
The objective of creating a new topic is to create comprehensive content for that topic, so the user can learn and fully understand the concept, and ultimately be ready to use AI or communicate effectively about that topic.

Creating a new interactive topic in the Interactive Loom Learning OS is done by assembling a sequence of modular "sections". The key architectural principle is strict separation of content (data) from structure (UI).

Below is the step-by-step process based on the `demo` topic implementation.

## 1. Create the Directory Structure
Create a new directory for your topic under `src/topics/[topic-name]/`.

A standard topic directory includes:
- `data/`: A directory storing all raw data payloads separated by type.
- `sections.ts`: Defines the sequence of sections, mapping the raw data to section props.
- `index.tsx`: The main React component that renders the sections.

## 2. Isolate Content in the `data/` Directory
To keep the structure clean, all content should live in `src/topics/[topic-name]/data/`. You should export these variables through `data/index.ts`.

Example `data/text.ts` (for Text and Bullet sections):
```typescript
import type { BulletItem } from '../../../sections/bullets'

export const myTopicParagraphs: string[] = [
  'Paragraph 1...',
  'Paragraph 2...',
]

export const myTopicBullets: BulletItem[] = [
  { text: 'Capability 1', children: [{ text: 'Sub-capability 1' }] },
  { text: 'Capability 2' },
]
```

Example `data/index.ts` (aggregating exports):
```typescript
export * from './text'
export * from './schema'     // UnifiedFlowchartSchema
export * from './taxonomy'   // TaxonomyCategory[]
export * from './tradeoffs'  // TradeoffScenario[]
export * from './flashcards' // WordTerm[]
```

## 3. Assemble the Topic in `sections.ts`
Your `sections.ts` will export an array of `SectionConfig` objects. Each section has a specific `type` and requires specific `props` fed from your `data/` folder. The order of the sections in this array determines the display order in the UI. Order the sections to follow a meaningful learning progression rather than an arbitrary sequence — see [Recommended Section Order](#recommended-section-order) below.

Here are the 6 available section types, their objectives, and how you assign content to them:

### 1. `flowchart`
**Objective:** Show how the action (command), event, and policy relate to actor aggregates and other external systems. It shows the flow of the process and provides multiple views (e.g. Event Storming, Sequence, Swimlanes) to make complex architectures easy to understand.

**Event Storming Node and Relation Conventions:**
When defining a `UnifiedFlowchartSchema` for a flowchart, strictly follow these conventions (as seen in the `demo` and `motorcycle` topics):
- **Root Node:** Set `root: true` on exactly ONE entity, which should be the starting `COMMAND` of the Event Storming flow. This determines the entry point and chronological anchor for the layout.
- **Standard Flow (per step):** Each step in the process follows the full cycle: `EVENT` → `POLICY` → `COMMAND` → `AGGREGATE`/`EXTERNAL` (via `handledBy`) → `EVENT`. The reacting `POLICY` triggers the next `COMMAND`, which is handled by the component that produces the resulting `EVENT`. Do not skip the `POLICY` or `COMMAND` — every step that "does work" should be a `COMMAND` handled by an `AGGREGATE`/`EXTERNAL`, not a direct `EVENT` → `AGGREGATE` jump.
- **Direction & Branching:** The flow progresses left-to-right from the root. Branching **must** happen through `POLICY` nodes — an `EVENT` connects to one or more `POLICIES`, and each `POLICY` triggers exactly one `COMMAND`. Never branch `POLICY → multiple COMMANDs` or `EVENT → multiple COMMANDs`. When 1 `EVENT` triggers 2 or more `POLICIES`, the layout engine spreads these branches vertically and symmetrically. A branching point (`EVENT` with >= 2 outgoing `POLICIES`) renders as the single Decision diamond in the Swimlanes/Data Flow views.
- **Duplicate-and-Collapse for repeated handlers:** A single canonical `AGGREGATE`, `EXTERNAL`, or `USER` (actor) is often involved in multiple steps of the flow. **Create a separate duplicate entity for each step it participates in, and map every duplicate back to the canonical node with `collapsedTo`.** This is required to complete the `handledBy` chain so the layout and derived views (Sequence, Swimlanes, Data Flow) resolve correctly.
  - Aggregate example (`motorcycle` topic): `engine`, `engine2`, `engine3`, `engine4` are four duplicates each handling one stroke (intake / compression / combustion / exhaust), all `collapsedTo: 'engine'`.
  - External example (`demo` topic): `llm_reason` and `llm_final` (collapsed to `llm_reason`); `orch_agent` with `orch_plan_ref`, `orch_qa_ref`, `orch_notify_ref` all collapsing to `orch_agent`.
  - Actor example (`demo` topic): `dev_user_feedback` collapses to `dev_user` (same developer, two interaction points).
- **Command Handlers:** Relations from a `COMMAND` to its handler (an `AGGREGATE` or `EXTERNAL`) must use `handledBy: true`. Point each handler relation at the per-step duplicate (e.g. `cmd_compression -> engine2` with `handledBy: true`), not the canonical node, so each step has its own handler instance.
- **View Targeting:** Relations should specify `views: ['EVENT_STORMING']` to ensure they render correctly in the Event Storming view.
- **Node Types:** The flowchart supports two categories of node types — **source types** you set directly in the schema, and **derived types** generated automatically by the layout engine for other views.

  **Source types** (set `type` directly on entities):

  | Type | `TYPES` key | Description | Example |
  |---|---|---|---|
  | Event | `TYPES.EVENT` | Something that happened; result of work | `evt_started`, `evt_tool_executed` |
  | Command | `TYPES.COMMAND` | An action or intent to do work | `cmd_run_agent`, `cmd_call_llm` |
  | Policy | `TYPES.POLICY` | A rule that decides which command to issue next | `pol_plan`, `pol_route` |
  | Aggregate | `TYPES.AGGREGATE` | A component within the system/library being discussed | `orch_agent`, `tools_router`, LangChain's `AgentExecutor` |
  | External API | `TYPES.EXTERNAL` | A real external system outside your control, called via API/network | LLM API (OpenAI), MCP servers, subagents |
  | Actor | `TYPES.USER` | A human user or actor initiating actions | `dev_user`, `qa_user` |
  | Read Model | `TYPES.READ_MODEL` | A query-optimized data projection | CQRS read model, materialized view |
  | Risk | `TYPES.HOTSPOT` | An area of uncertainty or risk in the design | unresolved integration point |

  **Derived types** (generated automatically, **do not set** in the schema):

  | Derived Type | Source Type | Appears in views |
  |---|---|---|
  | `DECISION` | `POLICY` with >= 2 outgoing relations | Swimlanes, Data Flow |
  | `PROCESS` | `COMMAND` | Swimlanes |
  | `DATA_OBJECT` | `EVENT`, `READ_MODEL` | Data Flow, State Machine |
  | `SERVICE` | `AGGREGATE` | System Architecture, Sequence |
  | `CORE_SYSTEM` | — | — |

  The derivation is controlled by `MASTER_MAPPING_MATRIX` in `src/sections/flowchart/types.ts`.

- **Aggregate vs. External Systems:** Use `AGGREGATE` for components that belong to the system or library being discussed (e.g., an `AgentExecutor`, `RunnableSequence`, or `PromptTemplate` inside LangChain). Use `EXTERNAL` for real external systems outside your control that are called via API, network, or file — e.g., a database, LLM API (OpenAI, Anthropic), message queue, or third-party service.
- **Splitting Flowcharts into Independent Graphs:** When a topic has multiple subsystems, split them into separate schemas if they share **no `COMMAND` or `EVENT` entities** between them. Sharing `AGGREGATE` or `EXTERNAL` entities is fine — those do not require keeping flows together. Each independent graph gets its own schema with exactly ONE `root: true` node.
  - Example (`motorcycle` topic): 4 independent schemas — `engineSchema` (4-stroke cycle), `chokeSchema` (cold start), `fuelInjectSchema` (EFI), `brakeSchema` (braking) — none share commands or events.
- **Multiple Journeys per Schema:** Each schema should include multiple `journeys` to cover different execution paths through the same flow. Each journey follows **one branch** from the flowchart. At minimum, include a happy path. Add journeys for error paths, alternative routes, feedback loops, and edge cases. Use `nodeIds` (array) in each step to group nodes that appear together in that step, and `processGroup` to organize steps into phases. See `motorcycle` topic: choke schema has cold start + forgot choke journeys, brake schema has normal + fade journeys, fuel injection schema has normal + cold enrichment journeys.
  - Reference (`demo` topic): 3 journeys covering happy path (tool execution + QA pass), feedback loop (agent asks user for input → replans), and direct LLM answer (skips tools). Each journey reuses nodes from the same schema to tell a different story.
- **Multiple Flowchart Sections:** A topic can have multiple `flowchart` sections, one per independent schema. Order them so foundational concepts appear first, then related systems.

```typescript
  {
    type: 'flowchart',
    props: {
      title: 'System Architecture',
      schema: myTopicSchema,
    },
  },
```

### 2. `tradeoff-sandbox`
**Objective:** Used when the topic has multiple choices that can be selected depending on different situations. It allows the user to understand the impact of selecting each choice and see the resulting metrics change immediately.
```typescript
  {
    type: 'tradeoff-sandbox',
    props: {
      title: 'Architecture Trade-offs',
      scenarios: myTopicTradeoffs,
    },
  },
```

### 3. `taxonomy-browser`
**Objective:** Used for clearing up ambiguous taxonomy or concepts that people normally don't understand and misunderstand frequently.
```typescript
  {
    type: 'taxonomy-browser',
    props: {
      title: 'Capability Taxonomy',
      categories: myTopicTaxonomies,
    },
  },
```

### 4. `flashcards`
**Objective:** Used to make the user familiar with the vocabulary of the topic and how to use those terms along with the AI.
```typescript
  {
    type: 'flashcards',
    props: {
      terms: myTopicFlashcards,
    },
  },
```

### 5. `text` and `bullets`
**Objective:** Normal and arbitrary sections used if the other specialized sections cannot provide a proper understanding of the important points of the topic.
```typescript
  {
    type: 'text',
    props: {
      title: 'Introduction',
      heading: 'Sub-heading',
      paragraphs: myTopicParagraphs,
    },
  },
  {
    type: 'bullets',
    props: {
      title: 'Key Capabilities',
      ordered: false,
      items: myTopicBullets,
    },
  },
```

### Recommended Section Order

Order sections so the learner builds understanding progressively: introduce the idea, give them the vocabulary, then show how it works, then let them explore trade-offs, and finally reinforce. A good default progression:

1. **Intro (`text`)** — Set the context: what the topic is, why it matters, and what the learner will be able to do afterward.
2. **Glossary / vocabulary (`flashcards` or `taxonomy-browser`)** — Teach the key terms *before* they appear in diagrams and explanations, so the learner isn't decoding jargon and concepts at the same time. Use `taxonomy-browser` when terms are frequently confused or misunderstood; use `flashcards` to drill recall.
3. **Core explanation (`text` / `bullets`)** — Explain the main concepts and key capabilities now that the vocabulary is established.
4. **How it works (`flowchart`)** — Show the process flow (Event Storming, Sequence, Swimlanes). This relies on the vocabulary and concepts introduced above.
5. **Explore trade-offs (`tradeoff-sandbox`)** — Once the learner understands the mechanism, let them experiment with the decisions and see the impact of each choice.
6. **Reinforce (`flashcards`)** — Optionally close with recall drills to consolidate the vocabulary and key takeaways.

This is a guideline, not a rigid template. Adapt the order to the topic — but always put understanding-enablers (intro, glossary) before the sections that depend on them (flowchart, trade-offs). The general principle: **never make the learner rely on something they haven't been taught yet.**

## 4. Render the Topic in `index.tsx`
Use the `SectionRenderer` to dynamically render the configuration defined in `sections.ts`.

```tsx
// src/topics/my-topic/index.tsx
import { SectionRenderer } from '../../components/layout/TopicShell'
import { myTopicSections } from './sections'

export default function MyTopic() {
  return (
    <div className="my-topic" data-testid="my-topic">
      {myTopicSections.map((section, idx) => (
        <SectionRenderer key={idx} config={section} />
      ))}
    </div>
  )
}
```

## 5. Register the Route
Once your topic is defined, register it in `src/core/routes.ts` by appending it to the `routes` array.

```typescript
import { myTopicSections } from '../topics/my-topic/sections'

export const routes: TopicRoute[] = [
  // ... existing routes
  {
    id: 'my-topic',
    label: 'My Awesome Topic',
    path: '/topics/my-topic',
    category: 'Architecture',
    description: 'A brief description of the topic that appears in the overview.',
    sections: myTopicSections,
  },
]
```
