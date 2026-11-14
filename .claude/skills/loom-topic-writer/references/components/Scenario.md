## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main visual/activity plus supporting text. Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

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
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.
ScenarioChoice(id: string, text: string, next: string) — A choice in a scenario. `next` is the ID of the node it leads to.
  - id: Choice ID, unique within its node.
  - text: Choice text shown on the button.
  - next: ID of the ScenarioNode this choice leads to.
Outcome(verdict: string, lesson: string, rating: "a" | "b-plus" | "b-minus" | "c") — End of a scenario path: verdict, lesson, and rating ("a", "b-plus", "b-minus" or "c").
  - verdict: Short judgement of the path taken (e.g. "Solid call").
  - lesson: What the learner should take away.
  - rating: Grade of the path: "a", "b-plus", "b-minus" or "c".

### Scenario: teaching purpose

- Introduce: Teach through a concrete situation, decisions, consequences and feedback; a scenario can introduce and explain a concept rather than only test it afterward.
- Explore: Explore authored paths and compare how choices affect outcomes and the lesson each outcome illustrates.
- Evidence: Separate exploration from assessment. Outcome ratings are authored judgments, not independently verified real-world performance. Present demonstrates authored content with separate state; demonstrated answers are not learner attempts.
- Limits: Explain assumptions and keep consequences plausible and source-supported or labelled illustrative. A branching story is not a simulation of every possible outcome.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### Scenario presentation beats
`title`, then `start`; then one path per ending (weaker endings first, the best last): along path P, `pathP.choice1` (the choice picked on its card), `pathP.choice1.next` (where it leads), `pathP.choice2`, … (the last `.next` shows its ending); a later path starts at the fork where it leaves the one before
