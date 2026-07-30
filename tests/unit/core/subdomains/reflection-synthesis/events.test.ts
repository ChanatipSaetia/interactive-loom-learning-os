import { describe, it, expect } from 'vitest'
import type {
  ReflectionSynthesisEvents,
  ReflectionAnswered,
  ReflectionCompleted,
} from '../../../../../src/core/subdomains/reflection-synthesis/events'

describe('ReflectionSynthesisEvents', () => {
  it('ReflectionAnswered has correct structure', () => {
    const event: ReflectionAnswered = {
      type: 'ReflectionAnswered',
      challengeId: 'challenge-1',
      challengeIndex: 0,
      isCorrect: true,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('ReflectionAnswered')
    expect(event.challengeId).toBe('challenge-1')
    expect(event.isCorrect).toBe(true)
    const unionEvent: ReflectionSynthesisEvents = event
    expect(unionEvent.type).toBe('ReflectionAnswered')
  })

  it('ReflectionCompleted has correct structure', () => {
    const event: ReflectionCompleted = {
      type: 'ReflectionCompleted',
      sectionType: 'reflection-sequence',
      totalChallenges: 3,
      correctCount: 2,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('ReflectionCompleted')
    expect(event.sectionType).toBe('reflection-sequence')
    expect(event.totalChallenges).toBe(3)
    expect(event.correctCount).toBe(2)
    const unionEvent: ReflectionSynthesisEvents = event
    expect(unionEvent.type).toBe('ReflectionCompleted')
  })
})
