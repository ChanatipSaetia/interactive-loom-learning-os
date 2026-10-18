# Grill Log — Present Mode (Guided Motion Play) in Loom Viewer

Status: **Implemented: phases 1–6, Read-mode styles and authored narration files (decisions 90–95)**

## Goal

Give a self-learner a lean-back way through a topic: **Present** mode turns every section type
into a motion graphic that explains itself, beat by beat, and stops where the learner has to act.
Sections stay interactive. Nothing new is authored: the beats come from the content the topic
already has.

## Baseline

- Sections are interactive components; only the flowchart has a playback timeline
  (`process-simulation/components/flowchart/playback-controls.tsx`, `mini-player.tsx`).
- Motion lives in `src/core/ui-system/motion/` (Framer Motion via `motion`, easing and springs in
  `ease.ts`); sounds in `SensoryFeedbackContract` (`stepNext`, `flip`, `success`, …). `animejs` v4
  is a dependency.
- AGENTS.md links `DESIGN.md` for the design system, but the file does not exist. The only written
  motion rules are the curves and springs in `ease.ts`.
- The schemas already hold what a performed section needs: quiz correct answers, tradeoff
  `recommended`, reflection `solution`, scenario `outcome`, decision-tree `recommendation`.

## Decisions

Numbering continues from [grill-log-ai-assistant.md](grill-log-ai-assistant.md).

| # | Question | Decision |
|---|---|---|
| 65 | Who it is for | **A self-learner going through a topic alone.** Not a live presenter (no presenter view, notes window or remote) and not video export for now. The learner sets the pace: autoplay between stops, with pause, rewind and skip. |
| 66 | Where it lives | **A new mode in Loom Viewer only**: a **Read \| Present** toggle in the header. Not in the learning app, Studio or the embed bundle (`libs/loom-sections.tsx`). Pick mode is off while presenting. |
| 67 | What authors write | **Nothing.** Each section type derives its beats from its content (`toBeats(data) → Beat[]`). No `present` props in `.oui`; overrides (skip, hold, narration) would be a later grill session. |
| 68 | The model | **A beat timeline per section.** A pure `toBeats(data)` plus a `PresentRenderer` that draws "state at beat *i*, progress *t*" from `(data, beat, t)` only, so back, rewind and skip are exact. Present mode never automates clicks on the Read-mode components. |
| 69 | Beat kinds | **`show`** plays by itself and holds for reading time (about 230 words a minute + 0.8s). **`gate`** waits for the learner (quiz answer, flashcard self-grade, sequence order, template chips, scenario choice, decision-tree answer), then plays a correct or incorrect response beat. **`explore`** runs the section live with a **Continue** button (tradeoff and formula sandboxes, concept map, taxonomy). |
| 70 | Branching sections | **The learner chooses.** Scenario and decision-tree stay interactive and animate the path taken. At an ending, **Try another path** moves the camera back to the last fork. |
| 71 | Progress | **Gates emit the same domain events as Read mode** (`events.ts` in each sub-context), so learner progress counts in either mode. |
| 72 | Where the code lives | **`src/core/supporting/presentation/`** owns the stage, beat runner, camera and controls. Each sub-context adds **`present.ts`** next to `openui.ts` with `toBeats` and its `PresentRenderer`. Renderers reuse the sections' visual parts (cards, nodes, bars) with controlled props; components whose visual state is internal get it lifted into props. |
| 73 | Motion engines | **Narrated beats use anime.js v4 timelines** (`createTimeline`, seekable, reversible) with `EASE_OUT` / `EASE_IN_OUT`. **The learner's own input at gates uses the existing springs** (`SPRING_PRESS`, `SPRING_SWAP`). Shared-element morphs use `motion`'s `layoutId` or FLIP. Section boundaries use the View Transitions API with a cross-fade fallback. |
| 74 | Motion presets | **Added to `SensoryFeedbackContract`** (`present.enter`, `present.highlight`, `present.draw`, …), so subdomain renderers never hard-code durations or curves (AGENTS.md: no ad-hoc styling). Beats fire the existing sounds on the moment of impact, not when a movement starts. |
| 75 | Stage | **One continuous canvas with a camera**, not slides. The topic is laid out in space; moving between sections and beats is a camera move (pan, zoom ≤ 1.15×, never rotation). The stage is a fixed 16:9 area scaled to fit, stacking to a vertical column on phones. |
| 76 | Controls | `Space` / `→` next beat, `←` previous, `A` autoplay on/off, `F` fullscreen, `G` overview of sections, `Esc` back to Read. A slim progress rail shows sections and beats; gates are marked on it. Touch: tap to advance, swipe back. |
| 77 | Reduced motion | **With `prefers-reduced-motion`: no camera moves, beats switch with cross-fades, draws and counts jump to their final state.** Gates and Continue work the same. |
| 78 | Standard OpenUI sections | **Section-level only**: one fade-in per top-level child, as Pick is section-level for them (decision 49). |
| 79 | Narration | **The browser's Web Speech voice reads each beat, off by default**, turned on with a **Narration** button (`N`). The words come from the beat's own content (decision 67); a gate reads its prompt, and solving it reads the explanation. When the voice reports word boundaries, the spoken word lights up. Autoplay waits for the voice to finish, with a time-out so a voice that never ends cannot stall the lesson. No voices means the button is disabled and captions carry on alone. |
| 80 | Code and URLs in narration | **A rule-based speech normalizer, no authoring.** Inline code, file names and header values are rewritten for speech (`/app.3f9a.js` → "app dot j s", `max-age=31536000` → "max-age 31536000"). There is no pronunciation prop; one would break decision 67 and needs its own grill session. |
| 81 | Sound cues | **The existing `SoundEffect` set plus `whoosh` (camera) and `draw` (a line drawing)**, played through `useSound()` and muted by the Viewer's existing **AudioToggle**, so Present mode adds no second sound switch. A sound fires on the moment of impact, at most one of a kind every 90ms. |
| 82 | How beats are derived | **Fixed rules per section type, from the compiled section data** (table in *Beat Derivation* below). Each rule lives in that type's `toBeats` and is unit-tested. |
| 83 | What a renderer may show | **Only what the section's props carry.** The prototype's invented visuals do not ship: no freshness timeline in `text`, no latency counters or request probe in `pillar-layer` (`LayerItem` has only `title` and `description`), no hand-placed concept-map positions (the Read layout `layoutTopDownPlanar` places them), no mock screenshots (a gallery shows its `GalleryImage` files), no hand-written pronunciation. |
| 84 | Present renderers | **Separate `Present<Type>` components that reuse the Read sections' leaf visuals and pure helpers**, with controlled props. Known reuse: the flowchart's `stateAtStep`, `usePlaybackState` and `useCamera`; the concept map's `layoutTopDownPlanar` (exported); the quiz `QuestionCard` and flashcard card faces once their reveal state is a prop. They tag elements with `usePickAnchors()` like every section, so Pick works on them if it is ever turned on. |
| 85 | Performance | **Only the current section and its neighbours mount**; every other region renders its header only, which is also what the overview shows. Camera moves and beats animate transform, opacity, clip-path and stroke-dashoffset only. |
| 86 | Viewer chrome in Present | **Pick and the AI assistant dock are hidden**; Theme, AudioToggle, Refresh and Open stay. Refresh keeps the learner on the same section and beat when the section still exists, else returns to the topic start. |
| 87 | Beat timelines | **One anime.js `createTimeline` per beat**, as `useAnimation` already does. Skipping calls the timeline's completion so it jumps to its end state; going back renders the earlier beat's end state directly, never plays a timeline in reverse. |
| 88 | Remembering the place | **No.** Present mode keeps nothing between visits; closing it or reopening the topic starts fresh. |
| 89 | Where Present starts | **At any section.** Switching to Present starts at the section the learner is reading (the first one whose top is in view); the progress rail and the overview jump to any section at any time, past unsolved gates too. |
| 90 | How Present looks | **Like Read mode.** Each `Present<Type>` renderer is built on its Read section's markup and CSS classes (cards, badges, chips, colours, type); only beat marks, motion and the sizing the 1200×675 region needs are Present's own. Refines decision 84. |
| 91 | Authored narration | **An optional narration file per section: `sections/<name>.narrate.oui`**, an OpenUI program with root `Narration([...])`. It adds explanation that is not in the section's content (callouts, highlights, a zoom, a caption line). A section without one plays as before. Revises decision 67 (authors may now write narration, never required) and decision 83 (callout text comes from the narration file). |
| 92 | Pointing at content | **Targets are strings in Pick pointer form**: a statement name of the section file, optionally with a prop path (`"noCache"`, `"q2.explanation"`, `"root.categories[0]"`). Validation checks the statement exists in the section and its first prop is a prop of that component. In Present a target matches the elements whose Pick anchor equals it or starts with it (`noCache.…`, `noCache[…`); Present now tags Pick anchors like Read. |
| 93 | Narration and derived beats | **Added to them.** Each `NarrationStep` becomes a `show` beat played right after the derived beat that reveals its first target (found from the rendered section: the target's closest `data-beat`). A step without targets, or whose target is not found, plays after the last `show` beat before the first gate or explore beat (else at the end). Steps keep their written order. |
| 94 | Effects | **`Highlight(target)`** outlines and pulses a target; **`Callout(target, text)`** pops a note beside it; **`Spotlight([targets])`** moves the camera in on the targets and dims the rest of the section; the step's **caption** is a subtitle line. Effects last for their step. Narration (decision 79) reads the caption, then each callout. |
| 95 | Authoring support | **The full pipeline**: components with field docs in the OUI library (prompt, JSON schema, hovers), `npm run oui:schema` outputs, the agent skill, validation in Viewer and Studio, Studio edits a section's narration in a **Narration** tab next to Code and Form, and every topic reader and writer (folder, `.zip`, `.loom.oui`, pasted text, assistant edits) keeps `sections/<name>.narrate.oui`. |
| 96 | Narration and the timeline | **Narration rides on the beats.** A step attaches to the derived beat that reveals its first target (untargeted: the last `show` before the first gate or explore beat) and plays during that beat; there are no extra stops, so the rail and beat count are the section's own. Several steps on one beat play one after another inside it. Revises decision 93. |
| 97 | What the voice reads | **Only the narration, where a section has one.** In a section with a narration file the voice reads the authored captions and callouts, and beats without a step are silent; sections without a file read their on-screen text (decision 79). |
| 98 | Step timing | **With the motion.** The caption (and voice) starts as the beat enters; highlights, callouts and the spotlight appear once the beat's entrance has landed. Each step lasts until the voice finishes, or its reading time without the voice; the beat then holds as usual. Next moves to the next beat. |
| 99 | Default | **Captions and effects always show; the voice stays opt-in (`N`).** |
| 100 | Phones | **On a phone the stage is the screen itself, at scale 1**, with phone-sized type, so sections lay out and read as Read mode does on a phone (landscape keeps its fixed 1200×675 stage scaled to fit). The concept map frames the group being introduced on a tall canvas; the flowchart may zoom to 1× on a step. The stage's boxes never scroll, so a focused button cannot shift the camera. |

## Motion Rules

These are the rules every `PresentRenderer` follows. They belong in a `DESIGN.md` motion section
once that file exists.

### Vocabulary: each movement has one meaning

| Movement | Means | Used for |
|---|---|---|
| **Draw** (path stroke) | Connection, cause | Concept-map links, flowchart lines, decision-tree path |
| **Grow** (scale from the baseline) | Size, amount | Tradeoff bars, formula results, pillar layers |
| **Travel** (along an arc) | Ordering, placement | Sequence items into order, chips into blanks |
| **Flip** (3D) | Recall, the hidden side | Flashcards, quiz answer reveals |
| **Focus** (dim the rest, lift the active item) | "Look here" | Every beat's active element |
| **Count** (number tween) | Change in a value | Formula outputs, scores |
| **Breathe** (slow glow, about 3s) | "Your turn" | The control a gate waits on |

A movement that means nothing is a short fade.

### Choreography

- **Lead, then follow:** the main element arrives first; supporting items follow with a 40–60ms
  stagger and overlap.
- **Exits are quicker than entrances** (about 60% of the time, eased in). Old content leaves
  before new content arrives; no muddy cross-fades.
- **At most two things move at once**, never in opposite directions.
- **Anticipation on key reveals:** a slight pull back or a 120ms pause before the correct answer
  lights up.
- **Duration budget:** small UI changes 150–250ms, elements 300–500ms, camera 600–900ms; nothing
  over 1s except drawing a path.
- **Continuity:** objects turn into the next state instead of being swapped (the chosen quiz
  option grows into its explanation; a scenario choice card turns into the next situation; a
  flowchart node grows into its detail).
- **Kinetic text:** text appears phrase by phrase at reading speed; **bold** gets a highlighter
  sweep; key terms lift slightly when introduced; bullet children unfold out of their parent.
- **Interruptible:** skipping mid-animation jumps to the end state; animations never queue.
- **Performance:** animate only transform, opacity, clip-path and stroke-dashoffset. No bounce on
  text; springs only for what the learner touches.

## Beat Derivation

Decision 82. Each rule reads the compiled section data (`SectionConfig.props`, typed by the
sub-context's `schema.ts`) and nothing else. `show` plays by itself, `gate` waits for the learner,
`explore` runs the section live with **Continue**.

| Section type | Beats (from the OUI props) |
|---|---|
| `intro` | `show` title and tagline · `show` `IntroWhat` · `show` `IntroWhy` · `show` the `RoadmapStep` list (line draws, steps rise) |
| `text` | `show` per paragraph of the markdown body; **bold** gets the highlighter sweep |
| `bullets` | `show` per top-level `Bullet`; its children unfold out of it |
| `pillar-layer` | `show` per `Layer`, settling onto the stack from the bottom; `MatrixBlock`s fill with the layer they belong to |
| `image-gallery` | `show` per `GalleryImage`: the image with a slow push-in (ambient, outside the beat timeline) and its caption |
| `taxonomy-browser` | `show` all `TaxonomyCategory` cards cascading in · `explore` (open any card) |
| `concept-map` | `show` per `Concept.category` group, in first-appearance order; its `ConceptLink`s draw once both ends are on screen · `explore` (tap a concept to highlight its links) |
| `flowchart` | `show` per `JourneyStep` of the first `Journey`, through the existing journey playback; the camera follows the active node |
| `scenario` | `show` `intro` and the start node's `prompt` · `gate` choose a `ScenarioChoice`, follow `next` until a node with an `Outcome` (`verdict`, `lesson`, `rating`); **Try another path** returns to the last fork |
| `decision-tree` | `show` the tree drawing in and the root `prompt` · `gate` answer `DecisionChoice`s until a `DecisionLeaf` (`recommendation`, `explanation`); **Start over** returns to the root |
| `tradeoff-sandbox` | per `TradeoffStep`: `show` its choices with metric bars growing, then `show` the `recommended` choice focused · `explore` the sandbox |
| `formula-sandbox` | `show` the variables and metrics · `show` a ghost hand sweeps the first `FormulaVariable` from `defaultValue` to `max` while each `FormulaMetric` recomputes (`evaluateFormula`) and counts · `explore` the sliders |
| `quiz` | per `QuizQuestion`: `show` question and choices · `gate` answer (a wrong choice shows its explanation and stays open; the right one grows into its explanation) |
| `flashcards` | `show` the deck · `gate` flip and grade every `Flashcard` (`word` front, `shortDefinition` back; **Again** sends a card to the back) |
| `reflection-sequence` | per challenge: `show` prompt and items · `gate` order them, checked against `solution` |
| `reflection-template` | per challenge: `show` prompt and template · `gate` fill the blanks with chips, checked against `solution` |
| `openui` | one `show`: each top-level child fades in |

## Implementation Plan

Phase 0, the prototype, is done:
[Loom Present Prototype](https://claude.ai/artifact/7qfJuQeFFbdbkKyDWdEMec) plays one section of every
type with narration and sound. Phases 1–6 build the real mode. Each phase ends green on
`npm run typecheck`, `npm run lint` and `npm run test`, and is checked in the Viewer with the
Playwright MCP tools (AGENTS.md, *E2E Testing*).

### Code layout

As built in phase 1 (the beat contract and the registry sit in the learning engine, next to
`openui-kernel.ts` and `SectionRegistry`, so core sections never import a supporting subdomain):

```
src/core/learning-engine/sub-contexts/
  present-kernel.ts                        Beat, BeatKind, BeatMotion, PresentRendererProps, PresentGate,
                                           SectionPresenter, beatMarks(), splitWords(), wordsHtml()
  PresentWords.tsx                         plain text as word spans for the `words` motion
  <subdomain>/present.ts                   toBeats(data) + SectionPresenter for each section type
  <subdomain>/components/<type>/Present<Type>.tsx   the renderer (decision 84)
src/core/learning-engine/registry/
  present-registry.ts                      PresentRegistry (cached loaders, no React.lazy) + beatsOf()
  register-core-presenters.ts              registerCorePresenters(), called by src/viewer/main.tsx
  index.ts                                 SectionRegistry.loader(type) for Read fallbacks
src/core/supporting/presentation/          PresentationContext
  beat-runner.ts                           pure reducer: position, next/prev/jump, gate and explore rules, holdMs
  camera.ts                                pure: 4-column snake grid, region/overview cameras, lean clamping
  motion.ts                                enterBeat(): one anime.js timeline per beat; revealBeat() scrolling
  components/PresentMode.tsx               stage, camera, regions, autoplay, keyboard/touch, overlay, complete card
  components/PresentControls.tsx           prev/play/next, rail, Overview, Read
  components/present.css
  narration.ts, speech-text.ts             phase 6 (decisions 79–80)
src/core/ui-system/SensoryFeedbackContract.ts   PRESENT_MOTION durations and curves; SoundEffect += whoosh, draw
src/viewer/ViewerApp.tsx                   Read | Present toggle, start at the section in view, preload
```

A renderer draws the end state of `beat` and marks elements with `beatMarks(beat)(at, { motion,
delay, until })`; CSS hides marked elements until `data-shown`. The stage plays the entrance of
the current beat over the marked elements and leaves them to CSS afterwards, so going back or
jumping just re-renders. Renderers never animate or set motion styles themselves.

### Phases

1. **Runtime and the simple types.**
   `types.ts`, `beat-runner.ts` (+ unit tests with fake timers), `camera.ts` (+ tests),
   `useBeatRunner.ts`, `PresentMode`, `PresentControls`, `PresentRegistry`, motion presets,
   `whoosh` and `draw` sounds, the Viewer toggle, keyboard and touch controls, reduced motion.
   Renderers and `toBeats` for `intro`, `text`, `bullets`, `openui`. Viewer opens any topic in
   Present; unsupported types show their Read component inside the region, one `show` beat, so a
   topic never breaks mid-way.
2. **The remaining progressive-content types:** `pillar-layer`, `image-gallery`,
   `taxonomy-browser` (first `explore` beat).
3. **Gates:** `quiz`, `flashcards`, `reflection-sequence`, `reflection-template`. Lift the quiz
   card's and flashcard's reveal state into props; one shared slot-gate hook for sequence and
   template. Gates emit the Read-mode events, verified by a test against `ProgressProvider`.
4. **Spatial and branching:** `flowchart` (journey playback, camera follow), `concept-map`
   (export `layoutTopDownPlanar`), `scenario`, `decision-tree`.
5. **Sandboxes:** `tradeoff-sandbox`, `formula-sandbox` (ghost-hand sweep through `evaluateFormula`).
6. **Narration and finish:** `narration.ts`, `speech-text.ts` (+ tests), spoken-word highlight,
   Refresh keeping the place (decision 86), performance pass (decision 85), docs:
   `docs/agents/domain.md` (PresentationContext), AGENTS.md (Viewer paragraph), `DESIGN.md` motion
   section from the *Motion Rules* above.

### Phase 1 — Implementation Notes

- Runtime: `beat-runner.ts`, `camera.ts`, `motion.ts`, `PresentMode`, `PresentControls`. Next or
  Space finishes the beat in progress first, then moves on; autoplay holds each `show` beat for
  `holdMs(words)` after its entrance and stops at gates and explore beats; `G` overview, `Esc` back
  to Read, tap and swipe on touch. Reduced motion cross-fades every entrance and skips draws and
  camera moves.
- Section modules are loaded by the stage, not through `React.lazy`/Suspense: with Suspense the
  first section sometimes stayed empty until another render (a lost retry), and the stage needs to
  know when a section's DOM exists to animate it. Viewer starts loading the renderers when a topic
  opens, so switching to Present is instant.
- Types without a renderer yet (all but intro, text, bullets, openui) show their Read component as
  one `show` beat, scrolling inside the region.
- Only the current section and its neighbours mount (decision 85); others show their header.
- Tests: runner, camera, kernel and registry, beat rules compiled from `.oui` fixtures, and a Viewer
  test that plays a topic to the end and back. Checked in Chromium at 1280px and 400px.

### Phase 4 — Implementation Notes

- `flowchart` renders the Read `Flowchart` with `present={{ step }}`: the first journey holds at the
  beat's step and the section's own title, tools, view tabs and dock are hidden, so its camera and
  step caption do the presenting. A hidden copy of each step's title and reason (`.present-sr`) gives
  the stage the words to time the beat by. The step is re-applied when a new schema resets playback.
- `concept-map` uses `layoutConceptMap` (exported next to the Read layout): every connected group
  laid out by `layoutTopDownPlanar`, side by side in one SVG. The view (`viewBox`, animated) widens
  each beat to frame every concept shown so far, never closer than 900×420 units. Categories the
  Read map has no colour for take a palette colour in group order.
- `draw` on an SVG path with `pathLength="1"` strokes it along the path (stroke-dashoffset) instead
  of the clip-path wipe; links in the concept map and decision tree use it.
- `scenario` and `decision-tree` keep the walked path in renderer state. The scenario collects the
  choices as a trail and grades outcomes A, B+, B−, C; the decision tree draws the whole tree
  (`drawTree`: leaves side by side, shared answers and loops as dashed cross links) and lights the
  branches taken. Reaching an outcome or a leaf solves the gate; Try another path and Start over stay
  available afterwards. The decision tree emits `DecisionNodeSelected`.
- Answer-button styles (`.present-choice`) moved to the stage stylesheet, shared by quiz, scenario
  and decision tree.

### Phase 5 — Implementation Notes

- `tradeoff-sandbox` (`tradeoffPlan`): per step, the choices arrive side by side, each effect's bar
  drawing in green where it helps and red where it costs (relative to the step's largest change);
  then the `recommended` choice lifts with its badge and `whyThisFits` (or `whenToUse`) while the
  others step back. A step without a valid `recommended` has one beat. The explore beat is the
  sandbox: metric meters summed from the base values as in Read, one pill per choice, a tab per
  scenario.
- `formula-sandbox`: formulas (`humanizeFormula`), sliders and gauges arrive; a ghost hand sweeps the
  first variable from `defaultValue` to `max` (2.6 s, eased, snapped to `step`) while the metrics
  recompute in order through `evaluateFormula`; the sliders are live on the explore beat. No sweep
  beat when the first variable starts at its max. Off-stage or with reduced motion the sweep lands
  at once. Gauge ranges come from moving each slider alone from the defaults, metrics evaluated in
  order, so derived metrics (`bleed_dps + poison_dps`) work; the Read sandbox's
  `computeMetricRange` does not see earlier metrics and logs errors for them (left as is).
- Labels avoid `<strong>`, which the stage styles as a highlighter mark.

### Phase 6 — Implementation Notes

- Narration (`narration.ts`): off by default; the **Narration** button (or `N`) is disabled when the
  browser lists no voice. Each beat is read as it arrives: the top-level elements marked for it, word
  spans one by one (the spoken one gets `.present-spoken` from the voice's word boundaries), other
  elements as their text with a pause after each line. When a gate is solved, the elements its
  renderer marked with `SAY` are read once (the quiz's right explanation, the reflection result, the
  scenario outcome, the decision-tree recommendation). Text in Thai, Japanese, Korean, Chinese,
  Cyrillic or Arabic script picks a voice for that language when the browser has one.
- With narration on, autoplay waits for the voice to finish (never longer than twice the reading
  hold plus 3 s), then holds 0.7 s.
- `speech-text.ts` rewrites file names and paths (`/app.3f9a.js` → "app dot j s"; hashes dropped,
  short extensions spelled), URLs, `key=value` header values and a few symbols and abbreviations.
- Refresh (decision 86): Viewer records the section and beat Present reports; after a refresh Present
  restarts at the section with the same name and that beat (clamped), or at the topic start when
  the section is gone.
- The flowchart renderer marks only its hidden step text, so neither the reading hold nor the voice
  takes in the whole canvas.
- The design-system doc the plan mentions (`DESIGN.md`) is not in the repository; the *Motion
  Rules* above remain the reference.

### Decisions 90–95 — Implementation Notes

- Read styles (decision 90): every `Present<Type>` renderer renders its Read section's markup and
  imports its CSS; each subdomain's `components/present.css` keeps only stage sizing, motion states
  and the few Present-only parts (the scenario trail, the decision tree drawing, the formula ghost
  hand, in-stage taxonomy detail). Gates keep their Present mechanics (tap to place, FLIP glides,
  fall-away answers) on Read-styled elements.
- Narration files: components in `composition/oui/narration.ts` (in the OUI library, so the prompt,
  JSON Schema and hovers have them); `compileOUINarration`; `validateOUINarration(source,
  sectionSource)` checks targets (tier 3, as warnings). Viewer lists narration problems in its error
  summary (warnings too, since a narration only plays in Present) and passes `narration` and the
  section's `sourceMap` to Present.
- Present wraps each section in a `PickAnchorProvider` so renderers tag `data-oui-anchor`;
  `narration-targets.ts` resolves targets and finds the derived beat that reveals them;
  `narration-steps.ts` groups steps by the beat they ride on (`stepsByBeat`, decision 96). Placement
  is measured once the section (or a neighbour) has drawn. During a beat its steps play in turn: the
  caption (and voice) starts with the entrance, the effects once the entrance has landed, each step
  lasts until the voice ends or its reading time passes, and autoplay waits for the last one. In a
  narrated section the voice reads only the steps (decision 97). Steps stay up at least 2 s (3.2 s
  with effects) so a spotlight's camera move can land; effects only use targets already shown, and a
  spotlight frames the step's callouts too.
- `NarrationLayer` draws highlights (outline pulse; drop-shadow for SVG), callouts (kept clear of
  the caption band at the bottom) and the spotlight (a dimming frame; the camera zooms with
  `focusCamera`, up to 2×). The caption sits over the stage, outside the camera.
- Authoring: `fileKindFromPath` → `'narration'` with target completions and diagnostics when the
  section source is known (Studio, VS Code); Studio's **Narration** tab adds a file from a template,
  edits, saves, removes it, and moves or deletes it with its section; assistant `oui-edit` blocks may
  write `sections/<name>.narrate.oui`; every topic reader and writer keeps the file; the authoring
  prompt has a *Narration Files* section with a validated example.

Tests per phase: every `toBeats` gets a unit test in `tests/unit/sections/present/` that compiles
a small `.oui` fixture and checks beat kinds and count; the runner, camera and speech normalizer are
pure and tested directly.

## Open Questions

None. Decisions 90–95 answered the follow-up on styles and authored narration.
