import { describe, it, expect } from 'vitest'
import {
  FlowchartSectionSchema,
  ScenarioSectionSchema,
} from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/schema'

const flowInput = () => ({
  type: 'flowchart' as const,
  flow: {
    actors: { user: { title: 'User', desc: 'Places orders' } },
    systems: { orders: { title: 'Orders', desc: 'Order aggregate', type: 'aggregate' as const } },
    steps: [
      {
        id: 'step1',
        type: 'linear' as const,
        initiatedBy: 'user',
        policy: 'When a cart is checked out',
        command: 'Place order',
        handledBy: 'orders',
        resultEvents: [{ id: 'evt1', title: 'Order placed' }],
      },
    ],
    journeys: [
      {
        id: 'happy',
        label: 'Happy path',
        description: 'Order goes through',
        steps: [{ stepId: 'step1', name: 'Place', description: 'User places the order', processGroup: 'checkout' }],
      },
    ],
  },
})

describe('ProcessSimulation Subdomain Schemas', () => {
  describe('FlowchartSectionSchema', () => {
    it('turns the assembled event-storming files into an AbstractFlow', () => {
      const result = FlowchartSectionSchema.safeParse(flowInput())
      expect(result.success).toBe(true)
      const flow = result.data!.flow
      expect(flow.steps[0]).toMatchObject({
        initiatedBy: { _tag: 'ref', id: 'user' },
        handledBy: { _tag: 'ref', id: 'orders' },
      })
      expect(flow.systems.orders.type).toBe('aggregate')
    })

    it('defaults actor/system titles to their IDs and a missing policy to empty', () => {
      const input = flowInput()
      input.flow.actors = { user: {} as never }
      delete (input.flow.steps[0] as Record<string, unknown>).policy
      const result = FlowchartSectionSchema.parse(input)
      expect(result.flow.actors.user.title).toBe('user')
      expect(result.flow.steps[0]).toMatchObject({ policy: '' })
    })

    it('is idempotent: parsed output re-validates to the same value', () => {
      const once = FlowchartSectionSchema.parse(flowInput())
      const twice = FlowchartSectionSchema.parse(JSON.parse(JSON.stringify(once)))
      expect(twice).toEqual(once)
    })

    it('rejects flowchart step missing resultEvents', () => {
      const input = flowInput()
      input.flow.steps[0].resultEvents = []
      expect(FlowchartSectionSchema.safeParse(input).success).toBe(false)
    })

    it('rejects system types other than aggregate/external', () => {
      const input = flowInput()
      ;(input.flow.systems.orders as Record<string, unknown>).type = 'AGGREGATE'
      expect(FlowchartSectionSchema.safeParse(input).success).toBe(false)
    })

    it('rejects the removed pre-derived entities/relations format', () => {
      const result = FlowchartSectionSchema.safeParse({
        type: 'flowchart',
        entities: { node1: { title: 'Node 1', desc: 'First node' } },
        relations: [{ id: 'r1', from: 'node1', to: 'node2' }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('ScenarioSectionSchema', () => {
    const scenarioInput = () => ({
      type: 'scenario' as const,
      id: 'scenario-1',
      title: 'Incident Response Scenario',
      nodes: {
        start: {
          prompt: 'Choose an option',
          choices: [{ id: 'c1', text: 'Option 1', next: 'outcome1' }],
        },
        outcome1: {
          outcome: { verdict: 'Success', lesson: 'Good job', rating: 'a' as const },
        },
      },
    })

    it('adds node IDs from their keys and defaults startNode to "start"', () => {
      const result = ScenarioSectionSchema.parse(scenarioInput())
      expect(result.startNode).toBe('start')
      expect(result.nodes.outcome1.id).toBe('outcome1')
    })

    it('rejects invalid rating in scenario outcome', () => {
      const input = scenarioInput()
      ;(input.nodes.outcome1.outcome as Record<string, unknown>).rating = 'invalid-rating'
      expect(ScenarioSectionSchema.safeParse(input).success).toBe(false)
    })
  })
})
