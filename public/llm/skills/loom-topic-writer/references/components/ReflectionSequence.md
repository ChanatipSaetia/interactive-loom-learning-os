## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

ReflectionSequence(title: string, challenges: SequenceChallenge[], heading?: string, lead?: Lead) — Sequence-builder reflection: learners put steps in the right order.
  - title: Section title, shown in the topic outline and as the section header.
  - challenges: The challenges, as SequenceChallenge references, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
SequenceChallenge(prompt: string, items: SequenceItem[], solution: (string | SequenceItem)[]) — Ask the learner to order items. `solution` lists the items (references or IDs) in the correct order.
  - prompt: Instruction shown above the items, e.g. "Put the steps in order".
  - items: The items to order, as SequenceItem references, in the order they are first shown (not the solution order).
  - solution: The same items (references or IDs) in the correct order.
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.
SequenceItem(id: string, text: string, icon?: string) — A draggable item in a sequence challenge.
  - id: Item ID, unique within the challenge; `solution` refers to it.
  - text: Text shown on the draggable card.
  - icon: Optional icon name (reserved; not shown yet).

### ReflectionSequence: teaching purpose

- Introduce: Make meaningful order and dependencies explicit by reconstructing an already-taught sequence.
- Explore: Arrange supplied steps and check the authored order, then explain why that order matters.
- Evidence: Explicit checked attempts concern this sequence; dragging alone is engagement. Present demonstrates authored content with separate state; demonstrated answers are not learner attempts.
- Limits: Use a defensible order and teach the procedure first. Do not force one arbitrary ordering when several are valid, or infer general procedural skill from one solved puzzle.

For a procedure, ask whether the learner needs to execute instructions, understand their structure, or practise their order. Steps, Bullets and Flowchart are peer candidates: Steps guides instructions with explanations or code, Bullets supports concise checklists and prerequisites, and Flowchart explains sequence, dependencies, branches, responsibilities and consequences. A linear procedure can justify Flowchart when the connections help explain it; branching or multiple participants are not selection prerequisites. The existing Flowchart contract still applies: model only supported participants, events and relationships; never invent actors or events just to use it.

For creating a Svelte app, Steps can guide installation, project creation and running commands; Flowchart can explain the edit-to-browser-update process. ReflectionSequence can optionally assess reconstructing a taught order. These serve distinct learning needs, not a mandatory sequence or component mix. Present demonstrations and checklist clicks do not prove procedural skill.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### ReflectionSequence presentation beats
`title`, then `c1`, `c1.step1`, `c1.step2`, …, `c1.solved`, `c2`, … per challenge: the prompt, then each item placed in its slot in the right order, one per step, then the order confirmed
