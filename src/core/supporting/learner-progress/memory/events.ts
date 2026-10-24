/**
 * Learner memory as an append-only event log (decisions 143–152 in
 * grill-log-learner-memory-review.md): what the learner met and answered,
 * one event per line. Progress and, later, review are worked out from the
 * log. Each device appends to its own file, and logs merge by union.
 */

export type LearnerEventKind = 'seen' | 'answered' | 'completed'

export interface LearnerEvent {
  /** Unique ID, so merged logs keep one copy of each event. */
  id: string
  /** When it happened, ISO 8601. */
  t: string
  /** The device (or local server) that wrote it. */
  device: string
  /** Topic ID. */
  topic: string
  /** What it is about: a section file (`sections/quiz.oui`), or an item in one (`sections/quiz.oui#q2`). */
  item: string
  kind: LearnerEventKind
  /** For `answered`: right or wrong. */
  result?: 'correct' | 'wrong'
}

/** An event before it gets its ID, time and device. */
export type NewLearnerEvent = Omit<LearnerEvent, 'id' | 't' | 'device'>

const KINDS = new Set<LearnerEventKind>(['seen', 'answered', 'completed'])

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function stampEvent(event: NewLearnerEvent, device: string, now = new Date()): LearnerEvent {
  return { id: randomId(), t: now.toISOString(), device, ...event }
}

/** Keeps only well-formed events (logs come from files and other devices). */
export function isLearnerEvent(value: unknown): value is LearnerEvent {
  const e = value as LearnerEvent
  return !!e && typeof e === 'object' && typeof e.id === 'string' && typeof e.t === 'string' && typeof e.device === 'string'
    && typeof e.topic === 'string' && typeof e.item === 'string' && KINDS.has(e.kind)
    && (e.result === undefined || e.result === 'correct' || e.result === 'wrong')
}

/** Union of event logs by ID, oldest first (decision 146). */
export function mergeEvents(...logs: LearnerEvent[][]): LearnerEvent[] {
  const byId = new Map<string, LearnerEvent>()
  for (const log of logs) for (const e of log) if (!byId.has(e.id)) byId.set(e.id, e)
  return [...byId.values()].sort((a, b) => a.t.localeCompare(b.t) || a.id.localeCompare(b.id))
}

export function toJSONL(events: LearnerEvent[]): string {
  return events.map((e) => `${JSON.stringify(e)}\n`).join('')
}

/** Reads a JSONL log, skipping lines that are not events. */
export function parseJSONL(text: string): LearnerEvent[] {
  const out: LearnerEvent[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      const value = JSON.parse(line)
      if (isLearnerEvent(value)) out.push(value)
    } catch {
      /* a half-written line */
    }
  }
  return out
}

/**
 * A section's own event (`events.ts` of each sub-context) as a learner event,
 * or null when it says nothing worth remembering.
 */
export function learnerEventOf(topic: string, section: string, event: { type: string; [key: string]: unknown }): NewLearnerEvent | null {
  const file = `sections/${section}.oui`
  switch (event.type) {
    case 'QuizOptionSelected':
      // An Evasion dodge is a retry, not an answer
      if (event.dodged) return null
      return { topic, item: `${file}#${String(event.questionId)}`, kind: 'answered', result: event.isCorrect ? 'correct' : 'wrong' }
    case 'ReflectionAnswered':
      return { topic, item: `${file}#${String(event.challengeId)}`, kind: 'answered', result: event.isCorrect ? 'correct' : 'wrong' }
    case 'FlashcardFlipped':
      return event.isFront ? null : { topic, item: `${file}#${String(event.termId)}`, kind: 'seen' }
    case 'QuizCompleted':
    case 'ReflectionCompleted':
      return { topic, item: file, kind: 'completed' }
    default:
      return null
  }
}

export interface TopicSummary {
  topic: string
  /** Sections and items met at least once. */
  seen: number
  /** Answers given, and how many were right. */
  answered: number
  correct: number
  /** Items whose latest answer was wrong. */
  missed: string[]
  completed: number
  last: string
}

/** What the log says about each topic, most recent first. */
export function summarize(events: LearnerEvent[]): TopicSummary[] {
  const topics = new Map<string, { seen: Set<string>; answered: number; correct: number; latest: Map<string, LearnerEvent['result']>; completed: Set<string>; last: string }>()
  for (const e of mergeEvents(events)) {
    const s = topics.get(e.topic) ?? { seen: new Set(), answered: 0, correct: 0, latest: new Map(), completed: new Set(), last: e.t }
    topics.set(e.topic, s)
    s.last = e.t > s.last ? e.t : s.last
    s.seen.add(e.item)
    if (e.kind === 'answered') {
      s.answered++
      if (e.result === 'correct') s.correct++
      s.latest.set(e.item, e.result)
    }
    if (e.kind === 'completed') s.completed.add(e.item)
  }
  return [...topics.entries()]
    .map(([topic, s]) => ({
      topic,
      seen: s.seen.size,
      answered: s.answered,
      correct: s.correct,
      missed: [...s.latest].filter(([, r]) => r === 'wrong').map(([item]) => item),
      completed: s.completed.size,
      last: s.last,
    }))
    .sort((a, b) => b.last.localeCompare(a.last))
}

/** The summary as text for a chat's model. */
export function summaryText(summaries: TopicSummary[]): string {
  if (summaries.length === 0) return 'No learning recorded yet.'
  return summaries.map((s) => [
    `${s.topic}: ${s.seen} parts seen, ${s.correct} of ${s.answered} answers right, ${s.completed} sections completed, last on ${s.last.slice(0, 10)}.`,
    ...(s.missed.length ? [`  Latest answer wrong: ${s.missed.join(', ')}`] : []),
  ].join('\n')).join('\n')
}
