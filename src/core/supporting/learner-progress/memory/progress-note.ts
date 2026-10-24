/**
 * The progress note (slice 6, decisions 198–203 in grill-log-adaptive-learning.md):
 * one day's learning in one topic as a short Markdown file, built from the
 * event log. The Loom MCP App's **Save my progress** sends it into the chat to
 * be saved to `Loom/<domain-id>/progress/<topic>-<date>.md` at the top of the
 * learner's drive (the domain layout, `composition/oui/storage-guide.ts`), and
 * Loom Viewer's **Copy progress for chat** copies the same note to paste. The
 * local server reads the saved notes back into `learner_summary`. Notes are
 * for models and people alike: front matter for the topic and the date, then
 * plain lists.
 */
import type { LearnerEvent } from './events'

export interface NoteTopic {
  id: string
  /** The domain the topic is kept under (`// @loom-domain`), when the topic says. */
  domain?: string
  title?: string
  /** The topic's sections in reading order: file name and title. */
  sections: Array<{ name: string; title: string }>
}

export interface ProgressNote {
  /** Where the note goes in the learner's drive. */
  path: string
  /** The topic's domain, when it names one; otherwise the chat picks it. */
  domain?: string
  text: string
  /** Nothing was played or answered that day. */
  empty: boolean
}

/** The learner's own date (`YYYY-MM-DD`), not UTC's. */
export function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Where a progress note goes; `<domain-id>` stays a placeholder when the topic names no domain. */
export function progressNotePath(topic: string, date: string, domain?: string): string {
  return `Loom/${domain ?? '<domain-id>'}/progress/${topic}-${date}.md`
}

/** `sections/quiz.oui#q2` → `quiz`. */
function sectionOf(item: string): string | undefined {
  return /^sections\/([^#]+)\.oui(?:#|$)/.exec(item)?.[1]
}

/** The day's note for one topic: what was played, every answer in order, and what to review. */
export function progressNote(topic: NoteTopic, events: LearnerEvent[], now = new Date()): ProgressNote {
  const date = localDate(now)
  const today = events
    .filter((e) => e.topic === topic.id && localDate(new Date(e.t)) === date)
    .sort((a, b) => a.t.localeCompare(b.t))
  const played = new Set(today.map((e) => sectionOf(e.item)).filter((s): s is string => !!s))
  const answers = new Map<string, Array<'correct' | 'wrong'>>()
  for (const e of today) if (e.kind === 'answered' && e.result) answers.set(e.item, [...(answers.get(e.item) ?? []), e.result])

  const titleOf = new Map(topic.sections.map((s) => [s.name, s.title]))
  const sectionLabel = (name: string) => (titleOf.get(name) && titleOf.get(name) !== name ? `${titleOf.get(name)} (\`${name}\`)` : `\`${name}\``)
  const results = [...answers.values()].map((r) => r[r.length - 1])
  const right = results.filter((r) => r === 'correct').length
  const missed = [...answers].filter(([, r]) => r[r.length - 1] === 'wrong').map(([item]) => item)
  const unplayed = topic.sections.filter((s) => !played.has(s.name))

  const lines = [
    '---',
    'loom-progress: 1',
    ...(topic.domain ? [`domain: ${topic.domain}`] : []),
    `topic: ${topic.id}`,
    `date: ${date}`,
    '---',
    `# Loom progress: ${topic.title ?? topic.id}`,
    '',
    `Played ${played.size} of ${topic.sections.length} sections${answers.size ? `; ${right} of ${answers.size} questions right in the end` : ''}.`,
    '',
    '## Sections',
    ...topic.sections.map((s) => `- [${played.has(s.name) ? 'x' : ' '}] ${sectionLabel(s.name)}`),
  ]
  if (answers.size) {
    lines.push('', '## Answers')
    for (const [item, tries] of answers) lines.push(`- \`${item}\`: ${tries.map((r) => (r === 'correct' ? 'right' : 'wrong')).join(', then ')}`)
  }
  if (missed.length || unplayed.length) {
    lines.push('', '## To review')
    for (const item of missed) lines.push(`- \`${item}\`: last answer wrong`)
    for (const s of unplayed) lines.push(`- ${sectionLabel(s.name)}: not played yet`)
  }
  return { path: progressNotePath(topic.id, date, topic.domain), domain: topic.domain, text: `${lines.join('\n')}\n`, empty: today.length === 0 }
}

/** The message that hands a note to the chat: save it with the chat's drive connector, or keep it here. */
export function progressNoteMessage(note: ProgressNote): string {
  const where = note.domain
    ? `as \`${note.path}\``
    : `as \`${note.path}\`, in the folder of the domain this topic belongs to (an existing \`Loom/<domain-id>/\` that fits, or a new domain you confirm with me first), and add \`domain: <domain-id>\` to its front matter`
  return [
    `Please save my Loom progress note ${where}. Save it at the top of my drive (My Drive in Google Drive, not a shared drive), as plain text with no conversion to a Google Doc, with your storage connector; create the folders if they are missing and replace the file if it is already there. Keep it at this path: Loom plans my next topic from this folder (follow get_storage_guide when you have it). If you cannot write files, keep it here in the conversation. Use it when you plan what I learn next.`,
    '',
    '```markdown',
    note.text.trimEnd(),
    '```',
  ].join('\n')
}
