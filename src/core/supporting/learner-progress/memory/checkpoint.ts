/** Portable, deterministic learning checkpoint derived from existing event logs. */
import { mergeEvents, summarize, type LearnerEvent } from './events'
import type { TopicPlan } from '../../../learning-engine/composition/oui/topic-plan'
import { fileStatements } from '../../authoring-editor/assistant/statements'

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
  resume: { item: string; basis: 'latest-section-event'; sourceVerified: boolean } | null
  topicVersion?: string
  currentRevisionEvidence?: { excludedLegacyAttempts: number; excludedStaleAttempts: number }
  objectiveProgress?: Array<{ id: string; status: 'not-observed' | 'developing' | 'demonstrated-on-linked-items'; itemRefs: string[]; attempts: number }>
  completedObjectives?: string[]
  developingObjectives?: string[]
  assessment: { attempts: number; correctAttempts: number; latestCorrectItems: string[]; mastery: 'not-inferred' }
}

export function createLearningCheckpoint(topicId: string, events: LearnerEvent[], context?: { topicVersion: string; plan?: TopicPlan; files: Record<string, string> }): LearningCheckpoint {
  const ordered = mergeEvents(events).filter((event) => event.topic === topicId)
  const summary = summarize(ordered).find((item) => item.topic === topicId)
  const latest = new Map<string, LearnerEvent>()
  const exists = (item: string) => {
    if (!context) return true
    const [file, statement] = item.split('#')
    return context.files[file] !== undefined && (!statement || fileStatements(context.files[file]).some((entry) => entry.name === statement))
  }
  let location: { sectionId: string; item: string } | undefined
  for (const event of ordered) {
    if (event.kind === 'answered') latest.set(event.item, event)
    const sectionId = /^sections\/([\w-]+)\.oui(?:#[^\s#]+)?$/.exec(event.item)?.[1]
    if (sectionId && (!context || (event.topicVersion === context.topicVersion && exists(event.item)))) location = { sectionId, item: event.item }
  }
  const current = context ? ordered.filter((event) => event.topicVersion === context.topicVersion) : []
  const currentAnswers = new Map<string, LearnerEvent>()
  for (const event of current) if (event.kind === 'answered') currentAnswers.set(event.item, event)
  const objectiveProgress = context?.plan?.objectives.map((objective) => {
    const itemRefs = [...new Set(context.plan!.sections.filter((section) => section.objectiveRefs.includes(objective.id)).flatMap((section) => section.assessment?.itemRefs ?? []))]
    const attempts = current.filter((event) => event.kind === 'answered' && itemRefs.includes(event.item)).length
    const demonstrated = itemRefs.length > 0 && itemRefs.every((item) => exists(item) && currentAnswers.get(item)?.result === 'correct')
    return { id: objective.id, status: demonstrated ? 'demonstrated-on-linked-items' as const : attempts ? 'developing' as const : 'not-observed' as const, itemRefs, attempts }
  })
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
    resume: location ? { item: location.item, basis: 'latest-section-event', sourceVerified: Boolean(context) } : null,
    ...(context ? { topicVersion: context.topicVersion, currentRevisionEvidence: {
      excludedLegacyAttempts: ordered.filter((event) => event.kind === 'answered' && !event.topicVersion).length,
      excludedStaleAttempts: ordered.filter((event) => event.kind === 'answered' && event.topicVersion && event.topicVersion !== context.topicVersion).length,
    } } : {}),
    ...(objectiveProgress ? { objectiveProgress, completedObjectives: objectiveProgress.filter((o) => o.status === 'demonstrated-on-linked-items').map((o) => o.id), developingObjectives: objectiveProgress.filter((o) => o.status === 'developing').map((o) => o.id) } : {}),
    assessment: { attempts: summary?.answered ?? 0, correctAttempts: summary?.correct ?? 0, latestCorrectItems: [...latest].filter(([, event]) => event.result === 'correct').map(([item]) => item).sort(), mastery: 'not-inferred' },
  }
}
