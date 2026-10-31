# scenario

Consequences across decisions. What happens if I choose this, then make another decision? Explore authored paths and outcomes.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

Scenario(title: string, id: string, nodes: ScenarioNode[], intro?: string, startNode?: string, displayTitle?: string, heading?: string, lead?: Lead) — Branching "what would you do?" scenario. `startNode` defaults to "start". `displayTitle` overrides the title shown inside the scenario.
  - title: Section title, shown in the topic outline and as the section header.
  - id: Scenario ID, unique within the topic.
  - nodes: All nodes, as ScenarioNode references.
  - intro: Optional setup text shown before the first node.
  - startNode: Optional ID of the first node (default "start").
  - displayTitle: Optional title shown inside the scenario instead of `title`.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
ScenarioNode(id: string, prompt?: string, choices?: ScenarioChoice[], outcome?: Outcome) — A scenario node: a prompt with choices, or an outcome.
  - id: Node ID, unique within the scenario; choices point at it with `next`.
  - prompt: Situation and question shown at this node (prompt nodes).
  - choices: Options, as ScenarioChoice references (prompt nodes).
  - outcome: Outcome(...) ending (outcome nodes, instead of prompt/choices).
ScenarioChoice(id: string, text: string, next: string) — A choice in a scenario. `next` is the ID of the node it leads to.
  - id: Choice ID, unique within its node.
  - text: Choice text shown on the button.
  - next: ID of the ScenarioNode this choice leads to.
Outcome(verdict: string, lesson: string, rating: "a" | "b-plus" | "b-minus" | "c") — End of a scenario path: verdict, lesson, and rating ("a", "b-plus", "b-minus" or "c").
  - verdict: Short judgement of the path taken (e.g. "Solid call").
  - lesson: What the learner should take away.
  - rating: Grade of the path: "a", "b-plus", "b-minus" or "c".

## Presentation beats

`title`, then `start`; then one path per ending (weaker endings first, the best last): along path P, `pathP.choice1` (the choice picked on its card), `pathP.choice1.next` (where it leads), `pathP.choice2`, … (the last `.next` shows its ending); a later path starts at the fork where it leaves the one before
