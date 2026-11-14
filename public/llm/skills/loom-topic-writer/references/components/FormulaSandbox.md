## Focused component contracts

Page rules: root = Page("Title", body, heading?). One section file is one authored page; choose components, not a section type or library. Use one main learner action with complementary cards, images, text, charts and reference links where useful; these compose one page, not separate content modes. Proactively include visual examples for visual subjects and visible sources for researched claims. See contracts/media-composition.md (installed skills: references/planning/media-composition.md). Local controls and their visual form one activity. Multiple competing activities produce review warnings, not a component-count rejection. Size the topic to the learner goal. Generic children are alternatives, not mandatory dependencies. Use exact positional signatures; request actual child components and required data models. TextContent handles Markdown prose; Text is a short line or metric. Choose ImageGallery for a preview grid or LearningGallery for captioned learning scenes. All components share one catalog; prebuilt activities are reusable compositions, not a separate authoring mode. Query/Mutation host tools are deferred. Local reactive $variables, input bindings and Set/Reset actions are allowed. Do not use actions unsupported by the host. Include useful learner-visible reference links for deeper reading, with descriptive labels and supplied or checked destinations; keep the core lesson self-contained. See contracts/learner-references.md (installed skills: references/core/learner-references.md). Before adding image sources, read contracts/images.md and runtime.md (installed skills: references/core/images.md); a reachable HTTPS URL may still be blocked by the MCP host. Use supplied/verified chart data or label illustrative values; never invent benchmarks. Present is hands-free, may use internal scenes/beats, and may render differently from Read using the same content. Demonstrations use authored defaults and never count as learner attempts. Narration is authored in OUI; preserve statement IDs and validate beat/target references. Preview narrow and desktop Read/Present layouts.

## Component Signatures

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
Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.

### FormulaSandbox: teaching purpose

- Introduce: Teach an authored input/output relationship through predictions and experiments, including first explanations of a formula.
- Explore: Vary meaningful inputs and interpret outputs, ranges and sensitivity. Explain why the formula responds as it does.
- Evidence: Changing a slider alone is engagement. Ask for a prediction, explanation or calculation if evidence is needed. Present demonstrates authored content with separate state; demonstrated answers are not learner attempts.
- Limits: State the formula, units, assumptions and valid domain. The sandbox evaluates an authored model, not the real external system; do not present invented scores or correlations as causal measurements.

## Narration Files

Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.

### FormulaSandbox presentation beats
`title`, then `formulas`, then `sweep1`, `sweep2`, … one per variable that can move (it sweeps from its min to its max while the trend of each metric is stated)
