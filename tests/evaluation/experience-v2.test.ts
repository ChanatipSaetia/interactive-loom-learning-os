// Deterministic regression benchmark; no external assistant or human teaching-quality scores.
// @ts-expect-error Node types are not installed
import { mkdirSync, writeFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { DISCOVERY_CASES, outcomeModel } from '../fixtures/ai-experience/experience-v2'
import { TOKEN_ECONOMICS_OUI, TOKEN_ECONOMICS_PLAN } from '../fixtures/ai-experience/token-economics'
import { recommendComponents } from '../../src/core/learning-engine/composition/oui/component-recommendations'
import { getCapabilityIndex } from '../../src/core/learning-engine/composition/oui/capability-catalog'
import { checkFormulaModel } from '../../src/core/learning-engine/validation/quantitative'
import { checkTopic } from '../../src/mcp/check'

it('measures 15 authored representation cases and the token-economics regression independently', () => {
  const cases = DISCOVERY_CASES.map(([category, learningObjective, expected]) => {
    const response = recommendComponents({ learningObjective })
    const candidates = response.candidates.map((c) => c.component)
    return { category, expected, candidates, candidateRecall: Number(candidates.includes(expected)), discoveryCharacters: JSON.stringify(response).length, baselineCatalogCharacters: JSON.stringify(getCapabilityIndex()).length, externalAssistantSelection: null, teachingClarity: null, rendering: 'browser-required' }
  })
  expect(cases.every((entry) => entry.candidateRecall === 1)).toBe(true)
  const topic = checkTopic(TOKEN_ECONOMICS_OUI, TOKEN_ECONOMICS_PLAN)
  expect(topic.planAlignment?.status).toBe('aligned')
  expect(topic.ok, topic.report ?? '').toBe(true)
  const formula = checkFormulaModel(outcomeModel)
  expect(formula.diagnostics).toEqual([])
  mkdirSync('artifacts', { recursive: true })
  writeFileSync('artifacts/experience-v2-benchmark.json', JSON.stringify({
    kind: 'authored-deterministic-regression', cases,
    tokenEconomics: { ouiValid: topic.ok, sections: topic.sections.length, defaultOutputs: formula.defaults, formulaCoverage: formula.coverage },
    workflowComparison: { existingWorkflow: 'catalog payload measured; autonomous selection not observed', semanticDiscovery: 'expected candidate presence measured', planning: 'advisory regressions tested separately', fullValidation: 'OUI and sampled numeric checks measured; rendering and teaching quality separate' },
    contextMeasure: 'JavaScript characters, not billed tokens or cache savings', externalAssistants: 'not-run', humanReview: 'required for semantic truth and teaching outcomes',
  }, null, 2) + '\n')
})
