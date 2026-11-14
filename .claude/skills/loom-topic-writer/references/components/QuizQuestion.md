## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

QuizQuestion(id: string, question: string, choices: QuizChoice[], hint?: string) — A multiple-choice question. Mark exactly one choice as correct.
  - id: Question ID, unique within the quiz.
  - question: The question text.
  - choices: Answer options, as QuizChoice references. Exactly one is correct.
  - hint: Optional hint the learner can reveal before answering.
QuizChoice(id: string, text: string, correct: boolean, explanation: string) — One answer option of a quiz question, with the explanation shown after answering.
  - id: Choice ID, unique within its question (e.g. "a").
  - text: Answer text shown on the option button.
  - correct: true for the one correct choice of the question.
  - explanation: Feedback shown after this choice is picked: why it is right or wrong.

### QuizQuestion: teaching purpose

- Introduce: Define the QuizQuestion content or configuration consumed by its owning component.
- Explore: Inspect it through the owning component and its documented behavior.
- Evidence: A supporting data declaration does not independently provide learning evidence.
- Limits: Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
