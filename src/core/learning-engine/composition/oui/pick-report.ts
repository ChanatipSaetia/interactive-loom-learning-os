/**
 * Wording of the text Loom Studio and Loom Viewer copy from the Pick tray
 * for an AI coding agent (decisions 40–49, grill-log-pick-and-comment.md).
 * The `loom-topic-writer` skill documents the same format; keep them in step.
 * Dependency-free so the pages can format without loading the compiler.
 */

/** Where the topic the person picked from lives. */
export type PickSource =
  | { kind: 'folder' }
  /** A `.loom.oui` or `.zip` file, by name. */
  | { kind: 'archive'; name: string }
  | { kind: 'text' }

export interface PickPointer {
  topicId: string
  /** Path inside the topic folder, e.g. `sections/quiz-basics.oui`. */
  file: string
  /** Statement name plus prop path, e.g. `q2.choices[1].explanation`. */
  anchor: string
  /** Line hint: where the statement starts now. */
  line?: number
  /** The line comes from unsaved edits in Studio. */
  unsaved?: boolean
}

export interface PickReportEntry extends PickPointer {
  /** Comment for the agent; empty for a mention. */
  note: string
}

export interface PickReportInput {
  topicId: string
  entries: PickReportEntry[]
  source?: PickSource
  /** Set to ask a question about the entries instead of commenting. */
  question?: string
}

export function pickSourceNote(source?: PickSource): string {
  if (source?.kind === 'archive') return ` (in ${source.name})`
  if (source?.kind === 'text') return ' (from pasted text)'
  return ''
}

/** `kafka/sections/quiz-basics.oui:14 #q2.explanation`, plus any notes. */
export function formatPickPointer(pointer: PickPointer, source?: PickSource): string {
  const line = pointer.line ? `:${pointer.line}` : ''
  const unsaved = pointer.unsaved ? ' (unsaved)' : ''
  return `${pointer.topicId}/${pointer.file}${line} #${pointer.anchor}${unsaved}${pickSourceNote(source)}`
}

const indent = (text: string) => text.trim().split('\n').map((l) => `  ${l}`.trimEnd()).join('\n')

/**
 * The text to paste into the agent: bare pointer lines when every entry is a
 * mention, a "Comments on …" list when any entry has a note, or an
 * "Answer about … (do not change any files)" list when a question is set.
 * Empty when there is nothing to copy.
 */
export function pickReport({ topicId, entries, source, question }: PickReportInput): string {
  if (entries.length === 0) return ''
  const pointers = entries.map((e) => formatPickPointer(e, source))
  const ask = question?.trim()
  const hasNotes = entries.some((e) => e.note.trim())

  if (!ask && !hasNotes) return `${pointers.join('\n')}\n`

  const list = entries.map((e, i) => `- ${pointers[i]}${e.note.trim() ? `\n${indent(e.note)}` : ''}`).join('\n')
  if (ask) return `Answer about the Loom topic "${topicId}" (do not change any files):\n${list}\n\n${ask}\n`
  return `Comments on the Loom topic "${topicId}":\n${list}\n`
}
