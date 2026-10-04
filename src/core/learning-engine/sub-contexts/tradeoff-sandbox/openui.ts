/**
 * OpenUI Lang vocabulary for the Trade-off & Parameter Exploration subdomain.
 *
 *   root = TradeoffSandbox("Architecture Trade-offs", [web])
 *   web = TradeoffScenario("web", "Enterprise Web App", [perf], [frontend])
 *   perf = TradeoffMetric("performance", "Performance", 50, 0, 100, "higher")
 */
import { z } from 'zod'
import { byId, call, defineOUIComponent, defineOUISection, sectionFields, sectionTail, sectionTailProps, type LoomOUIComponent } from '../openui-kernel'
import type {
  DecisionTreeNode,
  DecisionTreeSectionData,
  FormulaSandboxSectionData,
  TradeoffSandboxSectionData,
  FormulaMetric as FormulaMetricData,
  FormulaVariable as FormulaVariableData,
  TradeoffScenario as TradeoffScenarioData,
} from './schema'

// --- Tradeoff Sandbox ---

export const TradeoffMetric = defineOUIComponent({
  name: 'TradeoffMetric',
  description: 'A metric tracked across a trade-off scenario. `direction` says whether higher or lower is better.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    baseValue: z.number(),
    min: z.number().optional(),
    max: z.number().optional(),
    direction: z.enum(['higher', 'lower']).optional(),
  }),
  fields: {
    id: 'Metric ID, unique within the scenario; choices refer to it in `metrics`.',
    label: 'Metric name shown on its bar (e.g. "Latency").',
    baseValue: 'Starting value before any choice is made.',
    min: 'Optional lowest value the bar shows (default 0).',
    max: 'Optional highest value the bar shows (default 100).',
    direction: 'Optional "higher" or "lower": which way is better.',
  },
})

export const ProCon = defineOUIComponent({
  name: 'ProCon',
  description: 'A pro or con of a trade-off choice.',
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
  fields: {
    title: 'Short pro or con statement.',
    description: 'Optional detail behind the statement.',
  },
})

export const TradeoffChoice = defineOUIComponent({
  name: 'TradeoffChoice',
  description: 'One option in a trade-off step. `metrics` maps metric IDs to the delta this choice applies, e.g. {performance: 10, cost: -5}.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    metrics: z.record(z.string(), z.number()),
    pros: z.array(ProCon.ref),
    cons: z.array(ProCon.ref),
    whyThisFits: z.string().optional(),
    whenToUse: z.string().optional(),
  }),
  fields: {
    id: 'Choice ID, unique within the step; `recommended` refers to it.',
    label: 'Option name shown on the choice card.',
    description: 'What picking this option means.',
    metrics: 'Delta per metric ID when picked, e.g. {performance: 10, cost: -5}.',
    pros: 'Advantages, as ProCon references.',
    cons: 'Drawbacks, as ProCon references.',
    whyThisFits: 'Optional reason this option fits the scenario.',
    whenToUse: 'Optional guidance on when to choose this option in practice.',
  },
})

export const TradeoffStep = defineOUIComponent({
  name: 'TradeoffStep',
  description: 'A decision point in a trade-off scenario. `recommended` is the ID of the recommended choice.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    choices: z.array(TradeoffChoice.ref),
    description: z.string().optional(),
    recommended: z.string().optional(),
  }),
  fields: {
    id: 'Step ID, unique within the scenario.',
    title: 'The decision to make at this step.',
    choices: 'The options, as TradeoffChoice references.',
    description: 'Optional context for the decision.',
    recommended: 'Optional ID of the recommended choice.',
  },
})

export const TradeoffScenario = defineOUIComponent({
  name: 'TradeoffScenario',
  description: 'A trade-off scenario: metrics to watch and the sequence of decisions to make.',
  props: z.object({
    id: z.string(),
    title: z.string(),
    metrics: z.array(TradeoffMetric.ref),
    steps: z.array(TradeoffStep.ref),
    description: z.string().optional(),
  }),
  fields: {
    id: 'Scenario ID, unique within the sandbox.',
    title: 'Scenario name shown in the scenario picker.',
    metrics: 'Metrics to watch, as TradeoffMetric references.',
    steps: 'Decisions in order, as TradeoffStep references.',
    description: 'Optional scenario summary.',
  },
})

export const TradeoffSandbox: LoomOUIComponent = defineOUISection({
  name: 'TradeoffSandbox',
  sectionType: 'tradeoff-sandbox',
  description: 'Interactive sandbox where learners make design choices and watch metrics move.',
  props: z.object({
    title: z.string(),
    scenarios: z.array(TradeoffScenario.ref),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    scenarios: 'The scenarios, as TradeoffScenario references.',
  },
  toData: (p) => ({ type: 'tradeoff-sandbox', scenarios: p.scenarios as unknown as TradeoffScenarioData[] }),
  fromData: (data: TradeoffSandboxSectionData, meta) => call(TradeoffSandbox, {
    title: meta.title ?? '',
    scenarios: data.scenarios.map((sc) => call(TradeoffScenario, {
      id: sc.id,
      title: sc.title,
      metrics: sc.metrics.map((m) => call(TradeoffMetric, { id: m.id, label: m.label, baseValue: m.baseValue, min: m.min, max: m.max, direction: m.direction })),
      steps: sc.steps.map((st) => call(TradeoffStep, {
        id: st.id,
        title: st.title,
        choices: st.choices.map((c) => call(TradeoffChoice, {
          id: c.id,
          label: c.label,
          description: c.description,
          metrics: { ...c.metrics },
          pros: c.pros.map((pc) => call(ProCon, { title: pc.title, description: pc.description })),
          cons: c.cons.map((pc) => call(ProCon, { title: pc.title, description: pc.description })),
          whyThisFits: c.whyThisFits,
          whenToUse: c.whenToUse,
        }, c.id)),
        description: st.description,
        recommended: st.recommended,
      }, st.id)),
      description: sc.description,
    }, sc.id)),
    ...sectionTail(meta),
  }),
})

// --- Formula Sandbox ---

export const FormulaVariable = defineOUIComponent({
  name: 'FormulaVariable',
  description: 'A slider input that formulas can reference by `id`.',
  props: z.object({
    id: z.string(),
    label: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number(),
    defaultValue: z.number(),
  }),
  fields: {
    id: 'Variable ID, used by name inside formulas (letters, digits, _).',
    label: 'Slider label.',
    min: 'Slider minimum.',
    max: 'Slider maximum.',
    step: 'Slider increment.',
    defaultValue: 'Initial slider value.',
  },
})

export const FormulaMetric = defineOUIComponent({
  name: 'FormulaMetric',
  description: 'A computed metric. `formula` is an expression over variable IDs, e.g. "Math.round(chunk_size * (1 + overlap / 70))".',
  props: z.object({
    id: z.string(),
    label: z.string(),
    formula: z.string(),
    description: z.string(),
    analogy: z.string().optional(),
    inScope: z.array(z.string()).optional(),
    outOfScope: z.array(z.string()).optional(),
  }),
  fields: {
    id: 'Metric ID, unique within the sandbox.',
    label: 'Metric name shown on its card.',
    formula: 'JavaScript expression over variable IDs, e.g. "Math.round(chunk_size * (1 + overlap / 70))".',
    description: 'What the metric measures.',
    analogy: 'Optional everyday analogy shown in the metric details.',
    inScope: 'Optional list of what the metric covers.',
    outOfScope: 'Optional list of what the metric does not cover.',
  },
})

export const FormulaSandbox: LoomOUIComponent = defineOUISection({
  name: 'FormulaSandbox',
  sectionType: 'formula-sandbox',
  description: 'Parameter sandbox: sliders drive live formula-based metrics.',
  props: z.object({
    title: z.string(),
    variables: z.array(FormulaVariable.ref),
    metrics: z.array(FormulaMetric.ref),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    variables: 'Slider inputs, as FormulaVariable references.',
    metrics: 'Computed outputs, as FormulaMetric references.',
  },
  toData: (p) => ({
    type: 'formula-sandbox',
    variables: p.variables as unknown as FormulaVariableData[],
    metrics: p.metrics as unknown as FormulaMetricData[],
  }),
  fromData: (data: FormulaSandboxSectionData, meta) => call(FormulaSandbox, {
    title: meta.title ?? '',
    variables: data.variables.map((v) => call(FormulaVariable, { id: v.id, label: v.label, min: v.min, max: v.max, step: v.step, defaultValue: v.defaultValue })),
    metrics: data.metrics.map((m) => call(FormulaMetric, {
      id: m.id, label: m.label, formula: m.formula, description: m.description, analogy: m.analogy, inScope: m.inScope, outOfScope: m.outOfScope,
    }, m.id)),
    ...sectionTail(meta),
  }),
})

// --- Decision Tree ---

export const DecisionLeaf = defineOUIComponent({
  name: 'DecisionLeaf',
  description: 'Terminal recommendation of a decision tree.',
  props: z.object({
    recommendation: z.string(),
    explanation: z.string(),
    tradeoffs: z.array(z.string()).optional(),
  }),
  fields: {
    recommendation: 'The recommended option at the end of this path.',
    explanation: 'Why this is recommended.',
    tradeoffs: 'Optional list of trade-offs to keep in mind.',
  },
})

export const DecisionChoice = defineOUIComponent({
  name: 'DecisionChoice',
  description: 'An answer that moves to another decision node. `next` is the target node ID.',
  props: z.object({
    id: z.string(),
    text: z.string(),
    next: z.string(),
    rationale: z.string().optional(),
    recommended: z.boolean().optional(),
  }),
  fields: {
    id: 'Choice ID, unique within its node.',
    text: 'Answer text shown on the button.',
    next: 'ID of the DecisionNode this answer leads to.',
    rationale: 'Optional reason for taking this branch.',
    recommended: 'Optional: true highlights this answer as recommended.',
  },
})

export const DecisionNode = defineOUIComponent({
  name: 'DecisionNode',
  description: 'A decision tree node: either a question with choices, or a leaf recommendation.',
  props: z.object({
    id: z.string(),
    prompt: z.string().optional(),
    choices: z.array(DecisionChoice.ref).optional(),
    leaf: DecisionLeaf.ref.optional(),
  }),
  fields: {
    id: 'Node ID, unique within the tree; choices point at it with `next`.',
    prompt: 'Question asked at this node (question nodes).',
    choices: 'Answers, as DecisionChoice references (question nodes).',
    leaf: 'DecisionLeaf(...) recommendation (leaf nodes, instead of prompt/choices).',
  },
})

export const DecisionTree: LoomOUIComponent = defineOUISection({
  name: 'DecisionTree',
  sectionType: 'decision-tree',
  description: 'Interactive decision guide. `root` is the ID of the first node. `displayTitle` overrides the title shown inside the guide.',
  props: z.object({
    title: z.string(),
    id: z.string(),
    root: z.string(),
    nodes: z.array(DecisionNode.ref),
    displayTitle: z.string().optional(),
    ...sectionTailProps,
  }),
  fields: {
    ...sectionFields,
    id: 'Tree ID, unique within the topic.',
    root: 'ID of the first DecisionNode.',
    nodes: 'All nodes, as DecisionNode references.',
    displayTitle: 'Optional title shown inside the guide instead of `title`.',
  },
  toData: (p) => ({
    type: 'decision-tree',
    id: p.id,
    title: p.displayTitle ?? p.title,
    root: p.root,
    nodes: byId(p.nodes as unknown as DecisionTreeNode[]),
  }),
  fromData: (data: DecisionTreeSectionData, meta) => call(DecisionTree, {
    title: meta.title || data.title || '',
    displayTitle: data.title && data.title !== (meta.title || data.title) ? data.title : undefined,
    id: data.id,
    root: data.root,
    nodes: Object.entries(data.nodes).map(([id, n]) => call(DecisionNode, {
      id,
      prompt: n.prompt ?? n.text ?? n.title,
      choices: (n.choices ?? n.options)?.map((c) => call(DecisionChoice, {
        id: c.id ?? '',
        text: c.text ?? c.label ?? '',
        next: c.next ?? c.target ?? '',
        rationale: c.rationale,
        recommended: c.recommended,
      })),
      leaf: n.leaf ? call(DecisionLeaf, { recommendation: n.leaf.recommendation, explanation: n.leaf.explanation, tradeoffs: n.leaf.tradeoffs }) : undefined,
    }, id)),
    ...sectionTail(meta),
  }),
})

export const tradeoffSandboxOUIComponents = [
  TradeoffSandbox, TradeoffScenario, TradeoffStep, TradeoffChoice, TradeoffMetric, ProCon,
  FormulaSandbox, FormulaVariable, FormulaMetric,
  DecisionTree, DecisionNode, DecisionChoice, DecisionLeaf,
]
