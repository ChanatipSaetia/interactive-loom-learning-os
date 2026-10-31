# tradeoff-sandbox

Presenting options, comparing alternatives and trade-offs. What are my options, how do they compare, and when should I choose each? Show strengths, limitations, gains, costs and suitability; a recommendation can explain why an option fits. Use this for option comparison even without formal mathematical optimisation.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

TradeoffSandbox(title: string, scenarios: TradeoffScenario[], heading?: string, lead?: Lead) — Interactive sandbox where learners make design choices and watch metrics move.
  - title: Section title, shown in the topic outline and as the section header.
  - scenarios: The scenarios, as TradeoffScenario references.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
TradeoffScenario(id: string, title: string, metrics: TradeoffMetric[], steps: TradeoffStep[], description?: string) — A trade-off scenario: metrics to watch and the sequence of decisions to make.
  - id: Scenario ID, unique within the sandbox.
  - title: Scenario name shown in the scenario picker.
  - metrics: Metrics to watch, as TradeoffMetric references.
  - steps: Decisions in order, as TradeoffStep references.
  - description: Optional scenario summary.
TradeoffStep(id: string, title: string, choices: TradeoffChoice[], description?: string, recommended?: string) — A decision point in a trade-off scenario. `recommended` is the ID of the recommended choice.
  - id: Step ID, unique within the scenario.
  - title: The decision to make at this step.
  - choices: The options, as TradeoffChoice references.
  - description: Optional context for the decision.
  - recommended: Optional ID of the recommended choice.
TradeoffChoice(id: string, label: string, description: string, metrics: Record<string, number>, pros: ProCon[], cons: ProCon[], whyThisFits?: string, whenToUse?: string) — One option in a trade-off step. `metrics` maps metric IDs to the delta this choice applies, e.g. {performance: 10, cost: -5}.
  - id: Choice ID, unique within the step; `recommended` refers to it.
  - label: Option name shown on the choice card.
  - description: What picking this option means.
  - metrics: Delta per metric ID when picked, e.g. {performance: 10, cost: -5}.
  - pros: Advantages, as ProCon references.
  - cons: Drawbacks, as ProCon references.
  - whyThisFits: Optional reason this option fits the scenario.
  - whenToUse: Optional guidance on when to choose this option in practice.
TradeoffMetric(id: string, label: string, baseValue: number, min?: number, max?: number, direction?: "higher" | "lower") — A metric tracked across a trade-off scenario. `direction` says whether higher or lower is better.
  - id: Metric ID, unique within the scenario; choices refer to it in `metrics`.
  - label: Metric name shown on its bar (e.g. "Latency").
  - baseValue: Starting value before any choice is made.
  - min: Optional lowest value the bar shows (default 0).
  - max: Optional highest value the bar shows (default 100).
  - direction: Optional "higher" or "lower": which way is better.
ProCon(title: string, description?: string) — A pro or con of a trade-off choice.
  - title: Short pro or con statement.
  - description: Optional detail behind the statement.

## Presentation beats

`title`, then `situation1`, `situation2`, … introduces each scenario by title and description before its steps; `step1`, `step2`, … one per step (numbered across scenarios), each followed by `stepN.choice1`, `stepN.choice2`, … (the gains and costs of each choice that has some, numbered in the step) and `stepN.recommended` as a separate recommendation scene (name, description and why it fits) when it has a recommended choice; then `result1`, `result2`, … one per scenario with a recommendation
