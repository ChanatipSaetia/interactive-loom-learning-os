/** Portable, deterministic learning checkpoint derived from existing event logs. */
import { mergeEvents, summarize, type LearnerEvent } from './events'

export interface LearningCheckpoint {
  schemaVersion: 1
  topicId: string
  seen: number
  answered: number
  correct: number
  completed: number
  missed: string[]
  lastActivity: string | null
  assessment: { attempts: number; correctAttempts: number; latestCorrectItems: string[]; mastery: 'not-inferred' }
}

export function createLearningCheckpoint(topicId: string, events: LearnerEvent[]): LearningCheckpoint {
  const summary = summarize(mergeEvents(events)).find((item) => item.topic === topicId)
  const latest = new Map<string, LearnerEvent>()
  for (const event of mergeEvents(events)) if (event.topic === topicId && event.kind === 'answered') latest.set(event.item, event)
  return {
    schemaVersion: 1,
    topicId,
    seen: summary?.seen ?? 0,
    answered: summary?.answered ?? 0,
    correct: summary?.correct ?? 0,
    completed: summary?.completed ?? 0,
    missed: summary?.missed ?? [],
    lastActivity: summary?.last ?? null,
    assessment: { attempts: summary?.answered ?? 0, correctAttempts: summary?.correct ?? 0, latestCorrectItems: [...latest].filter(([, event]) => event.result === 'correct').map(([item]) => item).sort(), mastery: 'not-inferred' },
  }
}
