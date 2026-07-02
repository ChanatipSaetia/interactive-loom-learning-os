# Guideline: How to Create a New Topic

## Objective
The objective of creating a new topic is to create comprehensive content for that topic, so the user can learn and fully understand the concept, and ultimately be ready to use AI or communicate effectively about that topic.

Creating a new interactive topic in the Interactive Loom Learning OS is done by assembling a sequence of modular "sections". The key architectural principle is strict separation of content (data) from structure (UI).

All topic content lives in `public/okf/[topic-id]/` as markdown manifests and YAML data files. The reader pipeline loads sections dynamically — no TypeScript compilation needed.

## 1. Create the Directory Structure

Each topic has its own folder under `public/okf/`:

```
public/okf/[topic-id]/
  okf.md                          # topic manifest: section paths + file discovery
  sections/
    intro/
      section.md                  # frontmatter: type, title, resource
      content.md                  # paragraph text
    flowchart/
      section.md
      actors.yaml
      systems.yaml
      steps.yaml
      journeys.yaml
    lifecycle/
      section.md
      content.md
    capabilities/
      section.md
      items.yaml
    tradeoffs/
      section.md
      scenario-1.yaml
      scenario-2.yaml
    taxonomy/
      section.md
      category-1.yaml
      category-2.yaml
    flashcards/
      section.md
      glossary.yaml
```

**Adding a new section is simple:** create a folder with `section.md` + data files, then append the path to `okf.md` sections list.

## 2. Create the Topic Manifest (`okf.md`)

The manifest has two purposes: list sections (display order) and declare discoverable data files (browser can't list directories).

```yaml
---
type: topic
title: "Topic Display Title"
description: "One-line description for the topic card"
tags:
  - tag1
  - tag2
sections:
  - sections/intro/section.md
  - sections/flowchart/section.md
  - sections/lifecycle/section.md
  - sections/capabilities/section.md
  - sections/tradeoffs/section.md
  - sections/taxonomy/section.md
  - sections/flashcards/section.md
related:
  # All YAML data files the reader needs to discover
  - sections/flowchart/actors.yaml
  - sections/flowchart/systems.yaml
  - sections/flowchart/steps.yaml
  - sections/flowchart/journeys.yaml
  - sections/tradeoffs/enterprise-web.yaml
  - sections/tradeoffs/realtime-chat.yaml
  - sections/taxonomy/orchestrator-workers.yaml
  - sections/taxonomy/memory-context.yaml
  - sections/capabilities/items.yaml
  - sections/flashcards/glossary.yaml
---

# Topic Display Title

Optional markdown body for reference (not loaded by the reader).
```

**`sections`** — ordered list of section manifest paths (display order in the UI).
**`related`** — all discoverable YAML data files. Every `.yaml` file referenced by any section must appear here (the reader filters this list to find per-section data).

## 3. Section Types

Each section is a folder with a `section.md` manifest (YAML frontmatter) and data files.

### Section frontmatter fields

| Field | Required | Description |
|---|---|---|
| `type` | yes | Section renderer: `text`, `bullets`, `flowchart`, `tradeoff-sandbox`, `taxonomy-browser`, `flashcards` |
| `title` | yes | Display title shown above the section content |
| `resource` | yes | `"."` for directory (multiple data files), or `"filename.yaml"` for a single file |
| `heading` | no | Sub-heading displayed below the title |
| `ordered` | no | `true` for numbered lists, `false` for bullets (only for `bullets` type) |

### `text` section
Paragraph-based content. Each non-empty, non-heading line in `content.md` becomes a paragraph. Numbered items (1., 2., 3.) and bullet points (-) are stripped of their prefix.

```yaml
---
type: text
title: "Introduction Title"
heading: "Sub-heading (optional)"
resource: content.md
---
```

**Data file (`content.md`):**
```markdown
An **AI agent** is a software system that perceives its environment, reasons about a goal, and takes autonomous actions.

Modern agents combine a large language model with a memory store, a tool registry, and a feedback loop.

The key design decision is the **orchestration strategy**: single-agent vs multi-agent, synchronous ReAct loop vs async event-driven pipeline.
```

### `bullets` section
Bulleted or numbered list items with optional children.

```yaml
---
type: bullets
title: "Key Capabilities"
ordered: false
resource: items.yaml
---
```

**Data file (`items.yaml`):**
```yaml
- text: "Tool use — call external APIs, run code, browse the web"
  children:
    - text: "Web search (Tavily, Brave, Google)"
    - text: "Code execution (sandboxed interpreter)"
- text: "Long-horizon planning via chain-of-thought or ReAct"
- text: "Persistent memory across sessions (vector store)"
```

### `flowchart` section
Event Storming flowchart with multiple views (Event Storming, Sequence, Swimlanes, Data Flow, System Architecture). Always uses `resource: "."` — the reader loads 4 fixed YAML files: `actors.yaml`, `systems.yaml`, `steps.yaml`, `journeys.yaml`.

```yaml
---
type: flowchart
title: "System Architecture"
resource: "."
---
```

**Data files:**

`actors.yaml` — human actors:
```yaml
dev_user:
  title: "Developer (Initiator)"
  desc: "Starts the agent run"
qa_user:
  title: "QA Engineer"
  desc: "Reviews and approves the final result"
```

`systems.yaml` — system components:
```yaml
orch_agent:
  title: "Agent Orchestrator"
  desc: "Central orchestrator that plans and delegates"
  type: "aggregate"
llm_api:
  title: "LLM"
  desc: "Language model inference API"
  type: "external"
```

`steps.yaml` — process steps (linear or branching):
```yaml
- type: linear
  id: step_1
  initiatedBy: dev_user
  command: cmd_start
  handledBy: orch_agent
  resultEvents:
    - id: evt_started
      title: "Agent Started"
  continuesAs: step_2
- type: branch
  id: step_branch
  event: evt_decision
  branches:
    - id: branch_a
      label: "Happy path"
      policy: pol_approve
      command: cmd_approve
      handledBy: qa_user
      resultEvents:
        - id: evt_approved
          title: "Approved"
    - id: branch_b
      label: "Needs revision"
      dashed: true
      policy: pol_revise
      command: cmd_revise
      handledBy: orch_agent
      resultEvents:
        - id: evt_revision
          title: "Revision Started"
```

`journeys.yaml` — walkthrough paths through the flow:
```yaml
- id: journey_happy
  label: "Happy Path"
  description: "Agent completes the task in one pass"
  steps:
    - nodeId: evt_started
      description: "Developer triggers the agent run"
      processGroup: planning
    - nodeId: evt_approved
      description: "QA approves the result"
      processGroup: evaluation
```

**Event Storming Node and Relation Conventions:**
See [Event Storming Conventions](#event-storming-conventions) below for the full rules on flow structure, branching, duplicate-and-collapse, and node types.

### `tradeoff-sandbox` section
Interactive decision sandbox with metrics dashboard. Each scenario is a separate YAML file. Uses `resource: "."`.

```yaml
---
type: tradeoff-sandbox
title: "Architecture Trade-offs"
resource: "."
---
```

**Data file (one per scenario, e.g. `scenario-1.yaml`):**
```yaml
id: enterprise-web
title: "Enterprise Web Application"
description: "Build a scalable enterprise web app."
metrics:
  - id: performance
    label: Performance
    baseValue: 50
    min: 0
    max: 100
    direction: higher
  - id: cost
    label: Cost Efficiency
    baseValue: 50
    min: 0
    max: 100
    direction: higher
steps:
  - id: frontend
    title: "Frontend Framework"
    description: "Choose the client-side rendering approach."
    recommended: next-ssr
    choices:
      - id: react-spa
        label: "React SPA"
        description: "Single-page application with client-side routing."
        metrics:
          performance: 10
          cost: 5
        pros:
          - title: "Rich ecosystem"
            description: "Vast library support and community"
        cons:
          - title: "SEO challenges"
            description: "Requires SSR or SSG for search indexing"
        whenToUse: "Useful for admin dashboards and internal tools."
      - id: next-ssr
        label: "Next.js SSR"
        description: "Server-side rendered React with hybrid rendering."
        metrics:
          performance: 15
          cost: -5
        pros:
          - title: "Better SEO"
            description: "Server-rendered HTML for crawlers"
        cons:
          - title: "Server dependency"
            description: "Requires Node.js server runtime"
        whyThisFits: "Enterprise apps benefit from SSR for SEO and faster first paint."
```

### `taxonomy-browser` section
Card grid of concept categories with expandable detail views. Each category is a separate YAML file. Uses `resource: "."`.

```yaml
---
type: taxonomy-browser
title: "Capability Taxonomy"
resource: "."
---
```

**Data file (one per category, e.g. `orchestrator-workers.yaml`):**
```yaml
type: taxonomy-category
icon: GitFork
title: "Hierarchical Orchestration"
subtitle: "Orchestrator-Workers"
color: mauve
description: "A central manager agent decomposes goals, delegates tasks, and synthesizes output."
details: "Ideal for complex, multi-step workflows requiring strict quality control."
analogy: "Like a manager delegating tasks to developers."
primaryFocus: "Task decomposition, delegation, and output synthesis"
inScope:
  - "Central director"
  - "Specialized sub-agents"
outOfScope:
  - "Peer-to-peer unstructured negotiation"
```

The `icon` field uses a [Lucide icon name](https://lucide.dev/icons/) (e.g., `GitFork`, `Brain`, `Workflow`). The `color` field uses a Catppuccin color name (e.g., `mauve`, `rose`, `sky`, `green`, `peach`, `red`, `yellow`, `teal`).

### `flashcards` section
Vocabulary flashcards with flip animation showing definition, pronunciation, and AI dialogue. Uses `resource: glossary.yaml`.

```yaml
---
type: flashcards
title: "Key Vocabulary"
resource: glossary.yaml
---
```

**Data file (`glossary.yaml`):**
```yaml
- id: hierarchy
  word: "Visual Hierarchy"
  pronunciation: "vizh-oo-uhl hahy-er-ahr-kee"
  category: hierarchy
  shortDefinition: "Arranging UI elements in order of visual importance."
  detailedDefinition: "Visual hierarchy guides the user's eyes through an interface."
  whyItMatters: "Without hierarchy, all elements compete for attention equally."
  dialogue:
    user: "Make this look good"
    aiThoughts: "The user wants aesthetics but hasn't specified hierarchy priorities."
    aiQuestion: "Which element should be most prominent: the headline, the CTA button, or the hero image?"
```

## 4. Register the Route

Register the topic in `src/core/routes.ts`:

```typescript
import type { OKFBundled } from './okf/types'
import { loadOKFBundle } from './okf/reader'
import { useOKFBundled } from './okf/sections'

// In your topic route config or router setup:
// The OKF reader loads the manifest and sections at runtime.
// Add the topic to your route list with the topicId matching the folder name.

export const routes: TopicRoute[] = [
  // ...
  {
    id: 'my-topic',
    label: 'My Topic',
    path: '/topics/my-topic',
    category: 'Architecture',
    description: 'Description shown on the topic card.',
    loadBundle: () => loadOKFBundle('my-topic'),
  },
]
```

## 5. Adding a New Section

To add a section to an existing topic:

1. Create the folder under `public/okf/[topic-id]/sections/[section-name]/`
2. Create `section.md` with frontmatter (`type`, `title`, `resource`)
3. Add data files in the folder
4. Append section path to `okf.md` `sections` list
5. Add all `.yaml` data files to `okf.md` `related` list

No TypeScript changes needed — the reader discovers and loads sections at runtime.

### Multiple sections of the same type

You can have multiple flowcharts, tradeoff sandboxes, or taxonomy browsers in one topic. Each gets its own folder:

```
sections/
  flowchart/          # primary flowchart
  flowchart-lifecycle/ # second flowchart (different schema)
  tradeoffs/          # primary tradeoff sandbox
  tradeoffs-deploy/   # second tradeoff sandbox
  taxonomy/           # primary taxonomy
  taxonomy-patterns/  # second taxonomy
```

Each `section.md` declares its own `type` and `title`. The `related` list in `okf.md` includes all data files from all sections.

## Recommended Section Order

Order sections so the learner builds understanding progressively — each section should prepare the ground for the next one:

1. **Intro (`text`)** — Set the context: what the topic is, why it matters. Gives the learner a mental anchor before diving deeper.
2. **Glossary / vocabulary (`flashcards`)** — Teach key terms and their pronunciation before they appear in diagrams, text, or trade-offs. If the learner doesn't know the words, everything else is noise.
3. **Concept categories (`taxonomy-browser`)** — Show the landscape of concepts and how they relate. Gives the learner a map of what's coming so individual sections feel connected, not isolated.
4. **Core explanation (`text` / `bullets`)** — Explain main concepts, learning goals, or capabilities in prose. Builds on the vocabulary and taxonomy the learner just saw.
5. **How it works (`flowchart`)** — Show the process flow. Now the learner can read node labels and understand what each entity does because the terms were taught earlier.
6. **Apply (`bullets`)** — Practical checklists, maintenance steps, or reference material. The learner can now act on this because they understand the underlying mechanics.
7. **Explore trade-offs (`tradeoff-sandbox`)** — Let the learner experiment with decisions. Placed after everything is taught so choices feel meaningful, not arbitrary.
8. **Reinforce (`flashcards`)** — Optionally close with recall drills if there's a separate second flashcard deck. The first flashcards are glossary (section 2); these are practice.

**Rule: never reference a term, concept, or mechanism in section N that hasn't been introduced in section N-1 or earlier.**

## Event Storming Conventions

When defining flowchart data in `steps.yaml`, follow these conventions:

### Standard flow (per step)
Each step follows the full cycle: `EVENT` → `POLICY` → `COMMAND` → `AGGREGATE`/`EXTERNAL` (via `handledBy`) → `EVENT`. Never skip `POLICY` or `COMMAND` — every step that "does work" must be a `COMMAND` handled by an `AGGREGATE`/`EXTERNAL`.

### Direction & Branching
The flow progresses left-to-right. Branching **must** follow the pattern `EVENT → multiple POLICYs → one COMMAND each`:

**Correct:**
```
EVENT → POLICY A → COMMAND A → AGGREGATE → EVENT
        POLICY B → COMMAND B → AGGREGATE → EVENT
```

**Incorrect (never do this):**
```
EVENT → POLICY → COMMAND A
                      COMMAND B
```

Each branch gets its own `POLICY` node. When 1 `EVENT` triggers 2+ `POLICYs`, the layout engine spreads branches vertically. A branching point renders as the Decision diamond in Swimlanes/Data Flow views.

### Duplicate-and-Collapse for repeated handlers
A single canonical `AGGREGATE`, `EXTERNAL`, or `USER` involved in multiple steps must be **duplicated per step**. Each duplicate maps back to the canonical node via `collapsedTo` in `systems.yaml` or `actors.yaml`. This ensures the `handledBy` chain is complete for layout and derived views.

Example:
```yaml
# systems.yaml
orch_agent:
  title: "Agent Orchestrator"
  desc: "Main orchestrator"
  type: "aggregate"
orch_plan:
  title: "Agent Orchestrator"
  desc: "Planning step"
  type: "aggregate"
  collapsedTo: "orch_agent"
orch_exec:
  title: "Agent Orchestrator"
  desc: "Execution step"
  type: "aggregate"
  collapsedTo: "orch_agent"
```

Each step's `handledBy` points at the per-step duplicate, not the canonical node.

### Node Types
| Type | Description | Example |
|---|---|---|
| Actor (`USER`) | Human user or initiator | `dev_user`, `qa_user` |
| Event | Something that happened | `evt_started`, `evt_tool_executed` |
| Command | Action or intent to do work | `cmd_run_agent`, `cmd_call_llm` |
| Policy | Rule deciding next command | `pol_plan`, `pol_route` |
| Aggregate | System component | `orch_agent`, `tools_router` |
| External | External system/API | LLM API, MCP servers, databases |
| Read Model | Query-optimized projection | CQRS read model |
| Risk | Uncertainty or design risk | Unresolved integration point |

### Aggregate vs. External Systems
- **Aggregate:** Components that belong to the system being discussed (e.g., `AgentExecutor`, `RunnableSequence` in LangChain)
- **External:** Real external systems outside your control, called via API/network (e.g., LLM API, MCP servers, databases)

### Multiple Flowcharts
When a topic has multiple subsystems that share **no `COMMAND` or `EVENT` entities**, split them into separate flowchart sections. Sharing `AGGREGATE` or `EXTERNAL` entities is fine — those don't require keeping flows together. Each flowchart gets exactly ONE root node (the starting `COMMAND`).

### Multiple Journeys per Flowchart
Include multiple journeys to cover different execution paths. Each journey follows **one branch** from start to finish — never jump between branches. At minimum, include a happy path. Add journeys for error paths, alternatives, and edge cases.
