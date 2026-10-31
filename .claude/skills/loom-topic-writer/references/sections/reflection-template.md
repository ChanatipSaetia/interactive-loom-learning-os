# reflection-template

Structured reasoning and explanation. Can I complete a sound explanation using the supplied concepts and sentence blanks?

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

ReflectionTemplate(title: string, challenges: TemplateChallenge[], heading?: string, lead?: Lead) — Self-explanation reflection: learners complete sentence templates with chips.
  - title: Section title, shown in the topic outline and as the section header.
  - challenges: The challenges, as TemplateChallenge references, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
TemplateChallenge(prompt: string, template: string, chips: Chip[], solution: Record<string, string>, explanation?: string) — Fill-in-the-blanks self-explanation. `template` contains {zone-id} slots; `solution` maps each zone ID to a chip ID, e.g. {"zone-1": "chip-a"}.
  - prompt: Instruction shown above the template.
  - template: Sentence with {zone-id} blanks, e.g. "A cache trades {zone-1} for {zone-2}."
  - chips: Chips the learner can drop into blanks, as Chip references (may include distractors).
  - solution: Correct chip per blank: an object of zone ID → chip ID, e.g. {"zone-1": "chip-a"}.
  - explanation: Optional explanation shown once the template is solved.
Chip(id: string, text: string) — A word chip the learner drops into a template blank.
  - id: Chip ID, unique within the challenge; `solution` refers to it.
  - text: Word or phrase shown on the chip.

## Presentation beats

`title`, then `c1`, `c1.step1`, `c1.step2`, …, `c1.solved`, `c2`, … per challenge: the prompt, then each blank filled with its chip in reading order, one per step, then the sentence confirmed with its explanation
