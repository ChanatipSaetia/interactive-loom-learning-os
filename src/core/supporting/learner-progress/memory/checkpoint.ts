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
}

export function createLearningCheckpoint(topicId: string, events: LearnerEvent[]): LearningCheckpoint {
  const summary = summarize(mergeEvents(events)).find((item) => item.topic === topicId)
  return {
    schemaVersion: 1,
    topicId,
    seen: summary?.seen ?? 0,
    answered: summary?.answered ?? 0,
    correct: summary?.correct ?? 0,
    completed: summary?.completed ?? 0,
    missed: summary?.missed ?? [],
    lastActivity: summary?.last ?? null,
  }
}
