# Create Topic

Scaffold a new topic for the Interactive Loom Learning OS with proper file structure, section configurations, and route registration.

## When to Use

Use this skill when the user wants to create a new topic, add a new lesson, or scaffold topic files.

## Workflow

### 1. Gather Requirements

Ask the user for:
- **Topic ID** — kebab-case slug (e.g., `microservices-patterns`)
- **Topic Label** — display name for nav (e.g., "Microservices Patterns")
- **Category** — grouping for Overview page (e.g., "Architecture", "Operations")
- **Description** — short summary for the topic table
- **Content outline** — what concepts the topic teaches (don't ask for section types; derive them from content)

### 2. Map Content to Visual Sections (Not Bullets)

**Default to visual sections over bullets.** Bullets are a fallback, not the first choice. Map content patterns to section types:

| Content Pattern | Use This Section | Why |
|---|---|---|
| 3+ related concepts with "what/when/scope" | **`taxonomy-browser`** | Cards show scope, boundaries, and relationships at a glance |
| System components and how they connect | **`flowchart` (SYS_ARCH)** | Structural diagram > bullet list of components |
| Temporal flow: "what happens first, second, third" | **`flowchart` (EVENT_STORMING)** | Events/commands/policies show sequence visually |
| Defense layers, pipeline, or chained steps | **`flowchart` (SYS_ARCH + EVENT_STORMING)** | Both views: structural layers + temporal execution |
| Hierarchy with roles reporting to each other | **`flowchart` (SYS_ARCH)** | Shows accountability chains and dual-key gates |
| Memory types, capability categories | **`taxonomy-browser`** | Each type gets its card with details and analogies |
| Multi-step design decision with trade-offs | **`tradeoff-sandbox`** | Interactive metrics dashboard > static comparison |
| Narrative explanation between diagrams | **`text`** | Paragraphs for flowing prose |
| Checklist with actionable items | **`bullets` (checkable)** | Only use for actual checklists |
| Simple enumeration (<5 items, no nesting) | **`bullets`** | Last resort when nothing else fits |

**Anti-patterns to avoid:**
- Don't use bullets for 3+ related concepts that each have a "what it is" and "what it does" — use taxonomy cards
- Don't use bullets for system components or roles — use flowchart
- Don't use text for sequential steps — use flowchart with Event Storming
- Don't create a flowchart with only one view — always consider whether both SYS_ARCH (structural) and EVENT_STORMING (temporal) add value

### 3. Create Files

Scaffold the topic under `src/topics/<topic-id>/` using a modular directory structure:

#### Directory Layout
```
src/topics/<topic-id>/
├── index.tsx                 # React component with SectionRenderer and TopicRegistry.register
├── sections.ts               # Assembles SectionConfig[] from data exports
└── data/                     # Modular data directory
    ├── index.ts              # Exports all sub-modules
    ├── text.ts               # Plain text explanations and bullet lists
    ├── flowchart/            # Flowchart schema components
    │   ├── index.ts          # Assembles the UnifiedFlowchartSchema
    │   ├── entities.ts       # Logical node definition and multi-view types
    │   ├── relations.ts      # Visual links/edges scoped by view
    │   ├── views/            # Subdirectory for view-specific node layouts
    │   │   ├── index.ts      # Combines and exports all views configuration
    │   │   ├── event-storming.ts # Event Storming view node coordinates and groups
    │   │   └── sys-arch.ts   # System Architecture view node coordinates and groups
    │   └── journeys/
    │       └── happy-path.ts # Stepper playback/journey definitions
    ├── tradeoffs/            # Tradeoff Sandbox scenarios
    │   ├── index.ts          # Exports scenarios array
    │   └── <scenario-name>/  # E.g., api-pattern/
    │       ├── index.ts      # Combines scenario metadata and steps
    │       ├── <step-1>.ts   # Decision step 1
    │       └── <step-2>.ts   # Decision step 2
    └── taxonomy/             # Taxonomy Browser categories
        ├── index.ts          # Exports categories array
        └── <category-name>.ts # Individual category (e.g. tool-use.ts)
```

Refer to `references/Section-*.md` for exact file shapes and schema requirements.

### 4. Flowchart Multi-View and Journey Scoping

When creating flowcharts with both SYS_ARCH and EVENT_STORMING views:

- **Entities**: Define separate entity IDs per view. SYS_ARCH entities use structural names (`agent`, `api_contract`). EVENT_STORMING entities use behavioral names (`evt_workflow_triggered`, `cmd_tool_call`, `pol_route_agent`).
- **Relations**: Scope each relation to its view(s) via the `views` array.
- **Journeys**: Each journey must reference entity IDs that exist in at least one active view. Label journeys to indicate which view they work with:
  - `Defense-in-Depth (Layers)` → uses SYS_ARCH entity IDs
  - `Workflow Execution (Happy Path)` → uses EVENT_STORMING entity IDs
  - `Incident Response (Failure Path)` → uses EVENT_STORMING entity IDs

> [!IMPORTANT]
> A journey whose `nodeIds` don't exist in the current view will be invisible (no nodes highlight). Always verify journey entity IDs match the view's entities.

### 5. Delegate Content Creation to Subagents

Rather than writing all files sequentially in the main thread, delegate the creation of individual sections to subagents:
- **Flowchart Subagent**: Handles writing all files under `data/flowchart/` (such as `entities.ts`, `relations.ts`, and coordinates in `views/`).
- **Tradeoff Subagent**: Handles writing tradeoff scenarios under `data/tradeoffs/`.
- **Taxonomy Subagent**: Handles writing categories under `data/taxonomy/`.
- **Text Subagent**: Handles writing text/bullets under `data/text.ts`.

> [!IMPORTANT]
> Subagents do not need to run tests or typechecks. They only need to focus on generating/scaffolding files correctly.

### 6. Integrate Topic (Main Agent)

Once the subagents finish generating the components/data, the main agent takes over to integrate the topic:
- Import the topic in `src/main.tsx` to register it:
  ```ts
  import './topics/<topic-id>'
  ```
- Register the route in `src/core/routes.ts` by importing `sections` and adding the route object to `routes`:
  ```ts
  {
    id: '<topic-id>',
    label: 'Display Name',
    path: '/topics/<topic-id>',
    category: 'Category Name',
    description: 'Brief table summary of topic.',
    sections: <importedSections>,
  }
  ```

### 7. Verify (Main Agent Only)

Ensure the compilation and linting checks pass:
```bash
npm run typecheck
npm run lint
```

## Gotchas

- `TopicRegistry.register` ID must match the route `id` in `routes.ts`.
- Flowchart `viewTypes` must map to `TYPES.*` constants from `../../sections/flowchart`.
- Taxonomy `icon` needs an eslint-disable cast to `ComponentType<any>`:
  ```ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: Zap as unknown as ComponentType<any>,
  ```
- Taxonomy `color` must map to Frappé theme keys: `blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, `red`.
- Tradeoff `metrics` keys in choices must match the defined metric `id` keys.
- The recommended choice in tradeoffs must use `whyThisFits`; alternatives must use `whenToUse`.
- Flowchart journeys must reference entity IDs that exist in at least one view.
- Event Storming entity `title` must be past tense for EVENTS (e.g., "Order Placed", not "Place Order").

## Reference Files

- `references/Section-Text.md`
- `references/Section-Bullets.md`
- `references/Section-Flowchart.md` — Detailed breakdown of entities, relations, views, and journeys
- `references/Section-EventStorming.md` — Event Storming specific entity mapping, sequence triad, and stack layout conventions
- `references/Section-DiagramConventions.md` — **Multi-view conventions**: entity alignment across views, per-view title overrides (`viewTitles`), deduplication rules, SYS_ARCH boundary grouping, DATA_FLOW pipeline layout, SWIMLANES actor-split lanes, and relation naming patterns
- `references/Section-TradeoffSandbox.md` — Modular scenarios and step setup
- `references/Section-TaxonomyBrowser.md` — Categorization cards and details
- Full how-to: `docs/how-to-create-topics.md`
- **Best example**: `src/topics/ai-operating-model/` — Visual-first topic with taxonomy cards, multi-view flowcharts, Event Storming, and journeys scoped per view
