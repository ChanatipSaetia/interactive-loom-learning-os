# Create Topic

Scaffold a new topic for the Interactive Loom Learning OS with proper file structure, section configurations, and route registration.

## When to Use

Use this skill when the user wants to create a new topic, add a new lesson, or scaffold topic files.

## Workflow

### 1. Gather Requirements

Ask the user:
- **Topic ID** — kebab-case slug (e.g., `microservices-patterns`)
- **Topic Label** — display name for nav (e.g., "Microservices Patterns")
- **Category** — grouping for Overview page (e.g., "Architecture", "Operations", "Governance")
- **Description** — short summary for the topic table
- **Section types needed** — which of the 5 section types to include

### 2. Determine Section Types

Choose section types based on what the user wants to teach. Each section serves a distinct purpose:

#### `text` — Narrative and Explanation

Renders Markdown paragraphs with fade-in animation. Use for:
- Topic introduction and overview
- Explanatory prose between diagrams
- Lifecycle descriptions, numbered step sequences
- Any content that reads better as flowing paragraphs

Don't use when the content is a short list of items (use `bullets` instead).

#### `bullets` — Key Points and Hierarchies

Hierarchical lists with nesting, ordered/unordered modes, and checkable items. Use for:
- Key takeaways or summary points
- Feature lists, capability enumerations
- Parent-child hierarchies (e.g., categories with sub-items)
- Checklists with interactive checkboxes

Don't use for long explanations (use `text` instead).

#### `flowchart` — Visual System Understanding

Auto-laid diagrams with pan/zoom, node drag, and animated journey playback. A single schema can render four views. Choose the view that matches what you want to teach:

| View | Teaches | Use When |
|---|---|---|
| **SYS_ARCH** | What components exist and how they connect | Showing services, databases, external systems, and their relationships. The default "box-and-line" architecture diagram. |
| **EVENT_STORMING** | What happens over time in the domain | Showing the temporal sequence of events, commands, decisions, and policies. Use for behavioral flows and DDD event chains. |
| **DATA_FLOW** | How data transforms through the system | Showing a pipeline: raw input → transformation → output. Use for processing workflows and data movement. |
| **SWIMLANES** | Which responsibility zone handles each step | Showing horizontal bands (lanes) for roles or layers. Use when "who does what" and cross-boundary handoffs are the teaching point. |

Start with SYS_ARCH for simple topics. Add EVENT_STORMING when temporal behavior matters. Use all four when the system benefits from multiple perspectives.

Don't use for static content that doesn't benefit from visual relationships (use `text` or `bullets` instead).

#### `tradeoff-sandbox` — Design Decision Reasoning

Interactive metric dashboard with choice selection, pros/cons modals, and side-by-side comparison. Use for:
- Architecture decision records (ADRs) with trade-off analysis
- Comparing design options: frameworks, patterns, approaches
- Teaching design reasoning: why one choice fits better than another
- Multi-step decisions where each choice affects overall metrics

Don't use when there's only one option or no meaningful trade-offs.

#### `taxonomy-browser` — Concept Categories and Boundaries

Card grid with detail modals showing overview, deep dive, and scope boundaries. Use for:
- Categorizing domain concepts or capabilities
- Showing the scope and boundaries of a concept (in scope vs out of scope)
- Presenting analogies for abstract topics
- Bounded context visualization (DDD)

Don't use for sequential steps or decision comparisons (use `flowchart` or `tradeoff-sandbox` instead).

#### Composition Guidelines

Common patterns:
1. `text` → `flowchart` → `bullets` — Explain, visualize, summarize (minimum viable topic)
2. `text` → `flowchart` → `tradeoff-sandbox` → `bullets` — Add design decisions
3. `text` → `taxonomy-browser` → `tradeoff-sandbox` — Concept categorization with decisions
4. `text` → `flowchart` (4 views) → `tradeoff-sandbox` → `taxonomy-browser` → `bullets` — Full coverage

Read `references/Section-*.md` for type shapes and examples before writing data.

### 3. Create Files

Create three files under `src/topics/<topic-id>/`:

#### `data.ts`
Define raw content. Read the relevant `references/Section-*.md` files for type shapes and examples.

#### `sections.ts`
Assemble `SectionConfig[]` from data exports. Import `SectionConfig` from `../../core/registry`.

#### `index.tsx`
React component with `SectionRenderer` and `TopicRegistry.register`. Follow existing topic pattern.

### 4. Register Route

Add entry to `src/core/routes.ts`:
- Import sections from new topic
- Add to `routes` array with matching `id`, `label`, `path`, `category`, `description`, `sections`

### 5. Register Import

Add `import './topics/<topic-id>'` to `src/main.tsx`.

### 6. Verify

```bash
npm run typecheck
npm run lint
```

## Gotchas

- `TopicRegistry.register` id must match `routes.ts` `id`
- Flowchart `viewTypes` must use `TYPES.*` constants from `../../sections/flowchart`
- Taxonomy `icon` needs eslint-disable cast to `ComponentType<any>`
- Taxonomy `color` must be one of: `blue`, `peach`, `pink`, `mauve`, `green`, `teal`, `sky`, `lavender`, `yellow`, `red`
- Tradeoff `metrics` keys must match metric `id` values
- Recommended tradeoff choice should use `whyThisFits`; alternatives use `whenToUse`

## Reference Files

- `references/Section-Text.md`
- `references/Section-Bullets.md`
- `references/Section-Flowchart.md` — 4 view types with purpose and design guidance
- `references/Section-TradeoffSandbox.md`
- `references/Section-TaxonomyBrowser.md`
- Full how-to: `docs/how-to-create-topics.md`
- Examples: `src/topics/demo/`, `src/topics/ai-agent/`
