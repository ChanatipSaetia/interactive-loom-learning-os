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

// --- AbstractFlow Raw Step & Journey Schemas ---

export const FlowchartResultEventSchema = z.object({
  id: z.string().min(1, { message: 'Result event must have a non-empty id.' }),
  title: z.string().min(1, { message: 'Result event must have a non-empty title.' }),
  desc: z.string().optional(),
  enters: z.string().optional(),
  data: z.string().optional(),
})

export const FlowchartRawLinearStepSchema = z.object({
  id: z.string().min(1, { message: 'Step id cannot be empty.' }),
  type: z.literal('linear').optional(),
  initiatedBy: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  policy: z.string().optional(),
  command: z.string().optional(),
  handledBy: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  delegatesTo: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  // Optional: who receives the step's result (e.g. the server sends ServerHello to the client)
  sendsTo: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  resultEvents: z.array(FlowchartResultEventSchema).min(1, {
    message: 'Linear step must define at least one result event in resultEvents array.',
  }),
  continuesAs: z.string().optional(),
  description: z.string().optional(),
})

export const FlowchartRawBranchOptionSchema = z.object({
  id: z.string().min(1, { message: 'Branch option id cannot be empty.' }),
  label: z.string().optional(),
  dashed: z.boolean().optional(),
  initiatedBy: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  policy: z.string().optional(),
  command: z.string().optional(),
  handledBy: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  delegatesTo: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  // Optional: who receives the step's result (e.g. the server sends ServerHello to the client)
  sendsTo: z.union([z.string(), z.object({ id: z.string() })]).optional(),
  resultEvents: z.array(FlowchartResultEventSchema).min(1, {
    message: 'Branch option step must define at least one result event in resultEvents array.',
  }),
  continuesAs: z.string().optional(),
  description: z.string().optional(),
})

export const FlowchartRawBranchStepSchema = z.object({
  id: z.string().min(1, { message: 'Branch step id cannot be empty.' }),
  type: z.literal('branch'),
  event: z.string().min(1, { message: 'Branch step event cannot be empty.' }),
  branches: z.array(FlowchartRawBranchOptionSchema).min(1, {
    message: 'Branch step must define at least one branch option.',
  }),
})

export const FlowchartRawStepSchema = z.union([
  FlowchartRawBranchStepSchema,
  FlowchartRawLinearStepSchema,
])

export const FlowchartRawJourneyStepRefSchema = z.object({
  stepId: z.string().min(1, { message: 'Journey step reference must define a non-empty stepId.' }),
  name: z.string().min(1, { message: 'Journey step name cannot be empty.' }),
  description: z.string().min(1, { message: 'Journey step description cannot be empty.' }),
  processGroup: z.string().optional(),
})

export const FlowchartRawJourneySchema = z.object({
  id: z.string().min(1, { message: 'Journey must define a non-empty id.' }),
  label: z.string().min(1, { message: 'Journey must define a non-empty label.' }),
  description: z.string().min(1, { message: 'Journey description cannot be empty.' }),
  steps: z.array(FlowchartRawJourneyStepRefSchema).min(1, {
    message: 'Journey must define at least 1 journey step in steps array.',
  }),
})

export const FlowchartSectionSchema = z.object({
  type: z.literal('flowchart').optional(),
  entities: z.record(z.string(), FlowchartEntitySchema).optional(),
  relations: z.array(FlowchartRelationSchema).optional(),
  views: z.record(z.string(), FlowchartViewConfigSchema).optional(),
  journeys: z.array(FlowchartRawJourneySchema).optional(),
  steps: z.array(FlowchartRawStepSchema).optional(),
  flow: z.object({
    actors: z.unknown().optional(),
    systems: z.unknown().optional(),
    steps: z.union([
      z.array(FlowchartRawStepSchema).min(1, { message: 'Flowchart steps array cannot be empty.' }),
      z.object({ steps: z.array(FlowchartRawStepSchema).min(1, { message: 'Flowchart steps array cannot be empty.' }) }),
    ]).optional(),
    journeys: z.union([
      z.array(FlowchartRawJourneySchema).min(1, { message: 'Flowchart journeys array cannot be empty.' }),
      z.object({ journeys: z.array(FlowchartRawJourneySchema).min(1, { message: 'Flowchart journeys array cannot be empty.' }) }),
    ]).optional(),
  }).optional(),
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
  id: z.string().optional(),
  text: z.string().optional(),
  label: z.string().optional(),
  next: z.string().optional(),
  nextNode: z.string().optional(),
})

export const ScenarioNodeSchema = z.object({
  id: z.string().optional(),
  prompt: z.string().optional(),
  text: z.string().optional(),
  choices: z.array(ScenarioChoiceSchema).optional(),
  outcome: ScenarioOutcomeSchema.optional(),
})

export const ScenarioSectionSchema = z.object({
  type: z.literal('scenario').optional(),
  id: z.string(),
  title: z.string(),
  intro: z.string().optional(),
  nodes: z.record(z.string(), ScenarioNodeSchema),
  startNode: z.string().optional(),
  initialNode: z.string().optional(),
})

export type ScenarioSectionData = z.infer<typeof ScenarioSectionSchema>
export type ScenarioNode = z.infer<typeof ScenarioNodeSchema>
export type ScenarioChoice = z.infer<typeof ScenarioChoiceSchema>
export type ScenarioOutcome = z.infer<typeof ScenarioOutcomeSchema>
