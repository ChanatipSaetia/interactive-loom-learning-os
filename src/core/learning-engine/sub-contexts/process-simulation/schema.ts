import { z } from 'zod'
import { ref } from './model/types'
import type { ActorDecl, SystemDecl } from './model/types'

// --- Flowchart Section Schema ---
// Input: the four event-storming files assembled under `flow` (see layout.ts).
// Output: `{ type, flow: AbstractFlow }`. The output is valid input, so
// re-validating render-shaped data (e.g. from the editor) is idempotent.

export const FlowchartStateMachineStateSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(),
})

export const FlowchartStateMachineSchema = z.object({
  states: z.array(FlowchartStateMachineStateSchema),
  initialState: z.string(),
})

/** Actor/system reference: a bare ID in YAML, `{ _tag: 'ref', id }` once parsed. */
export const FlowchartRefSchema = z
  .union([z.string(), z.object({ id: z.string() })])
  .transform((r) => ref(typeof r === 'string' ? r : r.id))

export const FlowchartActorSchema = z.object({
  title: z.string().optional(),
  desc: z.string().optional(),
})

export const FlowchartSystemSchema = z.object({
  title: z.string().optional(),
  desc: z.string().optional(),
  type: z.enum(['aggregate', 'external']),
  stateMachine: FlowchartStateMachineSchema.optional(),
})

export const FlowchartResultEventSchema = z.object({
  id: z.string().min(1, { message: 'Result event must have a non-empty id.' }),
  title: z.string().min(1, { message: 'Result event must have a non-empty title.' }),
  desc: z.string().optional(),
})

export const FlowchartLinearStepSchema = z.object({
  id: z.string().min(1, { message: 'Step id cannot be empty.' }),
  type: z.literal('linear'),
  initiatedBy: FlowchartRefSchema.optional(),
  policy: z.string().default(''),
  command: z.string().default(''),
  // Optional: a step can be a pure state change (no system runs the command)
  handledBy: FlowchartRefSchema.optional(),
  delegatesTo: FlowchartRefSchema.optional(),
  // Optional: who receives the step's result (e.g. the server sends ServerHello to the client)
  sendsTo: FlowchartRefSchema.optional(),
  resultEvents: z.array(FlowchartResultEventSchema).min(1, {
    message: 'Linear step must define at least one result event in resultEvents array.',
  }),
  continuesAs: z.string().optional(),
  description: z.string().optional(),
})

export const FlowchartBranchOptionSchema = z.object({
  id: z.string().min(1, { message: 'Branch option id cannot be empty.' }),
  label: z.string(),
  dashed: z.boolean().optional(),
  policy: z.string(),
  command: z.string(),
  // Optional: a step can be a pure state change (no system runs the command)
  handledBy: FlowchartRefSchema.optional(),
  delegatesTo: FlowchartRefSchema.optional(),
  // Optional: who receives the step's result (e.g. the server sends ServerHello to the client)
  sendsTo: FlowchartRefSchema.optional(),
  resultEvents: z.array(FlowchartResultEventSchema).min(1, {
    message: 'Branch option step must define at least one result event in resultEvents array.',
  }),
  continuesAs: z.string().optional(),
  description: z.string().optional(),
})

export const FlowchartBranchStepSchema = z.object({
  id: z.string().min(1, { message: 'Branch step id cannot be empty.' }),
  type: z.literal('branch'),
  event: z.string().min(1, { message: 'Branch step event cannot be empty.' }),
  branches: z.array(FlowchartBranchOptionSchema).min(1, {
    message: 'Branch step must define at least one branch option.',
  }),
  continuesAs: z.string().optional(),
})

export const FlowchartStepSchema = z.discriminatedUnion('type', [
  FlowchartLinearStepSchema,
  FlowchartBranchStepSchema,
])

export const FlowchartJourneyStepRefSchema = z.object({
  stepId: z.string().min(1, { message: 'Journey step reference must define a non-empty stepId.' }),
  name: z.string().min(1, { message: 'Journey step name cannot be empty.' }),
  description: z.string().min(1, { message: 'Journey step description cannot be empty.' }),
  processGroup: z.string().optional(),
})

export const FlowchartJourneySchema = z.object({
  id: z.string().min(1, { message: 'Journey must define a non-empty id.' }),
  label: z.string().min(1, { message: 'Journey must define a non-empty label.' }),
  description: z.string().min(1, { message: 'Journey description cannot be empty.' }),
  steps: z.array(FlowchartJourneyStepRefSchema).min(1, {
    message: 'Journey must define at least 1 journey step in steps array.',
  }),
})

export const FlowchartFlowSchema = z.object({
  actors: z.record(z.string(), FlowchartActorSchema).transform((actors) =>
    Object.fromEntries(
      Object.entries(actors).map(([id, a]): [string, ActorDecl] => [id, { title: a.title ?? id, desc: a.desc ?? '' }]),
    ),
  ),
  systems: z.record(z.string(), FlowchartSystemSchema).transform((systems) =>
    Object.fromEntries(
      Object.entries(systems).map(([id, s]): [string, SystemDecl] => [
        id,
        { title: s.title ?? id, desc: s.desc ?? '', type: s.type, stateMachine: s.stateMachine },
      ]),
    ),
  ),
  steps: z.array(FlowchartStepSchema).min(1, { message: 'Flowchart steps array cannot be empty.' }),
  journeys: z.array(FlowchartJourneySchema).min(1, { message: 'Flowchart journeys array cannot be empty.' }),
})

export const FlowchartSectionSchema = z.object({
  type: z.literal('flowchart'),
  flow: FlowchartFlowSchema,
})

export type FlowchartSectionData = z.output<typeof FlowchartSectionSchema>

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
  id: z.string().optional(),
  prompt: z.string().optional(),
  choices: z.array(ScenarioChoiceSchema).optional(),
  outcome: ScenarioOutcomeSchema.optional(),
})

export const ScenarioSectionSchema = z.object({
  type: z.literal('scenario'),
  id: z.string(),
  title: z.string(),
  intro: z.string().optional(),
  nodes: z.record(z.string(), ScenarioNodeSchema).transform((nodes) =>
    Object.fromEntries(Object.entries(nodes).map(([id, node]) => [id, { ...node, id }])),
  ),
  startNode: z.string().default('start'),
})

export type ScenarioSectionData = z.output<typeof ScenarioSectionSchema>
export type ScenarioNode = ScenarioSectionData['nodes'][string]
export type ScenarioChoice = z.infer<typeof ScenarioChoiceSchema>
export type ScenarioOutcome = z.infer<typeof ScenarioOutcomeSchema>
