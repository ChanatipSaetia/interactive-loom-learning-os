# decision-tree

Rule-based diagnosis and selection. Which option fits my situation after answering a sequence of questions?

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

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

## Presentation beats

`title`, then `start` (the first question), then per answer taken (the recommended choice, else the first) `answer1` (picked on its question, with its rationale), `q2` (the next question), `answer2`, …, then `result` (the recommendation)
