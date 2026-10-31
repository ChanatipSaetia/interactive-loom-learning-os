# formula-sandbox

Input–output relationships and sensitivity. How does changing an input change a calculated result? Let the learner vary inputs to an authored formula.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

FormulaSandbox(title: string, variables: FormulaVariable[], metrics: FormulaMetric[], heading?: string, lead?: Lead) — Parameter sandbox: sliders drive live formula-based metrics.
  - title: Section title, shown in the topic outline and as the section header.
  - variables: Slider inputs, as FormulaVariable references.
  - metrics: Computed outputs, as FormulaMetric references.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
FormulaVariable(id: string, label: string, min: number, max: number, step: number, defaultValue: number) — A slider input that formulas can reference by `id`.
  - id: Variable ID, used by name inside formulas (letters, digits, _).
  - label: Slider label.
  - min: Slider minimum.
  - max: Slider maximum.
  - step: Slider increment.
  - defaultValue: Initial slider value.
FormulaMetric(id: string, label: string, formula: string, description: string, analogy?: string, inScope?: string[], outOfScope?: string[]) — A computed metric. `formula` is an expression over variable IDs, e.g. "Math.round(chunk_size * (1 + overlap / 70))".
  - id: Metric ID, unique within the sandbox.
  - label: Metric name shown on its card.
  - formula: JavaScript expression over variable IDs, e.g. "Math.round(chunk_size * (1 + overlap / 70))".
  - description: What the metric measures.
  - analogy: Optional everyday analogy shown in the metric details.
  - inScope: Optional list of what the metric covers.
  - outOfScope: Optional list of what the metric does not cover.

## Presentation beats

`title`, then `formulas`, then `sweep1`, `sweep2`, … one per variable that can move (it sweeps from its min to its max while the trend of each metric is stated)
