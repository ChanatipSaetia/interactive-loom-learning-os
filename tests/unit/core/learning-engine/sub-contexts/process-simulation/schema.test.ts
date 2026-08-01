import { describe, it, expect } from 'vitest'
import {
  FlowchartSectionSchema,
  ScenarioSectionSchema,
} from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/schema'

describe('ProcessSimulation Subdomain Schemas', () => {
  describe('FlowchartSectionSchema', () => {
    it('validates a minimal flowchart section schema', () => {
      const validData = {
        entities: {
          node1: { title: 'Node 1', desc: 'First node' },
        },
        relations: [
          { id: 'r1', from: 'node1', to: 'node2' },
        ],
      }
      const result = FlowchartSectionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects invalid relation missing from/to in flowchart data', () => {
      const invalidData = {
        relations: [{ id: 'r1' }],
      }
      const result = FlowchartSectionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejects flowchart step missing resultEvents array', () => {
      const invalidData = {
        steps: [
          {
            id: 'step1',
            type: 'linear',
            policy: 'Test Policy',
            command: 'Test Command',
            handledBy: 'sys1',
            resultEvents: [], // Empty resultEvents is invalid
          },
        ],
      }
      const result = FlowchartSectionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('accepts valid flowchart step with resultEvents array', () => {
      const validStepData = {
        steps: [
          {
            id: 'step1',
            type: 'linear',
            policy: 'Test Policy',
            command: 'Test Command',
            handledBy: 'sys1',
            resultEvents: [{ id: 'evt1', title: 'Event 1' }],
          },
        ],
      }
      const result = FlowchartSectionSchema.safeParse(validStepData)
      expect(result.success).toBe(true)
    })
  })

  describe('ScenarioSectionSchema', () => {
    it('validates a valid scenario section schema', () => {
      const validData = {
        id: 'scenario-1',
        title: 'Incident Response Scenario',
        nodes: {
          start: {
            prompt: 'Choose an option',
            choices: [
              { id: 'c1', text: 'Option 1', next: 'outcome1' },
            ],
          },
          outcome1: {
            outcome: {
              verdict: 'Success',
              lesson: 'Good job',
              rating: 'a' as const,
            },
          },
        },
        startNode: 'start',
      }
      const result = ScenarioSectionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejects invalid rating in scenario outcome', () => {
      const invalidData = {
        id: 'scenario-1',
        title: 'Incident Response Scenario',
        nodes: {
          outcome1: {
            outcome: {
              verdict: 'Success',
              lesson: 'Good job',
              rating: 'invalid-rating',
            },
          },
        },
      }
      const result = ScenarioSectionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
