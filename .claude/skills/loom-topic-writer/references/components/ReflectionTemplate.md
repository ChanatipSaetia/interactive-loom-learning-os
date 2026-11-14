## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

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
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.
Chip(id: string, text: string) — A word chip the learner drops into a template blank.
  - id: Chip ID, unique within the challenge; `solution` refers to it.
  - text: Word or phrase shown on the chip.

### ReflectionTemplate: teaching purpose

- Introduce: Scaffold a coherent explanation using supplied concepts and sentence blanks, making relationships and reasoning visible.
- Explore: Complete an explanation with authored chips, inspect feedback and articulate the resulting reasoning.
- Evidence: A checked completion supplies evidence for this constrained exercise, which is narrower than independently producing an explanation. Present demonstrates authored content with separate state; demonstrated answers are not learner attempts.
- Limits: Ground the template and solution in taught concepts. Preserve documented zones and chip references; do not claim automatic grading of arbitrary free-text reasoning.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### ReflectionTemplate presentation beats
`title`, then `c1`, `c1.step1`, `c1.step2`, …, `c1.solved`, `c2`, … per challenge: the prompt, then each blank filled with its chip in reading order, one per step, then the sentence confirmed with its explanation
