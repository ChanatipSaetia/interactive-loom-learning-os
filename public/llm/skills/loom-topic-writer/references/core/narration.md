## Narration Files

Loom Viewer can play a topic hands-free (Present mode): each section plays beat by beat, answers its own quiz questions (a wrong try, then the right answer), walks scenarios and decision trees, and lights the main content of each beat. Write a narration file for every section, `sections/<name>.narrate.oui`: it is the script the narrator reads, beat by beat. A beat with no step reads its on-screen text instead.

- Its `root` is `Narration([steps])`; each `NarrationStep(beat, caption, [effects])` plays on the beat it names. Give every beat of the section at least one step, in beat order. Several steps on one beat play in turn: use them to walk a dense beat (a table, a diagram, a long card) one point at a time, each step with its own effect.
- Flowcharts can choose a view per narration step with a fourth argument, e.g. `NarrationStep("step1", "First the systems.", null, "architecture")`, followed by another `NarrationStep("step1", "Now follow the messages.", null, "sequence")`. Supported views: "event-storming", "architecture", "swimlanes", "sequence", "data-flow", "state-machine". Use only views that explain the topic; an empty or missing view falls back to the initial view. Multiple narration steps on the same beat play in order.

- `caption` is what the narrator says: one or two spoken sentences in the topic's language. Explain and connect, do not just repeat the screen: on a quiz's `.wrong` beat say why that answer is tempting and wrong, on its `.right` beat why the right one is right. Pass `null` for a step that only plays an effect (its Callout is still read).
- Write it as a talk, not a template: vary how captions open, link a beat to the one before or to an earlier section, ask the question the learner is about to answer, and put the why or the example the screen leaves out in a Callout. Mix the effects to what each beat needs; not every step needs one.
- Effects (optional): `Highlight(target)`, `Callout(target, text)` (a note beside an element, one or two short sentences, read after the caption), `Spotlight([targets])` (zoom in and dim the rest). A target is a string naming a statement of the section file, optionally with a prop: `"catechins"`, `"q1.hint"`, `"root.items[0]"`. Name the statements you will point at in the section file (e.g. `catechins = Flashcard(...)`) rather than writing them inline. In a standard OpenUI section, a target names one of the root's children (see Standard OpenUI Sections) or one value of a chart or table among them, by the path of the value in its statement: `"bars.series[0].values[4]"` (one bar or line point), `"bars.labels[4]"` (every bar or point at the fifth label), `"bars.series[1]"` (a whole series), `"pie.values[2]"` (a slice), `"table.columns[2].data[4]"` (a cell), `"table.columns[2]"` (a column) or `"table.columns[2].label"` (its header). To point at a table row, Spotlight its cells. In a drawing (`Svg`), a target names one shape by its `id` in the markup: `"plant.bud"`. Use these to explain one figure or one part of a picture at a time: Highlight a bar while the caption names it, Callout a point with why it is there, Spotlight the shapes of a drawing the caption is about.
- In the single .oui file, the narration file follows its section: `// === sections/vocabulary.narrate.oui ===`.

Every section except the intro opens on a `title` beat: a card with the section's title, its `heading` and its `Lead` text. Its step introduces the section: what it is about and why it comes now (without one, the narrator reads the card). The intro's own beats start with its `title`.

Beat IDs are in each selected section reference under Presentation beats.

Example, for the `sections/vocabulary.oui` file of the example topic:

```
root = Narration([title, word1, back1, word2, back2])
title = NarrationStep("title", "Two words every tea brewer uses, and why they matter in the cup.")
word1 = NarrationStep("card1", "First word: catechins.", [Highlight("catechins")])
back1 = NarrationStep("card1.back", "They are the bitterness in green tea.", [Callout("catechins", "They dissolve faster in hotter water, so water at 75 °C keeps the cup sweet.")])
word2 = NarrationStep("card2", "Next: steep.")
back2 = NarrationStep("card2.back", "Steep time is the dial you control.", [Callout("steep", "Every extra minute adds more catechins than flavour. Pour off all the water when the time is up.")])
```

## Narration component signatures

Narration(steps: NarrationStep[]) — Root of a narration file sections/<name>.narrate.oui: the script Present mode plays the section to, step by step.
  - steps: The narrated steps in order, as NarrationStep references.
NarrationStep(beat: string, caption?: string, effects?: (Highlight | Callout | Spotlight)[], view?: "event-storming" | "architecture" | "swimlanes" | "sequence" | "data-flow" | "state-machine") — One narrated step: the beat it plays on, a caption line read aloud, and effects. Several steps on one beat play in turn.
  - beat: The beat it plays on, by its ID for the section type, e.g. "q1", "q1.wrong", "q1.right" for a quiz, "p2" for a text paragraph (see Narration Files).
  - caption: Subtitle line shown and read aloud while the beat plays, in the topic's language; null for none.
  - effects: Highlight, Callout and Spotlight calls for the step.
  - view: For flowcharts, optionally switch to this view while this narration step plays; null keeps the flowchart’s initial view.
Highlight(target: string) — Narration effect: outlines and pulses one element of the section for its step.
  - target: Pick pointer to what it points at in the section file: a statement name, optionally with a prop path, e.g. "noCache", "q2.explanation", "root.categories[0]".
Callout(target: string, text: string) — Narration effect: a note that pops up beside one element of the section, with explanation the section does not say itself.
  - target: Pick pointer to what it points at in the section file: a statement name, optionally with a prop path, e.g. "noCache", "q2.explanation", "root.categories[0]".
  - text: The note, one or two short sentences. Narration reads it after the caption.
Spotlight(targets: string[]) — Narration effect: the camera moves in on these elements and dims the rest of the section.
  - targets: Pick pointers of the elements to frame together, e.g. ["noCache", "noStore"].
