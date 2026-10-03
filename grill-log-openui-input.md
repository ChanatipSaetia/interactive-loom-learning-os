# Grill Log — OpenUI Lang Replaces OKF

Status: **Decisions recorded — Phase 1 not started**

## Goal

Replace the OKF content format (YAML/Markdown folders under `public/okf/`) with
**OpenUI Lang** ([thesysdev/openui](https://github.com/thesysdev/openui), spec v0.5),
a line-oriented `identifier = Expression` language whose components are defined with
Zod schemas (`defineComponent` / `createLibrary`).

## Baseline (what is being replaced)

- 12 topics / 436 files in `public/okf/`.
- Reader: `src/core/learning-engine/composition/okf/reader.ts`, `sections.ts`, `types.ts`.
- Ports: `OKFStoragePort`, `OKFRuntimePort` in `src/core/delivery/ports.ts`.
- 3-tier Validation Gateway, Visual Section Editor, `POST /api/okf/save-section` middleware.

## Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Scope | **Full replace + migrate.** OpenUI Lang becomes the only content format. A one-off OKF→OpenUI converter migrates all 12 topics, then the OKF reader/YAML pipeline is deleted. |
| 2 | Granularity | **One `.oui` file per section** (`public/topics/<id>/sections/<name>.oui`), each with its own `root`. |
| 3 | Component library | **Loom section components.** `defineComponent()` per existing section type (Quiz, Flashcards, Flowchart, TradeoffSandbox, …) and their child items (Question, Card, Step, Actor, …). Zod props reuse subdomain `schema.ts`; renderers are the existing React components. No generic OpenUI primitives. |
| 4 | Flowcharts | **Native OpenUI statements.** e.g. `flow = Flowchart("Title", [user, api], [s1, s2], [j1])`, `s1 = Step("PlaceOrder", user, api, …)`. References replace ID strings; event-storming conventions still apply. |
| 5 | Runtime | **`@openuidev/react-lang`** (`defineComponent`, `createLibrary`, `<Renderer>`, structured error codes, generated LLM system prompt). |
| 6 | Allowed features | **Static components + references** and **`$state` + `@builtins`** (ternaries, `@Each`, `@Count`, …). **Not allowed:** `Query`/`Mutation`, `@ToAssistant` (keeps the single-HTML embed static). |
| 7 | Topic metadata | **`topic.oui`** with `root = Topic("Title", "Category", ["tags"], [SectionRef("intro"), …])`. Replaces `index.yaml`. |
| 8 | Section editor | **Visual Form + raw OpenUI tab**, still bi-directionally synced (needs an OpenUI printer/serializer). Live preview keeps `lastValidData`. |
| 9 | Cross-file linking | **`SectionRef("<name>")`** in `topic.oui`; the loader resolves `sections/<name>.oui` and validates each file separately. |
| 10 | Validation | **Keep 3 tiers.** T1 = OpenUI parse errors (`parse-failed`, `unknown-component`, …); T2 = Zod props per component; T3 = Loom semantics (event-storming cycle, actor/system connectivity, quiz option bounds). Same `ValidationResult` + `fixHint` + `lastValidData`. |
| 11 | Rollout | **Phased commits**, each green on `typecheck` + `test` (see below). |
| 12 | Extension | **`.oui`** |
| 13 | Author tooling | **Build all three:** TextMate grammar (highlighting); VS Code extension with completion, signature help for positional args, hover docs, go-to-definition and gateway diagnostics; the same completion and diagnostics in the in-app raw tab (CodeMirror). Everything is generated from `createLibrary(...).toJSONSchema()`. **Named args are rejected**, so we stay on the upstream spec. |
| 14 | Tooling timing | **Right after Phase 1**, before content migration. |

## Rollout Phases

1. Loom OpenUI component library + `.oui` loader + gateway mapping (new ports/adapters).
2. Author tooling: TextMate grammar, VS Code extension / language server, CodeMirror integration.
3. OKF→OpenUI converter; migrate `demo` topic end-to-end.
4. Migrate remaining 11 topics.
5. Section Editor: raw OpenUI tab, Visual Form ↔ OpenUI printer, save middleware for `.oui`.
6. Delete OKF code, `public/okf/`, and update docs (`AGENTS.md`, `docs/creating-topics.md`, `docs/agents/domain.md`).

## Open Questions

_None._
