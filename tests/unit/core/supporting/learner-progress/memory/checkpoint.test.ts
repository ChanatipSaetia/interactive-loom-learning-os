import { expect, it } from 'vitest'
import { createLearningCheckpoint } from '../../../../../../src/core/supporting/learner-progress/memory/checkpoint'
import { createEngagementGate, isLearnerEvent, learnerEventOf, type LearnerEvent } from '../../../../../../src/core/supporting/learner-progress/memory/events'
const event: LearnerEvent = { id: 'a', t: '2026-01-01T00:00:00Z', device: 'test', topic: 'demo', item: 'sections/quiz.oui#q1', kind: 'answered', result: 'wrong' }
it('deduplicates attempts, isolates topics and separates engagement from mastery', () => {
  const correct = { ...event, id: 'b', t: '2026-01-02T00:00:00Z', result: 'correct' as const }
  const checkpoint = createLearningCheckpoint('demo', [event, event, correct, { ...event, id: 'c', topic: 'other' }])
  expect(checkpoint.answered).toBe(2)
  expect(checkpoint.missed).toEqual([])
  expect(checkpoint.assessment).toMatchObject({ latestCorrectItems: [event.item], mastery: 'not-inferred' })
  expect(createLearningCheckpoint('empty', []).lastActivity).toBeNull()
})
it('throttles repeated exploration but preserves all answers', () => {
  const gate = createEngagementGate()
  const seen = learnerEventOf('demo', 'sandbox', { type: 'SliderValueChanged', newValue: 42 })!
  expect(seen).toEqual({ topic: 'demo', item: 'sections/sandbox.oui', kind: 'seen' })
  expect(gate(seen, 0)).toBe(true)
  expect(gate(seen, 100)).toBe(false)
  expect(gate(seen, 1000)).toBe(true)
  expect(gate(event, 0)).toBe(true)
  expect(gate(event, 1)).toBe(true)
  expect(learnerEventOf('demo', 'quiz', { type: 'QuizOptionSelected', isCorrect: 'yes' })).toBeNull()
})
it('rejects invalid timestamps and assessment events without evidence', () => {
  expect(isLearnerEvent({ ...event, t: 'no' })).toBe(false)
  expect(isLearnerEvent({ ...event, result: undefined })).toBe(false)
})
