# AGENTS.md

Guidance for AI agents working in the **Interactive Loom Learning OS** repo.

## Project overview

Interactive learning platform with animated flowcharts, trade-off sandboxes, taxonomy
browsers, visual OKF section editor, and progressive content. React + Vite + anime.js, Catppuccin Frappé theme.
See [README.md](README.md) for the tech stack, scripts, and project structure.

## Key docs & Source of Truth

Read the relevant doc before starting work — **all documentation in `docs/` and key markdown specs are authoritative single-sources-of-truth. Trust and adhere strictly to the guidelines, schemas, and architectural decisions documented in them.**

| Topic | Doc |
|---|---|
| Creating / editing topics & flowchart schemas | [docs/creating-topics.md](docs/creating-topics.md) |
| Visual OKF Section Editor & live preview architecture | [grill-log-okf-section-editor.md](grill-log-okf-section-editor.md) |
| Domain language, architecture, ADRs | [docs/agents/domain.md](docs/agents/domain.md) |
| Issue tracker (GitHub Issues + `gh`) | [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md) |
| Triage labels | [docs/agents/triage-labels.md](docs/agents/triage-labels.md) |
| Design system | [DESIGN.md](DESIGN.md) |

## Working on OKF Sections & Editor Architecture

- OKF schemas and types live in `src/core/okf/types.ts` (`OKFSectionMeta`, `OKFSectionData`, and specific section data interfaces like `OKFQuizSectionData`, `OKFConceptMapSectionData`, `OKFTradeoffSectionData`, etc.).
- Dynamic OKF parsing and loading pipeline lives in `src/core/okf/reader.ts` and `src/core/okf/sections.ts`.
- The OKF Section Editor uses a split view (Editor Panel on left, Live Section Component Preview on right) with bi-directionally synchronized 'Visual Form' and 'Raw YAML/Markdown' tabs.
- Disk saving in development mode is handled via Vite dev server plugin middleware (`POST /api/okf/save-section`), updating `public/okf/[topic-id]/sections/[section-name]/` directly on disk.
- Errors in YAML syntax or schema validation must present non-blocking inline warning bars while keeping the last valid data state in the Live Preview pane.

## Working on topics & flowcharts

When creating a new topic, adding a lesson, or editing a `UnifiedFlowchartSchema`, follow
[docs/creating-topics.md](docs/creating-topics.md). In particular, the **Event Storming
Node and Relation Conventions** section is authoritative for schema structure:

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

Run `npm run typecheck` and `npm run test` before considering flowchart, derivation, or section editor changes complete.

## E2E Testing

Use the **Playwright MCP** tools (`playwright_browser_*`) for E2E testing instead of
`npm run test:e2e`. Navigate to the running dev server and verify behavior interactively:

1. Check if the dev server is already running; if not, start it with `npm run dev`
2. Use `playwright_browser_navigate` to visit `http://localhost:5173`
3. Use `playwright_browser_snapshot` to inspect the page and interact with elements
4. Verify UI behavior, animations, section rendering, and interactivity manually

This approach gives immediate feedback without maintaining Playwright test files.

## Conventions

- Trust documentation in `docs/` and root spec docs as authoritative truth.
- Keep content (data) strictly separate from structure (UI) — content lives in `public/okf/` or `src/topics/<topic>/data/`.
- Only commit, push, or open PRs when explicitly requested.
- Use the issue tracker and triage conventions in [docs/agents/](docs/agents/).
