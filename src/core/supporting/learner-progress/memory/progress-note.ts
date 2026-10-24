/**
 * The progress note (slice 6, decisions 198–203 in grill-log-adaptive-learning.md):
 * one day's learning in one topic as a short Markdown file, built from the
 * event log. The Loom MCP App's **Save my progress** sends it into the chat to
 * be saved to `Loom/progress/<topic>-<date>.md` in the learner's drive, and
 * Loom Viewer's **Copy progress for chat** copies the same note to paste. The
 * local server reads the saved notes back into `learner_summary`. Notes are
 * for models and people alike: front matter for the topic and the date, then
 * plain lists.
 */
import type { LearnerEvent } from './events'

export interface NoteTopic {
  id: string
  title?: string
  /** The topic's sections in reading order: file name and title. */
  sections: Array<{ name: string; title: string }>
}

export interface ProgressNote {
  /** Where the note goes in the learner's drive. */
  path: string
  text: string
  /** Nothing was played or answered that day. */
  empty: boolean
}

/** The learner's own date (`YYYY-MM-DD`), not UTC's. */
export function localDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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
  return { path: `Loom/progress/${topic.id}-${date}.md`, text: `${lines.join('\n')}\n`, empty: today.length === 0 }
}

/** The message that hands a note to the chat: save it with the chat's drive connector, or keep it here. */
export function progressNoteMessage(note: ProgressNote): string {
  return [
    `Please save my Loom progress note as \`${note.path}\` in my drive with your storage connector (create the folders if they are missing, and replace the file if it is already there). If you cannot write files, keep it here in the conversation. Use it when you plan what I learn next.`,
    '',
    '```markdown',
    note.text.trimEnd(),
    '```',
  ].join('\n')
}
