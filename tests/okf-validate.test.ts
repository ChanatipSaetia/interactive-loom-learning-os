import { describe, it, expect } from 'vitest'
import {
  validateSectionData,
  validateYAMLContent,
  validateSemanticIntegrity,
  formatPayloadAsPrompt,
} from '../src/core/learning-engine/validation/gateway'

describe('OKF 3-Tier Section Validator Engine', () => {
  describe('Tier 1: YAML Syntax Validation', () => {
    it('should catch invalid YAML syntax with line info', () => {
      const brokenYaml = `
type: text
paragraphs:
  - line 1
  - bad indent:
   broken: [
`
      const res = validateYAMLContent(brokenYaml)
      expect(res.data).toBeNull()
      expect(res.errors.length).toBeGreaterThan(0)
      expect(res.errors[0].tier).toBe('syntax')
      expect(res.errors[0].message).toContain('YAML Syntax Error')
    })

    it('should parse valid YAML correctly', () => {
      const validYaml = `
type: text
paragraphs:
  - Hello world
`
      const res = validateYAMLContent(validYaml)
      expect(res.data).not.toBeNull()
      expect(res.errors).toHaveLength(0)
    })
  })

  describe('Tier 2: Structural Schema Validation', () => {
    it('should detect missing required section type', () => {
      const res = validateSectionData({ paragraphs: ['hello'] })
      expect(res.length).toBeGreaterThan(0)
      expect(res[0].tier).toBe('schema')
      expect(res[0].field).toBe('type')
    })

    it('should detect unknown section type', () => {
      const res = validateSectionData({ type: 'invalid-custom-type' })
      expect(res.some((e) => e.message.includes('Unknown section type'))).toBe(true)
    })

    it('should detect missing required sub-fields (e.g. intro.what)', () => {
      const res = validateSectionData({ type: 'intro' })
      expect(res.some((e) => e.field === 'what')).toBe(true)
      expect(res.some((e) => e.field === 'why')).toBe(true)
    })

    it('should detect invalid field data types', () => {
      const res = validateSectionData({ type: 'text', paragraphs: 'not an array' })
      expect(res.some((e) => e.tier === 'schema' && e.field === 'paragraphs')).toBe(true)
    })
  })

  describe('Tier 3: Semantic Integrity & Reference Validation', () => {
    it('should catch broken startNode in scenario', () => {
      const scenarioData = {
        type: 'scenario',
        id: 'sc1',
        title: 'Test Scenario',
        startNode: 'non_existent_start',
        nodes: {
          node1: {
            title: 'Node 1',
            choices: [],
          },
        },
      }
      const errors = validateSemanticIntegrity(scenarioData, 'scenario')
      expect(errors.some((e) => e.field === 'startNode' && e.message.includes('non_existent_start'))).toBe(true)
    })

    it('should catch broken nextNode link in scenario choice', () => {
      const scenarioData = {
        type: 'scenario',
        id: 'sc1',
        title: 'Test Scenario',
        startNode: 'node1',
        nodes: {
          node1: {
            title: 'Node 1',
            choices: [
              { label: 'Go to missing', nextNode: 'missing_node_99' },
            ],
          },
        },
      }
      const errors = validateSemanticIntegrity(scenarioData, 'scenario')
      expect(errors.some((e) => e.field?.includes('nextNode') && e.message.includes('missing_node_99'))).toBe(true)
      expect(errors[0].fixHint).toBeDefined()
    })

    it('should catch broken decision-tree target references', () => {
      const dtData = {
        type: 'decision-tree',
        id: 'dt1',
        title: 'Test Decision Tree',
        root: 'rootNode',
        nodes: {
          rootNode: {
            question: 'Question?',
            options: [
              { label: 'Option A', target: 'ghost_node' },
            ],
          },
        },
      }
      const errors = validateSemanticIntegrity(dtData, 'decision-tree')
      expect(errors.some((e) => e.message.includes('ghost_node'))).toBe(true)
    })

    it('should catch invalid concept-map edge target node IDs', () => {
      const conceptData = {
        type: 'concept-map',
        nodes: { nodeA: { label: 'A' } },
        edges: [
          { source: 'nodeA', target: 'nodeUnknown' },
        ],
      }
      const errors = validateSemanticIntegrity(conceptData, 'concept-map')
      expect(errors.some((e) => e.field === 'edges[0].target')).toBe(true)
    })

    it('should catch out-of-bounds quiz correctAnswer index', () => {
      const quizData = {
        type: 'quiz',
        questions: [
          {
            question: 'What is 1+1?',
            options: ['1', '2', '3'],
            correctAnswer: 5,
          },
        ],
      }
      const errors = validateSemanticIntegrity(quizData, 'quiz')
      expect(errors.some((e) => e.field === 'questions[0].correctAnswer')).toBe(true)
    })
  })

  describe('Prompt Formatting Output', () => {
    it('should generate structured LLM prompt block from error payloads', () => {
      const errors = [
        {
          file: 'public/okf/demo/sections/01-scenario/data.yaml',
          sectionName: '01-scenario',
          tier: 'semantic' as const,
          field: 'startNode',
          message: 'startNode "node99" does not exist in scenario nodes dictionary.',
          fixHint: 'Change startNode to one of valid node keys: ["node1", "node2"]',
        },
      ]

      const prompt = formatPayloadAsPrompt(errors)
      expect(prompt).toContain('# OKF Section Validation Error Report')
      expect(prompt).toContain('public/okf/demo/sections/01-scenario/data.yaml')
      expect(prompt).toContain('startNode "node99"')
      expect(prompt).toContain('Instructions for AI')
    })
  })
})
