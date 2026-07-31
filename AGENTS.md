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
| Architecture Refactoring Roadmap & Grill Log | [grill-log-refactoring.md](grill-log-refactoring.md) |
| Backward Compatibility Removal & DDD Consolidation | [grill-log-backward-compat.md](grill-log-backward-compat.md) |
| Visual OKF Section Editor & Live Preview | [grill-log-okf-section-editor.md](grill-log-okf-section-editor.md) |
| OKF Section Validation & Diagnostics | [grill-log-okf-section-validation.md](grill-log-okf-section-validation.md) |
| Creating / editing topics & flowchart schemas | [docs/creating-topics.md](docs/creating-topics.md) |
| Design system & sensory experience | [DESIGN.md](DESIGN.md) |

## Working on DDD Subdomains, Validation Gateway & Delivery Ports

When refactoring or extending core sections, follow the Strategic & Tactical DDD specification in [docs/agents/domain.md](docs/agents/domain.md) and the decision logs in [grill-log-refactoring.md](grill-log-refactoring.md) and [grill-log-backward-compat.md](grill-log-backward-compat.md):

1. **5 Core Learning Subdomains (`src/core/subdomains/`):**
   * **`process-simulation`**: `flowchart`, `scenario`
   * **`tradeoff-sandbox`**: `tradeoff-sandbox`, `formula-sandbox`, `decision-tree`
   * **`reflection-synthesis`**: `reflection-sequence`, `reflection-template`
   * **`progressive-content`**: `text`, `intro`, `bullets`, `taxonomy-browser`, `image-gallery`
   * **`practice-assessment`**: `quiz`, `flashcards`, `concept-map`
   * *Rule:* Each subdomain directory (`src/core/subdomains/[subdomain]/`) MUST contain:
     - `components/`: React section view renderers, help modals, & visual form editors.
     - `schema.ts`: Co-located Zod structural schemas (`SectionSchema`).
     - `events.ts`: Domain event type definitions (`SectionEvents`).
     - `index.ts`: Bounded Context entry point exporting contract interfaces.
     * *Rule:* `src/core/subdomains/` and its barrel export `src/core/subdomains/index.ts` are the canonical sources for core section implementations, schemas, form editors, and supporting subdomains (`src/core/subdomains/supporting/`: `authoring-editor`, `catalog-discovery`, `learner-progress`). New code MUST import from the barrel (`src/core/subdomains`) or a subdomain path (`src/core/subdomains/[subdomain]`).


2. **3-Tier Validation Gateway (`src/core/validation/gateway.ts`):**
   * Tier 1 (Syntax): YAML syntax & frontmatter parsing.
   * Tier 2 (Structural Schema): Zod schema verification delegated to subdomain `SectionSchema`.
   * Tier 3 (Semantic Reference Integrity): Cross-reference validation (step links, quiz option bounds, node IDs).
   * *Rule:* Return standardized `ValidationResult` payloads containing `status`, `payload` (`lastValidData` for non-blocking preview fallbacks), and `diagnostics` with `fixHint` annotations.

3. **Hexagonal Delivery Ports & Adapters (`src/core/delivery/`):**
   * Interfaces: `OKFStoragePort` and `OKFRuntimePort` live in `src/core/delivery/ports.ts`.
   * Adapters: `InRepoStorageAdapter`, `WebAppRuntimeAdapter`, `SingleHTMLEmbedAdapter` live in `src/core/delivery/adapters/`.
   * *Rule:* Decouple host environments (Vite dev server, Web App SPA router, single HTML embed library `libs/loom-sections.tsx`) from section component implementations.

4. **UI System Contract (`src/core/ui-system/`):**
   * Exposes `UISystemContract` via `useUISystem()` hook unifying `ThemeContract` (Catppuccin Frappé), `UIComponentRegistryContract` (`<Card>`, `<Button>`, `<RangeSlider>`, `<Modal>`, `<Badge>`), and `SensoryFeedbackContract` (audio triggers, motion animation variants).
   * *Rule:* Zero ad-hoc hardcoded styling or direct un-abstracted audio triggers inside subdomain components.

## Working on OKF Sections & Editor Architecture

- OKF schemas and types live co-located in `src/core/subdomains/[subdomain]/schema.ts` (with legacy type aliases in `src/core/okf/types.ts`).
- Dynamic OKF parsing and loading pipeline lives in `src/core/okf/reader.ts` and `src/core/okf/sections.ts` (using delivery adapters).
- The OKF Section Editor uses a split view (Editor Panel on left, Live Section Component Preview on right) with bi-directionally synchronized 'Visual Form' and 'Raw YAML/Markdown' tabs.
- Disk saving in development mode is handled via Vite dev server plugin middleware (`POST /api/okf/save-section`), updating `public/okf/[topic-id]/sections/[section-name]/` directly on disk.
- Errors in YAML syntax or schema validation must present non-blocking inline warning bars while keeping the `lastValidData` state in the Live Preview pane.

## Working on Topics & Flowcharts

When creating a new topic, adding a lesson, or editing a `UnifiedFlowchartSchema`, follow
[docs/creating-topics.md](docs/creating-topics.md). In particular, the **Event Storming Node and Relation Conventions** section is authoritative for schema structure:

- Each step follows the full cycle `EVENT → POLICY → COMMAND → AGGREGATE/EXTERNAL (handledBy) → EVENT` — never jump `EVENT → AGGREGATE` directly.
- Duplicate any `AGGREGATE`/`EXTERNAL`/`USER` that participates in multiple steps, and map each duplicate back to the canonical node with `collapsedTo`, so the `handledBy` chain is complete. See the `motorcycle` (`engine`/`engine2`/`engine3`/`engine4`) and `demo` (`orch_*_ref`, `llm_final`, `dev_user_feedback`) topics for reference.
- Point each `handledBy` relation at the per-step duplicate, not the canonical node.

Reference schemas: `src/topics/demo/data/agent-schema.ts`, `src/topics/motorcycle/data/schema.ts`.

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

- Trust documentation in `docs/` and root spec docs (`docs/agents/domain.md`, `grill-log-refactoring.md`) as authoritative truth.
- Keep content (data) strictly separate from structure (UI) — content lives in `public/okf/` or `src/topics/<topic>/data/`.
- Only commit, push, or open PRs when explicitly requested.
