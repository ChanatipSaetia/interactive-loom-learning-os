import { describe, expect, it, vi } from 'vitest'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { createLoomServer } from '../../../src/mcp/server'
import { recommendComponents, inferKnowledgeStructures } from '../../../src/core/learning-engine/composition/oui/component-recommendations'
import { checkFormulaModel, normalizeTokenUsage, reviewQuantitativeModels } from '../../../src/core/learning-engine/validation/quantitative'
import { checkSection, checkTopic } from '../../../src/mcp/check'
import { PROBABILITY_TREE_EXAMPLE } from '../../../src/core/learning-engine/composition/oui/breakdown-tree-authoring'

import { DISCOVERY_CASES, outcomeModel } from '../../fixtures/ai-experience/experience-v2'

describe('representation discovery', () => {
  it.each(DISCOVERY_CASES)('%s retains a faithful candidate', (_, learningObjective, expected) => {
    expect(recommendComponents({ learningObjective }).candidates.map((c) => c.component)).toContain(expected)
  })
  it('does not equate categories or the word breakdown with quantities', () => {
    expect(inferKnowledgeStructures({ learningObjective: 'Breakdown of memory categories' })).toEqual(['classification'])
    expect(recommendComponents({ learningObjective: 'Explain categories of AI agent memory.' }).candidates.map((c) => c.component)).not.toContain('BreakdownTree')
    expect(recommendComponents({ learningObjective: 'Compare frameworks' }).candidates.map((c) => c.component)).toEqual(expect.arrayContaining(['Table', 'TradeoffSandbox']))
  })
  it('respects explicit structures, missing data, bounded candidates and accessibility limits', () => {
    const result = recommendComponents({ learningObjective: 'Inspect', knowledgeStructure: 'hierarchical_quantity comparison', constraints: { numericDataAvailable: false, accessibilityNeeds: ['keyboard'] }, candidateLimit: 2 })
    expect(result.candidates).toHaveLength(2)
    expect(result.candidates.map((c) => c.component)).not.toContain('BreakdownTree')
    expect(result.warnings.join(' ')).toContain('does not certify accessibility')
    expect(() => recommendComponents({ learningObjective: 'x', candidateLimit: 100 })).toThrow()
  })
})

describe('quantitative correctness', () => {
  it('reproduces outcome economics and ordered derived metrics at defaults and domain probes', () => {
    const result = checkFormulaModel(outcomeModel)
    expect(result.diagnostics).toEqual([])
    expect(result.defaults.attempt).toBeCloseTo(.04864, 10)
    expect(result.defaults.accepted).toBeCloseTo(.05404444444, 10)
    expect(result.samplesChecked).toBeGreaterThan(10)
    expect(result.coverage).toBe('sampled-not-proven')
  })
  it.each(['base / (probability - .5)', 'unknown + base', 'Math.sqrt(-base)', 'process.exit()', 'Math.random()'])('rejects unsafe or invalid model %s', (formula) => {
    const model = structuredClone(outcomeModel)
    model.metrics[0].formula = formula
    expect(checkFormulaModel(model).diagnostics.length).toBeGreaterThan(0)
  })
  it('rejects zero denominators, invalid steps, duplicate IDs and defaults outside ranges', () => {
    const model = structuredClone(outcomeModel)
    model.variables[3].min = 0
    expect(checkFormulaModel(model).diagnostics.some((d) => d.code === 'INVALID_FORMULA_OUTPUT')).toBe(true)
    model.variables[0].step = 0
    model.variables[0].defaultValue = 4
    model.variables[1].id = 'base'
    expect(checkFormulaModel(model).diagnostics.map((d) => d.code)).toEqual(expect.arrayContaining(['INVALID_VARIABLE_DOMAIN', 'INVALID_VARIABLE_ID']))
  })
  it('reconciles explicit shared-model observations and provenance separately', () => {
    const entry = { modelId: 'execution', provenance: 'illustrative' as const, assumptions: 'Synthetic costs, same execution.', observations: [{ target: 'tree#total', value: .0442, unit: 'USD' }, { target: 'table#total', value: .0442, unit: 'USD' }, { target: 'formula#total', value: .0442, unit: 'USD' }] }
    expect(reviewQuantitativeModels({ reconciliations: [entry] }).diagnostics).toEqual([])
    entry.observations[1].value = .045
    expect(reviewQuantitativeModels({ reconciliations: [entry] }).diagnostics[0].code).toBe('QUANTITATIVE_MISMATCH')
    entry.observations[1].unit = 'EUR'
    expect(reviewQuantitativeModels({ reconciliations: [entry] }).diagnostics[0].code).toBe('INCONSISTENT_UNITS')
  })
  it('blocks invalid quantity and probability sources in the actual OUI gateway', () => {
    expect(checkSection(PROBABILITY_TREE_EXAMPLE, 'sections/probability.oui').valid).toBe(true)
    const broken = PROBABILITY_TREE_EXAMPLE.replace('"Cached", 0.6', '"Cached", 0.7')
    expect(checkSection(broken, 'sections/probability.oui').valid).toBe(false)
    const topic = '// @loom-topic invalid-probability\n// === topic.oui ===\nroot = Topic("Invalid probability", "Test", "", [SectionRef("probability")])\n// === sections/probability.oui ===\n' + broken
    const checked = checkTopic(topic)
    expect(checked.ok).toBe(false)
    expect(checked.report).toContain('sum to')
  })
  it('normalizes inclusive and exclusive cache/reasoning reporting without double counting', () => {
    const common = { inputTokens: 100, cacheReadTokens: 20, cacheWriteTokens: 10, outputTokens: 40, reasoningTokens: 15, inputIncludesCacheRead: true, inputIncludesCacheWrite: true, outputIncludesReasoning: true }
    expect(normalizeTokenUsage(common)).toMatchObject({ freshInputTokens: 70, outputTokens: 25, reasoningTokens: 15 })
    expect(normalizeTokenUsage({ ...common, inputIncludesCacheRead: false, inputIncludesCacheWrite: false, outputIncludesReasoning: false })).toMatchObject({ freshInputTokens: 100, outputTokens: 40 })
    expect(() => normalizeTokenUsage({ ...common, inputTokens: 5 })).toThrow('Inclusive usage')
  })
})

it('serves deterministic discovery and explicit quantitative checks through the hosted MCP surface', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createLoomServer().connect(b)
  const client = new Client({ name: 'experience-v2', version: '1' })
  await client.connect(a)
  const read = (result: unknown) => JSON.parse((result as { content: { text: string }[] }).content[0].text)
  try {
    const response = read(await client.callTool({ name: 'recommend_components', arguments: { learningObjective: DISCOVERY_CASES[0][1] } }))
    expect(response.candidates.map((c: { component: string }) => c.component)).toContain('BreakdownTree')
    const checked = read(await client.callTool({ name: 'validate_topic_plan', arguments: { plan: {}, quantitativeModels: { formulas: [outcomeModel] } } }))
    expect(checked.valid).toBe(false)
    expect(checked.quantitativeReview.status).toBe('checked')
    expect(checked.experienceReadiness.presentationReadiness).toEqual({ read: 'not-measured', present: 'not-measured' })
  } finally { await client.close() }
})

it('reconciles the regression lesson tree, exact ledger and actual pricing defaults', async () => {
  const { TOKEN_ECONOMICS_FILES, TOKEN_ECONOMICS_OUI } = await import('../../fixtures/ai-experience/token-economics')
  const { parseOUIElements, compileSectionElement } = await import('../../../src/core/learning-engine/composition/oui/compile')
  const { checkTopic } = await import('../../../src/mcp/check')
  expect(checkTopic(TOKEN_ECONOMICS_OUI).ok).toBe(true)
  const root = parseOUIElements(TOKEN_ECONOMICS_FILES['sections/sensitivity.oui'])!
  const data = compileSectionElement(root.props.body as typeof root)!.data
  const result = checkFormulaModel(data)
  expect(result.diagnostics).toEqual([])
  expect(result.defaults.total).toBeCloseTo(.0442, 12)
  // Traverse the actual authored page, then reconcile independently compiled representations.
  const allocation = parseOUIElements(TOKEN_ECONOMICS_FILES['sections/allocation.oui'])!
  const children = (allocation.props.body as typeof root).props.children as Array<typeof root>
  const tree = compileSectionElement(children.find((node) => node.typeName === 'BreakdownTree')!)!.data as { nodes: Array<{ parent?: string; value: number }> }
  const table = children.find((node) => node.typeName === 'Table')!
  const columns = table.props.columns as Array<typeof root>
  const ledgerValues = columns.find((node) => node.props.label === 'USD')!.props.data as number[]
  expect(tree.nodes.find((node) => !node.parent)!.value).toBeCloseTo(result.defaults.total, 12)
  expect(ledgerValues[ledgerValues.length - 1]).toBeCloseTo(result.defaults.total, 12)
})

it('keeps representation advice optional, auditable and bound to the current plan', async () => {
  const { TOKEN_ECONOMICS_OUI, TOKEN_ECONOMICS_PLAN } = await import('../../fixtures/ai-experience/token-economics')
  const { reviewTopicPlan, topicPlanVersion, validateTopicPlan } = await import('../../../src/core/learning-engine/composition/oui/topic-plan')
  const { reviewDelivery } = await import('../../../src/mcp/delivery-review')
  expect(validateTopicPlan(TOKEN_ECONOMICS_PLAN)).toEqual([])
  expect(reviewTopicPlan(TOKEN_ECONOMICS_PLAN)).toEqual([])
  const plan = structuredClone(TOKEN_ECONOMICS_PLAN)
  plan.sections[0].components = ['Table']
  plan.sections[0].rationale = 'Table shows illustrative USD values with mutually exclusive categories.'
  const warning = reviewTopicPlan(plan).find((d) => d.code === 'REPRESENTATION_ALTERNATIVE_AVAILABLE')!
  expect(warning).toMatchObject({ severity: 'warning', stage: 'representation', path: 'sections[0].rationale' })
  const resolution = { code: warning.code, path: warning.path, planVersion: topicPlanVersion(plan)!, reason: 'Exact reconciliation is the primary learner task; the accessible ledger provides the required amounts and labels.' }
  expect(reviewDelivery(TOKEN_ECONOMICS_OUI, plan, [resolution]).deliveryReview.resolvedAdvisoryCount).toBe(1)
  plan.goal += ' for beginners'
  expect(reviewDelivery(TOKEN_ECONOMICS_OUI, plan, [resolution]).deliveryReview.errors.some((d) => d.code === 'INVALID_ADVISORY_RESOLUTION')).toBe(true)
})


it('rejects invalid quantitative content through the app content reader', async () => {
  const { loadOUISection, clearOUICache } = await import('../../../src/core/learning-engine/composition/oui/reader')
  const source = PROBABILITY_TREE_EXAMPLE.replace('"Cached", 0.6', '"Cached", 0.7')
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(source))
  clearOUICache()
  try { await expect(loadOUISection('invalid', 'probability')).rejects.toThrow('sum to') }
  finally { fetch.mockRestore(); clearOUICache() }
})
