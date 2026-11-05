/**
 * Opt-in durable storage boundary. The host supplies verified identity and an
 * atomic storage port per request; public Workers configure neither by default.
 * This module performs no authentication, network calls or filesystem access.
 */
import { z } from 'zod'
import { isLearnerEvent, mergeEvents, type LearnerEvent } from './events'
import { createLearningCheckpoint } from './checkpoint'
import { TopicPlanSchema, validateTopicPlan } from '../../../learning-engine/composition/oui/topic-plan'
import { OUI_SECTION_TYPES } from '../../../learning-engine/composition/oui/library'
import { topicSourceVersion } from '../../../learning-engine/composition/oui/topic-version'
import { readTopicText } from '../../authoring-editor/workspace/archive'
import { EvidenceReferenceSchema, validateEvidenceReferences } from '../../../learning-engine/composition/oui/source-provenance'

export const LearningRecordSchema = z.object({
  schemaVersion: z.literal(1),
  topicId: z.string().regex(/^[\w-]+$/).max(120),
  oui: z.string().min(1).max(524288),
  sources: z.array(EvidenceReferenceSchema).max(100),
  plan: TopicPlanSchema.optional(),
  events: z.array(z.object({ id: z.string(), t: z.string(), device: z.string(), topic: z.string(), topicVersion: z.string().min(1).max(200).optional(), item: z.string(), kind: z.enum(['seen', 'answered', 'completed']), result: z.enum(['correct', 'wrong']).optional() }).strict().refine(isLearnerEvent, 'Invalid learner event')).max(10000),
}).strict().superRefine((record, context) => {
  const id = /^\/\/\s*@loom-topic\s+([\w-]+)\s*$/m.exec(record.oui)?.[1]
  if (id !== record.topicId) context.addIssue({ code: 'custom', path: ['oui'], message: 'Topic header must match topicId' })
  try {
    const topics = readTopicText(record.oui)
    if (topics.length !== 1 || topics[0].topicId !== record.topicId || !topics[0].files['topic.oui']) context.addIssue({ code: 'custom', path: ['oui'], message: 'Store exactly one canonical topic bundle with topic.oui' })
  } catch {
    context.addIssue({ code: 'custom', path: ['oui'], message: 'Topic bundle could not be read; repair it before saving' })
  }
  if (record.plan && (record.plan.topicId !== record.topicId || validateTopicPlan(record.plan, new Set([...OUI_SECTION_TYPES.values(), 'openui'])).length)) context.addIssue({ code: 'custom', path: ['plan'], message: 'Plan must be valid and belong to this topic' })
  if (record.events.some((event) => event.topic !== record.topicId)) context.addIssue({ code: 'custom', path: ['events'], message: 'Events must belong to this topic' })
  if (validateEvidenceReferences(record.sources, []).length) context.addIssue({ code: 'custom', path: ['sources'], message: 'Invalid provenance locators' })
})
export type LearningRecord = z.infer<typeof LearningRecordSchema>
export interface VersionedLearningRecord { version: string; record: LearningRecord }

/** Implement with a durable database transaction, conditional object write, or connector revision API. */
export interface LearningRecordPort {
  read(key: string): Promise<VersionedLearningRecord | null>
  /** Atomic compare-and-swap; null means another writer won. Never emulate with read then unconditional write. */
  compareAndSwap(key: string, expectedVersion: string | null, record: LearningRecord): Promise<VersionedLearningRecord | null>
}
export interface VerifiedLearner {
  /** From verified auth middleware, never a model argument or unverified request header. */
  subject: string
  scopes: readonly ('learning:read' | 'learning:write')[]
}
export class LearningRepositoryError extends Error {
  constructor(readonly code: 'FORBIDDEN' | 'VERSION_CONFLICT' | 'EVENT_CONFLICT') { super(code) }
}

/** The host must create this repository from verified identity for each request. */
export function createLearningRepository(port: LearningRecordPort, learner: VerifiedLearner) {
  const subject = learner.subject
  const scopes = new Set(learner.scopes)
  const keyFor = (topicId: string, scope: 'learning:read' | 'learning:write') => {
    if (!subject || !scopes.has(scope)) throw new LearningRepositoryError('FORBIDDEN')
    return `learners/${encodeURIComponent(subject)}/topics/${z.string().regex(/^[\w-]+$/).max(120).parse(topicId)}`
  }
  const responseOf = (saved: VersionedLearningRecord) => {
    const record = LearningRecordSchema.parse(saved.record)
    // Legacy records without versioned evidence retain their historical location
    // with sourceVerified=false; they cannot establish current objective progress.
    const source = readTopicText(record.oui)[0]
    const topicVersion = topicSourceVersion(source)
    const context = record.plan || record.events.some((event) => event.topicVersion) ? { topicVersion, files: source.files, plan: record.plan } : undefined
    return { version: saved.version, topicVersion, record, checkpoint: createLearningCheckpoint(record.topicId, record.events, context) }
  }
  return {
    async read(topicId: string) {
      const saved = await port.read(keyFor(topicId, 'learning:read'))
      if (saved && saved.record.topicId !== topicId) throw new LearningRepositoryError('FORBIDDEN')
      return saved ? responseOf(saved) : null
    },
    async write(input: unknown, expectedVersion: string | null) {
      const record = LearningRecordSchema.parse(input)
      const key = keyFor(record.topicId, 'learning:write')
      // A merge returns existing events, so write-only scope cannot disclose them.
      keyFor(record.topicId, 'learning:read')
      const saved = await port.read(key)
      if ((saved?.version ?? null) !== expectedVersion) throw new LearningRepositoryError('VERSION_CONFLICT')
      const existing = saved ? LearningRecordSchema.parse(saved.record) : null
      if (existing && existing.topicId !== record.topicId) throw new LearningRepositoryError('FORBIDDEN')
      const ids = new Map<string, LearnerEvent>()
      for (const event of [...(existing?.events ?? []), ...record.events]) {
        const prior = ids.get(event.id)
        if (prior && (['t', 'device', 'topic', 'topicVersion', 'item', 'kind', 'result'] as const).some((field) => prior[field] !== event[field])) throw new LearningRepositoryError('EVENT_CONFLICT')
        ids.set(event.id, event)
      }
      const merged = LearningRecordSchema.parse({ ...record, events: mergeEvents(existing?.events ?? [], record.events) })
      const updated = await port.compareAndSwap(key, expectedVersion, merged)
      if (!updated) throw new LearningRepositoryError('VERSION_CONFLICT')
      return responseOf(updated)
    },
  }
}
export type LearningRepository = ReturnType<typeof createLearningRepository>
