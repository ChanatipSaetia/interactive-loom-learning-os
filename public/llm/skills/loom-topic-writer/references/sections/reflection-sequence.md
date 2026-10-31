# reflection-sequence

Reconstructing order and procedure. Can I arrange the supplied steps into the correct sequence?

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

ReflectionSequence(title: string, challenges: SequenceChallenge[], heading?: string, lead?: Lead) — Sequence-builder reflection: learners put steps in the right order.
  - title: Section title, shown in the topic outline and as the section header.
  - challenges: The challenges, as SequenceChallenge references, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
SequenceChallenge(prompt: string, items: SequenceItem[], solution: (string | SequenceItem)[]) — Ask the learner to order items. `solution` lists the items (references or IDs) in the correct order.
  - prompt: Instruction shown above the items, e.g. "Put the steps in order".
  - items: The items to order, as SequenceItem references, in the order they are first shown (not the solution order).
  - solution: The same items (references or IDs) in the correct order.
SequenceItem(id: string, text: string, icon?: string) — A draggable item in a sequence challenge.
  - id: Item ID, unique within the challenge; `solution` refers to it.
  - text: Text shown on the draggable card.
  - icon: Optional icon name (reserved; not shown yet).

## Presentation beats

`title`, then `c1`, `c1.step1`, `c1.step2`, …, `c1.solved`, `c2`, … per challenge: the prompt, then each item placed in its slot in the right order, one per step, then the order confirmed
