# Grill Log — Present Mode (Guided Motion Play) in Loom Viewer

Status: **Phase 1 done (runtime, Viewer toggle, intro/text/bullets/openui); phases 2–6 planned**

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

Tests per phase: every `toBeats` gets a unit test in `tests/unit/sections/present/` that compiles
a small `.oui` fixture and checks beat kinds and count; the runner, camera and speech normalizer are
pure and tested directly.

## Open Questions

None. Decisions 88–89 answered the last two.
