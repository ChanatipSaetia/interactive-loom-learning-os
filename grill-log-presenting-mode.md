# Grill Log — Present Mode (Guided Motion Play) in Loom Viewer

Status: **Implemented: phases 1–6, Read-mode styles and authored narration files (decisions 90–95), hands-free play (decisions 101–107), narration scripted per beat in OUI (decision 108), one idea per beat and answers shown as they are made (decisions 109–111), gains and costs, trends and every scenario ending (decisions 112–113)**

## Goal

Give a self-learner a lean-back way through a topic: **Present** mode turns every section type
into a motion graphic that explains itself, beat by beat. Since decision 101 it plays hands-free:
the stage answers quizzes (a wrong try, then the right answer), walks scenarios and decision trees,
solves reflections, narrates every beat and lights each beat's main content. Nothing new is
authored: the beats come from the content the topic already has.

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
| 101 | Interaction | **None needed: Present plays every section by itself.** There are no gates or explore beats; every beat enters, is narrated, holds and moves on, and autoplay is on from the start. The viewer can still pause, step, go back, jump on the rail and open the overview, but sections take no pointer input. Revises decisions 65 (the viewer watches; pausing sets the pace), 69 and 70. |
| 102 | Narration on every beat | **Every beat is narrated, and the voice is on by default** (`N` mutes it; without a browser voice the captions carry on alone). A beat may carry a narrator line (`Beat.say`, derived from the content by `toBeats`): it shows as a subtitle under the stage and is read first, then the voice reads what the beat puts on screen. Beats whose on-screen text says it all (a paragraph, a bullet, an intro block) have no line. What a line already says is marked `QUIET` so the voice does not read it twice. Captions sit in a bar under the stage, never over the content. Revises decisions 79, 97 (beats of a narrated section without an authored step play their own line) and 99. The derived line moved to the narration file in decision 108. |
| 103 | Performed answers | **The stage answers, and shows a wrong answer before the right one where the content has one.** Quiz: per question, ask; try the first wrong choice (it turns red with the hint and its explanation, error sound); then the right choice (green with its explanation, the others step back, success sound). Scenario: when a weaker ending exists, walk the path to it choice by choice, go back to where it leaves the best path, then walk the best path to its outcome. Decision tree: take the recommended answer (else the first) at each node down to a leaf. Reflection sequence and template: the steps settle into the right order, the right chips fill the blanks. The rail marks wrong tries red and right answers green. Revises decisions 69 and 70. |
| 104 | Former explore beats | **Each becomes something the stage shows**: the taxonomy opens each card in turn; the concept map ends on the whole map; the tradeoff sandbox ends on Read's sandbox with every recommended choice picked; the formula sandbox ends after its sweep. Flashcards play per card: the word, then the flip to its definition. |
| 105 | Highlight | **Every beat lights its main content** once its entrance has landed: what the renderer marks with `focus()` (the question, the tried choice, the outcome, the card being read), else what the beat brings on screen. An authored step with its own `Highlight` or `Spotlight` takes over while it plays. |
| 106 | Progress | **Present emits no learner events.** The stage answers, not the learner, so quiz scores and reflection results are only recorded in Read mode. Revises decision 71. |
| 107 | Narrator wording | ~~Short fixed English phrases built in each `toBeats`.~~ Superseded by decision 108: no narrator wording lives in code. |
| 108 | Where narration is written | **In OUI, per beat, in the section's narration file.** Every beat has a stable ID derived from the content (`q1`, `q1.wrong`, `q1.right`, `card2.back`, `p3`, …; table in *Beat Derivation*), and `NarrationStep(beat, caption, [effects])` names the beat it plays on. Several steps on one beat play in turn. A beat without a step shows no caption and the voice reads its on-screen text; the derived `say` lines of decision 102 are gone. Validation warns about a step whose beat the section does not have and lists its beats; Studio's **Add narration** writes one step per beat, its caption a placeholder saying what the beat shows; the authoring prompt and the `loom-topic-writer` skill write a narration file for every section, in the topic's language. Revises decisions 91, 93, 96, 97 and 102 (steps no longer attach by their first target), and answers the open question of decision 107. |
| 109 | How much a beat shows | **One idea per beat, the key content only; the full text stays in Read.** Content-heavy sections no longer show their whole Read layout: each beat is a scene that replaces the last, and each type picks the parts that carry the idea (table in *Beat Derivation*). Intro: the title, then what it is (the definition, else the summary) with up to three of its points, then why it matters ending on the takeaway, then the roadmap's step titles on a path; tags and roadmap descriptions are left out. Text: one paragraph at a time, a bold opening term as its headline. Bullets: one top-level point at a time with its sub-points. Taxonomy: the cards by name only, then each card with the first two sentences of its description and its analogy; deep dive, primary focus and scope lists are left out. Pillar-layer: blocks by name only. Tradeoff: choices by name with their effect chips, the recommended one with the first two sentences of why it fits; descriptions, gains and costs are left out; the result lists only the recommended choices. Decision-tree answers show their rationale only when taken, and the recommendation the first two sentences of its explanation, without trade-offs. What is left out is not narrated either; a narration file can still say it. Quiz, flashcards, reflections, concept map, flowchart, gallery and formula sandbox already show one idea per beat and are unchanged. |
| 110 | When a choice is made | **On the card it is asked on, in its own beat, before the walk moves on.** In the decision tree and the scenario a beat used to take the choice and show the next question at once, so the narration about a choice came a beat after it was on screen. Now the choice lights on its card while the others step back (a decision-tree answer with its rationale; a scenario choice with a tick, and at the fork the choice tried before struck through), then the next beat brings the next question, situation or ending. Beat IDs: decision tree `start`, `answer1`, `q2`, `answer2`, …, `result`; scenario `start`, `wrong1`, `wrong1.next`, …, `right1`, `right1.next`, …. Revises decisions 103 and 108 (the ID table). |
| 111 | Motion that helps follow | **A `zoom` motion and an agenda rail.** `zoom` settles a beat's key statement into place from slightly larger (a headline, a takeaway, an ending). Sections played one part at a time (bullets, taxonomy, text whose paragraphs all open with a term) show an agenda beside the part on stage: the parts' short names, the current one lit with a bar growing in, the ones done ticked; it moves with CSS, is skipped by the voice and hidden on phones. The roadmap draws its path, then its steps pop on along it. |
| 112 | What the sandboxes explain | **Every choice's gains and costs, and every variable's trend.** Tradeoff: after a step's choices arrive, each choice that has gains or costs gets its own beat (`stepN.choiceK`): its card comes forward and a panel under the cards lists its gains and costs by title (descriptions stay in Read), which the voice reads; the recommendation then lands in the same panel with why it fits. Formula: one sweep per variable that can move (`sweep1`, `sweep2`, …), from its min to its max with the others at their defaults; as it plays, a trend panel states what each metric that moves does ("Recall rises 59 → 101", "peaks at …", "dips to …"), computed from the formulas, and the voice reads it. Revises decision 104 (the sweep) and the tradeoff part of 109. |
| 113 | How many scenario endings | **All of them.** The stage walks one path to every ending (the shortest walk to it): weaker endings first in branch order, so each path leaves the one before as late as possible, the best ending last. A later path starts at the fork where it parts, with the choices tried there struck through; each ending says which one it is ("Ending 2 of 4"); endings below the best rating are marked *wrong* on the rail, the best (and equal ones) *right*. Beat IDs `pathP.choiceN` and `pathP.choiceN.next`. Revises decisions 103 and 110 (one weaker path, then the best). |
| 114 | How a section opens | **On its own `title` beat, which a narration step can script.** Every section but the intro starts with a `title` beat: a card over the section with its kind, title, `heading` and `Lead` text (`lead.what`), which then steps aside for the section's own beats. A `NarrationStep("title", …)` says the section's intro in the author's words; without one the voice reads the card ("Quiz. Knowledge Check."). The intro's first beat is already its title, so it gets none. Renderers can also mark a stage line `FRAME`: the voice reads it on its beat even where an authored step plays, unless the step's caption already says it. The decision tree shows two: "An example: one path through this tree" from `start`, and "The result of these decisions" over the recommendation on `result`. Kind names and frame lines are stage labels like "Question 1 of 3", in English. Refines decisions 97, 108 and 110. |
| 115 | Reflections step by step | **One beat per item placed or blank filled.** A reflection sequence places its items one slot per beat (`cn.step1`, `cn.step2`, … in `solution` order) and a reflection template fills one blank per beat (`cn.stepK`, in reading order), each focused as it lands, so a narration file can explain each step of the answer; `cn.solved` then turns the answer green (with the template's explanation). `cn` and `cn.solved` keep their IDs, so existing narration files still play. Revises decision 103 (the reflection part). |
| 116 | Standard OpenUI sections in steps | **One beat per child of a `Card` or `Stack` root.** When the root of a standard OpenUI section is `Card([...])` or `Stack([...])` with more than one child, each child gets its own beat (`part1`, `part2`, … in order), so a narration file can walk through a header, a table, then its takeaway. The program still renders whole, as in Read; each child's element is marked with its beat and, when the child is a statement reference, tagged with that statement as its Pick anchor so `Highlight("table")` lights it. Any other root (Tabs, Accordion, a single child) keeps the one `all` beat. Revises decision 78. |
| 117 | Narration points at one bar, point or cell | **A chart or table part of a standard OpenUI section is pointable down to one value, by the path of the value in its statement.** `bars.series[0].values[4]` is one bar or line point, `bars.labels[4]` every value at that label, `bars.series[1]` a series, `pie.values[2]` a slice, `table.columns[2].data[4]` a cell, `table.columns[2]` a column and `.label` its header; a row is Spotlighted by its cells. The paths are Pick-pointer paths into the statement's props, so nothing new is learned to write them. Only Present mode tags them; validation accepts exactly these paths on BarChart, HorizontalBarChart, LineChart, AreaChart, PieChart and Table parts. |
| 118 | Drawings | **A standard OpenUI section can draw: `Svg(markup, caption?)`, Loom's one addition to the standard library, pointable shape by shape.** Some ideas are pictures (the parts of an object, where things sit, a shape, a mechanism), and boxes and arrows or prose explain them worse. The markup is inline SVG in a single-quoted, possibly multi-line string; it is sanitized (no scripts, styles, handlers, `foreignObject`, external links or images), its IDs are scoped to the drawing, and Loom palette names as colors (`fill="green"`) become theme tokens. In Present mode every element with an `id` answers to `<statement>.<id>`, so narration walks a drawing with several steps on its beat (`Highlight("kamado.draft-door")`, `Spotlight(["kamado.coals"])`); validation checks the ID is in the markup. Extends decision 117. |

| 119 | Dense bullet slides | **One statement per beat, including every nested point.** A top-level point keeps its `itemN` ID; its descendants play depth-first as `itemN.child1`, `itemN.child1.child1`, and so on. Each statement replaces the previous one in large type; up to two immediate ancestor labels remain as quiet context and the agenda stays on the top-level point. Context is not narrated again. Bullet scenes use the full available stage width, with a compact horizontal agenda below the content rather than a side column; single-point sections use the same full-width scene. The active statement is vertically centered in the available body space. Read mode keeps the complete list. Revises the bullets part of decisions 109 and 111. |

| 120 | Dense text slides | **Long prose becomes short scenes rather than a paragraph-sized slide.** Ordinary text is grouped to a soft budget of 220 source characters, preferring sentence boundaries and then word boundaries; inline Markdown constructs and structured blocks stay intact. The first scene keeps `pN`, continuations use `pN.part2`, `pN.part3`, … . A bold opening term stays as the headline and the agenda stays on that paragraph; continuation headlines are quiet. No wording is summarized or discarded. Code blocks and tables remain whole. Revises the text part of decision 109. |

| 121 | Bullet groups and icons | **Fit pages to rendered content, keeping the hierarchy visible.** Beats and their IDs still visit every point, but several beats share a page: parent headings remain above indented, connected sub-items and each point stays visible after it is spoken. Pages use measured row heights and available stage space, keep complete groups together when they fit, and repeat ancestor context on continuation pages. Recompute after resizing or font loading. Parent headings use icon tiles and sub-items use smaller icons, with optional author-selected `Bullet(text, children?, icon?)` icons and safe defaults. Read mode uses the same icons in compact tiles on parent cards and expanded sub-items, retaining ordered-list counters. The agenda stays below the full-width composition only when it spans multiple pages; single-page lists reclaim that space. Pagination checks the space without the agenda before deciding it needs another page. Revises decision 119; Read keeps its existing interaction. |

| 122 | Emphasis within bullet points | **Inline bold in parents and sub-items.** Authors write `**important phrase**` inside a bullet string. Read, Present, continuation context and the agenda render that phrase as bold; the narration reads its words without the delimiters. The measuring copy renders the same formatting, so pagination accounts for it. Other authored markup stays escaped text rather than executable HTML. |

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
| **Settle** (`zoom`: scale down into place) | "This is the point" | A beat's headline, the intro takeaway, a scenario outcome, a decision-tree recommendation |
| **Advance** (agenda bar grows, item lights) | "We are here" | The agenda beside bullets, taxonomy cards and termed text |
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

Decisions 82, 101–104 and 108. Each rule reads the compiled section data (`SectionConfig.props`, typed
by the sub-context's `schema.ts`) and nothing else. Every beat plays by itself; *wrong* / *right* marks
a performed answer (decision 103). The `code` names are the beat IDs a narration file's steps name
(`BEAT_IDS` in `composition/oui/narration.ts`, listed in the authoring prompt). Every type but
`intro` plays a `title` beat (its title card) before the beats below (decision 114).

| Section type | Beats (from the OUI props) |
|---|---|
| `intro` | `title` title and tagline (when it has either) · `what` the definition (else the summary) and up to three bullets · `why` the summary, then the impact as the takeaway · `roadmap` the `RoadmapStep` titles on a drawn path. One scene per beat (decision 109) |
| `text` | `p1`, `p2`, … per paragraph with `pN.part2`, … continuations for dense prose; one short scene at a time, keeping a bold opening term as its headline (decision 120) |
| `bullets` | `item1`, … for top-level points, with descendants in depth-first order (`item1.child1`, `item1.child1.child1`, …); content-sized pages retain parents and progressively reveal connected sub-items, with icons and continuation context (decision 121) |
| `pillar-layer` | `layer1`, … one per `Layer`, settling onto the stack from the bottom; `MatrixBlock`s fill with the layer they belong to, by title only |
| `image-gallery` | `image1`, … one per `GalleryImage`: the image with a slow push-in (ambient, outside the beat timeline) and its caption |
| `taxonomy-browser` | `cards` all `TaxonomyCategory` cards cascading in, by name · `card1`, … each card opened in turn beside the agenda: title, the first two sentences of its description, its analogy |
| `concept-map` | `group1`, … one per `Concept.category` group, in first-appearance order; its `ConceptLink`s draw once both ends are on screen · `map` the whole map, when there is more than one group |
| `flowchart` | `step1`, … one per `JourneyStep` of the first `Journey`, through the existing journey playback; the camera follows the active node |
| `scenario` | `start` `intro` and the start node's `prompt` · then one path per ending, weaker ones first, the best last: `pathP.choiceN` the choice picked on its card and `pathP.choiceN.next` where it leads, the last on its `Outcome` (*wrong* below the best rating, else *right*); a later path starts at its fork (decisions 110 and 113) |
| `decision-tree` | `start` the tree drawing in and the root `prompt`, framed as an example path · per answer down to a `DecisionLeaf` (the recommended `DecisionChoice`, else the first): `answerN` picked on its question with its rationale, `qN+1` the next question · `result` *right* the recommendation, framed as the result of these decisions (decisions 110, 114) |
| `tradeoff-sandbox` | per `TradeoffStep` (numbered across scenarios): `stepN` its choices by label with their effects · `stepN.choiceK` each choice with gains or costs, listed by title under the cards (decision 112) · `stepN.recommended` the `recommended` choice focused, with the first two sentences of why it fits · `result1`, … per scenario with a recommendation, the metrics with every recommended choice picked |
| `formula-sandbox` | `formulas` the formulas, sliders and gauges · `sweep1`, … per `FormulaVariable` that can move, a ghost hand sweeps it from `min` to `max` while each `FormulaMetric` recomputes (`evaluateFormula`) and its trend is stated (decision 112) |
| `quiz` | per `QuizQuestion` n: `qn` question and choices · `qn.wrong` *wrong*: the first wrong choice, its hint and explanation · `qn.right` *right*: the right choice over its explanation |
| `flashcards` | per `Flashcard` n: `cardn` the `word` on the front · `cardn.back` the flip to its `shortDefinition` |
| `reflection-sequence` | per challenge n: `cn` prompt and items · `cn.step1`, … one per `solution` entry: that item settles into its slot (decision 115) · `cn.solved` *right*: the slots turn green as the right order |
| `reflection-template` | per challenge n: `cn` prompt and template · `cn.step1`, … one per blank in reading order: its right chip pops in (decision 115) · `cn.solved` *right*: the sentence turns green, then the `explanation` |
| `openui` | a `Card([...])` or `Stack([...])` root with several children: `part1`, … one per child, in order, each rising in under the ones before (decision 116); narration points into a chart or table part by value (117) and into an `Svg` part by shape ID (118) · any other root: `all` one beat, each top-level child fades in |

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

### Decisions 101–107 — Implementation Notes

- Kernel (`present-kernel.ts`): `Beat` is `{ say?, answer? }` (no `kind`; since decision 108
  `{ id, answer?, about? }`); `show(say?)` and `answer('wrong' | 'right', say?)` build beats. `PresentRendererProps` lost `gate` and `onEvent`;
  `active` remains for timed motion such as the formula sweep. `beatMarks()` takes a `sound`
  (played by `enterBeat` as the element lands: `error` on a wrong try, `success` on a right answer,
  `flip` on a flashcard). `focus(on)` marks a beat's main content, `QUIET` what the narrator line
  already says; `plain()`, `quoted()`, `listOf()` and `sentence()` build narrator lines.
- Runner (`beat-runner.ts`): no gates, `solve`, `isBlocked` or `isWaiting`; `next` always moves on.
- Stage (`PresentMode.tsx`): autoplay (prop `autoplay`, default on) and the voice start on; the
  caption is the current authored step's caption, else the beat's line, shown in
  `.present-caption-bar` under the stage. The voice reads the line, then `beatSpeech()` of the beat.
  The hold without a voice counts the line's words too. Once a beat lands, `focusElements()`
  (`narration-targets.ts`) finds what to light and the stage adds `present-focus`. The region body
  takes no pointer input; the "Your turn" pill and Continue button are gone.
- Renderers draw only from `(data, beat)`: quiz (`quizPlan`), scenario (`scenarioPlan`: every walk to
  an outcome without loops, best by rating then length, the weaker walk that leaves the best one
  earliest), decision tree (`decisionTreeWalk`), reflection sequence and template (the solved state on
  the second beat; `useSlotGate` is removed), flashcards, taxonomy, concept map, tradeoff (`Summary`)
  and formula. Choices are list items, not buttons.
- Tests: beat rules per type (`tests/unit/sections/present/`, `performed.test.tsx` renders the quiz
  at each beat), the runner without gates, untargeted narration steps riding on the beat before the
  first performed answer, and `QUIET` in `beatSpeech()`.

### Decision 108 — Implementation Notes

- `Beat` is `{ id, answer?, about? }`: `show(id, about?)`, `answer(kind, id, about?)`; `about` says in
  a few words what the beat shows (Studio's template, nothing on stage). The `say` line is removed.
- `NarrationStep(beat, caption?, effects?)` (`composition/oui/narration.ts`), `BEAT_IDS` per section
  type for the prompt (a test checks it covers every presenter), `narrationTemplate(beats)` for Studio.
- `registry/register-core-presenters.ts` exports `CORE_PRESENTERS` and `coreBeatsOf(config)`;
  `sectionBeatsOf(source)` in `validation/oui-gateway.ts` compiles a section and returns its beats, for
  validation and the template.
- Runtime: `stepsByBeat(beats, steps)` groups steps by beat ID; the measured target placement
  (`revealingBeat`, `defaultBeat`) is gone. While a taxonomy card is open, only its detail carries the
  card's Pick anchors, so a step's effects land on what is in view.
- Without a script the voice reads the beat's on-screen text; `QUIET` now only hides what is not worth
  reading (drawing labels, slot numbers, the item pool, the formula sliders, card descriptions in the grid).

### Decisions 109–111 — Implementation Notes

- Kernel: `lead(text, sentences)` keeps the opening sentences (text without stops, such as Thai, stays
  whole); `BeatMotion` gains `zoom`, played by `enterBeat` as a fade with a scale from 1.12.
  `PresentAgenda` (next to `PresentWords`) draws the agenda; its styles, `.present-scenes` (scenes
  sharing one grid cell, each marked `until` its beat) and `.present-headline` live in the stage
  stylesheet.
- Intro, text, bullets and taxonomy render one scene per beat; the taxonomy no longer opens a dialog
  over the grid. Pick anchors stay on what is shown, so narration targets such as
  `noCache.description` still resolve; a target on a part that is left out finds nothing and its
  effect is skipped.
- `decisionTreePlan` and `scenarioPlan` return one step per beat with the card on stage and the choice
  picked on it; a card keeps its React key from its question beat to its answer beat, so the answer
  lights on the same card instead of a new one.
- Tests: `digest.test.tsx` (lead, lead terms, the scenes and what each type leaves out), the decision
  tree renderer in `performed.test.tsx`, the new beat orders in `branching.test.ts`.

### Decisions 112–113 — Implementation Notes

- `tradeoffPlan` returns `{ scenario, step, show: 'choices' | 'choice' | 'recommended', choice? }`; the
  renderer keeps the cards compact and draws the gains and costs, then the why-it-fits, as scenes of one
  panel under them.
- `evaluateFormula` moved to `formula-sandbox/evaluate.ts` (re-exported by the Read component), so
  `present.ts` can compute without loading React. `computeFormulas` evaluates metrics in order;
  `formulaTrends(data, variable)` samples the sweep 25 times and reports `rises`, `falls`, `peak` or
  `dip` with the endpoints (and the turning value), skipping metrics that do not move. The trend words
  are stage labels like "Question 1 of 3"; a narration file can say more.
- `scenarioPlan` keeps one walk per ending; `tried` lists every choice taken from the same card on an
  earlier path.

### Decision 114 — Implementation Notes

- Kernel: `TITLE_BEAT`, `titleBeatCount(type)` and `withTitleBeat(type, beats)`; `beatsOf` and
  `coreBeatsOf` return the stage's beats with the title beat first, so validation, Studio's Add
  narration and `stepsByBeat` see it. Renderers are unchanged: `SectionBody` gives them their own
  beats and the beat less the title beat, so the title beat is their beat -1, and the stage's DOM work
  (entrance, reveal, speech, focus, reading hold) uses that body beat.
- `SectionTitleCard` (in `PresentMode.tsx`) draws the card marked `beatMarks(body)(-1, { until: -1 })`.
- `narration.ts`: `frameSpeech(region, beat)` (elements marked `FRAME`, `data-present-frame`),
  `mentions(text, words)` and `notSaidIn(caption, parts)`; the first authored step of a beat reads the
  beat's frame lines its caption does not say.
- Tests: title beats in `present-kernel.test.ts` and `viewer.test.tsx` (the card, then the section; a
  scripted `title` step), frames in `narration.test.ts`, the decision-tree frame lines in
  `performed.test.tsx`.

### Decision 115 — Implementation Notes

- `reflection-synthesis/present.ts`: `sequenceBeats` and `templateBeats` add a `cn.stepK` show beat per
  `solution` entry or template blank; `challengeStarts(sizes)` gives each challenge's first beat
  (`size + 2` beats each) for the renderers, and `templateSegments` / `templateZones` moved there from
  `PresentTemplate`.
- `PresentSequence` fills slot K on `cn.stepK` (the item leaves a faded copy in the pool, the slot is
  focused) and marks the slots `is-ok` with a tick on `cn.solved`; `PresentTemplate` does the same per
  blank, with its explanation on `cn.solved`. A step beat without a narration step reads the item or
  chip it places.
- Tests: the beat orders and the step-by-step renderers in `performed.test.tsx`.

### Decision 116 — Implementation Notes

- `progressive-content/present.ts`: `openuiParts(source)` scans the `root = Card(` / `Stack(` statement's
  first argument (a list) for its items, as statement names or inline components, skipping strings and
  nested brackets; `openuiBeats(data)` gives `partN` beats for two or more, else `all`.
- `PresentOpenUI` renders the program whole and, in a layout effect (before the stage enters the beat),
  sets `data-beat`, `data-motion` and `data-shown` on each rendered child (past single wrappers, as the
  `children` motion steps in) and `data-oui-anchor` for reference children. When the rendered children
  do not line up with the source's, the body plays whole on the first beat.
- Only those children carry Pick anchors in Present, so `validateOUINarration` warns about a target in a
  standard OpenUI section that is not one of them by name (a statement nested in Tabs, a prop path),
  and the authoring prompt tells writers to make a narrated section a Card or Stack of named parts.
- Tests: `progressive-content.test.ts` (parts and beats), `openui.test.tsx` (the marks per beat),
  `narration-file.test.ts` (targets inside the layout).

### Decision 117 — Implementation Notes

- `progressive-content/components/openui/data-anchors.ts`: `tagDataAnchors(part, name)` reads the rendered
  part. recharts draws each chart twice (the y axis alone, then the plot), so the widest surface is the plot
  and tags left on another surface come off. Bars and pie sectors get `data-oui-anchor`; line and area charts
  draw no element per value, so a `g.loom-data-points` of transparent circles goes on the vertices of each
  curve (`curveVertices`, the end of each M/L/C segment; step curves get none). Table head and body cells are
  tagged by column and row. Every value also answers to `<name>.labels[i]` through `data-oui-alias`, which
  `targetElements` matches like the anchor.
- `PresentOpenUI` tags after render and again on DOM changes (a MutationObserver, once per frame), since charts
  draw only once they are measured.
- `validateOUINarration` accepts the paths per component (`OPENUI_DATA_PATHS`); indexes are not bounds-checked.
- Tests: `openui.test.tsx` (cells, curve vertices), `narration-file.test.ts` (accepted and refused paths).

### Decision 118 — Implementation Notes

- `progressive-content/components/openui/loom-components.tsx`: `Svg` (`defineComponent`) and
  `withLoomComponents(library)`, which adds it to the standard library's Content group; `loomOpenUILibrary`
  renders with it. `standardLibrarySnapshot()` is what `npm run openui:gen` writes: the library with `Svg`, added
  next to `Image` in every child union of the JSON schema and the signatures (`Card(children: (… | Image | Svg | …)[])`).
- `svg-markup.ts`: `sanitizeSvgMarkup(markup, scope, label)` parses with `DOMParser` (`image/svg+xml`), keeps an
  allowlist of drawing elements, drops handlers, unsafe `url()`/`javascript:`/`data:` values and links that are not
  `#id` within the drawing, prefixes IDs with the instance's `useId` scope (keeping the authored one in
  `data-svg-id`), turns palette names in color attributes into `var(--ctp-<name>)` styles and gives the root a
  `viewBox`, `fill="currentColor"` and `role="img"`. `svgShapeIds(markup)` reads IDs without a DOM, for validation.
- `data-anchors.ts`: a part holding `.loom-svg` tags each `[data-svg-id]` element `<name>.<id>`.
  `validateOUINarration` accepts `<name>.<id>` on an `Svg` part when the statement's markup has that ID.
- Single-quoted strings may span lines (the lexer already reads them whole): `indexStatementLines`, the editor's
  `scan` and the CodeMirror highlighter follow them; double-quoted strings still end with their line.
- `scripts/validate-hexmaps.ts` no longer counts `<name>.narrate.oui` files as sections.
- Example: `public/content/kamado-beef/sections/airflow.oui` (a cross-section with animated airflow) and its narration.
- Tests: `svg-markup.test.ts` (sanitizing, scoping, colors, multi-line statements), `openui.test.tsx` (shape anchors),
  `narration-file.test.ts` (accepted and refused shape targets), `authoring-prompt.test.ts` (the Drawings example).

## Open Questions

- Beat IDs follow the content's order (`q2` is the second question), so inserting a question or a card
  shifts the IDs after it and the narration file must follow (validation flags steps whose beat is gone,
  not steps that now land on a different item).


### Taxonomy visual prototype (awaiting review)

Present taxonomy now prototypes the supplied circular-icon reference: a balanced overview (five categories use a 3 + 2 layout) with category names and short focus lines, followed by an analogy-led explanation beside its definition. Category icons and colors carry across both views; the category agenda moves below the focus view. Existing `cards` and `cardN` narration IDs and Pick targets are preserved. Read-mode taxonomy and category data are unchanged.
