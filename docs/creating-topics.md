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
    quiz/
      section.md
      questions.yaml
    concept-map/
      section.md
      concepts.yaml
    scenario/
      section.md
      scenarios.yaml
    decision-tree/
      section.md
      tree.yaml
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
  - sections/concept-map/section.md
  - sections/flashcards/section.md
  - sections/taxonomy/section.md
  - sections/lifecycle/section.md
  - sections/capabilities/section.md
  - sections/flowchart/section.md
  - sections/quiz/section.md
  - sections/tradeoffs/section.md
  - sections/scenario/section.md
  - sections/decision-tree/section.md
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
  - sections/quiz/questions.yaml
  - sections/concept-map/concepts.yaml
  - sections/scenario/scenarios.yaml
  - sections/decision-tree/tree.yaml
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
| `type` | yes | Section renderer: `text`, `bullets`, `flowchart`, `tradeoff-sandbox`, `taxonomy-browser`, `flashcards`, `quiz`, `concept-map`, `scenario`, `decision-tree` |
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
  command: "Start Agent Run"
  policy: "Trigger Execution Plan"
  handledBy: orch_agent
  resultEvents:
    - id: evt_started
      title: "Agent Started"
  continuesAs: step_branch
- type: branch
  id: step_branch
  event: evt_started
  branches:
    - id: branch_a
      label: "Happy path"
      policy: "If Plan Approved"
      command: "Approve and Release"
      handledBy: qa_user
      resultEvents:
        - id: evt_approved
          title: "Approved"
    - id: branch_b
      label: "Needs revision"
      dashed: true
      policy: "If Plan Rejected"
      command: "Request Revision"
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

### `quiz` section
Multiple-choice questions with instant feedback, hints, score tracking, and prev/next navigation. Each choice includes an explanation revealed on selection. Uses `resource: questions.yaml`.

```yaml
---
type: quiz
title: "Knowledge Check"
resource: questions.yaml
---
```

**Data file (`questions.yaml`):**
```yaml
- id: q1
  question: "What is the primary role of an orchestrator agent?"
  hint: "Think about how work gets divided."
  choices:
    - id: a
      text: "Directly execute all tasks"
      correct: false
      explanation: "The orchestrator delegates work rather than executing it directly."
    - id: b
      text: "Decompose goals, delegate tasks, and synthesize output"
      correct: true
      explanation: "Correct. The orchestrator breaks down complex goals and coordinates specialized workers."
    - id: c
      text: "Store conversation history"
      correct: false
      explanation: "Memory handling is a separate concern, usually delegated to a memory component."
```

### `concept-map` section
Force-directed graph visualization of interconnected concepts. Nodes are grouped by category with distinct colors. Supports zoom, pan, and hover-to-highlight connections. Gives learners a bird's-eye view of how concepts relate. Uses `resource: concepts.yaml`.

```yaml
---
type: concept-map
title: "Concept Map"
resource: concepts.yaml
---
```

**Data file (`concepts.yaml`):**
```yaml
nodes:
  orchestrator:
    title: "Orchestrator"
    category: pattern
  worker:
    title: "Worker Agent"
    category: role
  memory:
    title: "Memory Store"
    category: mechanism
edges:
  - from: orchestrator
    to: worker
    label: "delegates to"
  - from: orchestrator
    to: memory
    label: "reads from"
```

**Node `category`** determines the visual color. Supported categories: `pattern`, `mechanism`, `concept`, `role`, `system`, `data`, `process`, plus any custom category (falls back to lavender).

### `scenario` section
Branching narrative where the learner makes choices that lead to an outcome rated on a letter grade (A = Excellent, B+ = Good, B- = Fair, C = Needs Improvement). Includes step counter, back navigation, and restart. Purpose: learn through consequences — the learner experiences the impact of decisions. Uses `resource: scenarios.yaml`.

```yaml
---
type: scenario
title: "Architecture Decision Scenario"
resource: scenarios.yaml
---
```

**Data file (`scenarios.yaml`):**
```yaml
id: arch-decision
title: "Scaling Challenge"
intro: "Your service is growing fast. How do you handle the load?"
nodes:
  start:
    prompt: "Traffic spikes 10x. What's your first move?"
    choices:
      - id: scale-horizontally
        text: "Add more instances behind a load balancer"
        next: monitor-result
      - id: optimize-first
        text: "Profile and optimize the bottleneck"
        next: optimize-result
  monitor-result:
    outcome:
      verdict: "You handled the spike but incurred higher infrastructure costs."
      lesson: "Horizontal scaling works but always pair it with auto-scaling policies."
      rating: b-plus
  optimize-result:
    outcome:
      verdict: "You found the bottleneck and resolved it with minimal cost."
      lesson: "Optimization before scaling often reveals you don't need more resources."
      rating: a
```

### `decision-tree` section
Guided Q&A that leads to a tailored recommendation. Each step presents a question with choices that include rationale and optional "recommended" badges. A breadcrumb trail tracks the path. The leaf node delivers a recommendation with explanation and trade-offs. Purpose: diagnostic tool — "answer these questions, get a recommendation for your situation." Uses `resource: tree.yaml`.

```yaml
---
type: decision-tree
title: "Choose Your Agent Architecture"
resource: tree.yaml
---
```

**Data file (`tree.yaml`):**
```yaml
id: agent-arch
title: "Agent Architecture Advisor"
root: complexity
nodes:
  complexity:
    prompt: "How complex is your task?"
    choices:
      - id: simple
        text: "Single-step, well-defined"
        next: rec-simple
        rationale: "Simple tasks don't need complex orchestration."
        recommended: true
      - id: complex
        text: "Multi-step with dependencies"
        next: rec-complex
        rationale: "Complex tasks benefit from structured decomposition."
  rec-simple:
    leaf:
      recommendation: "Use a single-agent ReAct loop."
      explanation: "For well-defined tasks, a single agent with tool use is sufficient and avoids orchestration overhead."
      tradeoffs:
        - "Limited to tasks the agent can solve in one session"
        - "No parallel execution of subtasks"
  rec-complex:
    leaf:
      recommendation: "Use hierarchical orchestrator-workers."
      explanation: "A central orchestrator decomposes the task, delegates to specialized workers, and synthesizes results."
      tradeoffs:
        - "Higher latency from orchestration overhead"
        - "More complex to configure and debug"
```

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
2. **Concept map (`concept-map`)** — Visual bird's-eye view of how concepts interrelate. Placed early so the learner has a spatial map before individual concepts are explored in depth.
3. **Glossary / vocabulary (`flashcards`)** — Teach key terms and their pronunciation before they appear in diagrams, text, or trade-offs. If the learner doesn't know the words, everything else is noise.
4. **Concept categories (`taxonomy-browser`)** — Show the landscape of concepts and how they relate. Gives the learner a map of what's coming so individual sections feel connected, not isolated.
5. **Core explanation (`text` / `bullets`)** — Explain main concepts, learning goals, or capabilities in prose. Builds on the vocabulary and taxonomy the learner just saw.
6. **How it works (`flowchart`)** — Show the process flow. Now the learner can read node labels and understand what each entity does because the terms were taught earlier.
7. **Apply (`bullets`)** — Practical checklists, maintenance steps, or reference material. The learner can now act on this because they understand the underlying mechanics.
8. **Knowledge check (`quiz`)** — Multiple-choice questions to verify understanding. Score tracking gives immediate feedback. Placed after core content is taught so questions test learned material.
9. **Explore trade-offs (`tradeoff-sandbox`)** — Let the learner experiment with decisions. Placed after everything is taught so choices feel meaningful, not arbitrary.
10. **Scenario (`scenario`)** — Branching narrative where the learner makes decisions and faces consequences. Graded outcomes make the learning stick. Requires full context from prior sections.
11. **Decision guide (`decision-tree`)** — Diagnostic Q&A that leads to a tailored recommendation. Learner applies knowledge to their own situation. Best placed after all concepts are understood.
12. **Reinforce (`flashcards`)** — Optionally close with recall drills if there's a separate second flashcard deck. The first flashcards are glossary (section 3); these are practice.

**Rule: never reference a term, concept, or mechanism in section N that hasn't been introduced in section N-1 or earlier.**

## Event Storming Conventions

When defining flowchart data in `steps.yaml`, follow these conventions:

### Standard flow (per step)
Each step follows the full cycle: `EVENT` → `POLICY` → `COMMAND` → `AGGREGATE`/`EXTERNAL` (via `handledBy`) → `EVENT`. Never skip `POLICY` or `COMMAND` — every step that "does work" must be a `COMMAND` handled by an `AGGREGATE`/`EXTERNAL`.

- **Policy Inclusion:** Every non-root linear step and all branch options must specify a `policy` field in the steps YAML file (except the first user-initiated root step which is triggered directly by an actor).
- **Natural Language:** Both `command` and `policy` values must be written in natural language (e.g. `command: "Start Agent Run"`, `policy: "If Plan Approved"`) rather than code-like identifiers (e.g. `cmd_start`, `pol_approve`). They render directly as human-readable nodes in the flow diagram.

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
| Command | Action or intent to do work | `"Start Agent Run"`, `"Call LLM API"` |
| Policy | Rule deciding next command | `"On Execution Complete"`, `"Check Review Score"` |
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
