## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

TradeoffScenario(id: string, title: string, metrics: TradeoffMetric[], steps: TradeoffStep[], description?: string) — A general comparison container or a contextual situation, with comparison criteria or decisions to explore.
  - id: Scenario ID, unique within the sandbox.
  - title: Scenario name shown in the scenario picker.
  - metrics: Metrics to watch, as TradeoffMetric references; use [] for a qualitative comparison.
  - steps: Comparison criteria or decisions in order, as TradeoffStep references.
  - description: Optional scenario summary.
TradeoffMetric(id: string, label: string, baseValue: number, min?: number, max?: number, direction?: "higher" | "lower") — A metric tracked across a trade-off scenario. `direction` says whether higher or lower is better.
  - id: Metric ID, unique within the scenario; choices refer to it in `metrics`.
  - label: Metric name shown on its bar (e.g. "Latency").
  - baseValue: Starting value before any choice is made.
  - min: Optional lowest value the bar shows (default 0).
  - max: Optional highest value the bar shows (default 100).
  - direction: Optional "higher" or "lower": which way is better.
TradeoffStep(id: string, title: string, choices: TradeoffChoice[], description?: string, recommended?: string) — One comparison criterion or decision point. Reuse alternatives across criteria; recommended is optional.
  - id: Step ID, unique within the scenario.
  - title: The shared comparison criterion or decision to explore at this step.
  - choices: The options, as TradeoffChoice references.
  - description: Optional explanation of the comparison criterion or decision context.
  - recommended: Optional ID of the recommended choice.
TradeoffChoice(id: string, label: string, description: string, metrics: Record<string, number>, pros: ProCon[], cons: ProCon[], whyThisFits?: string, whenToUse?: string) — One option in a trade-off step. `metrics` maps metric IDs to the delta this choice applies, e.g. {performance: 10, cost: -5}.
  - id: Choice ID, unique within the step; `recommended` refers to it.
  - label: Option name shown on the choice card.
  - description: What picking this option means.
  - metrics: Delta per metric ID when picked; use {} for a qualitative comparison without scores.
  - pros: Advantages, as ProCon references.
  - cons: Drawbacks, as ProCon references.
  - whyThisFits: Optional reason this option fits the scenario.
  - whenToUse: Optional guidance on when to choose this option in practice.
ProCon(title: string, description?: string) — A pro or con of a trade-off choice.
  - title: Short pro or con statement.
  - description: Optional detail behind the statement.

### TradeoffScenario: teaching purpose

- Introduce: Define the TradeoffScenario content or configuration consumed by its owning component.
- Explore: Inspect it through the owning component and its documented behavior.
- Evidence: A supporting data declaration does not independently provide learning evidence.
- Limits: Use the exact required fields and references. This supporting contract does not imply an independently rendered activity, interaction, grading or persistence.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.
