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
- **Section types needed** — which section types to include

### 2. Determine Section Types

Map requirements to the appropriate section types (refer to `references/Section-*.md` for complete details):
- **`text`** — Narrative explanations and flowing paragraphs.
- **`bullets`** — Key takeaways, checklist hierarchies, and feature lists.
- **`flowchart`** — Visual component structures, DFD pipelines, or Event Storming timelines.
- **`tradeoff-sandbox`** — Multi-step design decision reasoning and metrics.
- **`taxonomy-browser`** — Card grid showing concept scope and boundaries.

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

### 4. Delegate Content Creation to Subagents

Rather than writing all files sequentially in the main thread, delegate the creation of individual sections to subagents:
- **Flowchart Subagent**: Handles writing all files under `data/flowchart/` (such as `entities.ts`, `relations.ts`, and coordinates in `views/`).
- **Tradeoff Subagent**: Handles writing tradeoff scenarios under `data/tradeoffs/`.
- **Taxonomy Subagent**: Handles writing categories under `data/taxonomy/`.
- **Text Subagent**: Handles writing text/bullets under `data/text.ts`.

> [!IMPORTANT]
> Subagents do not need to run tests or typechecks. They only need to focus on generating/scaffolding files correctly.

### 5. Integrate Topic (Main Agent)

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

### 6. Verify (Main Agent Only)

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
- Taxonomy `color` must map to Frazier theme keys: `blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, `red`.
- Tradeoff `metrics` keys in choices must match the defined metric `id` keys.
- The recommended choice in tradeoffs must use `whyThisFits`; alternatives must use `whenToUse`.

## Reference Files

- `references/Section-Text.md`
- `references/Section-Bullets.md`
- `references/Section-Flowchart.md` — Detailed breakdown of entities, relations, views, and journeys
- `references/Section-EventStorming.md` — Event Storming specific entity mapping, sequence triad, and stack layout conventions
- `references/Section-TradeoffSandbox.md` — Modular scenarios and step setup
- `references/Section-TaxonomyBrowser.md` — Categorization cards and details
- Full how-to: `docs/how-to-create-topics.md`
- Examples: `src/topics/demo/`, `src/topics/ai-agent/`
