/**
 * Staged changes of the Studio assistant (grill-log-ai-assistant.md,
 * decisions 130–135): what the edit tools change, kept over the editor
 * buffers until the author applies it.
 *
 * Changes are stored per file and per statement, with the statement as it was
 * in the buffer when staged (`base`). The staged view of a file is the
 * buffer as it is now with the pending changes applied again by name, so an
 * author's edits elsewhere in the file are kept; a statement the author
 * changed too is a conflict and stays as the buffer has it.
 *
 * topic.oui changes are metadata fields and added `SectionRef`s, applied to
 * the compiled manifest and printed back.
 */
import { compileOUITopic, type OUITopicManifest } from '../../../learning-engine/composition/oui/compile'
import { printOUITopic } from '../../../learning-engine/composition/oui/print'
import { CONTENT_ID } from '../../../learning-engine/composition/oui/catalog-gen'
import type { AssistantTopicContext } from './context'
import { fileStatements } from './context'
import { fileErrors, narrationNameOf, sectionNameOf } from './edits'

export type StagedState = 'pending' | 'applied' | 'rejected'

export interface StagedChange {
  /**
   * `replace` / `add` / `delete`: a statement (`name`); `create`: a new file
   * (`text` is the whole file); `field`: a topic metadata field (`text` and
   * `base` are JSON); `section`: a `SectionRef(name)` added to topic.oui.
   */
  kind: 'replace' | 'add' | 'delete' | 'create' | 'field' | 'section'
  name: string
  text?: string
  /** The statement (or field) in the buffer when it was staged. */
  base?: string
  /** `add` / `section`: placed after this statement or section. */
  after?: string
  state: StagedState
  /** The author's decision has been told to the model (decision 135). */
  reported?: boolean
}

export interface StagedFile {
  /** `topic.oui`, `sections/<name>.oui` or `sections/<name>.narrate.oui`. */
  file: string
  changes: StagedChange[]
  /** The edit calls' one-line summaries, in order. */
  summaries: string[]
}

export type Changeset = StagedFile[]

export type TopicField = 'title' | 'category' | 'description' | 'tags'
export const TOPIC_FIELDS: readonly TopicField[] = ['title', 'category', 'description', 'tags']

const norm = (text: string | undefined) => (text ?? '').replace(/\s+/g, ' ').trim()

export interface FileView {
  /** The file with its pending, non-conflicting changes applied; undefined when it does not exist. */
  source: string | undefined
  /** Names of pending changes that clash with the buffer. */
  conflicts: Set<string>
  /** Names of pending changes the buffer already holds. */
  done: Set<string>
}

/** Insert `text` as a statement after the statement `after` (or at the end). */
function insertStatement(source: string, text: string, after?: string): string {
  const anchor = after ? fileStatements(source).find((s) => s.name === after) : undefined
  if (anchor) return `${source.slice(0, anchor.end)}\n${text}${source.slice(anchor.end)}`
  const base = source.length === 0 || source.endsWith('\n') ? source : `${source}\n`
  return `${base}${text}\n`
}

function removeStatement(source: string, start: number, end: number): string {
  let stop = end
  while (source[stop] === ' ' || source[stop] === '\t') stop++
  if (source[stop] === '\n') stop++
  return source.slice(0, start) + source.slice(stop)
}

const fieldValue = (manifest: OUITopicManifest, field: TopicField) => JSON.stringify(manifest[field] ?? (field === 'tags' ? [] : ''))

/**
 * Apply the pending changes of `staged` (or only those named in `only`) to
 * `source`, the buffer as it is now.
 */
export function fileView(source: string | undefined, staged: StagedFile, only?: ReadonlySet<string>): FileView {
  const conflicts = new Set<string>()
  const done = new Set<string>()
  const pending = staged.changes.filter((c) => c.state === 'pending' && (!only || only.has(c.name)))
  if (!pending.length) return { source, conflicts, done }

  const create = pending.find((c) => c.kind === 'create')
  if (create) {
    if (source !== undefined) {
      if (norm(source) === norm(create.text)) done.add(create.name)
      else conflicts.add(create.name)
      return { source, conflicts, done }
    }
    return { source: create.text, conflicts, done }
  }

  if (staged.file === 'topic.oui') {
    const manifest = source === undefined ? null : compileOUITopic(source).value
    if (!manifest) {
      pending.forEach((c) => conflicts.add(c.name))
      return { source, conflicts, done }
    }
    const next: OUITopicManifest = { ...manifest, sections: [...manifest.sections] }
    let changed = false
    for (const change of pending) {
      if (change.kind === 'field') {
        const field = change.name as TopicField
        const now = fieldValue(next, field)
        if (now === change.text) done.add(change.name)
        else if (now !== change.base) conflicts.add(change.name)
        else {
          ;(next as unknown as Record<string, unknown>)[field] = JSON.parse(change.text ?? '""')
          changed = true
        }
      } else if (change.kind === 'section') {
        if (next.sections.includes(change.name)) {
          done.add(change.name)
          continue
        }
        const at = change.after ? next.sections.indexOf(change.after) : -1
        next.sections.splice(at >= 0 ? at + 1 : next.sections.length, 0, change.name)
        changed = true
      }
    }
    return { source: changed ? printOUITopic(next) : source, conflicts, done }
  }

  let current = source ?? ''
  if (source === undefined && !narrationNameOf(staged.file)) {
    pending.forEach((c) => conflicts.add(c.name))
    return { source, conflicts, done }
  }
  for (const change of pending) {
    const found = fileStatements(current).find((s) => s.name === change.name)
    if (change.kind === 'replace') {
      if (!found) conflicts.add(change.name)
      else if (norm(found.text) === norm(change.text)) done.add(change.name)
      else if (norm(found.text) !== norm(change.base)) conflicts.add(change.name)
      else current = current.slice(0, found.start) + change.text + current.slice(found.end)
    } else if (change.kind === 'delete') {
      if (!found) done.add(change.name)
      else if (norm(found.text) !== norm(change.base)) conflicts.add(change.name)
      else current = removeStatement(current, found.start, found.end)
    } else if (change.kind === 'add') {
      if (found) {
        if (norm(found.text) === norm(change.text)) done.add(change.name)
        else conflicts.add(change.name)
      } else current = insertStatement(current, change.text ?? '', change.after)
    }
  }
  return { source: current, conflicts, done }
}

/** Every file as the staged changes would leave it. */
export function stagedFiles(files: Record<string, string>, changeset: Changeset): Record<string, string> {
  const out = { ...files }
  for (const staged of changeset) {
    const view = fileView(files[staged.file], staged)
    if (view.source === undefined) delete out[staged.file]
    else out[staged.file] = view.source
  }
  return out
}

export const hasPending = (staged: StagedFile) => staged.changes.some((c) => c.state === 'pending')

/** The topic context as the staged changes would leave it: files, reading order and errors. */
export function stagedContext(context: AssistantTopicContext, changeset: Changeset): AssistantTopicContext {
  if (!changeset.some(hasPending)) return context
  const files = stagedFiles(context.files, changeset)
  const sections = compileOUITopic(files['topic.oui'] ?? '').value?.sections
  const fileOrder = sections
    ? ['topic.oui', ...sections.flatMap((name) => {
      const narration = `sections/${name}.narrate.oui`
      return files[narration] !== undefined ? [`sections/${name}.oui`, narration] : [`sections/${name}.oui`]
    })]
    : context.fileOrder
  const diagnostics = { ...context.diagnostics }
  for (const staged of changeset) {
    if (!hasPending(staged)) continue
    const errors = files[staged.file] === undefined ? [] : fileErrors(context.topicId, staged.file, files)
    if (errors.length) diagnostics[staged.file] = errors
    else delete diagnostics[staged.file]
  }
  return { ...context, files, fileOrder, diagnostics }
}

export interface StageResult {
  changeset: Changeset
  /** Why nothing was staged. */
  error?: string
  /** What was staged, for the tool result. */
  staged?: string[]
}

const replaceEntry = (changeset: Changeset, entry: StagedFile): Changeset => {
  const rest = changeset.filter((s) => s.file !== entry.file)
  return entry.changes.length ? [...rest, entry] : rest
}

const entryOf = (changeset: Changeset, file: string): StagedFile =>
  changeset.find((s) => s.file === file) ?? { file, changes: [], summaries: [] }

/** Drop the pending change of `name` (a newer one takes its place). */
const withoutPending = (changes: StagedChange[], name: string) => changes.filter((c) => !(c.state === 'pending' && c.name === name))

export interface StatementInput {
  name: string
  text: string
}

/** Parse `name = …` statements written by the model; one per name, in order. */
export function parseStatements(text: string): StatementInput[] {
  return fileStatements(text).map((s) => ({ name: s.name, text: s.text }))
}

/**
 * Stage statement changes to one file (`edit_section`): whole statements
 * replace those of the same name or are added; `remove` lists names to
 * delete. Changes to a file the changeset creates go into its new text.
 */
export function stageStatements(
  changeset: Changeset,
  files: Record<string, string>,
  file: string,
  statements: readonly StatementInput[],
  remove: readonly string[],
  summary: string,
): StageResult {
  const name = sectionNameOf(file) ?? narrationNameOf(file)
  if (file === 'topic.oui') return { changeset, error: 'Change topic.oui with edit_topic (metadata) or create_section (new sections).' }
  if (!name) return { changeset, error: `"${file}" is not sections/<name>.oui or sections/<name>.narrate.oui.` }
  if (!statements.length && !remove.length) return { changeset, error: 'Nothing to change: give statements and/or delete.' }
  const entry = entryOf(changeset, file)
  const narration = narrationNameOf(file)
  const buffer = files[file]
  const created = entry.changes.find((c) => c.kind === 'create' && c.state === 'pending')
  const view = stagedFiles(files, changeset)
  if (view[file] === undefined && !narration) {
    return { changeset, error: `${file} does not exist. Add a section with create_section.` }
  }
  if (narration && view[`sections/${narration}.oui`] === undefined) {
    return { changeset, error: `There is no section sections/${narration}.oui for this narration.` }
  }
  const staged: string[] = []

  if (created) {
    // A new file: change its text directly.
    let text = created.text ?? ''
    let after: string | undefined
    for (const statement of statements) {
      const found = fileStatements(text).find((s) => s.name === statement.name)
      if (found) text = text.slice(0, found.start) + statement.text + text.slice(found.end)
      else text = insertStatement(text, statement.text, after)
      after = statement.name
      staged.push(`${found ? 'replace' : 'add'} ${statement.name}`)
    }
    for (const gone of remove) {
      const found = fileStatements(text).find((s) => s.name === gone)
      if (!found) return { changeset, error: `${file} has no statement "${gone}" to delete.` }
      text = removeStatement(text, found.start, found.end)
      staged.push(`delete ${gone}`)
    }
    const changes = entry.changes.map((c) => (c === created ? { ...c, text } : c))
    return { changeset: replaceEntry(changeset, { ...entry, changes, summaries: [...entry.summaries, summary] }), staged }
  }

  let changes = [...entry.changes]
  const inBuffer = buffer === undefined ? [] : fileStatements(buffer)
  const inView = fileStatements(view[file] ?? '')
  let after: string | undefined
  for (const statement of statements) {
    const current = inBuffer.find((s) => s.name === statement.name)
    changes = withoutPending(changes, statement.name)
    if (current) {
      if (norm(current.text) !== norm(statement.text)) {
        changes.push({ kind: 'replace', name: statement.name, text: statement.text, base: current.text, state: 'pending' })
      }
      staged.push(`replace ${statement.name}`)
    } else {
      const position = after ?? inView.filter((s) => s.name !== statement.name).pop()?.name
      changes.push({ kind: 'add', name: statement.name, text: statement.text, ...(position ? { after: position } : {}), state: 'pending' })
      staged.push(`add ${statement.name}`)
    }
    after = statement.name
  }
  for (const gone of remove) {
    const current = inBuffer.find((s) => s.name === gone)
    const pendingAdd = changes.find((c) => c.state === 'pending' && c.kind === 'add' && c.name === gone)
    if (!current && !pendingAdd) return { changeset, error: `${file} has no statement "${gone}" to delete.` }
    changes = withoutPending(changes, gone)
    if (current) changes.push({ kind: 'delete', name: gone, base: current.text, state: 'pending' })
    staged.push(`delete ${gone}`)
  }
  return { changeset: replaceEntry(changeset, { ...entry, changes, summaries: [...entry.summaries, summary] }), staged }
}

/** Stage a new section file and its `SectionRef` (`create_section`). */
export function stageSection(
  changeset: Changeset,
  files: Record<string, string>,
  name: string,
  source: string,
  after: string | undefined,
  summary: string,
): StageResult {
  if (!CONTENT_ID.test(name)) return { changeset, error: `"${name}" is not a section name: use lowercase letters, digits, - and _.` }
  const file = `sections/${name}.oui`
  const view = stagedFiles(files, changeset)
  if (view[file] !== undefined) return { changeset, error: `${file} already exists. Change it with edit_section.` }
  if (!parseStatements(source).some((s) => s.name === 'root')) return { changeset, error: 'The source needs a `root = <Section>(...)` statement.' }
  const sections = compileOUITopic(view['topic.oui'] ?? '').value?.sections
  if (!sections) return { changeset, error: 'topic.oui does not compile, so the section cannot be listed. Fix topic.oui first.' }
  if (after && !sections.includes(after)) return { changeset, error: `There is no section "${after}" to add it after. Sections: ${sections.join(', ')}.` }
  const entry: StagedFile = { file, changes: [{ kind: 'create', name: file, text: `${source.trimEnd()}\n`, state: 'pending' }], summaries: [summary] }
  const topic = entryOf(changeset, 'topic.oui')
  const topicEntry: StagedFile = {
    ...topic,
    changes: [...withoutPending(topic.changes, name), { kind: 'section', name, ...(after ? { after } : {}), state: 'pending' }],
    summaries: [...topic.summaries, `add section ${name}`],
  }
  return { changeset: replaceEntry(replaceEntry(changeset, entry), topicEntry), staged: [`create ${file}`, `list SectionRef("${name}") in topic.oui${after ? ` after ${after}` : ''}`] }
}

/** Stage topic metadata changes (`edit_topic`). */
export function stageTopic(
  changeset: Changeset,
  files: Record<string, string>,
  patch: Partial<Record<TopicField, unknown>>,
  summary: string,
): StageResult {
  const manifest = compileOUITopic(files['topic.oui'] ?? '').value
  if (!manifest) return { changeset, error: 'topic.oui does not compile. Fix it in the editor first.' }
  const entry = entryOf(changeset, 'topic.oui')
  let changes = [...entry.changes]
  const staged: string[] = []
  for (const field of TOPIC_FIELDS) {
    const value = patch[field]
    if (value === undefined) continue
    if (field === 'tags' ? !Array.isArray(value) || value.some((t) => typeof t !== 'string') : typeof value !== 'string') {
      return { changeset, error: `${field} must be ${field === 'tags' ? 'a list of strings' : 'a string'}.` }
    }
    changes = withoutPending(changes, field)
    const base = fieldValue(manifest, field)
    const text = JSON.stringify(value)
    if (text !== base) changes.push({ kind: 'field', name: field, text, base, state: 'pending' })
    staged.push(`set ${field}`)
  }
  if (!staged.length) return { changeset, error: 'Nothing to change: give title, category, description and/or tags.' }
  return { changeset: replaceEntry(changeset, { ...entry, changes, summaries: [...entry.summaries, summary] }), staged }
}

/** Errors the staged version of `file` has that the buffer does not. */
export function newErrors(topicId: string, file: string, files: Record<string, string>, changeset: Changeset): string[] {
  const view = stagedFiles(files, changeset)
  if (view[file] === undefined) return []
  const strip = (e: string) => e.replace(/^line \d+: /, '')
  const before = new Set(files[file] === undefined ? [] : fileErrors(topicId, file, files).map(strip))
  return fileErrors(topicId, file, view).filter((e) => !before.has(strip(e)))
}

/** Mark changes of one file decided. */
export function decide(changeset: Changeset, file: string, names: ReadonlySet<string> | null, state: Exclude<StagedState, 'pending'>): Changeset {
  return changeset.map((s) => (s.file !== file
    ? s
    : { ...s, changes: s.changes.map((c) => (c.state === 'pending' && (!names || names.has(c.name)) ? { ...c, state, reported: false } : c)) }))
}

/** New section files first, then sections and narration, then topic.oui (so its SectionRefs find their files). */
export function applyRank(staged: StagedFile): number {
  if (staged.changes.some((c) => c.kind === 'create' && c.state === 'pending')) return 0
  return staged.file === 'topic.oui' ? 2 : 1
}

/**
 * What the author decided since the model last heard, and what is still
 * waiting, for the next user message (decision 135). Returns the note and
 * the changeset with those decisions marked reported.
 */
export function changesetNote(changeset: Changeset): { note: string; changeset: Changeset } {
  const lines: string[] = []
  for (const staged of changeset) {
    const fresh = staged.changes.filter((c) => c.state !== 'pending' && c.reported === false)
    if (!fresh.length) continue
    const applied = fresh.filter((c) => c.state === 'applied').map((c) => c.name)
    const rejected = fresh.filter((c) => c.state === 'rejected').map((c) => c.name)
    const parts = [applied.length ? `applied ${applied.join(', ')}` : '', rejected.length ? `rejected ${rejected.join(', ')}` : ''].filter(Boolean)
    lines.push(`- ${staged.file}: ${parts.join('; ')}`)
  }
  const waiting = changeset.filter(hasPending).map((s) => `${s.file} (${s.changes.filter((c) => c.state === 'pending').map((c) => c.name).join(', ')})`)
  if (!lines.length) return { note: '', changeset }
  const note = [
    '[Staged changes decided by the author since your last turn:',
    ...lines,
    ...(waiting.length ? [`Still staged, not decided: ${waiting.join('; ')}.`] : []),
    'Applied changes are in the buffers now; rejected ones are gone from the staged view.]',
  ].join('\n')
  return { note, changeset: changeset.map((s) => ({ ...s, changes: s.changes.map((c) => (c.reported === false ? { ...c, reported: true } : c)) })) }
}

function readChange(value: unknown): StagedChange | null {
  const c = value as Partial<StagedChange>
  if (!c || typeof c.name !== 'string' || !['replace', 'add', 'delete', 'create', 'field', 'section'].includes(c.kind as string)) return null
  const out: StagedChange = { kind: c.kind!, name: c.name, state: c.state === 'applied' || c.state === 'rejected' ? c.state : 'pending' }
  if (typeof c.text === 'string') out.text = c.text
  if (typeof c.base === 'string') out.base = c.base
  if (typeof c.after === 'string') out.after = c.after
  if (typeof c.reported === 'boolean') out.reported = c.reported
  return out
}

/** A changeset read back from storage. */
export function readChangeset(value: unknown): Changeset {
  if (!Array.isArray(value)) return []
  return value.flatMap((raw): StagedFile[] => {
    const s = raw as Partial<StagedFile>
    if (!s || typeof s.file !== 'string' || !Array.isArray(s.changes)) return []
    const changes = s.changes.map(readChange).filter((c): c is StagedChange => c !== null)
    if (!changes.length) return []
    return [{ file: s.file, changes, summaries: Array.isArray(s.summaries) ? s.summaries.filter((x): x is string => typeof x === 'string') : [] }]
  })
}
