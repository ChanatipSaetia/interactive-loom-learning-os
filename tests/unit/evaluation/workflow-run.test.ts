import { expect, it } from 'vitest'
import { evaluateWorkflowRuns } from '../../../src/evaluation/workflow-run'

const run = { schemaVersion: 1, runId: 'run-1', caseId: 'prose', variant: 'progressive', origin: 'synthetic', events: [{ type: 'validation.completed', latencyMs: 10, inputBytes: 40, outputBytes: 20, estimatedInputTokens: 10, estimatedOutputTokens: 5 }], outcome: { ouiValid: true, rendered: null, narrationValid: true, repairCount: 1 }, documentationEstimatedTokens: 6000 }
it('keeps unknown render/billing metrics, synthetic runs and budget exemptions explicit', () => {
  const group = evaluateWorkflowRuns([run]).groups[0]
  expect(group.successful).toBe(0)
  expect(group.providerTokensPerSuccess).toBeNull()
  expect(group.budgetViolations).toEqual(['run-1'])
  expect(evaluateWorkflowRuns([{ ...run, budgetExemption: 'Complex graph contracts' }]).groups[0].budgetViolations).toEqual([])
  expect(() => evaluateWorkflowRuns([run, run])).toThrow('Duplicate')
  expect(() => evaluateWorkflowRuns([{ ...run, privateSource: 'never log this' }])).toThrow()
})
it('counts complete provider repair usage only when supplied by the host', () => {
  const observed = { ...run, origin: 'host-observed', outcome: { ...run.outcome, rendered: true }, events: run.events.map((e) => ({ ...e, providerInputTokens: 100, providerOutputTokens: 20 })) }
  const groups = evaluateWorkflowRuns([run, { ...observed, runId: 'run-2' }]).groups
  expect(groups).toHaveLength(2)
  expect(groups[1].providerTokensPerSuccess).toBe(120)
  expect(groups[1].repairs).toBe(1)
})
