/**
 * Edits the assistant proposes in Loom Studio (grill-log-ai-assistant.md,
 * decisions 54 and 58): fenced `oui-edit file=<path>` blocks of whole
 * statements.
 *
 * A statement whose name exists in the file replaces it; a new name is added
 * after the last statement the block touched (or at the end); `name = DELETE`
 * removes one; `mode=create` makes a new section file. Statements are found
 * by name, so the model's line numbers never matter. Each block is one hunk
 * that the person applies or rejects; nothing here writes anything.
 */
import { marked, type Token } from 'marked'
import { CONTENT_ID } from '../../../learning-engine/composition/oui/catalog-gen'
import { compileOUITopic } from '../../../learning-engine/composition/oui/compile'
import { validateOUINarration, validateOUISection } from '../../../learning-engine/validation/oui-gateway'
import { NARRATION_FILE } from '../../../learning-engine/composition/oui/narration'
import { fileStatements } from './context'

export interface EditStatement {
  name: string
  text: string
  /** `name = DELETE` */
  remove: boolean
}

export interface EditBlock {
  /** Position among the reply's `oui-edit` blocks. */
  index: number
  /** Path inside the topic: `topic.oui` or `sections/<name>.oui`. */
  file: string
  create: boolean
  body: string
  statements: EditStatement[]
  /** The block cannot be applied at all (bad path, no statements). */
  error?: string
}

export const isEditLang = (lang: string | undefined) => /^oui-edit(\s|$)/.test((lang ?? '').trim())

/** `oui-edit` code blocks in document order (the order `AssistantMarkdown` renders them). */
export function editCodeTokens(text: string): Array<{ lang: string; text: string }> {
  const out: Array<{ lang: string; text: string }> = []
  const walk = (tokens: Token[]) => {
    for (const token of tokens) {
      if (token.type === 'code' && isEditLang((token as { lang?: string }).lang)) {
        out.push({ lang: (token as { lang: string }).lang, text: (token as { text: string }).text })
        continue
      }
      const nested = token as { tokens?: Token[]; items?: Array<{ tokens: Token[] }> }
      if (nested.items) nested.items.forEach((item) => walk(item.tokens))
      else if (nested.tokens) walk(nested.tokens)
    }
  }
  try {
    walk(marked.lexer(text, { gfm: true }))
  } catch {
    // Unparseable text has no blocks.
  }
  return out
}

/** `kafka/sections/a.oui` and `./sections/a.oui` → `sections/a.oui`. */
function normalizePath(raw: string): string {
  const parts = raw.replace(/^\.\//, '').split('/').filter(Boolean)
  if (parts.length === 3 && parts[1] === 'sections') parts.shift()
  if (parts.length === 2 && parts[1] === 'topic.oui') parts.shift()
  return parts.join('/')
}

const SECTION_FILE = /^sections\/([^/.]+)\.oui$/

/** The section name of `sections/<name>.oui`, or undefined. */
export const sectionNameOf = (file: string) => SECTION_FILE.exec(file)?.[1]

/** The section name of a narration file `sections/<name>.narrate.oui`, or undefined. */
export const narrationNameOf = (file: string) => NARRATION_FILE.exec(file)?.[1]

export function parseEditBlock(lang: string, body: string, index: number): EditBlock {
  const fileMatch = /\bfile=("?)([^\s"]+)\1/.exec(lang)
  const create = /\bmode=create\b/.test(lang)
  const file = fileMatch ? normalizePath(fileMatch[2]) : ''
  const block: EditBlock = { index, file, create, body, statements: [] }
  if (!file) return { ...block, error: 'The block has no file=… path.' }
  const name = sectionNameOf(file) ?? narrationNameOf(file)
  if (file !== 'topic.oui' && (!name || !CONTENT_ID.test(name))) {
    return { ...block, error: `"${file}" is not topic.oui, sections/<name>.oui or sections/<name>.narrate.oui (lowercase letters, digits, - and _).` }
  }
  if (create && file === 'topic.oui') return { ...block, error: 'topic.oui already exists; change it without mode=create.' }
  block.statements = fileStatements(body).map((s) => ({ name: s.name, text: s.text, remove: /^\S+\s*=\s*DELETE\s*$/.test(s.text) }))
  if (block.statements.length === 0) return { ...block, error: 'The block holds no `name = …` statements.' }
  return block
}

/** Every `oui-edit` block of a reply. */
export function parseEditBlocks(text: string): EditBlock[] {
  return editCodeTokens(text).map((code, index) => parseEditBlock(code.lang, code.text, index))
}

export interface StatementChange {
  name: string
  kind: 'replace' | 'add' | 'delete' | 'create'
  before?: string
  after?: string
}

export interface HunkResult {
  ok: boolean
  /** The file after the edit (when ok). */
  source: string
  changes: StatementChange[]
  error?: string
}

const fail = (source: string, error: string): HunkResult => ({ ok: false, source, changes: [], error })

/** Apply one block to the current text of its file (undefined when the file does not exist). */
export function applyEditBlock(source: string | undefined, block: EditBlock): HunkResult {
  if (block.error) return fail(source ?? '', block.error)
  if (block.create) {
    if (source !== undefined) return fail(source, `${block.file} already exists; change its statements without mode=create.`)
    return { ok: true, source: `${block.body.trimEnd()}\n`, changes: [{ name: block.file, kind: 'create', after: block.body.trimEnd() }] }
  }
  if (source === undefined) return fail('', `${block.file} does not exist. To add a section, use mode=create.`)

  let current = source
  let insertAt: number | null = null
  const changes: StatementChange[] = []
  for (const statement of block.statements) {
    const found = fileStatements(current).find((s) => s.name === statement.name)
    if (statement.remove) {
      if (!found) return fail(source, `${block.file} has no statement "${statement.name}" to delete.`)
      let end = found.end
      while (current[end] === ' ' || current[end] === '\t') end++
      if (current[end] === '\n') end++
      current = current.slice(0, found.start) + current.slice(end)
      insertAt = found.start
      changes.push({ name: statement.name, kind: 'delete', before: found.text })
    } else if (found) {
      current = current.slice(0, found.start) + statement.text + current.slice(found.end)
      insertAt = found.start + statement.text.length
      changes.push({ name: statement.name, kind: 'replace', before: found.text, after: statement.text })
    } else if (insertAt !== null) {
      current = `${current.slice(0, insertAt)}\n${statement.text}${current.slice(insertAt)}`
      insertAt += statement.text.length + 1
      changes.push({ name: statement.name, kind: 'add', after: statement.text })
    } else {
      const base = current.length === 0 || current.endsWith('\n') ? current : `${current}\n`
      current = `${base}${statement.text}\n`
      insertAt = base.length + statement.text.length
      changes.push({ name: statement.name, kind: 'add', after: statement.text })
    }
  }
  return { ok: true, source: current, changes }
}

/** New section files first, then sections, then topic.oui (so its SectionRefs find their files). */
export function applyOrder(blocks: readonly EditBlock[]): EditBlock[] {
  const rank = (b: EditBlock) => (b.create ? 0 : b.file === 'topic.oui' ? 2 : 1)
  return [...blocks].sort((a, b) => rank(a) - rank(b) || a.index - b.index)
}

const describe = (d: { line?: number; message: string; fixHint?: string }) =>
  `${d.line ? `line ${d.line}: ` : ''}${d.message}${d.fixHint ? ` (fix: ${d.fixHint})` : ''}`

/** Errors (tiers 1–2) of a file as it would be; topic.oui is checked against the files it lists. */
export function fileErrors(topicId: string, file: string, files: Record<string, string>): string[] {
  const source = files[file]
  if (source === undefined) return []
  if (file === 'topic.oui') {
    const topic = compileOUITopic(source)
    const errors = topic.issues.filter((i) => i.tier < 3).map(describe)
    for (const name of topic.value?.sections ?? []) {
      if (files[`sections/${name}.oui`] === undefined) errors.push(`SectionRef("${name}") has no sections/${name}.oui.`)
    }
    return errors
  }
  const narrated = narrationNameOf(file)
  if (narrated) {
    return validateOUINarration(source, files[`sections/${narrated}.oui`], { topicId, sectionName: narrated, file })
      .diagnostics.filter((d) => d.tier < 3)
      .map(describe)
  }
  const name = sectionNameOf(file) ?? file
  return validateOUISection(source, { topicId, sectionName: name, file })
    .diagnostics.filter((d) => d.tier < 3)
    .map(describe)
}

export interface ProposalCheck {
  /** Per block, in reply order. */
  results: HunkResult[]
  /** What would be wrong after applying every block: failed blocks and new errors. */
  problems: string[]
}

/**
 * Dry run of a whole proposal against the current files: apply every block
 * (new files, then sections, then topic.oui) and validate the touched files.
 * Errors a file already had are not counted.
 */
export function checkProposal(topicId: string, blocks: readonly EditBlock[], files: Record<string, string>): ProposalCheck {
  const next = { ...files }
  const results: HunkResult[] = []
  const problems: string[] = []
  for (const block of applyOrder(blocks)) {
    const result = applyEditBlock(next[block.file], block)
    results[block.index] = result
    if (result.ok) next[block.file] = result.source
    else problems.push(`${block.file || 'oui-edit block'}: ${result.error}`)
  }
  const touched = [...new Set(blocks.filter((block) => results[block.index]?.ok).map((block) => block.file))]
  for (const file of touched) {
    const before = new Set(files[file] === undefined ? [] : fileErrors(topicId, file, files).map((e) => e.replace(/^line \d+: /, '')))
    for (const error of fileErrors(topicId, file, next)) {
      if (!before.has(error.replace(/^line \d+: /, ''))) problems.push(`${file} ${error}`)
    }
  }
  // A new section that topic.oui does not list is never shown.
  const listed = compileOUITopic(next['topic.oui'] ?? '').value?.sections ?? []
  for (const block of blocks) {
    const name = sectionNameOf(block.file)
    if (block.create && results[block.index]?.ok && name && !listed.includes(name)) {
      problems.push(`${block.file} is new but topic.oui does not list SectionRef("${name}"); add an oui-edit block for topic.oui.`)
    }
  }
  return { results, problems }
}

export interface DiffLine {
  kind: 'same' | 'add' | 'remove'
  text: string
}

/** Line diff (longest common subsequence), for the edit cards. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before ? before.split('\n') : []
  const b = after ? after.split('\n') : []
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) out.push({ kind: 'remove', text: a[i++] })
    else out.push({ kind: 'add', text: b[j++] })
  }
  while (i < a.length) out.push({ kind: 'remove', text: a[i++] })
  while (j < b.length) out.push({ kind: 'add', text: b[j++] })
  return out
}
