import { z } from 'zod'

// --- Flowchart Section Schema ---

export const FlowchartStateMachineStateSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
})

export const FlowchartStateMachineSchema = z.object({
  states: z.array(FlowchartStateMachineStateSchema),
  initialState: z.string(),
})

export const FlowchartEntitySchema = z.object({
  title: z.string(),
  viewTitles: z.record(z.string(), z.string()).optional(),
  desc: z.string(),
  type: z.string().optional(),
  viewTypes: z.record(z.string(), z.string()).optional(),
  jsonPayload: z.record(z.string(), z.unknown()).optional(),
  color: z.string().optional(),
  strokeColor: z.string().optional(),
  stateMachine: FlowchartStateMachineSchema.optional(),
  branchLabel: z.string().optional(),
  collapsedTo: z.string().optional(),
  root: z.boolean().optional(),
})

export const FlowchartRelationSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  views: z.array(z.string()).optional(),
  dashed: z.boolean().optional(),
  handledBy: z.boolean().optional(),
  label: z.string().optional(),
  chronologicalIndex: z.number().optional(),
})

export const FlowchartViewNodeSchema = z.object({
  id: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  grid: z.tuple([z.number(), z.number()]).optional(),
  root: z.boolean().optional(),
})

export const FlowchartViewGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  desc: z.string().optional(),
  nodeIds: z.array(z.string()).optional(),
  color: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  isLane: z.boolean().optional(),
  row: z.number().optional(),
  rowSpan: z.number().optional(),
  y: z.number().optional(),
  h: z.number().optional(),
})

export const FlowchartStepSchema = z.object({
  nodeIds: z.array(z.string()),
  title: z.string(),
  reason: z.string(),
  processGroup: z.enum(['planning', 'execution', 'evaluation', 'escalation']).optional(),
})

export const FlowchartStepLinearSchema = z.object({
  id: z.string(),
  type: z.literal('linear'),
  nodeIds: z.array(z.string()).optional(),
  title: z.string(),
  reason: z.string(),
})

export const FlowchartStepBranchOptionSchema = z.object({
  id: z.string(),
  type: z.string(),
  nodeIds: z.array(z.string()).optional(),
  title: z.string(),
  reason: z.string(),
})

export const FlowchartStepBranchSchema = z.object({
  id: z.string(),
  type: z.literal('branch'),
  branches: z.array(FlowchartStepBranchOptionSchema),
})

export const FlowchartStepDataSchema = z.union([
  FlowchartStepLinearSchema,
  FlowchartStepBranchSchema,
])

export const FlowchartJourneySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  steps: z.array(FlowchartStepSchema),
})

export const LayoutInfoSchema = z.object({
  rowCount: z.number(),
  colCount: z.number(),
  nodeCount: z.number(),
})

export const FlowchartViewConfigSchema = z.object({
  name: z.string(),
  icon: z.string(),
  nodes: z.array(FlowchartViewNodeSchema),
  groups: z.array(FlowchartViewGroupSchema),
  steps: z.array(FlowchartStepDataSchema).optional(),
  layoutInfo: LayoutInfoSchema.optional(),
})

export const FlowchartSectionSchema = z.object({
  entities: z.record(z.string(), FlowchartEntitySchema),
  relations: z.array(FlowchartRelationSchema),
  views: z.record(z.string(), FlowchartViewConfigSchema).optional(),
  journeys: z.array(FlowchartJourneySchema),
})

export type FlowchartSectionData = z.infer<typeof FlowchartSectionSchema>

// --- Scenario Section Schema ---

export const ScenarioRatingSchema = z.enum(['a', 'b-plus', 'b-minus', 'c'])

export const ScenarioOutcomeSchema = z.object({
  verdict: z.string(),
  lesson: z.string(),
  rating: ScenarioRatingSchema,
})

export const ScenarioChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  next: z.string(),
})

export const ScenarioNodeSchema = z.object({
  id: z.string(),
  prompt: z.string().optional(),
  choices: z.array(ScenarioChoiceSchema).optional(),
  outcome: ScenarioOutcomeSchema.optional(),
})

export const ScenarioSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  intro: z.string(),
  nodes: z.record(z.string(), ScenarioNodeSchema),
  startNode: z.string(),
})

export type ScenarioSectionData = z.infer<typeof ScenarioSectionSchema>
