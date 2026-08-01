import { describe, it, expect } from 'vitest'
import type {
  PracticeAssessmentEvents,
  QuizOptionSelected,
  QuizCompleted,
  FlashcardFlipped,
  ConceptMapMatched,
} from '../../../../../../src/core/learning-engine/sub-contexts/practice-assessment/events'

describe('PracticeAssessmentEvents', () => {
  it('QuizOptionSelected has correct structure', () => {
    const event: QuizOptionSelected = {
      type: 'QuizOptionSelected',
      questionId: 'q1',
      choiceId: 'a',
      isCorrect: true,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('QuizOptionSelected')
    expect(event.questionId).toBe('q1')
    expect(event.choiceId).toBe('a')
    expect(event.isCorrect).toBe(true)
    const unionEvent: PracticeAssessmentEvents = event
    expect(unionEvent.type).toBe('QuizOptionSelected')
  })

  it('QuizCompleted has correct structure', () => {
    const event: QuizCompleted = {
      type: 'QuizCompleted',
      totalQuestions: 10,
      correctCount: 8,
      score: 80,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('QuizCompleted')
    expect(event.totalQuestions).toBe(10)
    expect(event.correctCount).toBe(8)
    expect(event.score).toBe(80)
    const unionEvent: PracticeAssessmentEvents = event
    expect(unionEvent.type).toBe('QuizCompleted')
  })

  it('FlashcardFlipped has correct structure', () => {
    const event: FlashcardFlipped = {
      type: 'FlashcardFlipped',
      termId: 't1',
      termIndex: 0,
      isFront: false,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('FlashcardFlipped')
    expect(event.termId).toBe('t1')
    expect(event.termIndex).toBe(0)
    expect(event.isFront).toBe(false)
    const unionEvent: PracticeAssessmentEvents = event
    expect(unionEvent.type).toBe('FlashcardFlipped')
  })

  it('ConceptMapMatched has correct structure', () => {
    const event: ConceptMapMatched = {
      type: 'ConceptMapMatched',
      fromNodeId: 'n1',
      toNodeId: 'n2',
      edgeLabel: 'relates to',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('ConceptMapMatched')
    expect(event.fromNodeId).toBe('n1')
    expect(event.toNodeId).toBe('n2')
    expect(event.edgeLabel).toBe('relates to')
    const unionEvent: PracticeAssessmentEvents = event
    expect(unionEvent.type).toBe('ConceptMapMatched')
  })

  it('ConceptMapMatched works without optional edgeLabel', () => {
    const event: ConceptMapMatched = {
      type: 'ConceptMapMatched',
      fromNodeId: 'n1',
      toNodeId: 'n2',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('ConceptMapMatched')
    expect(event.edgeLabel).toBeUndefined()
    const unionEvent: PracticeAssessmentEvents = event
    expect(unionEvent.type).toBe('ConceptMapMatched')
  })
})
