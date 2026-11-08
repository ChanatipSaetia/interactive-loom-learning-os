/**
 * The <topic-context> block of an assistant user turn (grill-log-ai-assistant.md,
 * decisions 56, 59 and 63): the topic outline, the current source of the
 * picked statements, the reference entries of the components they call and
 * the current errors; in Viewer also where the person is (mode and the
 * section in view, whose file is sent whole).
 *
 * It is built from the current sources when a message is sent, so after an
 * edit (or unsaved changes in Studio) the model sees the text as it is now,
 * not a snapshot from when the place was picked. A statement-level pick
 * sends the statement plus the statements it references by name, one level
 * deep; a whole-section pick (`#root`) sends the whole file.
 *
 * The block is stored with its message and sent unchanged with every later
 * request, so the conversation is a stable prefix that servers can cache.
 * Each part it sends gets a key (`keys`); given the keys of the earlier
 * blocks still in the history (`known`), a new block leaves out what they
 * already carry and sends only what is new or changed.
 */
import { fileStatements, textHash, type FileStatement } from './statements'
export { fileStatements, textHash } from './statements'
export type { FileStatement } from './statements'
import { statementOfAnchor } from '../pick/tray'
import { pickSourceNote, type PickSource } from '../../../learning-engine/composition/oui/pick-report'
import { componentClosure, componentEntries } from '../../../learning-engine/composition/oui/assistant-prompt'
import { sectionTitle } from '../../../learning-engine/composition/oui/content-tree'

export interface AssistantTopicContext {
  topicId: string
  /** Current sources by path (`topic.oui`, `sections/<name>.oui`), unsaved edits included. */
  files: Record<string, string>
  /** Reading order: topic.oui, then the sections as the topic lists them. */
  fileOrder: readonly string[]
  /** Current errors by path, one line each (`line 3: …`). */
  diagnostics: Record<string, string[]>
  /** Files whose source differs from disk (Studio). */
  unsaved?: ReadonlySet<string>
  /** Where the topic was opened from (Viewer). */
  source?: PickSource
  /** Where the person is in the topic (Viewer): the mode and the section file in view, sent whole (decision 119). */
  view?: AssistantView
}

export interface AssistantView {
  mode: 'read' | 'present'
  /** `sections/<name>.oui` of the section in view, if any. */
  file?: string
}

export interface ContextPointer {
  file: string
  anchor: string
}


/** `sections/quiz.oui (Quiz "Knowledge Check")`, or `(standard OpenUI "…")` (titles: decision 127). */
function describeFile(file: string, source: string | undefined, statements: FileStatement[] | undefined): string {
  if (source === undefined) return `${file} (missing)`
  const title = file === 'topic.oui' ? undefined : sectionTitle(source)
  const titled = title ? ` "${title}"` : ''
  const root = statements?.find((s) => s.name === 'root')
  return root?.component ? `${file} (${root.component}${titled})` : file
}

const MAX_DIAGNOSTICS = 30

export interface TopicContextBlock {
  /** The <topic-context> block, or '' when there is nothing new to send. */
  text: string
  /** Components called by the source the block carries (for the reference entries). */
  components: string[]
  /** Files the block carries source from. */
  files: string[]
  /** One key per part sent (outline, statement, file, errors, component entry); `known` for later blocks. */
  keys: string[]
}

export interface TopicContextOptions {
  /** Keys of the blocks earlier in the history: parts with these keys are left out. */
  known?: ReadonlySet<string>
  /** Add reference entries for the components the sent source calls (not with Full reference). */
  reference?: boolean
  /** Send the section in view whole (default); off when the model can read it with the content tools (decision 127). */
  wholeView?: boolean
}

/** The <topic-context> block for a message about `pointers` (all picks of the thread). */
export function buildTopicContext(context: AssistantTopicContext, pointers: readonly ContextPointer[], options: TopicContextOptions = {}): TopicContextBlock {
  const known = options.known ?? new Set<string>()
  const keys: string[] = []
  const parsed = new Map<string, FileStatement[]>()
  const statementsOf = (file: string) => {
    if (!parsed.has(file)) parsed.set(file, context.files[file] === undefined ? [] : fileStatements(context.files[file]))
    return parsed.get(file)!
  }

  // Which statements each file sends: the picked ones and what they reference; `#root` sends the file.
  const wanted = new Map<string, Set<string> | 'all'>()
  for (const pointer of pointers) {
    if (context.files[pointer.file] === undefined) continue
    if (pointer.anchor === 'root') {
      wanted.set(pointer.file, 'all')
      continue
    }
    const current = wanted.get(pointer.file)
    if (current === 'all') continue
    const set = current ?? new Set<string>()
    const name = statementOfAnchor(pointer.anchor)
    const statement = statementsOf(pointer.file).find((s) => s.name === name)
    if (!statement) continue
    set.add(name)
    statement.refs.forEach((ref) => set.add(ref))
    wanted.set(pointer.file, set)
  }

  // The section in view goes whole, so "explain this" works without a pick.
  const viewFile = context.view?.file
  if (viewFile && context.files[viewFile] !== undefined && options.wholeView !== false) wanted.set(viewFile, 'all')

  const order = [...context.fileOrder, ...Object.keys(context.files).filter((f) => !context.fileOrder.includes(f)).sort()]
  const contextFiles = order.filter((file) => wanted.has(file))
  const components = new Set<string>()
  const collect = (_file: string, statements: FileStatement[]) => statements.forEach((statement) => statement.calls.forEach((component) => components.add(component)))
  const sections: string[][] = []

  const outline: string[] = []
  const note = pickSourceNote(context.source).trim()
  if (note) outline.push(`Opened ${note.replace(/^\(|\)$/g, '')}.`, '')
  outline.push('## Outline', '')
  for (const file of order) {
    const statements = context.files[file] === undefined ? undefined : statementsOf(file)
    let line = `- ${describeFile(file, context.files[file], statements)}`
    if (wanted.has(file) && statements?.length) {
      line += `: ${statements.map((s) => (s.component ? `${s.name} ${s.component}` : s.name)).join(', ')}`
    }
    outline.push(line)
  }
  const outlineKey = `outline:${textHash(outline.join('\n'))}`
  if (!known.has(outlineKey)) {
    sections.push(outline)
    keys.push(outlineKey)
  }

  if (context.view) {
    const mode = context.view.mode === 'present' ? 'Present mode (the topic plays itself, beat by beat, with a narrator)' : 'Read mode'
    const at = viewFile && context.files[viewFile] !== undefined ? `, at ${describeFile(viewFile, context.files[viewFile], statementsOf(viewFile))}` : ''
    const view = ['## On Screen', '', `${mode}${at}${viewFile && options.wholeView === false ? ' (not included: read it when you need it)' : ''}.`]
    const viewKey = `view:${textHash(view.join('\n'))}`
    if (!known.has(viewKey)) {
      sections.push(view)
      keys.push(viewKey)
    }
  }

  const sentFiles: string[] = []
  const source: string[] = []
  for (const file of contextFiles) {
    const want = wanted.get(file)!
    const statements = statementsOf(file)
    const text = context.files[file]
    const fileKey = `file:${file}:${textHash(text)}`
    // The whole file went earlier and has not changed since: nothing in it to repeat.
    if (known.has(fileKey)) continue
    const unsaved = context.unsaved?.has(file) ? ' (unsaved edits)' : ''
    let body: string
    if (want === 'all') {
      body = text.trimEnd()
      collect(file, statements)
      source.push('', `### ${file} (whole file)${unsaved}`)
      keys.push(fileKey)
    } else {
      const chosen = statements.filter((s) => want.has(s.name) && !known.has(statementKey(file, s)))
      if (!chosen.length) continue
      collect(file, chosen)
      chosen.forEach((s) => keys.push(statementKey(file, s)))
      body = chosen.map((s) => s.text).join('\n')
      source.push('', `### ${file}${unsaved}: ${chosen.map((s) => `${s.name} (line ${s.line})`).join(', ')}`)
    }
    source.push('```oui', body, '```')
    sentFiles.push(file)
  }
  if (source.length) sections.push(['## Current Source', ...source])

  if (options.reference) {
    const entries = componentClosure(components, undefined, 'selected').filter((name) => !known.has(`component:${name}`))
    if (entries.length) {
      sections.push(['## Components', '', 'Arguments marked with ? are optional.', '', componentEntries(entries)])
      entries.forEach((name) => keys.push(`component:${name}`))
    }
  }

  // Errors for the files in context; with nothing picked, for the whole topic.
  const errorFiles = (contextFiles.length ? contextFiles : order).filter((file) => context.diagnostics[file]?.length)
  const errors: string[] = []
  for (const file of errorFiles) {
    const lines = context.diagnostics[file]
    errors.push('', `### ${file}`, ...lines.slice(0, MAX_DIAGNOSTICS).map((d) => `- ${d}`))
    if (lines.length > MAX_DIAGNOSTICS) errors.push(`- … ${lines.length - MAX_DIAGNOSTICS} more`)
  }
  const errorsKey = `errors:${textHash(errors.join('\n'))}`
  // "None" is only news once errors were reported earlier.
  const reportedBefore = [...known].some((key) => key.startsWith('errors:'))
  if (!known.has(errorsKey) && (errors.length || reportedBefore)) {
    sections.push(['## Current Errors', ...(errors.length ? errors : ['', 'None.'])])
    keys.push(errorsKey)
  }

  const text = sections.length ? [`<topic-context topic="${context.topicId}">`, ...sections.flatMap((s, i) => (i ? ['', ...s] : s)), '</topic-context>'].join('\n') : ''
  return { text, components: [...components], files: sentFiles, keys }
}

const statementKey = (file: string, statement: FileStatement) => `src:${file}#${statement.name}:${textHash(statement.text)}`
