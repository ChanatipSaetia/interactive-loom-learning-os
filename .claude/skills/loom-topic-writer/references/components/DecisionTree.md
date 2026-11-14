## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

DecisionTree(title: string, id: string, root: string, nodes: DecisionNode[], displayTitle?: string, heading?: string, lead?: Lead) — Interactive decision guide. `root` is the ID of the first node. `displayTitle` overrides the title shown inside the guide.
  - title: Section title, shown in the topic outline and as the section header.
  - id: Tree ID, unique within the topic.
  - root: ID of the first DecisionNode.
  - nodes: All nodes, as DecisionNode references.
  - displayTitle: Optional title shown inside the guide instead of `title`.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
DecisionNode(id: string, prompt?: string, choices?: DecisionChoice[], leaf?: DecisionLeaf) — A decision tree node: either a question with choices, or a leaf recommendation.
  - id: Node ID, unique within the tree; choices point at it with `next`.
  - prompt: Question asked at this node (question nodes).
  - choices: Answers, as DecisionChoice references (question nodes).
  - leaf: DecisionLeaf(...) recommendation (leaf nodes, instead of prompt/choices).
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.
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

### DecisionTree: teaching purpose

- Introduce: Teach explicit criteria and reasoning behind diagnosis, identification or selection, as well as guiding a decision.
- Explore: Follow authored questions and compare paths, explanations and leaf recommendations.
- Evidence: Reaching a leaf is not proof of diagnostic skill or a verified recommendation. Ask the learner to explain the relevant rule when needed.
- Limits: Branches must represent defensible explicit rules and reachable outcomes. Preserve the existing question/leaf contract; a diagnostic guide does not establish an empirical probability or universal best choice.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### DecisionTree presentation beats
`title`, then `start` (the first question), then per answer taken (the recommended choice, else the first) `answer1` (picked on its question, with its rationale), `q2` (the next question), `answer2`, …, then `result` (the recommendation)
