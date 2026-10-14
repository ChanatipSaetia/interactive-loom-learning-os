# Grill Log — Pick & Comment in Studio and Viewer

Status: **All phases complete (1–5)**

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
| 50 | Panning in Pick mode | **Drags pass through on canvases.** Inside an element marked `data-pick-pan` (flowchart and concept-map SVGs) presses still reach the section, so it can be panned while picking; clicks stay blocked, and a click that ends a drag of more than 4px picks nothing. Everywhere else presses stay blocked. Wheel zoom always works. |
| 51 | Flowchart nodes and lines | **The source of what is drawn, not the step.** Actors and systems point at their declaring statement in every copy and view (`#evaluator`, also for `evaluator2`); policy and command nodes at their step's prop (`#fbCheck.policy`, `#fbCheck.command`); event nodes at the **inline event** (`#fbCheck.events[0]`), or the branch's `event` when no step declares it. Event Storming lines point at the step prop that drew them (`initiatedBy`, `command`, `handledBy`, `events[i]`, `sendsTo`, `continuesAs`, `delegatesTo`; a fork's fan-out at the option). Lines in the derived views, sequence messages and the inspector panel stay section-level. Step cards and the narration caption point at their `JourneyStep` (`#fbJourneyPass.steps[1]`, `.name`, `.description`). |
| 52 | Touch | **A tap is picked when the touch ends.** Phones have no hover, so every pick flashes the picked element with its label for about a second. In Pick mode a tap on a tagged element is picked on `touchend`, which is cancelled (no click follows) and stopped, so sections that act on `touchend` (flowchart lines toggled their highlight) or cancel `touchstart` (concept-map lines got no click at all) still pick right. A tap on a canvas background picks the whole section and still reaches the canvas, so its pan gesture ends. Concept-map link labels, node titles and categories, which had `pointer-events: none`, take pointer events in Pick mode, on desktop too. Studio stays desktop-only: phone browsers cannot open folders. |
| 53 | Many picks, and phones | **Group, compact, number.** The tray groups picks by section in reading order (topic.oui, then the sections as the topic lists them; by line inside a file), and the copy follows the same order. Each pick is one row: a number, its anchor ("Whole section" for `root`), a comment button and an X; tapping a row opens its full pointer, a **Wider** button (one step up: `q1.choices[0].text` to `q1.choices[0]`, then `q1`, then `root`, merging into a place already picked) and, on phones, **Show on page**. Comment boxes appear only when asked for or filled. Numbered **badges** mark the picked places on the page while picking or with the tray open; a badge opens its row. A **"Picking · Done"** pill shows while Pick mode is on. On phones (640px wide or less) the tray is a one-line bar ("8 picked · Copy") that opens into an 85vh sheet; picks keep the bar folded, Show on page folds it, and the pill hides while the sheet is open. |

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

## Phases 2 and 3 — Implementation Notes

| Piece | Location |
|---|---|
| Lists are anchored too (`#root.paragraphs[0]`), so plain strings can be picked through their array | `composition/oui/compile.ts` (`compileElementTree`) |
| `usePickAnchors()` returns `pick(value, prop?)` for use inside loops (`prop` may be a list index); `usePickAnchor` is the single-element form | `src/core/ui-system/pick-anchor.tsx` |
| Every tagged element also carries `data-oui-file` and `data-oui-section`, so picks resolve inside portals (the taxonomy dialog) | `pick-anchor.tsx`, `PickLayer.tsx` (`pickTargetOf`) |
| `OUISourceMap.anchorOfId(component, id)` and `pick.byId(components, id, prop?)` for renderers left with domain IDs only | `compile.ts`, `pick-anchor.tsx`, `PickSection.tsx` |
| Tags: Text paragraphs; Bullets (item, text); Intro (what/why panels, summary, definition, bullets, tags, impact, roadmap steps); TaxonomyBrowser (card + title/subtitle/description, and the dialog's fields and scope items); ImageGallery (image, lightbox caption/credit/url); PillarLayer (layers, blocks, their titles/descriptions); Quiz (question, text, hint, choice, choice text, explanation); Flashcards (card, word, pronunciation, short/detailed definition, whyItMatters, image, dialogue lines); ConceptMap (node, title, category, link, link label); Scenario (intro, decision, prompt, choice, choice text, outcome, verdict, lesson) | each section's `components/<type>/index.tsx` |
| Flowchart: `entityPickSources` / `relationPickSources` map `deriveSchema` IDs (`pol_`, `cmd_`, `evt_`, `<id>2`) back to sources without changing `deriveSchema`'s output; `pickFirst` takes the first one the file declares | `process-simulation/components/flowchart/pick-source.ts`, `views/standard-view.tsx`, `views/sequence-view.tsx`, `step-carousel.tsx`, `step-caption.tsx` |
| Drag-through on canvases (`data-pick-pan`) | `PickLayer.tsx`, concept-map and flowchart SVGs |

- Not tagged (section-level picks): flowchart lines in the derived views, sequence messages, the inspector panel, quiz/flashcard category badges.
- Hidden content (a closed quiz hint, a flashcard's back, a taxonomy dialog, a scenario's later nodes) is picked after leaving Pick mode to open it, then Alt/Option+clicking or turning Pick mode back on.
- Tests: `tests/unit/core/supporting/authoring-editor/pick/section-anchors.test.tsx` renders every tagged section type's Studio template and checks that each anchor names a real statement; `flowchart-pick-source.test.ts` resolves every node of `demo/sections/flowchart-feedback.oui`. Checked in Chromium against `bg3-four-element-monk`: flowchart nodes pick `#step1.events[0]`, `#kiPool`, `#step1.command`, `#player`, `#stepOpening.options[1].policy`; the concept map pans while picking.

## Phases 4 and 5 — Implementation Notes

| Piece | Location |
|---|---|
| Tags: TradeoffSandbox (scenario, metric bars and effect chips, step + title/description, choice cards in the step dialog, the compare panel and the details dialog: label, description, pros/cons and their title/description, whyThisFits, whenToUse); FormulaSandbox (variable sliders + label, metric rows + label, each formula line); DecisionTree (node, prompt, choice, text, rationale, leaf, recommendation, explanation, trade-offs, tree-view nodes and branches); ReflectionSequence (challenge, prompt, items and placed items); ReflectionTemplate (challenge, prompt, template sentence, chips) | `tradeoff-sandbox/components/*/index.tsx`, `reflection-synthesis/components/*/index.tsx` |
| Reflection components receive the current challenge object (`challenge` prop) only for anchors | `ReflectionSequenceSingle`, `ReflectionTemplateSingle` |
| Code editor: `revealLine` (scroll, cursor, 1.5s line flash), `onHoverLine`, `onAddLine` (Ctrl/Cmd+Shift+M on the cursor line, Alt/Option+click on a line number) | `authoring-editor/components/OUICodeEditor.tsx` |
| `statementAtLine(source, line)`: the top-level statement a line belongs to | `pick/tray.ts` |
| `PickMode` takes `onPick` (Studio reveals the pick's statement) and `apiRef` (`add(target)`, for picks from the code) | `pick/PickMode.tsx` |
| Studio wiring: a pick reveals its statement in the Code tab; hovering a code line outlines the statement's elements in the preview (`.pick-linked`: exact anchor, else the shallowest ones inside it); Ctrl/Cmd+Shift+M adds the statement | `StudioWorkspace.tsx`, `SectionEditor.tsx`, `SectionPreview.tsx`, `pick.css` |

- Every Loom section type now tags its elements; `section-anchors.test.tsx` renders every Studio template (inside the same HUD and progress providers Studio and Viewer use) and checks that each anchor names a real statement.
- **Deviation from decision 46:** a pick does not open a form field. The visual forms are per-type editors with no mapping from anchors to fields, so a pick only reveals the line in the Code tab (the Form tab is left as it is). Picks from the code add the whole statement, not a prop.
- Tests: `statementAtLine` unit test; `tests/e2e/studio.spec.ts` "links preview picks and code lines both ways" (pick → line flash, Ctrl/Cmd+Shift+M → `#root` entry, code-line hover → `.pick-linked` in the preview), run in Chromium against the `mtls` topic.

## Touch and Many-Picks Notes (decisions 52–53)

| Piece | Location |
|---|---|
| Tap picking on `touchend`, pick flash, `findPickElement`, `focus` prop (scroll to a pick and flash it) | `pick/PickLayer.tsx` |
| `PickTarget.section`, `widenAnchor` / `widenPickEntry`, `orderPickEntries`, `entrySection`; `trayReport(…, fileOrder)` | `pick/tray.ts` |
| Grouped compact rows, Wider, Show on page, badges (`PickBadges`), "Picking · Done" pill, phone bar and sheet (`useNarrow`), `fileOrder` prop | `pick/PickMode.tsx`, `pick/pick.css` |
| Reading order from the topic: Viewer passes `topic.oui` and its sections, Studio its sections | `src/viewer/ViewerApp.tsx`, `src/studio/components/StudioWorkspace.tsx` |
| Pick-mode pointer events for concept-map labels and node text | `practice-assessment/components/concept-map/concept-map.css` |

- Checked on a Pixel 7 (Chromium device emulation) against `bg3-four-element-monk`: tapping a quiz answer picks it without answering; a flowchart line tap no longer toggles the line; a concept-map label tap picks `#root.links[1].label`; eight picks fit the sheet in one screen; Wider turned `kiPoints.word` into `kiPoints`; the copy came out in reading order.
- Tests: tap picking (and a swipe that does not pick) in `pick-section.test.tsx`; widen, merge and ordering in `tray.test.ts`; Viewer and Studio component tests and the Studio e2e test updated for the new rows.

## Open Questions

_None._
