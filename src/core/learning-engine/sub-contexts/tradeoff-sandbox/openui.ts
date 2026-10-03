/**
 * OpenUI Lang vocabulary for the Trade-off & Parameter Exploration subdomain.
 *
 *   root = TradeoffSandbox("Architecture Trade-offs", [web])
 *   web = TradeoffScenario("web", "Enterprise Web App", [perf], [frontend])
 *   perf = TradeoffMetric("performance", "Performance", 50, 0, 100, "higher")
 */
import { z } from 'zod'
import { byId, defineOUIComponent, defineOUISection, sectionTailProps } from '../openui-kernel'
import type {
  DecisionTreeNode,
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
})

export const ProCon = defineOUIComponent({
  name: 'ProCon',
  description: 'A pro or con of a trade-off choice.',
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
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
})

export const TradeoffSandbox = defineOUISection({
  name: 'TradeoffSandbox',
  sectionType: 'tradeoff-sandbox',
  description: 'Interactive sandbox where learners make design choices and watch metrics move.',
  props: z.object({
    title: z.string(),
    scenarios: z.array(TradeoffScenario.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({ type: 'tradeoff-sandbox', scenarios: p.scenarios as unknown as TradeoffScenarioData[] }),
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
})

export const FormulaSandbox = defineOUISection({
  name: 'FormulaSandbox',
  sectionType: 'formula-sandbox',
  description: 'Parameter sandbox: sliders drive live formula-based metrics.',
  props: z.object({
    title: z.string(),
    variables: z.array(FormulaVariable.ref),
    metrics: z.array(FormulaMetric.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({
    type: 'formula-sandbox',
    variables: p.variables as unknown as FormulaVariableData[],
    metrics: p.metrics as unknown as FormulaMetricData[],
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
})

export const DecisionTree = defineOUISection({
  name: 'DecisionTree',
  sectionType: 'decision-tree',
  description: 'Interactive decision guide. `root` is the ID of the first node.',
  props: z.object({
    title: z.string(),
    id: z.string(),
    root: z.string(),
    nodes: z.array(DecisionNode.ref),
    ...sectionTailProps,
  }),
  toData: (p) => ({
    type: 'decision-tree',
    id: p.id,
    title: p.title,
    root: p.root,
    nodes: byId(p.nodes as unknown as DecisionTreeNode[]),
  }),
})

export const tradeoffSandboxOUIComponents = [
  TradeoffSandbox, TradeoffScenario, TradeoffStep, TradeoffChoice, TradeoffMetric, ProCon,
  FormulaSandbox, FormulaVariable, FormulaMetric,
  DecisionTree, DecisionNode, DecisionChoice, DecisionLeaf,
]
