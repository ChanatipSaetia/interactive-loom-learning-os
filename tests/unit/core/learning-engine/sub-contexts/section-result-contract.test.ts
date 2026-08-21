import { describe, it, expect } from 'vitest'
import type { SectionResultContract } from '../../../../../src/core/learning-engine/sub-contexts'

describe('Section Result Contract Interfaces', () => {
  it('creates and adheres to SectionResultContract payload structure', () => {
    const quizResult: SectionResultContract<{ correctCount: number; totalQuestions: number }> = {
      sectionId: 'demo-quiz',
      sectionType: 'quiz',
      status: 'completed',
      score: 100,
      accuracy: 1.0,
      completedAt: Date.now(),
      payload: { correctCount: 5, totalQuestions: 5 },
    }

    expect(quizResult.sectionType).toBe('quiz')
    expect(quizResult.status).toBe('completed')
    expect(quizResult.score).toBe(100)
    expect(quizResult.payload.correctCount).toBe(5)
  })

  it('handles in-progress states and partial scores', () => {
    const tradeoffResult: SectionResultContract<Record<string, number>> = {
      sectionId: 'demo-tradeoffs',
      sectionType: 'tradeoff-sandbox',
      status: 'in_progress',
      score: 65,
      accuracy: 0.5,
      payload: { latency: 80, consistency: 50 },
    }

    expect(tradeoffResult.status).toBe('in_progress')
    expect(tradeoffResult.completedAt).toBeUndefined()
    expect(tradeoffResult.payload.latency).toBe(80)
  })
})
