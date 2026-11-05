import { describe, expect, it } from 'vitest'
import { summarizeMeasurements } from '../../../src/evaluation/metrics'

describe('evaluation metrics', () => {
  it('does not divide by zero', () => expect(summarizeMeasurements([]).tokensPerSuccess).toBeNull())
  it('counts repairs in total observed tokens', () => {
    const summary = summarizeMeasurements([{ caseId: 'a', variant: 'focused', valid: true, rendered: true, inputTokens: 100, repairInputTokens: 40, repairCount: 1 }])
    expect(summary.tokensPerSuccess).toBe(140)
    expect(summary.firstPassValidityRate).toBe(0)
  })
})

it('keeps absent token measurements distinct from observed zero usage', () => {
  const summary = summarizeMeasurements([{ caseId: 'offline', variant: 'fixture', valid: true, rendered: true, repairCount: 0 }])
  expect(summary.tokenObservedRuns).toBe(0)
  expect(summary.completeTokenRuns).toBe(0)
  expect(summary.tokensPerSuccess).toBeNull()
})
