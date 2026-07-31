import { z } from 'zod'

// --- Tradeoff Sandbox Section Schema ---

export const TradeoffMetricDefSchema = z.object({
  id: z.string(),
  label: z.string(),
  baseValue: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
  direction: z.enum(['higher', 'lower']).optional(),
})

export const TradeoffProConSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
})

export const TradeoffChoiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  metrics: z.record(z.string(), z.number()),
  pros: z.array(TradeoffProConSchema),
  cons: z.array(TradeoffProConSchema),
  whyThisFits: z.string().optional(),
  whenToUse: z.string().optional(),
})

export const TradeoffStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  choices: z.array(TradeoffChoiceSchema),
  recommended: z.string().optional(),
})

export const TradeoffScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  metrics: z.array(TradeoffMetricDefSchema),
  steps: z.array(TradeoffStepSchema),
})

export const TradeoffSandboxSectionSchema = z.object({
  type: z.literal('tradeoff-sandbox'),
  scenarios: z.array(TradeoffScenarioSchema),
})

export type TradeoffSandboxSectionData = z.infer<typeof TradeoffSandboxSectionSchema>
export type TradeoffMetricDef = z.infer<typeof TradeoffMetricDefSchema>
export type TradeoffProCon = z.infer<typeof TradeoffProConSchema>
export type TradeoffChoice = z.infer<typeof TradeoffChoiceSchema>
export type TradeoffStep = z.infer<typeof TradeoffStepSchema>
export type TradeoffScenario = z.infer<typeof TradeoffScenarioSchema>

// --- Formula Sandbox Section Schema ---

export const FormulaVariableSchema = z.object({
  id: z.string(),
  label: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number(),
  defaultValue: z.number(),
})

export const FormulaMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  formula: z.string(),
  description: z.string(),
  analogy: z.string().optional(),
  inScope: z.array(z.string()).optional(),
  outOfScope: z.array(z.string()).optional(),
})

export const FormulaSandboxSectionSchema = z.object({
  type: z.literal('formula-sandbox'),
  variables: z.array(FormulaVariableSchema),
  metrics: z.array(FormulaMetricSchema),
})

export type FormulaSandboxSectionData = z.infer<typeof FormulaSandboxSectionSchema>
export type FormulaVariable = z.infer<typeof FormulaVariableSchema>
export type FormulaMetric = z.infer<typeof FormulaMetricSchema>

// --- Decision Tree Section Schema ---

export const DecisionTreeLeafSchema = z.object({
  recommendation: z.string(),
  explanation: z.string(),
  tradeoffs: z.array(z.string()).optional(),
})

export const DecisionTreeChoiceSchema = z.object({
  id: z.string().optional(),
  text: z.string().optional(),
  label: z.string().optional(),
  next: z.string().optional(),
  target: z.string().optional(),
  rationale: z.string().optional(),
  recommended: z.boolean().optional(),
})

export const DecisionTreeNodeSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().optional(),
  text: z.string().optional(),
  title: z.string().optional(),
  choices: z.array(DecisionTreeChoiceSchema).optional(),
  options: z.array(DecisionTreeChoiceSchema).optional(),
  leaf: DecisionTreeLeafSchema.optional(),
  recommendation: z.string().optional(),
})

export const DecisionTreeSectionSchema = z.object({
  type: z.literal('decision-tree').optional(),
  id: z.string(),
  title: z.string(),
  root: z.string(),
  nodes: z.record(z.string(), DecisionTreeNodeSchema),
})

export type DecisionTreeSectionData = z.infer<typeof DecisionTreeSectionSchema>
export type DecisionTreeNode = z.infer<typeof DecisionTreeNodeSchema>
export type DecisionTreeChoice = z.infer<typeof DecisionTreeChoiceSchema>
export type DecisionTreeLeaf = z.infer<typeof DecisionTreeLeafSchema>
