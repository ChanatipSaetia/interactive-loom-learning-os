## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

DecisionNode(id: string, prompt?: string, choices?: DecisionChoice[], leaf?: DecisionLeaf) — A decision tree node: either a question with choices, or a leaf recommendation.
  - id: Node ID, unique within the tree; choices point at it with `next`.
  - prompt: Question asked at this node (question nodes).
  - choices: Answers, as DecisionChoice references (question nodes).
  - leaf: DecisionLeaf(...) recommendation (leaf nodes, instead of prompt/choices).
DecisionChoice(id: string, text: string, next: string, rationale?: string, recommended?: boolean) — An answer that moves to another decision node. `next` is the target node ID.
  - id: Choice ID, unique within its node.
  - text: Answer text shown on the button.
  - next: ID of the DecisionNode this answer leads to.
  - rationale: Optional reason for taking this branch.
  - recommended: Optional: true highlights this answer as recommended.
DecisionLeaf(recommendation: string, explanation: string, tradeoffs?: string[]) — Terminal recommendation of a decision tree.
  - recommendation: The recommended option at the end of this path.
  - explanation: Why this is recommended.
  - tradeoffs: Optional list of trade-offs to keep in mind.

### DecisionNode: teaching purpose

- Introduce: Define the DecisionNode content or configuration consumed by its owning component.
- Explore: Inspect it through the owning component and its documented behavior.
- Evidence: A supporting data declaration does not independently provide learning evidence.
- Limits: Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
