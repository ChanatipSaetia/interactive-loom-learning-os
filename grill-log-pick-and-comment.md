# Grill Log — Pick & Comment in Studio and Viewer

Status: **Phase 1 complete — Phase 2 (statement + prop tags in practice-assessment, progressive-content) next**

## Goal

Let a person point at part of a topic in **Loom Studio** or **Loom Viewer** (a section, one
component, or one of its props) and copy a precise reference for an **AI coding agent** that
has the topic files: to ask about it, comment on it, or mention it as context.

## Baseline

- Viewer copies *errors* as fix requests (decision 37) and re-reads the topic after an AI edit
  with **Refresh** (decision 39). There is no way to point at content that is not an error.
- Studio has code + form + preview, but no "copy a reference to this".
- The compiler already maps statements to lines (`OUISourceMap.lineOf(statementId)` in
  `composition/oui/compile.ts`).
- Section components receive compiled *data*: they know domain `id` props (`QuizQuestion("kafka-offsets", …)`)
  but not statement names (`q2 = …`), and many children are inline with no statement at all.

## Decisions

Numbering continues from [grill-log-openui-input.md](grill-log-openui-input.md).

| # | Question | Decision |
|---|---|---|
| 40 | Who reads the copy | **An AI coding agent that has the files** (Claude Code, opencode with `loom-topic-writer`, Copilot in VS Code). The copy is a short pointer the agent resolves itself; no section snippet, no human breadcrumb. |
| 41 | What can be picked | **One statement** (component instance) by default; **one prop** where the renderer shows it as its own element (a question's explanation, a card's back, a step's title). Section chrome (header, lead) picks the **whole section**. Free text ranges are out: rendered text went through markdown, and the agent finds the words from the statement and prop. |
| 42 | How the agent finds the file | **Topic-relative path + line hint + statement anchor**: `kafka/sections/quiz-basics.oui:14 #q2.explanation`. The page never knows the absolute path (folder picker, zip, paste). The anchor is authoritative; the line is a hint (it drifts after edits and differs for unsaved Studio buffers). The `loom-topic-writer` skill documents the rule: find `<topic-id>/topic.oui` in the workspace, then re-find the statement by its anchor if the line moved. Archives and pasted text get the same pointer plus a source note (`(in kafka.loom.oui)`, `(from pasted text)`). |
| 43 | How someone picks | **Pick mode** in the header of Studio's preview and Viewer, like DevTools "inspect" (button + `P`, `Esc` exits). Hover outlines the element with its `anchor · prop` label; click picks. Section interactions (quiz answers, card flips, flowchart steps, sliders) are blocked in the capture phase while it is on. **Alt/Option+click** picks directly without entering the mode. Works on touch through the button. |
| 44 | What a pick does | **A tray of entries** at the bottom. Each pick **appends** an entry: a pointer plus an optional note. With a note it is a **Comment**, without one a **Mention**; both mix freely across sections. **Ask** is a question about the whole list and says not to change files. There is no Edit intent: comments carry the requested change. **Copy** (button, or `Ctrl/Cmd+C` in Pick mode) writes one block, e.g. below. The wording lives in one module next to `composition/oui/llm-guide.ts`; the skill documents the format. |
| 45 | Where the tray lives | **`localStorage`, per topic**, in both pages. It survives reloads and Refresh. Nothing is written to the topic folder; the agent only sees what is pasted. After Refresh an entry whose anchor no longer resolves is shown **stale** (struck through, warning icon) rather than dropped; Copy leaves stale entries out unless kept. |
| 46 | Studio code link | **Both directions.** A pick in the preview reveals and highlights the statement's line in the code editor and opens its form field. `Ctrl/Cmd+Shift+M` or a gutter action adds the statement at the cursor to the tray; hovering a code line outlines its element in the preview. Entries made from unsaved buffers show **(unsaved)**; the anchor still resolves after Save. |
| 47 | Learning app and embeds | **Not included**, not even behind a dev switch. Pick mode exists only in Studio and Viewer; the embed bundle never ships it. A learner-facing "ask about this" would be a separate product and its own grill session. |
| 48 | The anchor | **Nearest statement name + short path**: `#q2` when the element is its own statement, `#q2.choices[1].explanation` when it is inline. The tray chip also shows a differing `id` prop for people (`q2 (id "kafka-offsets")`); the copy does not. The compiler records `{ statement, path }` for every evaluated object in a `WeakMap` (alongside the existing line map), and section components tag their elements through a `usePickAnchor(obj, prop?)` hook from the UI system (`data-oui-anchor`). Flowchart nodes merged across steps anchor to the **declaring** statement (`#user`), not the step. |
| 49 | Rollout | **Phased**, each green on `typecheck` + `test` (below). **Standard OpenUI sections** (`// @openui`, stock `@openuidev/react-ui` components) stay **section-level** until lang-core's `<Renderer>` offers a per-element hook. |

Example copy (decision 44):

```
Comments on the Loom topic "kafka":
- kafka/sections/quiz-basics.oui:14 #q2.explanation
  Too long, keep it to one sentence.
- kafka/sections/quiz-basics.oui:22 #q5
- kafka/sections/flow.oui:40 #s3.handledBy
  Should be the broker, not the producer.
```

With **Ask**, the header reads `Answer about the Loom topic "kafka" (do not change any files):`
and the question follows the list.

## Rollout Phases

1. **Core:** compiler anchor map, `usePickAnchor`, Pick mode, tray (localStorage, stale entries),
   copy format, `loom-topic-writer` skill + authoring prompt docs (`npm run oui:schema`). Every
   section gets section-level picks through the shared section wrapper.
2. **Statement + prop tags** in `practice-assessment` and `progressive-content`.
3. **`process-simulation`** (flowchart, scenario), with the declaring-statement rule for merged nodes.
4. **`tradeoff-sandbox`** and **`reflection-synthesis`**.
5. **Studio two-way code link** (decision 46).

## Phase 1 — Implementation Notes

| Piece | Location |
|---|---|
| Anchor map: `OUISourceMap.anchorOf(value)` → `{ statement, path }`, built while `compileElementTree` walks the tree (inline elements have no `statementId`, so they extend their parent's path); `sourceMapOf(payload)` finds the map of a payload from `compileOUISection` or the Validation Gateway | `src/core/learning-engine/composition/oui/compile.ts` |
| Copy wording (`formatPickPointer`, `pickReport`, `PickSource`) | `src/core/learning-engine/composition/oui/pick-report.ts` |
| `usePickAnchor(value, prop?)` + `PickAnchorProvider`; returns nothing outside a provider, so the learning app and embeds are unaffected | `src/core/ui-system/pick-anchor.tsx` |
| Tray model: entries, localStorage per topic (`loom-pick-tray:<topicId>`), `sourceResolver` (line hints from `indexStatementLines`, `(unsaved)`, stale), `trayReport` | `src/core/supporting/authoring-editor/pick/tray.ts` |
| `PickSection` (marks a file, `#root`), `PickLayer` (capture-phase events, outline, `P` / `Esc` / Alt+click / Ctrl+C), `PickMode` + `PickToggle` (tray UI) | `src/core/supporting/authoring-editor/pick/` |
| Viewer: Pick button, every section and the topic header (`topic.oui`) are pickable; the source note comes from how the topic was opened | `src/viewer/ViewerApp.tsx`, `compileTopic.ts` (`files`, `sourceMap` per section) |
| Studio: Pick button, the preview is pickable; line hints come from the editor buffers | `src/studio/components/StudioWorkspace.tsx`, `SectionPreview.tsx` |
| Skill: "Pointers and comments from Loom Studio and Loom Viewer" section; skill description mentions Pick mode | `composition/oui/skill.ts` → `npm run oui:schema` |

- Entries store only file, anchor, label, note and `keep`. Line hints, `(unsaved)` and staleness are resolved from the current sources on every render, so they follow edits, Save and Refresh.
- A place is added once; picking it again leaves the tray as is.
- Staleness checks the statement only (Phase 1); a path into an inline component that no longer exists is not detected.
- Section components carry no tags yet, so every pick in Phase 1 is `#root` of a section or of `topic.oui`.
- Tests: `tests/unit/core/learning-engine/composition/oui/{anchors,pick-report}.test.ts`, `tests/unit/core/supporting/authoring-editor/pick/`, and Pick cases in the Viewer and Studio component tests. Checked in Chromium against `http-caching`: a click on a quiz answer in Pick mode adds the entry and does not answer it.

## Open Questions

_None._
