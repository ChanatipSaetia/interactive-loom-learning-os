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
  /** Last observed section, not a completion recommendation or source-version claim. */
  currentSectionId?: string
  resume: { item: string; basis: 'latest-section-event'; sourceVerified: false } | null
  assessment: { attempts: number; correctAttempts: number; latestCorrectItems: string[]; mastery: 'not-inferred' }
}

export function createLearningCheckpoint(topicId: string, events: LearnerEvent[]): LearningCheckpoint {
  const ordered = mergeEvents(events).filter((event) => event.topic === topicId)
  const summary = summarize(ordered).find((item) => item.topic === topicId)
  const latest = new Map<string, LearnerEvent>()
  let location: { sectionId: string; item: string } | undefined
  for (const event of ordered) {
    if (event.kind === 'answered') latest.set(event.item, event)
    const sectionId = /^sections\/([\w-]+)\.oui(?:#[^\s#]+)?$/.exec(event.item)?.[1]
    if (sectionId) location = { sectionId, item: event.item }
  }
  return {
    schemaVersion: 1,
    topicId,
    seen: summary?.seen ?? 0,
    answered: summary?.answered ?? 0,
    correct: summary?.correct ?? 0,
    completed: summary?.completed ?? 0,
    missed: summary?.missed ?? [],
    lastActivity: summary?.last ?? null,
    ...(location ? { currentSectionId: location.sectionId } : {}),
    resume: location ? { item: location.item, basis: 'latest-section-event', sourceVerified: false } : null,
    assessment: { attempts: summary?.answered ?? 0, correctAttempts: summary?.correct ?? 0, latestCorrectItems: [...latest].filter(([, event]) => event.result === 'correct').map(([item]) => item).sort(), mastery: 'not-inferred' },
  }
}
