# AGENTS.md

Guidance for AI agents working in the **Interactive Loom Learning OS** repo.

## Project overview

Interactive learning platform with animated flowcharts, trade-off sandboxes, taxonomy
browsers, and progressive content. React + Vite + anime.js, Catppuccin Frappé theme.
See [README.md](README.md) for the tech stack, scripts, and project structure.

## Key docs

Read the relevant doc before starting work — do not duplicate its content here.

| Topic | Doc |
|---|---|
| Creating / editing topics & flowchart schemas | [docs/creating-topics.md](docs/creating-topics.md) |
| Domain language, architecture, ADRs | [docs/agents/domain.md](docs/agents/domain.md) |
| Issue tracker (GitHub Issues + `gh`) | [docs/agents/issue-tracker.md](docs/agents/issue-tracker.md) |
| Triage labels | [docs/agents/triage-labels.md](docs/agents/triage-labels.md) |
| Design system | [DESIGN.md](DESIGN.md) |

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
npm run test:e2e    # E2E tests (Playwright)
npm run lint        # lint
npm run typecheck   # type check
```

Run `npm run typecheck` and `npm run test` before considering flowchart/derivation
changes complete.

## Conventions

- Keep content (data) strictly separate from structure (UI) — content lives in `src/topics/<topic>/data/`.
- Only commit, push, or open PRs when explicitly requested.
- Use the issue tracker and triage conventions in [docs/agents/](docs/agents/).
