## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

TemplateChallenge(prompt: string, template: string, chips: Chip[], solution: Record<string, string>, explanation?: string) — Fill-in-the-blanks self-explanation. `template` contains {zone-id} slots; `solution` maps each zone ID to a chip ID, e.g. {"zone-1": "chip-a"}.
  - prompt: Instruction shown above the template.
  - template: Sentence with {zone-id} blanks, e.g. "A cache trades {zone-1} for {zone-2}."
  - chips: Chips the learner can drop into blanks, as Chip references (may include distractors).
  - solution: Correct chip per blank: an object of zone ID → chip ID, e.g. {"zone-1": "chip-a"}.
  - explanation: Optional explanation shown once the template is solved.
Chip(id: string, text: string) — A word chip the learner drops into a template blank.
  - id: Chip ID, unique within the challenge; `solution` refers to it.
  - text: Word or phrase shown on the chip.

### TemplateChallenge: teaching purpose

- Introduce: Define the TemplateChallenge content or configuration consumed by its owning component.
- Explore: Inspect it through the owning component and its documented behavior.
- Evidence: A supporting data declaration does not independently provide learning evidence.
- Limits: Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
