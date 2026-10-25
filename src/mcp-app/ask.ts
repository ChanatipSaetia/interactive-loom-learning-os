/**
 * Pick in the Loom MCP App: the learner points at parts of the topic in Read
 * (Pick mode from Loom Viewer, grill-log-pick-and-comment.md) and asks about
 * them. The question goes into the chat as the learner's message, so the
 * chat's model answers as their tutor. Each picked place carries its pointer
 * (the model wrote the topic and can find the statement) and the words on
 * screen there, so the model knows exactly what the learner means.
 */
import type { PickSendDraft } from '../core/supporting/authoring-editor/pick'

/** Words quoted per picked place; enough to recognise it, short enough to keep the message small. */
const QUOTE_CHARS = 400

/** `q2.choices[1]` → readable; the whole section reads as "whole section". */
const placeOf = (anchor: string) => (anchor === 'root' ? 'whole section' : anchor)

export function quoteOf(text: string | null | undefined): string {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim()
  return flat.length > QUOTE_CHARS ? `${flat.slice(0, QUOTE_CHARS - 1)}…` : flat
}

/**
 * The chat message for a Send from the pick bar. `onScreen` gives the words a
 * picked place shows (empty when it is not on the page).
 */
export function pickQuestion(topic: { id: string; title?: string }, draft: PickSendDraft, onScreen: (file: string, anchor: string) => string): string {
  const message = draft.message.trim()
  if (draft.entries.length === 0) return message
  const lines = [`About ${draft.entries.length === 1 ? 'this part' : 'these parts'} of the Loom topic "${topic.title ?? topic.id}":`, '']
  for (const entry of draft.entries) {
    lines.push(`- ${entry.section ?? entry.label} › ${placeOf(entry.anchor)} (\`${topic.id}/${entry.file} #${entry.anchor}\`)`)
    const quote = quoteOf(onScreen(entry.file, entry.anchor))
    if (quote) lines.push(`  > ${quote}`)
    if (entry.note.trim()) lines.push(`  My note: ${entry.note.trim()}`)
  }
  lines.push('', message || (draft.entries.length === 1 ? 'Can you explain this?' : 'Can you explain these?'))
  return lines.join('\n')
}
