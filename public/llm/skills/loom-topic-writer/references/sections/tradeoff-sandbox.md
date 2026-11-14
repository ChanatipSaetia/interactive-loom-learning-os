# tradeoff-sandbox

Presenting options, comparing alternatives and trade-offs. What are my options and how do they differ across shared criteria? Explain strengths, limitations and consequences even without a decision request. Contextual suitability and recommendations are optional; no scoring or mathematical optimisation is required.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

TradeoffSandbox(title: string, scenarios: TradeoffScenario[], heading?: string, lead?: Lead) — Explained comparison of alternatives across shared criteria, strengths, limitations and consequences. Use for comparison even without a decision request; contextual situations and recommendations are optional. Qualitative comparisons use empty metrics; avoid invented scores or a universal winner.
  - title: Section title, shown in the topic outline and as the section header.
  - scenarios: The scenarios, as TradeoffScenario references.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
ProCon(title: string, description?: string) — A pro or con of a trade-off choice.
  - title: Short pro or con statement.
  - description: Optional detail behind the statement.
TradeoffChoice(id: string, label: string, description: string, metrics: Record<string, number>, pros: ProCon[], cons: ProCon[], whyThisFits?: string, whenToUse?: string) — One option in a trade-off step. `metrics` maps metric IDs to the delta this choice applies, e.g. {performance: 10, cost: -5}.
  - id: Choice ID, unique within the step; `recommended` refers to it.
  - label: Option name shown on the choice card.
  - description: What picking this option means.
  - metrics: Delta per metric ID when picked; use {} for a qualitative comparison without scores.
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
TradeoffScenario(id: string, title: string, metrics: TradeoffMetric[], steps: TradeoffStep[], description?: string) — A general comparison container or a contextual situation, with comparison criteria or decisions to explore.
  - id: Scenario ID, unique within the sandbox.
  - title: Scenario name shown in the scenario picker.
  - metrics: Metrics to watch, as TradeoffMetric references; use [] for a qualitative comparison.
  - steps: Comparison criteria or decisions in order, as TradeoffStep references.
  - description: Optional scenario summary.
TradeoffStep(id: string, title: string, choices: TradeoffChoice[], description?: string, recommended?: string) — One comparison criterion or decision point. Reuse alternatives across criteria; recommended is optional.
  - id: Step ID, unique within the scenario.
  - title: The shared comparison criterion or decision to explore at this step.
  - choices: The options, as TradeoffChoice references.
  - description: Optional explanation of the comparison criterion or decision context.
  - recommended: Optional ID of the recommended choice.

## Presentation beats

`title`, then `situation1`, `situation2`, … introduces each scenario by title and description before its steps; `step1`, `step2`, … one per step (numbered across scenarios), each followed by `stepN.choice1`, `stepN.choice2`, … (the gains and costs of each choice that has some, numbered in the step) and `stepN.recommended` as a separate recommendation scene (name, description and why it fits) when it has a recommended choice; then `result1`, `result2`, … one per scenario with a recommendation

TradeoffSandbox is a first-class comparison component, including when the learner only asks how alternatives differ. Table provides a compact factual overview; TradeoffSandbox supports an explained comparison across shared criteria, strengths, limitations and practical consequences. Choose by learning value, without requiring a winner or a fixed component mix.

For Svelte versus React, compare the same criteria for each option, such as reactivity, setup and ecosystem, and explain what each difference means in practice. Use a comparison step per useful criterion with the same alternatives; keep descriptions and pros/cons specific to that criterion. A project situation can follow if it adds a distinct learning contribution. Do not invent performance or productivity scores.

A qualitative comparison needs no scores, sliders, recommendation or multiple situations. With the current contract, use one TradeoffScenario as the comparison container, metrics: [] and choice metrics: {}; omit recommended, whyThisFits and whenToUse unless useful. These are existing positional fields, not new mode flags. Present guides the authored comparisons; Read supports exploration. Inspecting or selecting an option is engagement, not evidence of a justified decision.
