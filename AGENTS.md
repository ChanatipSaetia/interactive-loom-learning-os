# AGENTS.md

Guidance for AI agents working in the **Interactive Loom Learning OS** repo.

## Project Overview

Interactive learning platform with animated flowcharts, trade-off sandboxes, taxonomy
browsers, visual OKF section editor, and progressive content. React + Vite + anime.js, Catppuccin Frappé theme.
See [README.md](README.md) for the tech stack, scripts, and project structure.

## Key Docs & Source of Truth

Read the relevant doc before starting work — **all documentation in `docs/` and key markdown specs are authoritative single-sources-of-truth. Trust and adhere strictly to the guidelines, schemas, and architectural decisions documented in them.**

| Topic | Doc |
|---|---|
| Domain Architecture, DDD Subdomains & Contracts | [docs/agents/domain.md](docs/agents/domain.md) |
| Unified OKF Loading Pipeline (Gateway-owned parsing, raw-file ports) | [grill-log-okf-loading-pipeline.md](grill-log-okf-loading-pipeline.md) |
| Creating / editing topics & flowchart schemas | [docs/creating-topics.md](docs/creating-topics.md) |
| Creating Hex Campaign Maps & Boss Encounters | [docs/creating-hexmaps.md](docs/creating-hexmaps.md) |
| Design system & sensory experience | [DESIGN.md](DESIGN.md) |

## Working on DDD Subdomains, Validation Gateway & Delivery Ports

When refactoring or extending core sections, follow the Strategic & Tactical DDD specification in [docs/agents/domain.md](docs/agents/domain.md):

1. **5 Core Learning Sub-Contexts (`src/core/learning-engine/sub-contexts/`):**
   * **`process-simulation`**: `flowchart`, `scenario`
   * **`tradeoff-sandbox`**: `tradeoff-sandbox`, `formula-sandbox`, `decision-tree`
   * **`reflection-synthesis`**: `reflection-sequence`, `reflection-template`
   * **`progressive-content`**: `text`, `intro`, `bullets`, `taxonomy-browser`, `image-gallery`
   * **`practice-assessment`**: `quiz`, `flashcards`, `concept-map`
   * *Rule:* Each sub-context directory (`src/core/learning-engine/sub-contexts/[subcontext]/`) MUST contain:
     - `components/`: React section view renderers, help modals, & visual form editors.
     - `schema.ts`: Co-located Zod schemas (`SectionSchema`) — strict canonical input, transformed to the render shape. Output must be valid input (idempotent), so editor re-validation works.
     - `layout.ts`: How each section type's files assemble into schema input (`singleFile`, `collection`, `fixedFiles`, `markdownParagraphs` from `validation/layout.ts`).
     - `validation.ts`: Tier 3 semantic reference-integrity validators (`validateTier3`).
     - `events.ts`: Domain event type definitions (`SectionEvents`).
     - `index.ts`: Bounded Context entry point exporting contract interfaces.
     * *Rule:* `src/core/learning-engine/sub-contexts/` and its barrel export `src/core/learning-engine/sub-contexts/index.ts` are the canonical sources for core section implementations, schemas, and form editors. Supporting subdomains live in `src/core/supporting/` (`authoring-editor`, `catalog-discovery`, `learner-progress`, `gamification`) and must NOT be re-exported through the core learning barrel. New code MUST import from the barrel (`src/core/learning-engine/sub-contexts`) or a sub-context path (`src/core/learning-engine/sub-contexts/[subcontext]`).

2. **Validation Gateway Context (`src/core/learning-engine/validation/`):**
   * Pure ingestion & 3-tier validation, decoupled from React — can run in browser, CDN bundle, CLI/CI, or background AI fix loops. Independent entry point: `src/core/learning-engine/validation`.
   * Entry points: `validateSectionFiles(files)` for a section folder's raw files (used by every loader and the CLI); `validateOKFSection(yaml)` for single-document payloads (editor).
   * Tier 1 (Syntax): YAML syntax & frontmatter parsing, per file (diagnostics name the file and line).
   * Tier 2 (Structural Schema): Zod schema verification + transform delegated to sub-context `SectionSchema`, after the sub-context `layout.ts` assembles the files.
   * Tier 3 (Semantic Reference Integrity): Cross-reference validation (step links, quiz option bounds, node IDs, and actor/system node connectivity to event nodes).
   * *Rule:* Return standardized `ValidationResult` payloads containing `status`, `payload` (`lastValidData` for non-blocking preview fallbacks), and `diagnostics` with `fixHint` annotations. **Zero React/DOM imports** inside `validation/`.

3. **Composition Engine Context (`src/core/learning-engine/composition/`):**
   * Page & section assembly: topic route discovery (`routes.tsx`), the `loadSection` / `loadOKFBundle` use case (`okf/loader.ts`: storage → `validateSectionFiles`), payload→props mapping (`okf/section-config.ts`: payload fields map 1:1 onto component props), `useOKFBundled` (`okf/sections.ts`), HUD/editor/storage contexts (`context/`), and lazy `SectionRegistry` resolution (`src/core/learning-engine/registry/`). Independent entry point: `src/core/learning-engine/composition`.
   * *Rule:* Must not parse raw YAML or re-implement section schemas — delegate to the Validation Gateway and consume its `ValidationResult` payloads (keep `lastValidData` for non-blocking preview fallbacks). A section that fails validation keeps its slot and renders a placeholder (`ValidatedSection`); it never fails the topic.

4. **Hexagonal Delivery Ports & Adapters (`src/core/delivery/`):**
   * Interfaces: `OKFStoragePort` (raw files only: `listSections`, `readSectionFiles`, `readHexMap`, optional `saveSection`) and `OKFRuntimePort` live in `src/core/delivery/ports.ts`.
   * Adapters: `InRepoStorageAdapter` (browser fetch), `NodeFsStorageAdapter` (CLI/Vite/tests), `WebAppRuntimeAdapter`, `SingleHTMLEmbedAdapter` live in `src/core/delivery/adapters/`.
   * *Rule:* Decouple host environments (Vite dev server, Web App SPA router, single HTML embed library `libs/loom-sections.tsx`) from section component implementations. Storage adapters never import composition; hosts construct the adapter at their entry point and inject it with `<StorageProvider>` (`App.tsx`, `libs/loom-sections.tsx`).
   * *Rule:* The filesystem decides which files belong to a section. Browsers read the generated `okf/<topic>/manifest.json` (served in dev, emitted at build by the Vite plugin, never committed).

5. **UI System Contract (`src/core/ui-system/`):**
   * Exposes `UISystemContract` via `useUISystem()` hook unifying `ThemeContract` (Catppuccin Frappé), `UIComponentRegistryContract` (`<Card>`, `<Button>`, `<RangeSlider>`, `<Modal>`, `<Badge>`), and `SensoryFeedbackContract` (audio triggers, motion animation variants).
   * *Rule:* Zero ad-hoc hardcoded styling or direct un-abstracted audio triggers inside subdomain components.

## Working on OKF Sections & Editor Architecture

- OKF schemas and types live co-located in `src/core/learning-engine/sub-contexts/[subcontext]/schema.ts` (with legacy `OKF*` type aliases in `src/core/learning-engine/composition/okf/types.ts`).
- OKF loading: storage adapter (raw files) → `validateSectionFiles` (Validation Gateway) → `loadSection` (`composition/okf/loader.ts`) → `toSectionConfig` (`composition/okf/section-config.ts`). See [grill-log-okf-loading-pipeline.md](grill-log-okf-loading-pipeline.md).
- The OKF Section Editor uses a split view (Editor Panel on left, Live Section Component Preview on right) with bi-directionally synchronized 'Visual Form' and 'Raw YAML/Markdown' tabs.
- Disk saving in development mode is handled via Vite dev server plugin middleware (`POST /api/okf/save-section`), updating `public/okf/[topic-id]/sections/[section-name]/` directly on disk.
- Errors in YAML syntax or schema validation must present non-blocking inline warning bars while keeping the `lastValidData` state in the Live Preview pane.

## Working on Topics, Multi-Modal Sections & Hex Campaign Maps

When creating a new topic, adding a lesson, or editing a campaign map, follow [docs/creating-topics.md](docs/creating-topics.md) and [docs/creating-hexmaps.md](docs/creating-hexmaps.md):

- **Multi-Modal Section Design:** Never construct a topic out of plain `text` walls. Distribute curriculum knowledge across appropriate interactive section types (`taxonomy-browser`, `pillar-layer`, `bullets`, `flowchart`, `tradeoff-sandbox`, `formula-sandbox`, `scenario`, `decision-tree`, `concept-map`, `flashcards`, `quiz`, `reflection-sequence`, `reflection-template`).
- **Strict Assessment Grounding (Zero Ungrounded Content):** Every `quiz` question and `reflection-sequence` challenge must be strictly aware of and grounded in its immediate prerequisite section. **Never add questions, answer choices, or reflection items that reference facts, dates, names, or mechanisms not explicitly taught in the prerequisite content.** If a concept needs to be assessed, it must first be taught in the prerequisite reading/interactive section.
- **Hex Campaign Maps (`public/hexmaps/<topic-id>.yaml`):**
  - **Free Exploration Tracks:** Radiate 2 to 4 parallel thematic/chronological tracks from the starting `capital` hub.
  - **Key Items as Mandatory Knowledge:** Key items can be placed in **any node type except Capital** to signal that this milestone is mandatory to learn for the topic.
  - **Boss Lair:** The Boss represents the central failure mode of the domain. It unlocks only when all required key items are gathered. Boss nodes must NOT drop items.
  - **Full Curriculum Coverage:** Every OKF section in `public/okf/<topic-id>/sections/` must be mapped to a unique node on the hex map.

## Working on Flowchart Event Storming Conventions

When editing a `UnifiedFlowchartSchema`, follow [docs/event-storming-conventions.md](docs/event-storming-conventions.md):
- Each step follows the full cycle `EVENT → POLICY → COMMAND → AGGREGATE/EXTERNAL (handledBy) → EVENT` — never jump `EVENT → AGGREGATE` directly.
- Every `Actor` (User) and `System` (`Aggregate`/`External`) node declared in `actors.yaml` or `systems.yaml` **must be connected to at least one step in steps.yaml** (via `initiatedBy`, `handledBy`, `delegatesTo`, or relation chains).
- Actor and system node duplication across steps is handled automatically by `deriveSchema`. If an actor or system is referenced in N steps, `deriveSchema` generates per-step node instances in EVENT_STORMING view (sharing exact titles), and automatically collapses them into a single node in derived views (SYS_ARCH, SWIMLANES, SEQUENCE, DATA_FLOW) based on matching title and entity type. Point `initiatedBy`, `handledBy`, and `delegatesTo` directly to the declared actor/system ID in `steps.yaml`.

Reference content: `public/okf/demo/sections/flowchart/` and `public/okf/motorcycle/sections/flowchart-engine/` (event-storming `steps.yaml` + `actors.yaml` + `systems.yaml`).

## Commands

```bash
npm run dev         # dev server
npm run build       # production build
npm run test        # unit tests (Vitest)
npm run lint        # lint
npm run typecheck   # type check
```

Run `npm run typecheck` and `npm run test` before considering any section, validation, or subdomain refactoring complete.

## E2E Testing

Use the **Playwright MCP** tools (`playwright_browser_*`) for E2E testing instead of `npm run test:e2e`. Navigate to the running dev server and verify behavior interactively:

1. Check if the dev server is already running; if not, start it with `npm run dev`
2. Use `playwright_browser_navigate` to visit `http://localhost:5173`
3. Use `playwright_browser_snapshot` to inspect the page and interact with elements
4. Verify UI behavior, split pane editor rendering, section components, and animations manually

## Conventions

- Trust documentation in `docs/` and root spec docs (`docs/agents/domain.md`, `grill-log-okf-loading-pipeline.md`) as authoritative truth.
- Keep content (data) strictly separate from structure (UI) — content lives in `public/okf/[topic-id]/sections/[section-name]/`.
- Only commit, push, or open PRs when explicitly requested.
