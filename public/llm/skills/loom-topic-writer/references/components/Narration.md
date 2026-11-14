## Focused component contracts

Narration rules: sections/<name>.narrate.oui must contain exactly one root = Narration(...) statement. Its steps target documented beats in the matching page; it is not a Page. A bare Narration(...) call is invalid source.

## Component Signatures

Narration(steps: NarrationStep[]) — Root of a narration file sections/<name>.narrate.oui: the script Present mode plays the section to, step by step.
  - steps: The narrated steps in order, as NarrationStep references.
NarrationStep(beat: string, caption?: string, effects?: (Highlight | NarrationCallout | Spotlight)[], view?: "event-storming" | "architecture" | "swimlanes" | "sequence" | "data-flow" | "state-machine") — One narrated step: the beat it plays on, a caption line read aloud, and effects. Several steps on one beat play in turn.
  - beat: The beat it plays on, by its ID for the section type, e.g. "q1", "q1.wrong", "q1.right" for a quiz, "p2" for a text paragraph (see Narration Files).
  - caption: Subtitle line shown and read aloud while the beat plays, in the topic's language; null for none.
  - effects: Highlight, NarrationCallout and Spotlight calls for the step.
  - view: For flowcharts, optionally switch to this view while this narration step plays; null keeps the flowchart’s initial view.
Highlight(target: string) — Narration effect: outlines and pulses one element of the section for its step.
  - target: Pick pointer to what it points at in the section file: a statement name, optionally with a prop path, e.g. "noCache", "q2.explanation", "root.categories[0]".
NarrationCallout(target: string, text: string) — Narration effect: a note that pops up beside one element of the section, with explanation the section does not say itself.
  - target: Pick pointer to what it points at in the section file: a statement name, optionally with a prop path, e.g. "noCache", "q2.explanation", "root.categories[0]".
  - text: The note, one or two short sentences. Narration reads it after the caption.
Spotlight(targets: string[]) — Narration effect: the camera moves in on these elements and dims the rest of the section.
  - targets: Pick pointers of the elements to frame together, e.g. ["noCache", "noStore"].

### Narration: teaching purpose

- Introduce: Explain and focus attention on already-authored content during Present.
- Explore: Follow supported beats and real effect targets; captions should connect and explain the content.
- Evidence: Narration and demonstrated answers do not count as learner attempts or mastery.
- Limits: Use valid beat IDs, resolvable targets and supported view controls. Do not invent narrative content as evidence that an external system ran or a learner answered.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
