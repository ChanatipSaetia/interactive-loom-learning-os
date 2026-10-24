import { beforeEach, describe, expect, it } from 'vitest'
import {
  PROGRESS_STORAGE_KEY,
  learnerEventOf,
  memoryAdapter,
  mergeEvents,
  migrateProgressOnce,
  parseJSONL,
  progressAsEvents,
  stampEvent,
  summarize,
  summaryText,
  toJSONL,
  type LearnerEvent,
} from '../../../../../src/core/supporting/learner-progress'

const at = (iso: string) => new Date(iso)
const event = (item: string, kind: LearnerEvent['kind'], t: string, result?: LearnerEvent['result']): LearnerEvent =>
  stampEvent({ topic: 'tea', item, kind, ...(result && { result }) }, 'test', at(t))

describe('learner event log (decisions 145–146)', () => {
  it('merges logs from several devices by union, oldest first', () => {
    const a = event('sections/quiz.oui#q1', 'answered', '2026-10-02T00:00:00Z', 'wrong')
    const b = event('sections/quiz.oui#q1', 'answered', '2026-10-01T00:00:00Z', 'correct')
    expect(mergeEvents([a, b], [a])).toEqual([b, a])
  })

  it('round-trips JSONL and skips broken lines', () => {
    const log = [event('sections/intro.oui', 'seen', '2026-10-01T00:00:00Z')]
    expect(parseJSONL(`${toJSONL(log)}{"half":\nnot json\n{"id":1}\n`)).toEqual(log)
  })

  it('turns section events into learner events', () => {
    expect(learnerEventOf('tea', 'quiz', { type: 'QuizOptionSelected', questionId: 'q2', isCorrect: true })).toEqual({ topic: 'tea', item: 'sections/quiz.oui#q2', kind: 'answered', result: 'correct' })
    expect(learnerEventOf('tea', 'quiz', { type: 'QuizOptionSelected', questionId: 'q2', isCorrect: false, dodged: true })).toBeNull()
    expect(learnerEventOf('tea', 'order', { type: 'ReflectionAnswered', challengeId: 'c1', isCorrect: false })?.result).toBe('wrong')
    expect(learnerEventOf('tea', 'words', { type: 'FlashcardFlipped', termId: 'cha', isFront: false })?.item).toBe('sections/words.oui#cha')
    expect(learnerEventOf('tea', 'quiz', { type: 'QuizCompleted' })).toEqual({ topic: 'tea', item: 'sections/quiz.oui', kind: 'completed' })
    expect(learnerEventOf('tea', 'flow', { type: 'StepChanged' })).toBeNull()
  })

  it('summarizes each topic, with the items last answered wrong', () => {
    const log = [
      event('sections/intro.oui', 'seen', '2026-10-01T00:00:00Z'),
      event('sections/quiz.oui#q1', 'answered', '2026-10-01T00:01:00Z', 'wrong'),
      event('sections/quiz.oui#q1', 'answered', '2026-10-01T00:02:00Z', 'correct'),
      event('sections/quiz.oui#q2', 'answered', '2026-10-01T00:03:00Z', 'wrong'),
      event('sections/quiz.oui', 'completed', '2026-10-01T00:04:00Z'),
    ]
    const [tea] = summarize(log)
    expect(tea).toMatchObject({ topic: 'tea', answered: 3, correct: 1, completed: 1, missed: ['sections/quiz.oui#q2'], last: '2026-10-01T00:04:00.000Z' })
    expect(summaryText([tea])).toContain('1 of 3 answers right')
    expect(summaryText([])).toBe('No learning recorded yet.')
  })
})

describe('migrating the old progress store (decision 151)', () => {
  beforeEach(() => localStorage.clear())

  it('turns viewed and completed sections into events, once', async () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ tea: { intro: { viewed: true, completed: false, data: {} }, quiz: { viewed: true, completed: true, data: {} } } }))
    expect(progressAsEvents('test').map((e) => `${e.item} ${e.kind}`)).toEqual(['sections/intro.oui seen', 'sections/quiz.oui seen', 'sections/quiz.oui completed'])
    const port = memoryAdapter()
    await migrateProgressOnce(port, 'test')
    await migrateProgressOnce(port, 'test')
    expect(await port.readAll()).toHaveLength(3)
  })
})
