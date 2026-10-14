/**
 * Pick tray model (grill-log-pick-and-comment.md, decisions 44–45): the
 * entries a person picked in Loom Studio or Loom Viewer, kept per topic in
 * localStorage. Line hints, "(unsaved)" and staleness are not stored; they
 * are worked out again from the current sources every time, so they follow
 * edits, saves and Refresh.
 */
import { indexStatementLines } from '../../../learning-engine/composition/oui/compile'
import {
  pickReport,
  type PickReportEntry,
  type PickSource,
} from '../../../learning-engine/composition/oui/pick-report'

export interface PickEntry {
  /** Path inside the topic folder, e.g. `sections/quiz-basics.oui`. */
  file: string
  /** Statement name plus prop path, e.g. `q2.choices[1].explanation`. */
  anchor: string
  /** For people: section title (and later an `id` prop), never copied. */
  label: string
  /** Comment; empty for a mention. */
  note: string
  /** Copy this entry even though its statement is gone. */
  keep?: boolean
}

export type PickMode = 'comment' | 'ask'

export interface PickTrayState {
  entries: PickEntry[]
  mode: PickMode
  /** Question for the Ask mode. */
  question: string
}

export const EMPTY_TRAY: PickTrayState = { entries: [], mode: 'comment', question: '' }

/** Where an entry's statement is now, or null when it no longer exists. */
export type PickResolver = (file: string, statement: string) => { line: number; unsaved?: boolean } | null

export interface ResolvedPickEntry extends PickEntry {
  line?: number
  unsaved?: boolean
  stale: boolean
}

export const pickEntryKey = (entry: Pick<PickEntry, 'file' | 'anchor'>) => `${entry.file}#${entry.anchor}`

/** `q2` from `q2.choices[1].explanation`. */
export const statementOfAnchor = (anchor: string) => /^[^.[]*/.exec(anchor)![0]

/**
 * Resolver over a topic's current sources (`topic.oui`, `sections/<name>.oui`).
 * `unsaved` lists files whose source differs from disk (Studio).
 */
export function sourceResolver(sources: Record<string, string>, unsaved: ReadonlySet<string> = new Set()): PickResolver {
  const lines = new Map<string, Map<string, number>>()
  return (file, statement) => {
    const source = sources[file]
    if (source === undefined) return null
    let index = lines.get(file)
    if (!index) lines.set(file, (index = indexStatementLines(source)))
    const line = index.get(statement)
    if (line === undefined) return null
    return unsaved.has(file) ? { line, unsaved: true } : { line }
  }
}

/** The top-level statement a 1-based line belongs to (the last one starting at or before it). */
export function statementAtLine(source: string, line: number): string | undefined {
  let found: string | undefined
  let start = 0
  for (const [statement, at] of indexStatementLines(source)) {
    if (at <= line && at >= start) {
      found = statement
      start = at
    }
  }
  return found
}

export function resolvePickEntries(entries: PickEntry[], resolve: PickResolver): ResolvedPickEntry[] {
  return entries.map((entry) => {
    const found = resolve(entry.file, statementOfAnchor(entry.anchor))
    return found ? { ...entry, ...found, stale: false } : { ...entry, stale: true }
  })
}

/** Add a pick, or leave the tray as is when that place is already in it. */
export function addPickEntry(state: PickTrayState, entry: Omit<PickEntry, 'note'>): PickTrayState {
  if (state.entries.some((e) => pickEntryKey(e) === pickEntryKey(entry))) return state
  return { ...state, entries: [...state.entries, { ...entry, note: '' }] }
}

/** The text to copy; stale entries are left out unless kept. */
export function trayReport(topicId: string, state: PickTrayState, resolve: PickResolver, source?: PickSource): string {
  const entries: PickReportEntry[] = resolvePickEntries(state.entries, resolve)
    .filter((e) => !e.stale || e.keep)
    .map((e) => ({ topicId, file: e.file, anchor: e.anchor, line: e.line, unsaved: e.unsaved, note: e.note }))
  return pickReport({ topicId, entries, source, question: state.mode === 'ask' ? state.question : undefined })
}

// --- localStorage --------------------------------------------------------------

const storageKey = (topicId: string) => `loom-pick-tray:${topicId}`

function isEntry(value: unknown): value is PickEntry {
  const e = value as PickEntry
  return !!e && typeof e.file === 'string' && typeof e.anchor === 'string' && typeof e.label === 'string' && typeof e.note === 'string'
}

/** The saved tray for a topic; empty when nothing is saved or storage is unavailable. */
export function loadPickTray(topicId: string): PickTrayState {
  try {
    const raw = localStorage.getItem(storageKey(topicId))
    if (!raw) return EMPTY_TRAY
    const parsed = JSON.parse(raw) as Partial<PickTrayState>
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries.filter(isEntry) : [],
      mode: parsed.mode === 'ask' ? 'ask' : 'comment',
      question: typeof parsed.question === 'string' ? parsed.question : '',
    }
  } catch {
    return EMPTY_TRAY
  }
}

export function savePickTray(topicId: string, state: PickTrayState): void {
  try {
    if (state.entries.length === 0 && !state.question) localStorage.removeItem(storageKey(topicId))
    else localStorage.setItem(storageKey(topicId), JSON.stringify(state))
  } catch {
    // Private windows and blocked storage: the tray just isn't kept.
  }
}
