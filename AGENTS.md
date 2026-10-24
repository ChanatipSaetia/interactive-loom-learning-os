# AGENTS.md

Guidance for AI agents working in the **Interactive Loom Learning OS** repo.

## Project Overview

Interactive learning platform with animated flowcharts, trade-off sandboxes, taxonomy
browsers, visual OKF section editor, and progressive content. React + Vite + anime.js, Catppuccin Frappé palette; the default theme is Liquid Glass, or Liquid Glass Light when the system is in light mode, until the learner picks one (`src/core/ui-system/theme/themes.ts`).
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
| Pick & Comment in Studio / Viewer (references for AI agents) | [grill-log-pick-and-comment.md](grill-log-pick-and-comment.md) |
| AI Assistant for Pick (OpenAI-compatible API from the browser) | [grill-log-ai-assistant.md](grill-log-ai-assistant.md) |
| Present mode in Viewer (guided motion play, motion rules) | [grill-log-presenting-mode.md](grill-log-presenting-mode.md) |
| Learner memory without a server (proposed) | [grill-log-learner-memory-review.md](grill-log-learner-memory-review.md) |
| Adaptive learning: callbacks, skill maps, AI chat integration (concept) | [grill-log-adaptive-learning.md](grill-log-adaptive-learning.md) |
| Creating / editing topics & flowchart schemas | [docs/creating-topics.md](docs/creating-topics.md) |
| Design system & sensory experience | [DESIGN.md](DESIGN.md) |
| Hex campaign maps (gamification) | [docs/creating-hexmaps.md](docs/creating-hexmaps.md) |

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
   * Tier 3 (Semantic Reference Integrity): Cross-reference validation (step links, quiz option bounds, node IDs, and actor/system node connectivity to event nodes).
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
- The learning app and embeds are read-only. Content is authored in **Loom Studio** (`npm run studio`, `studio.html`, `src/studio/`), which opens one topic folder (`public/content/<topic>/`) via the File System Access API and edits OpenUI Lang (`.oui`) files with code + visual form + live preview. Studio exports a topic as a single `.loom.oui` file or a `.zip` and imports either back, and can create a new topic from pasted text into a folder you pick; **Loom Viewer** (`viewer.html`, `src/viewer/`) shows a `.loom.oui`, `.zip` or picked folder read-only with the app themes; it also opens pasted text (a `.loom.oui` or a single section) and copies its errors as a fix request for the AI chat. Viewer's **Present** mode (Read | Present in the header, `src/core/supporting/presentation/`) plays the topic hands-free, beat by beat, as guided motion (decisions 101–107): it answers quizzes (a wrong try, then the right answer), walks scenarios and decision trees, solves reflections, narrates every beat and lights each beat's main content. Each section type turns its compiled props into beats with stable IDs (`q1`, `q1.wrong`, `card2.back`, …; `BEAT_IDS` in `composition/oui/narration.ts`) in `sub-contexts/<subdomain>/present.ts` and draws them in a `Present<Type>.tsx` renderer marked with `beatMarks()`, `focus()` (what to light) and `QUIET` (what the voice skips); the voice is on by default (`N` mutes it). Renderers use their Read section's markup and CSS, but show one idea per beat with only the key content (each beat a scene replacing the last, `lead()` for the opening sentences of long text, an agenda rail for sections played part by part; the full text stays in Read, decisions 109–111), and branching sections pick a choice on its card in its own beat before moving on. What the narrator says is written in OUI, never in code (decision 108): `sections/<name>.narrate.oui` (`root = Narration(...)`, `NarrationStep(beat, caption, [effects])` per beat, with `Highlight`, `Callout`, `Spotlight` pointing at the section's statements by Pick pointer); a beat without a step reads its on-screen text. It is edited in Studio's Narration tab (Add narration writes one step per beat) and kept by every topic reader and writer (see [grill-log-presenting-mode.md](grill-log-presenting-mode.md), decisions 90–95 and 108). When you change a section type's beats, update its `BEAT_IDS` entry and run `npm run oui:schema`. Both Studio and Viewer have a **Refresh** button that reloads the open topic after an AI edits it (decision 39). Both also have **Pick** mode, started from ⌖ in the message bar at the bottom (decision 64 in grill-log-ai-assistant.md; picks show as chips there): point at a section or a component and copy a pointer such as `kafka/sections/quiz.oui:14 #q2.explanation`, with optional comments, for an AI coding agent (`src/core/supporting/authoring-editor/pick/`, see [grill-log-pick-and-comment.md](grill-log-pick-and-comment.md)). Section components mark their elements with `usePickAnchors()` from the UI system (every Loom section type does; keep new components tagged). In Studio a pick reveals its statement in the code, Ctrl/Cmd+Shift+M adds the statement at the cursor, and hovering a code line outlines what it draws. Both pages also have an **AI assistant** (`src/core/supporting/authoring-editor/assistant/`, see [grill-log-ai-assistant.md](grill-log-ai-assistant.md)): Send in the message bar calls any OpenAI-compatible API (Ollama, LM Studio, llama.cpp, OpenRouter, …) straight from the browser, with connection profiles in localStorage and no backend; the system prompt (`composition/oui/assistant-prompt.ts`) stays the same for the whole conversation and each user turn stores the `<topic-context>` block it was sent with (`assistant/context.ts`, only what is new or changed), so requests share a cacheable prefix (decision 63). In Viewer the assistant is a learner's tutor (decision 119): it explains the subject rather than the code, marks what comes from the topic and what from its own knowledge, hints before answers, replies in the question's language and is told the mode and the section on screen; with the profile's tools on it can look through the whole topic with two tools, `navigate` and `read` (`assistant/content-tools.ts` over `composition/oui/content-tree.ts`, decisions 120–127), shown in an activity pill above the reply together with the model's streamed thinking (`reasoning_content`, `reasoning` or a leading `<think>` block; shown only, never sent back, decision 128). In Studio, with the profile's tools on, the model reads the topic with the same `navigate` and `read` tools (source by default) and changes it with `edit_section`, `create_section` and `edit_topic`, one file per call (`assistant/edit-tools.ts`, decisions 129–137): each call is checked at once and answers with the new errors, and the changes are staged in the thread's changeset (`assistant/changeset.ts`), re-based by statement onto the buffers, and reviewed per statement in cards under the chat (`StagedChanges.tsx`); applied changes go into the buffers and Save writes them. For brainstorming it proposes a plan with `propose_plan`, a card whose ticked items **Build these** sends back (`PlanCard.tsx`, decisions 138–139). Without tools, replies propose `oui-edit` blocks (whole statements by name), shown as edit cards. Both pages can search the web through Tavily with the author's own key (`assistant/web-search.ts`: `web_search`, `web_extract`; a Web search section in the settings; results are data and answers cite their URLs, decisions 140–142). See [grill-log-openui-input.md](grill-log-openui-input.md).
- Standard OpenUI sections (`// @openui`) can draw with Loom's `Svg(markup, caption?)` component (decision 118 in [grill-log-presenting-mode.md](grill-log-presenting-mode.md), `progressive-content/components/openui/loom-components.tsx`): sanitized inline SVG in a single-quoted string, palette color names follow the theme, and narration points at a shape by its `id` (`"figure.piston"`). After changing Loom's additions to the standard library, run `npm run openui:gen` (then `npm run oui:schema`).
- Errors in OpenUI syntax or schema validation must present non-blocking inline diagnostics while the preview keeps the last valid version (`lastValid`).
- Every OUI component prop has a one-sentence description in `fields` (next to `props` in `src/core/learning-engine/sub-contexts/<subdomain>/openui.ts`). It feeds VS Code and Studio hovers, Studio form tooltips (`OUIFieldKey` / `OUIFieldHelp`) and the LLM authoring prompt. After changing a component or `composition/oui/authoring-prompt.ts`, run `npm run oui:schema` to refresh the files GitHub Pages publishes for external LLM chats: `public/llm/loom-authoring-prompt.md`, `public/llm/loom-oui.schema.json` and `public/llms.txt`. LLM answers come back as a single `<topic>.loom.oui` file or a folder of `.oui` files; Loom Viewer opens both, Studio imports the file and opens the folder. `npm run oui:schema` also writes the `loom-topic-writer` agent skill (`composition/oui/skill.ts`: `SKILL.md` plus the prompt as `references/loom-authoring-prompt.md`) to `public/llm/skills/` and to this repo's `.claude/skills/` (where `npx skills add` finds it), and zips the skill folder as `public/llm/skills/loom-topic-writer.zip`. The **Create with AI** page (`create.html`, `src/create/`) is only about the skill: **Claude app** (download the zip, upload it under Skills) and **Coding agents** (`npx skills add ChanatipSaetia/interactive-loom-learning-os --skill loom-topic-writer -g`); its wording and commands live in `composition/oui/llm-guide.ts`. See decisions 28–40 in [grill-log-openui-input.md](grill-log-openui-input.md).

## Working on Topics & Flowcharts

When creating a new topic, adding a lesson, or editing a `UnifiedFlowchartSchema`, follow
[docs/creating-topics.md](docs/creating-topics.md). In particular, the **Event Storming Node and Relation Conventions** section is authoritative for schema structure:

- Each step follows the full cycle `EVENT → POLICY → COMMAND → AGGREGATE/EXTERNAL (handledBy) → EVENT` — never jump `EVENT → AGGREGATE` directly.
- Every `Actor` (User) and `System` (`Aggregate`/`External`) node declared in `actors.yaml` or `systems.yaml` **must be connected to at least one step in steps.yaml** (via `initiatedBy`, `handledBy`, `delegatesTo`, or relation chains).
- Actor and system node duplication across steps is handled automatically by `deriveSchema`. If an actor or system is referenced in N steps, `deriveSchema` generates per-step node instances in EVENT_STORMING view (sharing exact titles), and automatically collapses them into a single node in derived views (SYS_ARCH, SWIMLANES, SEQUENCE, DATA_FLOW) based on matching title and entity type. Point `initiatedBy`, `handledBy`, and `delegatesTo` directly to the declared actor/system ID in `steps.yaml`.

Reference schemas: `src/topics/demo/data/agent-schema.ts`, `src/topics/motorcycle/data/schema.ts`.

## Working on Hex Campaign Maps & Gamification

Campaign maps live in `public/hexmaps/<topic-id>.yaml` and are played at `/campaign/<topic-id>` (`src/core/supporting/gamification/`). Follow [docs/creating-hexmaps.md](docs/creating-hexmaps.md):

- **Multi-modal sections:** never build a topic out of plain `text` walls; spread the knowledge across the interactive section types.
- **Grounded assessments:** every `quiz` question and `reflection-sequence` challenge tests only what an earlier section of the same track teaches.
- **Tracks:** radiate 2–4 parallel tracks from the starting `capital` hub.
- **Key items** mark mandatory milestones and can sit on any node type except `capital`. The `boss_lair` (the domain's central failure mode) unlocks once every required key item is collected, and it never drops items.
- **Full coverage:** every section file `public/content/<topic-id>/sections/<name>.oui` maps to exactly one node through `sectionRef: <name>`.
- Check maps with `npm run hexmap:validate`. Regenerate the VS Code YAML schema with `npm run hexmap:schema` after changing `src/core/generic/hex-map/schema.ts`.

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
