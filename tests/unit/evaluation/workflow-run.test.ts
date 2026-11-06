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

it('reports offline Supported Objective Rate separately from coverage and engagement', () => {
  const objectiveReviews = [
    { objectiveId: 'define', sectionIds: ['cards', 'explanation'], reviewerAlias: 'reviewer-a', rubricVersion: 1, representationFit: 5, grounding: 4, implementationQuality: 4 },
    { objectiveId: 'apply', sectionIds: ['explanation', 'practice'], reviewerAlias: 'reviewer-a', rubricVersion: 1, representationFit: 5, grounding: 2, implementationQuality: 5 },
  ]
  const input = { ...run, objectiveIds: ['define', 'apply'], objectiveReviews, toolCalls: 7, outcome: { ...run.outcome, objectiveCoverage: 1 } }
  const group = evaluateWorkflowRuns([input]).groups[0]
  expect(group.objectiveCoverage.mean).toBe(1)
  expect(group.objectiveSupport).toMatchObject({ supportedObjectiveRate: 0.5, reviewedObjectives: 2, learnerMastery: 'not-inferred' })
  expect(group.objectiveSupport.meanAlignmentScore).toBeCloseTo(25 / 30)
  expect(group.toolCalls.totalObserved).toBe(7)
  expect(evaluateWorkflowRuns([{ ...input, objectiveIds: ['define', 'apply', 'unreviewed'] }]).groups[0].objectiveSupport.supportedObjectiveRate).toBeNull()
  expect(evaluateWorkflowRuns([run]).groups[0].objectiveSupport.meanAlignmentScore).toBeNull()
  expect(() => evaluateWorkflowRuns([{ ...input, objectiveReviews: [...objectiveReviews, objectiveReviews[0]] }])).toThrow('Duplicate objective review')
  expect(() => evaluateWorkflowRuns([{ ...input, objectiveIds: ['define'] }])).toThrow('inventory')
})
