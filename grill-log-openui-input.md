# Grill Log — OpenUI Lang Replaces OKF

Status: **Phases 1–5 complete — Phase 6 (delete OKF, docs) next**

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

## Phase 1 — Implementation Notes

What landed (additive; the app still renders OKF until Phase 3 switches it over):

| Piece | Location |
|---|---|
| Shared kernel (`defineOUIComponent`, `defineOUISection`, `Lead`, `refOrId`, `idOf`) | `src/core/learning-engine/sub-contexts/openui-kernel.ts` |
| Per-subdomain vocabularies (co-located, own `toData` mappers) | `src/core/learning-engine/sub-contexts/<subdomain>/openui.ts` |
| Library assembly + `Topic` / `SectionRef` / `Catalog` / `TopicRef` | `src/core/learning-engine/composition/oui/library.ts` |
| Compiler (parse → evaluate `$state` → `toData`, statement→line source map) | `src/core/learning-engine/composition/oui/compile.ts` |
| Content reader (`public/content/…`) | `src/core/learning-engine/composition/oui/reader.ts` |
| `@openuidev/react-lang` `<Renderer>` bridge | `src/core/learning-engine/composition/oui/react.tsx` |
| Validation Gateway for `.oui` | `src/core/learning-engine/validation/oui-gateway.ts` |
| Storage adapter (`OKFStoragePort`) | `src/core/delivery/adapters/oui-storage.ts` |
| Dev-server save endpoint `POST /api/content/save-section` | `vite.config.ts` (`ouiSavePlugin`) |

Content layout:

```
public/content/index.oui                    root = Catalog([TopicRef("demo"), …])
public/content/<topic>/topic.oui            root = Topic("Title", "Category", "Description", [SectionRef("intro"), …])
public/content/<topic>/sections/<name>.oui  root = Quiz(…) | Flowchart(…) | …
```

`public/content/` rather than `public/topics/`, so static files never shadow the SPA route `/topics/:id`.

Conventions settled while implementing:

- **Signatures:** every section component takes `title` first and ends with the shared optional `heading` and `lead` (`Lead(what?, why?, next?)`, which replaces the frontmatter `intro`). Component names are unique and prefixed where they would clash (`QuizChoice`, `ScenarioChoice`, `DecisionChoice`, `TradeoffChoice`).
- **References:** where the graph cannot loop, props take a reference *or* an ID (`string | Actor`), e.g. `handledBy`, `initiatedBy`, `JourneyStep.step`, `ConceptLink.from`, `MatrixBlock.layer`. Where it can loop (scenario and decision-tree `next`), only string IDs are accepted.
- **`null`** in an optional position means "omitted", so later optional arguments can be given.
- **Records:** keyed collections (scenario/decision nodes, concepts) are written as arrays of components with `id` and compiled to records.
- **`$state` / `@builtins`:** evaluated with the declared `$state` defaults when a file is loaded, so the compiled section data is static. `<Renderer>` (react bridge) keeps live reactivity for future streaming/LLM use.
- **Tier mapping:** T1 = `parse-failed`, `parse-exception`, `incomplete`, `unknown-component`, `unresolved-reference`, `inline-reserved`, `wrong-root`, unsupported `Query`/`Mutation`. T2 = `missing-required`, `null-required`, `excess-args`, `type-mismatch`, `runtime-error`, plus the subdomain Zod schema. T3 = subdomain semantic checks plus `unused-statement` (defined but never referenced). Every diagnostic carries the source line of its statement; Zod and T3 paths are mapped back to lines through the compiled-object source map.
- **Load policy:** a section that compiles loads even with T2/T3 diagnostics, which travel with the bundle. A file that hits T1 rejects with `OUILoadError`.
- **Telemetry:** `@openuidev/lang-core` sends anonymous install telemetry from `postinstall`; set `OPENUI_TELEMETRY_DISABLED=1` (or `DO_NOT_TRACK=1`) to opt out. Runtime telemetry is opt-in and server-side only. `<Renderer>` is called with `publishObservability={false}`.

Example section:

```
root = Flowchart("Checkout", [buyer], [orders], [place], [happy])
buyer = Actor("buyer", "Buyer", "Person placing the order")
orders = System("orders", "Order Service", "Owns orders", "aggregate")
place = Step("place-order", "When cart is submitted", "PlaceOrder", orders, [Event("order-placed", "Order Placed")], buyer)
happy = Journey("happy", "Happy path", "Order goes through", [JourneyStep(place, "Place order", "Buyer submits the cart")])
```

## Phase 2 — Author Tooling Notes

All tooling comes from one editor-agnostic **language service** generated from the library's JSON Schema, so it cannot drift from what the compiler accepts:

| Piece | Location |
|---|---|
| Language spec (params, kinds, enums, accepted components, builtins) | `src/core/supporting/authoring-editor/oui-language/spec.ts` |
| Fault-tolerant scanner (cursor frames, statements, offsets) | `src/core/supporting/authoring-editor/oui-language/scanner.ts` |
| Service: completions, signature help, hover, definition, symbols, diagnostics | `src/core/supporting/authoring-editor/oui-language/service.ts` |
| CodeMirror 6 bindings + Catppuccin theme (`--ctp-*` variables) | `src/core/supporting/authoring-editor/oui-language/codemirror.ts` |
| `OUICodeEditor` React component (exported lazily as `LazyOUICodeEditor`) | `src/core/supporting/authoring-editor/components/OUICodeEditor.tsx` |
| VS Code extension (TextMate grammar, language config, providers) | `tools/vscode-oui/` |
| GitHub highlighting | `.gitattributes` (`*.oui linguist-language=JavaScript`) |

Features (VS Code and in-app):

- **Completions by argument position.** Only the components the current positional argument accepts (e.g. inside `Quiz(…, [▮])` only `QuizQuestion`), references of compatible type, declared IDs inside strings (`handledBy: "or▮"` → `orders`; scenario/decision `next`, `recommended`, `initialState`, `dependsOn`), enum values, TradeoffChoice metric keys, `$state`/`@builtins` where a plain value fits, and `root = …` snippets in an empty file. Component completions insert a snippet with every required argument.
- **Signature help** that highlights the active positional argument.
- **Hover** names the parameter any argument fills (`Step › command: string`), documents components and builtins, and previews referenced statements.
- **Go to definition** for references and ID strings (VS Code F12; in-app F12 or Ctrl/Cmd-click); outline from statements.
- **Diagnostics** from the same 3-tier gateway as the app, with fix hints.
- VS Code also completes `SectionRef("…")` / `TopicRef("…")` from files on disk.

Delivery:

- The extension bundles the service with esbuild. **Rebuild it after changing the component library** (`cd tools/vscode-oui && npm run package`).
- CodeMirror ships in its own on-demand `vendor-codemirror` chunk (~116 kB gz), loaded only when the editor mounts. Phase 5 wires it into the Section Editor's raw tab.

## Phase 3 — Converter & `demo` Migration Notes

- **Printer** (`composition/oui/print.ts`): every section component has a `fromData` (inverse of `toData`) that builds a call tree. The printer hoists named or referenced calls into statements, prints references by statement name, orders positional arguments by schema, writes `null` for gaps, and wraps at 100 columns. The editor also uses it to save Visual Form edits as `.oui` (until Phase 5's raw tab).
- **Converter** (`npm run oui:convert -- <topic…> | --all [--check]`): loads topics through the existing OKF reader, so output matches what the app renders. It validates every section before writing and keeps `index.oui` in OKF catalog order. A dry run over all 12 topics (143 sections) converts with zero diagnostics.
- **Round-trip guard** (`okf-roundtrip.test.ts`): every section of every OKF topic goes OKF → `.oui` → compile and must come back with identical data and meta. Normalized as equivalent: empty bullet `children`, `roadmap[].id` and `challenges[].id` (no component reads them), and an intro inner title equal to the section title.
- **Vocabulary changes found by the round trip:**
  - `displayTitle` on `Intro`, `Scenario`, `DecisionTree`, `PillarLayer`, for content whose inner widget title differs from the section title.
  - `JourneyStep.processGroup` accepts any string; existing flows use values like "opening" and "learning".
- **Dual-source loading** (`composition/content.ts`): a topic listed in `public/content/index.oui` loads from OpenUI Lang, otherwise from OKF. Topic discovery merges both catalogs, and migrated topics take their OpenUI metadata. The web app, single-HTML embed runtime and editor all go through this facade. Phase 6 removes the OKF branch.
- **Catalog metadata:** title, category and description come from `public/okf/index.md`. Tags come from the topic's `index.yaml`; the OKF app ignored these before, so migrated topics now show tags in the catalog.
- **Verified in Chromium:** `#/topics/demo` renders identical text for all 18 sections from `.oui` and from OKF (A/B with `index.oui` hidden), with the same console output. Editing a section in the UI and saving rewrites its `.oui` file.

## Phase 4 — Full Content Migration Notes

- `npm run oui:convert -- --all` converted all 12 topics: 143 sections, 12 `topic.oui` manifests and the `index.oui` catalog (~1.1 MB in `public/content/`). Regenerating `demo` produced byte-identical output.
- **Verified in Chromium:** all 12 topic pages render identical section text (143/143) and titles from `.oui` and from OKF (A/B with `index.oui` hidden). The catalog page differs only by the topic tags that OpenUI manifests now carry.
- **Guard for the committed content** (`tests/unit/content/content-files.test.ts`): the catalog, every topic manifest and every section must compile with no tier 1/2/3 diagnostics, every `TopicRef`/`SectionRef` must resolve, and no section file may be orphaned. A deliberately corrupted file makes it fail. This test replaces the OKF round trip once `public/okf/` is deleted in Phase 6.
- **Existing content bug (unchanged, in both formats):** `poe2-witchhunter-poison-bleed/dot-calculator`'s `total_dps` formula is `bleed_dps + poison_dps`, which references other *metrics*. The formula sandbox only binds *variables*, so it logs `ReferenceError` on every render. It is not fixed here because the content is migrated as-is.
- `public/okf/` is still present and still the fallback source. It is deleted in Phase 6 along with the OKF reader.

## Re-scope (after Phase 4): Standalone Editor App — Decisions

The in-app Section Editor (old Phase 5) is replaced by a separate authoring app, **Loom Studio**, for editing topic folders on disk.

| # | Question | Decision |
|---|---|---|
| 15 | Disk access | **Browser folder picker** (File System Access API, `showDirectoryPicker`). It reads and writes `.oui` files directly with no server, so Studio can be hosted statically. Chromium-based browsers only; other browsers get an explanatory message. |
| 16 | Folder scope | **One topic folder** (`topic.oui` + `sections/*.oui`). An empty folder starts a new topic. |
| 17 | Main app editor | **Removed.** The learning app becomes a read-only viewer: no edit toggle, no split-pane editor, no dev-server save endpoints. |
| 18 | App location | **Same repo, own page:** a second Vite entry (`studio.html`, `npm run studio`) that reuses `src/core` directly, so previews use the real section components. |
| 19 | Editing a section | **Code + form + preview:** the OpenUI code editor (Phase 2 tooling) and the existing per-type visual forms, synced both ways, with a live preview of the real section. Code edits are saved exactly as typed; form edits reprint the file. |
| 20 | Saving | **Explicit Save** (Ctrl/Cmd+S or button), unsaved markers in the section list, and a warning before leaving with unsaved changes. |
| 21 | Section actions | **Add from type template** (pick type and file name, start from a small valid example), **reorder** (updates `SectionRef` order in `topic.oui`), **rename / delete** (with confirmation; updates `topic.oui`). No duplicate. |
| 22 | Catalog | **Auto-generated.** `index.oui` is generated from the `public/content/*/topic.oui` folders at dev and build time, so a new topic folder just appears. It is no longer committed. |

Revised remaining phases:

5. **Loom Studio**
   - 5a. Auto-generated catalog (Vite plugin, dev middleware + build emit); drop the committed `index.oui`.
   - 5b. Studio app: folder picker, topic loading, section list (add/reorder/rename/delete), topic metadata, section editor (code + form + preview), explicit save.
   - 5c. Remove the in-app editor and dev save endpoints from the learning app.
6. Delete OKF code, `public/okf/` and the OKF converter/round-trip test; update docs.

## Phase 5 — Loom Studio Notes

- **5a Catalog:** `public/content/index.oui` is generated by the `loom-content-catalog` Vite plugin (served in dev, emitted at build) from folders with a `topic.oui`, sorted by folder name. It is git-ignored; the content test checks the generated catalog.
- **5b Studio** (`studio.html`, `src/studio/`, `npm run studio`):
  - Workspace model in `src/core/supporting/authoring-editor/workspace/`: a `TopicFolder` port (File System Access + in-memory), starter templates for all 16 section types, and the `TopicWorkspace` store.
  - Opening an empty folder creates `topic.oui`. Sections listed but missing, or present but unlisted, are reconciled with a notice.
  - Code edits are saved byte-for-byte; form edits reprint the section; the preview keeps the last valid version while there are errors.
  - Add/rename/delete/reorder write immediately (with `topic.oui`); content and topic-settings edits wait for Save (button or Ctrl/Cmd+S). Unsaved markers and a leave guard are shown.
  - Section rendering is shared through `registerCoreSections()`.
  - Tests: workspace unit tests, Studio component tests (jsdom), and `tests/e2e/studio.spec.ts`, which uses the browser's origin-private file system (real `FileSystemDirectoryHandle`s) because the native picker cannot be automated.
- **5c Read-only learning app:**
  - Removed the edit toggles, split-pane editor, `EditorContext`, `EditorPanel`, `useSectionEditorBuffer`, the OKF save/download helpers, and both dev-server save endpoints (`/api/okf/save-section`, `/api/content/save-section`).
  - Storage adapters' `saveSection` now throws `READ_ONLY_CONTENT_MESSAGE`.
- **Decision 23 — embed `editable`:** removed. `LoomSections.render(…, { editable: true })` logs a warning that points to Loom Studio and renders read-only; `editable`/`topicId` are marked deprecated in the docs.
- **Existing test gap:** `tests/e2e/static-html.spec.ts` was already broken (the static page was redesigned in v1.4.0) and loads the *published* library from jsdelivr first. It is rewritten for the current page and a read-only embed. Its assertions were verified against this branch's `dist-lib` build by routing the CDN to it, but the spec itself cannot reach jsdelivr in this sandbox.

## Topic Archives & Loom Viewer

| # | Topic | Decision |
|---|---|---|
| 24 | Single-file format | *Superseded by 34.* **`<topic>.loom.json`**: `{ format: "loom-topic-bundle", version: 1, exportedAt, topics: [{ id, files: { "topic.oui": …, "sections/<name>.oui": … } }] }`. Files stay byte-for-byte `.oui` sources, so a round trip is lossless. Several topics per file are allowed (the Viewer can show them); Studio exports one. |
| 25 | Zip format | **The topic folder itself:** `<topic>/topic.oui` and `<topic>/sections/*.oui`, with folder entries. Written store-only (no dependency); reading also inflates deflated entries (`DecompressionStream`), so zips made by OS tools work. |
| 26 | Studio export / import | **Export file / Export zip** export the topic *as currently edited* (unsaved edits included). **Import** takes a `.loom.oui` (`.loom.json` before 34) or `.zip`, asks for confirmation, then overwrites `topic.oui`, writes the sections, deletes section files not in the import, and reopens the folder. A broken imported `topic.oui` is refused before anything is written. On import only `topic.oui` and `sections/<id>.oui` paths are kept. |
| 27 | Loom Viewer | **Third read-only page** (`viewer.html`, `src/viewer/`): opens a `.loom.oui` (`.loom.json` before 34), a `.zip` (drop or pick), or a folder (`<input webkitdirectory>`, works in every modern browser). Each folder with a `topic.oui` is a topic; several topics get a picker. Sections render with the learning app's components; a broken or missing section shows its diagnostics in place. The theme toggle and sound toggle are in the header (Studio also gets the theme toggle). |

Code: `src/core/supporting/authoring-editor/workspace/archive.ts` (bundle + zip + file grouping), `TopicWorkspace.exportFiles()` / `TopicWorkspace.replaceFolderContents()`, `src/viewer/`.

## Field Descriptions

| # | Topic | Decision |
|---|---|---|
| 28 | Where descriptions live | **`fields` next to `props`** in every `defineOUIComponent` / `defineOUISection`: one sentence per prop, and the type check rejects a missing or unknown prop. Not Zod `.describe()`: lang-core builds its JSON Schema with a private registry (dropping it), and describing a `Child.ref` clones the ref, which turns `Child[]` into `{…}[]` in prompt signatures. Section components spread `sectionFields` (`title`, `heading`, `lead`). |
| 29 | VS Code and the Studio code editor | `getLoomOUIJSONSchema()` copies `fields` onto `$defs.<Component>.properties.<prop>.description`. The shared language service reads it for signature help, argument hovers, and a parameter list in component hovers and completions. The VS Code extension bundles the same service, so it picks this up when rebuilt. |
| 30 | Studio form tooltips | `OUIFieldKey` (label + icon) and `OUIFieldHelp` (icon only) in `sub-contexts/OUIFieldKey.tsx` take `of={OUI.Component} field="prop"` and show that description in a portalled tooltip. Form editors, the section settings form and the topic settings form use them. |
| 31 | LLM prompt | `getLoomOUIPrompt()` augments lang-core's own OpenUI Lang prompt (syntax rules, signatures, hoisting) with a `- prop: description` line per prop under each signature. |
| 32 | Published authoring prompt | `getLoomAuthoringPrompt()` (`composition/oui/authoring-prompt.ts`) wraps it for external LLM chats: a Loom preamble (topic layout, the output formats), a worked example topic (unit-tested to compile with zero diagnostics), Loom authoring rules, and lang-core's single-program wording rewritten for multi-file topics (a missing phrase throws, so a lang-core upgrade cannot leave it stale). `npm run oui:schema` writes `public/llm/loom-authoring-prompt.md`, `public/llm/loom-oui.schema.json` and `public/llms.txt`, so the GitHub Pages build serves them (`<pages>/llm/…`, `<pages>/llms.txt`). A unit test fails when any is stale. |
| 33 | Single-file topic (`<topic>.loom.oui`) | An optional `// @loom-topic <id>` header, then each file after a `// === <path> ===` marker line; the ID otherwise comes from the file name. Markdown code fence lines are ignored, so a chat answer can be saved as is. |
| 34 | `.loom.oui` replaces `.loom.json` | One single-file format for Studio export/import, Viewer and LLM output. A `.loom.oui` holds one or more topics (each starts with `// @loom-topic <id>`; Viewer shows a picker for several), and file text is kept verbatim between markers, so the round trip is exact for files ending in a newline. Studio's **Export file** writes `<topic>.loom.oui`. JSON bundles are no longer read: opening one says so and asks for a re-export. The LLM prompt offers the single file (default) or a folder. |

## Open Questions

_None._
