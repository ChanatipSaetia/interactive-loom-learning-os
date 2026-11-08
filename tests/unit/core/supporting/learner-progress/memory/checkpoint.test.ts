import { expect, it } from 'vitest'
import { createLearningCheckpoint } from '../../../../../../src/core/supporting/learner-progress/memory/checkpoint'
import { createEngagementGate, isLearnerEvent, learnerEventOf, type LearnerEvent } from '../../../../../../src/core/supporting/learner-progress/memory/events'
import type { TopicPlan } from '../../../../../../src/core/learning-engine/composition/oui/topic-plan'
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

it('links objective evidence only to current source/version and preserves legacy aggregates', () => {
  const plan: TopicPlan = { schemaVersion: 1, topicId: 'demo', goal: 'Apply', objectives: [{ id: 'apply', description: 'Apply the rule', evidenceOfLearning: 'Answer the authored item' }], sections: [{ id: 'quiz', title: 'Check', representation: 'quiz', objectiveRefs: ['apply'], activity: 'Answer', assessment: { itemRefs: ['sections/quiz.oui#q1'], successCriterion: 'Latest answer correct' } }] }
  const files = { 'sections/quiz.oui': "root = Page(\"T\", Quiz(\"T\", [q1]))\nq1 = QuizQuestion(\"q1\", \"Why?\", [])" }
  const context = { topicVersion: 'v2', files, plan }
  const current: LearnerEvent = { ...event, id: 'current', topicVersion: 'v2', result: 'correct' }
  const stale: LearnerEvent = { ...current, id: 'stale', topicVersion: 'v1' }
  const checkpoint = createLearningCheckpoint('demo', [event, stale, current], context)
  expect(checkpoint.completedObjectives).toEqual(['apply'])
  expect(checkpoint.assessment.mastery).toBe('not-inferred')
  expect(checkpoint.currentRevisionEvidence).toEqual({ excludedLegacyAttempts: 1, excludedStaleAttempts: 1 })
  expect(checkpoint.resume?.sourceVerified).toBe(true)
  expect(createLearningCheckpoint('demo', [event, stale], context).completedObjectives).toEqual([])
  expect(createLearningCheckpoint('demo', [current], { ...context, files: {} }).resume).toBeNull()
  expect(createLearningCheckpoint('demo', [current], { ...context, files: {} }).completedObjectives).toEqual([])
})

it('derives a stable resume location from section evidence without claiming source freshness', () => {
  const seen: LearnerEvent = { ...event, id: 'next', t: '2026-01-03T00:00:00Z', item: 'sections/explore_more.oui', kind: 'seen', result: undefined }
  const unknown = { ...seen, id: 'unknown', t: '2026-01-04T00:00:00Z', item: '../private.oui' }
  const other = { ...seen, id: 'other', topic: 'other', item: 'sections/other.oui' }
  const checkpoint = createLearningCheckpoint('demo', [seen, event, unknown, other, seen])
  expect(checkpoint.currentSectionId).toBe('explore_more')
  expect(checkpoint.resume).toEqual({ item: seen.item, basis: 'latest-section-event', sourceVerified: false })
  expect(createLearningCheckpoint('demo', [event, unknown, seen])).toEqual(checkpoint)
  expect(checkpoint.assessment.mastery).toBe('not-inferred')
  expect(createLearningCheckpoint('empty', []).resume).toBeNull()
  expect(createLearningCheckpoint('empty', []).currentSectionId).toBeUndefined()
})
