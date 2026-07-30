import { describe, it, expect } from 'vitest'
import {
  TradeoffSandboxSectionSchema,
  FormulaSandboxSectionSchema,
  DecisionTreeSectionSchema,
  TradeoffChoiceSchema,
  TradeoffMetricDefSchema,
  FormulaVariableSchema,
  FormulaMetricSchema,
  DecisionTreeNodeSchema,
  DecisionTreeChoiceSchema,
  DecisionTreeLeafSchema,
} from '../../../../../src/core/subdomains/tradeoff-sandbox/schema'

describe('TradeoffSandboxSectionSchema', () => {
  it('validates correct tradeoff sandbox data', () => {
    const valid = {
      type: 'tradeoff-sandbox',
      scenarios: [
        {
          id: 'scenario-1',
          title: 'Enterprise App',
          description: 'Build an enterprise app.',
          metrics: [
            { id: 'perf', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' as const },
          ],
          steps: [
            {
              id: 'step-1',
              title: 'Frontend',
              description: 'Choose frontend.',
              choices: [
                {
                  id: 'spa',
                  label: 'SPA',
                  description: 'Single page app',
                  metrics: { perf: 10 },
                  pros: [{ title: 'Fast', description: 'Quick navigation' }],
                  cons: [{ title: 'SEO', description: 'Needs SSR' }],
                },
              ],
            },
          ],
        },
      ],
    }
    const result = TradeoffSandboxSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'flowchart',
      scenarios: [],
    }
    const result = TradeoffSandboxSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required scenario fields', () => {
    const invalid = {
      type: 'tradeoff-sandbox',
      scenarios: [
        {
          id: 'scenario-1',
          // missing title, description, metrics, steps
        },
      ],
    }
    const result = TradeoffSandboxSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('TradeoffMetricDefSchema', () => {
  it('validates required metric fields', () => {
    const valid = { id: 'perf', label: 'Performance', baseValue: 50 }
    const result = TradeoffMetricDefSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional metric fields', () => {
    const valid = { id: 'perf', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' as const }
    const result = TradeoffMetricDefSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects invalid direction', () => {
    const invalid = { id: 'perf', label: 'Performance', baseValue: 50, direction: 'equal' }
    const result = TradeoffMetricDefSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('TradeoffChoiceSchema', () => {
  it('validates choice with pros and cons', () => {
    const valid = {
      id: 'opt1',
      label: 'Option 1',
      description: 'Description',
      metrics: { perf: 10 },
      pros: [{ title: 'Good', description: 'It works' }],
      cons: [{ title: 'Bad', description: 'It costs' }],
    }
    const result = TradeoffChoiceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional whyThisFits and whenToUse', () => {
    const valid = {
      id: 'opt1',
      label: 'Option 1',
      description: 'Description',
      metrics: {},
      pros: [],
      cons: [],
      whyThisFits: 'Fits well',
      whenToUse: 'When needed',
    }
    const result = TradeoffChoiceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('FormulaSandboxSectionSchema', () => {
  it('validates correct formula sandbox data', () => {
    const valid = {
      type: 'formula-sandbox',
      variables: [
        { id: 'x', label: 'X', min: 0, max: 100, step: 1, defaultValue: 50 },
      ],
      metrics: [
        { id: 'y', label: 'Y', formula: 'x * 2', description: 'Double X' },
      ],
    }
    const result = FormulaSandboxSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional metric fields', () => {
    const valid = {
      type: 'formula-sandbox',
      variables: [],
      metrics: [
        {
          id: 'y',
          label: 'Y',
          formula: 'x * 2',
          description: 'Double X',
          analogy: 'Like doubling',
          inScope: ['scope1'],
          outOfScope: ['scope2'],
        },
      ],
    }
    const result = FormulaSandboxSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'decision-tree',
      variables: [],
      metrics: [],
    }
    const result = FormulaSandboxSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required variable fields', () => {
    const invalid = {
      type: 'formula-sandbox',
      variables: [{ id: 'x' }],
      metrics: [],
    }
    const result = FormulaSandboxSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('FormulaVariableSchema', () => {
  it('validates all required fields', () => {
    const valid = { id: 'x', label: 'X', min: 0, max: 100, step: 1, defaultValue: 50 }
    const result = FormulaVariableSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('FormulaMetricSchema', () => {
  it('validates required metric fields', () => {
    const valid = { id: 'y', label: 'Y', formula: 'x * 2', description: 'Double X' }
    const result = FormulaMetricSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('DecisionTreeSectionSchema', () => {
  it('validates correct decision tree data', () => {
    const valid = {
      type: 'decision-tree',
      id: 'tree-1',
      title: 'Architectural Advisor',
      root: 'root',
      nodes: {
        root: {
          id: 'root',
          prompt: 'What is your goal?',
          choices: [
            { id: 'c1', text: 'Scale', next: 'leaf1' },
            { id: 'c2', text: 'Cost', next: 'leaf2' },
          ],
        },
        leaf1: {
          id: 'leaf1',
          leaf: {
            recommendation: 'Use microservices',
            explanation: 'Better scalability',
            tradeoffs: ['Complexity', 'Cost'],
          },
        },
        leaf2: {
          id: 'leaf2',
          leaf: {
            recommendation: 'Use monolith',
            explanation: 'Lower cost',
          },
        },
      },
    }
    const result = DecisionTreeSectionSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects wrong type literal', () => {
    const invalid = {
      type: 'tradeoff-sandbox',
      id: 'tree-1',
      title: 'Tree',
      root: 'root',
      nodes: {},
    }
    const result = DecisionTreeSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const invalid = {
      type: 'decision-tree',
      id: 'tree-1',
      // missing title, root, nodes
    }
    const result = DecisionTreeSectionSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('validates node with choices and next references', () => {
    const validNode = {
      id: 'n1',
      prompt: 'Choose?',
      choices: [
        { id: 'c1', text: 'Yes', next: 'n2', rationale: 'Because', recommended: true },
      ],
    }
    const result = DecisionTreeNodeSchema.safeParse(validNode)
    expect(result.success).toBe(true)
  })

  it('validates leaf node', () => {
    const validLeaf = {
      id: 'leaf1',
      leaf: {
        recommendation: 'Do X',
        explanation: 'Because Y',
      },
    }
    const result = DecisionTreeNodeSchema.safeParse(validLeaf)
    expect(result.success).toBe(true)
  })
})

describe('DecisionTreeLeafSchema', () => {
  it('validates required leaf fields', () => {
    const valid = { recommendation: 'Do X', explanation: 'Because Y' }
    const result = DecisionTreeLeafSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional tradeoffs', () => {
    const valid = { recommendation: 'Do X', explanation: 'Because Y', tradeoffs: ['Cost', 'Time'] }
    const result = DecisionTreeLeafSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})

describe('DecisionTreeChoiceSchema', () => {
  it('validates required choice fields', () => {
    const valid = { id: 'c1', text: 'Yes', next: 'n2' }
    const result = DecisionTreeChoiceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts optional rationale and recommended', () => {
    const valid = { id: 'c1', text: 'Yes', next: 'n2', rationale: 'Because', recommended: true }
    const result = DecisionTreeChoiceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})
