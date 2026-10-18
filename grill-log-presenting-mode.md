# Grill Log — Present Mode (Guided Motion Play) in Loom Viewer

Status: **Designed, not started**

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

## Section Beats

| Section | Beats |
|---|---|
| `intro` | Hero title → What → Why → roadmap steps draw in (`show`) |
| `text` | Phrase by phrase, highlighter on bold (`show`) |
| `bullets` | Staggered reveal; children unfold from parents (`show`) |
| `pillar-layer` | Layers stack bottom-up; matrix cells fill (`show`) |
| `image-gallery` | Slow pan and zoom per image with its caption (`show`) |
| `taxonomy-browser` | Category grid cascades in → zoom into each category (`show`) → free browsing (`explore`) |
| `concept-map` | Nodes by cluster → links draw → labels fade in (`show`) → free panning (`explore`) |
| `flowchart` | Journey playback, one step per beat; the camera follows the active node; the line draws before the next node appears (`show`) |
| `scenario` | Situation → choices fan out (`gate`) → consequence → next situation or outcome card |
| `decision-tree` | Question (`gate`) → path lights up → next question … → recommendation |
| `tradeoff-sandbox` | Options appear → bars grow → `recommended` highlighted with its reason (`show`) → sandbox (`explore`) |
| `formula-sandbox` | A ghost hand sweeps one slider once; the result counts and the chart line draws (`show`) → sandbox (`explore`) |
| `quiz` | Question → options drop in → the expected control breathes (`gate`) → wrong options fall away, the right one grows into the explanation |
| `flashcards` | Front → learner flips and self-grades (`gate`) → next card |
| `reflection-sequence` | Shuffled items → learner orders them (`gate`) → wrong items lift and travel along arcs to their slots |
| `reflection-template` | Template with blanks → learner places chips (`gate`) → chips settle or fly to their right blanks → explanation |
| `openui` | One fade-in per top-level child (`show`) |

## Rollout Phases

1. **Prototype:** a standalone motion prototype (quiz, flowchart step, sequence gate on a camera
   canvas) to judge how the motion feels before any architecture work.
2. **Runtime:** `supporting/presentation` (stage, camera, beat runner, controls, progress rail),
   motion presets in `SensoryFeedbackContract`, the Viewer **Read | Present** toggle. Renderers for
   `intro`, `text`, `bullets`, `pillar-layer`, `image-gallery`, `openui`.
3. **Gates:** `quiz`, `flashcards`, `reflection-sequence`, `reflection-template`, domain events
   from gates.
4. **Spatial and branching:** `flowchart` (reusing journey playback), `concept-map`,
   `taxonomy-browser`, `scenario`, `decision-tree`.
5. **Sandboxes:** `tradeoff-sandbox`, `formula-sandbox` (`explore` beats, ghost-hand demo).

Each phase is done when `npm run typecheck` and `npm run test` pass and the mode is checked in
the Viewer with Playwright.

## Open Questions

- Does Present mode remember the learner's place per topic (`localStorage`, like the Pick tray)?
- Narration: on-screen captions only, or optional Web Speech text-to-speech later?
- Should a learner be able to start Present from any section, or always from the topic's start?
