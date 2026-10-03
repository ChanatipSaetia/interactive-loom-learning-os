/**
 * OpenUI Lang → Loom compiler
 *
 * Pipeline for one `.oui` file:
 *   1. Parse with the OpenUI parser against the Loom library schema.
 *   2. Evaluate dynamic props (`$state`, `@builtins`, ternaries) using the
 *      declared `$state` defaults — Loom content is static once loaded.
 *   3. Walk the element tree bottom-up, running each component's `toData`
 *      mapper, so a section root becomes the subdomain's section data.
 *
 * A section file that starts with `// @openui "Title"` is instead a standard
 * OpenUI program (see `progressive-content/openui-standard.ts`): it is parsed
 * against the `@openuidev/react-ui` library and kept verbatim as an `openui`
 * section.
 *
 * Issues found along the way are reported with the statement ID and source
 * line they came from. Compiled objects are tracked in a source map so later
 * validation tiers can point back at the line that produced a value.
 */
import {
  createParser,
  evaluateElementProps,
  type ElementNode,
  type OpenUIError,
  type ParseResult,
  type Parser,
} from '@openuidev/lang-core'
import { getLoomOUIComponent, getLoomOUIJSONSchema, loomOUILibrary, OUI_SECTION_TYPES } from './library'
import {
  OPENUI_SECTION_TYPE,
  openUIProgramOf,
  readOpenUIDirective,
  standardOpenUISchema,
  type OpenUIDirective,
} from '../../sub-contexts/progressive-content/openui-standard'
import type { OKFSectionData, OKFSectionMeta } from '../okf/types'

// ============================================================================
// Types
// ============================================================================

export type OUIIssueCode =
  | 'parse-failed'
  | 'parse-exception'
  | 'incomplete'
  | 'unresolved-reference'
  | 'unknown-component'
  | 'missing-required'
  | 'null-required'
  | 'excess-args'
  | 'type-mismatch'
  | 'inline-reserved'
  | 'runtime-error'
  | 'unsupported-feature'
  | 'wrong-root'
  | 'unused-statement'

export interface OUIIssue {
  /** Validation tier this issue belongs to (see the Validation Gateway). */
  tier: 1 | 2 | 3
  code: OUIIssueCode
  message: string
  fixHint?: string
  statementId?: string
  line?: number
  component?: string
  /** Prop path inside the component, e.g. "/explanation". */
  path?: string
}

export interface OUISourceMap {
  /** 1-based line of the statement that defines `statementId`. */
  lineOf(statementId: string): number | undefined
  /** Statement that produced a compiled object, if known. */
  statementOf(value: unknown): string | undefined
}

export interface OUICompileResult<T> {
  /** Compiled value, or null when nothing usable could be compiled. */
  value: T | null
  /** OpenUI component name of the root element. */
  rootComponent?: string
  issues: OUIIssue[]
  sourceMap: OUISourceMap
}

export interface OUISectionPayload {
  meta: OKFSectionMeta
  data: OKFSectionData
}

export interface OUITopicManifest {
  title: string
  category: string
  description: string
  sections: string[]
  tags?: string[]
  difficulty?: string
  updatedAt?: string
  isNew?: boolean
}

export interface OUICatalogManifest {
  topics: string[]
}

// ============================================================================
// Statement → line index
// ============================================================================

/**
 * Find the 1-based line on which each top-level statement starts.
 * Statements may span lines (open brackets), so this tracks bracket depth,
 * strings and `//` comments rather than matching line by line.
 */
export function indexStatementLines(source: string): Map<string, number> {
  const lines = new Map<string, number>()
  let depth = 0
  let line = 1
  let atStatementStart = true
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (ch === '\n') {
      line++
      if (depth === 0) atStatementStart = true
      i++
      continue
    }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (ch === '"' || ch === "'") {
      i++
      while (i < source.length && source[i] !== ch && source[i] !== '\n') {
        if (source[i] === '\\') i++
        i++
      }
      i++
      atStatementStart = false
      continue
    }
    if (atStatementStart && depth === 0 && /[$A-Za-z_]/.test(ch)) {
      const match = /^(\$?[A-Za-z_][\w]*)\s*=(?!=)/.exec(source.slice(i))
      if (match && !lines.has(match[1])) lines.set(match[1], line)
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1)
    if (!/\s/.test(ch)) atStatementStart = false
    i++
  }
  return lines
}

// ============================================================================
// Parsing
// ============================================================================

let parser: Parser | null = null
let standardParser: Parser | null = null

function getParser(): Parser {
  parser ??= createParser(getLoomOUIJSONSchema())
  return parser
}

function getStandardParser(): Parser {
  standardParser ??= createParser(standardOpenUISchema)
  return standardParser
}

const ERROR_TIERS: Record<string, 1 | 2> = {
  'parse-failed': 1,
  'parse-exception': 1,
  'unknown-component': 1,
  'inline-reserved': 1,
  'missing-required': 2,
  'null-required': 2,
  'excess-args': 2,
  'type-mismatch': 2,
  'runtime-error': 2,
}

const FIX_HINTS: Partial<Record<OUIIssueCode, string>> = {
  'unknown-component': 'Use a component from the Loom library (check spelling and capitalization).',
  'missing-required': 'Add the missing positional argument. Arguments are positional, in the order shown in the signature.',
  'null-required': 'Replace null with a value; this argument is required.',
  'excess-args': 'Remove the extra arguments; the component takes fewer positional arguments.',
  'type-mismatch': 'Pass a value of the expected type; strings need double quotes, booleans are true/false.',
  'inline-reserved': 'Query()/Mutation() must be top-level statements — and are not supported in Loom content.',
  'runtime-error': 'Check the expression; it must evaluate with the declared $state defaults.',
}

function toIssue(error: { code: string; message: string; statementId?: string; component?: string; path?: string; hint?: string }, lines: Map<string, number>): OUIIssue {
  const code = error.code as OUIIssueCode
  return {
    tier: ERROR_TIERS[code] ?? 1,
    code,
    message: error.message,
    fixHint: error.hint ?? FIX_HINTS[code],
    statementId: error.statementId,
    line: error.statementId ? lines.get(error.statementId) : undefined,
    component: error.component,
    path: error.path,
  }
}

interface ParsedProgram {
  result: ParseResult | null
  issues: OUIIssue[]
  lines: Map<string, number>
}

function parseProgram(source: string, programParser: Parser = getParser()): ParsedProgram {
  const lines = indexStatementLines(source)
  const issues: OUIIssue[] = []

  let result: ParseResult
  try {
    result = programParser.parse(source)
  } catch (e) {
    issues.push({
      tier: 1,
      code: 'parse-exception',
      message: `OpenUI parser failed: ${e instanceof Error ? e.message : String(e)}`,
      fixHint: 'Check for unbalanced brackets, unterminated strings, or invalid characters.',
    })
    return { result: null, issues, lines }
  }

  for (const error of result.meta.errors ?? []) issues.push(toIssue(error, lines))

  if (result.meta.incomplete) {
    issues.push({
      tier: 1,
      code: 'incomplete',
      message: 'The file ends inside an unfinished statement (unclosed bracket or string).',
      fixHint: 'Close every "(", "[", "{" and string literal.',
    })
  }
  for (const name of result.meta.unresolved ?? []) {
    issues.push({
      tier: 1,
      code: 'unresolved-reference',
      message: `Reference "${name}" is used but never defined.`,
      fixHint: `Define it with \`${name} = …\` or fix the spelling.`,
    })
  }
  for (const name of result.meta.orphaned ?? []) {
    issues.push({
      tier: 3,
      code: 'unused-statement',
      message: `Statement "${name}" is defined but never used, so it is ignored.`,
      fixHint: `Reference "${name}" from its parent, or delete it.`,
      statementId: name,
      line: lines.get(name),
    })
  }
  const dataStatements = [...(result.queryStatements ?? []), ...(result.mutationStatements ?? [])]
  for (const stmt of dataStatements) {
    issues.push({
      tier: 1,
      code: 'unsupported-feature',
      message: `Query()/Mutation() ("${stmt.statementId}") is not supported in Loom content.`,
      fixHint: 'Loom content is static; inline the data instead of fetching it.',
      statementId: stmt.statementId,
      line: lines.get(stmt.statementId),
    })
  }
  if (!result.root) {
    issues.push({
      tier: 1,
      code: 'parse-failed',
      message: 'No `root = …` statement was found, so nothing can be rendered.',
      fixHint: 'Add a `root = Component(…)` statement.',
    })
  }

  return { result, issues, lines }
}

// ============================================================================
// Evaluation & compilation
// ============================================================================

function isElement(value: unknown): value is ElementNode {
  return !!value && typeof value === 'object' && (value as ElementNode).type === 'element'
}

function stripUndefined<T>(value: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      if ((value as Record<string, unknown>)[key] === undefined) delete (value as Record<string, unknown>)[key]
    }
  }
  return value
}

function evaluateDynamicProps(root: ElementNode, stateDefaults: Record<string, unknown>, lines: Map<string, number>, issues: OUIIssue[]): ElementNode {
  const errors: OpenUIError[] = []
  const evaluated = evaluateElementProps(root, {
    ctx: {
      getState: (name) => stateDefaults[name],
      resolveRef: () => undefined,
    },
    library: loomOUILibrary,
    store: null,
    errors,
  })
  for (const error of errors) issues.push(toIssue(error, lines))
  return evaluated
}

/**
 * Compile a (props-evaluated) element tree to plain data by running each
 * component's `toData` bottom-up. Exported for renderers that receive
 * already-evaluated elements from `<Renderer>`.
 */
export function compileElementTree(root: ElementNode, track?: (value: unknown, statementId: string) => void): unknown {
  const visit = (value: unknown, statementId: string | undefined): unknown => {
    if (Array.isArray(value)) return value.map((v) => visit(v, statementId))
    if (isElement(value)) {
      const owner = value.statementId ?? statementId
      const props: Record<string, unknown> = {}
      for (const [key, prop] of Object.entries(value.props)) {
        // `null` skips an optional positional argument; treat it as omitted.
        if (prop !== null) props[key] = visit(prop, owner)
      }
      const component = getLoomOUIComponent(value.typeName)
      const data = stripUndefined(component ? component.toData(props) : props)
      if (owner && data && typeof data === 'object') track?.(data, owner)
      return data
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [key, v] of Object.entries(value)) out[key] = visit(v, statementId)
      return out
    }
    return value
  }
  return visit(root, root.statementId)
}

function compileProgram(source: string): OUICompileResult<unknown> & { root: ElementNode | null } {
  const { result, issues, lines } = parseProgram(source)
  const statements = new WeakMap<object, string>()
  const sourceMap: OUISourceMap = {
    lineOf: (id) => lines.get(id),
    statementOf: (value) => (value && typeof value === 'object' ? statements.get(value) : undefined),
  }
  if (!result?.root) return { value: null, issues, sourceMap, root: null }

  const stateDefaults = (result.stateDeclarations ?? {}) as Record<string, unknown>
  const root = evaluateDynamicProps(result.root, stateDefaults, lines, issues)
  const value = compileElementTree(root, (data, id) => statements.set(data as object, id))
  return { value, rootComponent: root.typeName, issues, sourceMap, root }
}

function wrongRoot(expected: string, actual: string | undefined): OUIIssue {
  return {
    tier: 1,
    code: 'wrong-root',
    message: `Expected root to be ${expected}, but found ${actual ?? 'nothing'}.`,
    fixHint: `Start the file with \`root = ${expected.split(' ')[0]}(…)\`.`,
    statementId: 'root',
  }
}

// ============================================================================
// Public entry points
// ============================================================================

/** Build OKF-compatible section meta from a section root's (evaluated) props. */
function sectionMetaFrom(root: ElementNode, sectionType: string): OKFSectionMeta {
  const props = root.props as Record<string, unknown>
  const meta: OKFSectionMeta = { type: sectionType, title: (props.title as string) ?? '', resource: '.' }
  if (typeof props.heading === 'string') meta.heading = props.heading
  if (typeof props.ordered === 'boolean') meta.ordered = props.ordered
  if (isElement(props.lead)) meta.intro = compileElementTree(props.lead) as OKFSectionMeta['intro']
  return meta
}

/**
 * Compile an evaluated section element (e.g. one handed to a `<Renderer>`
 * component) to section meta + data. Returns null for non-section elements.
 */
export function compileSectionElement(root: ElementNode): OUISectionPayload | null {
  const sectionType = OUI_SECTION_TYPES.get(root.typeName)
  if (!sectionType) return null
  return {
    meta: sectionMetaFrom(root, sectionType),
    data: compileElementTree(root) as OKFSectionData,
  }
}

/**
 * Compile a standard OpenUI section (`// @openui "Title"` directive). The
 * program is only parsed — to report syntax and schema issues against the
 * standard library — and kept verbatim; it is rendered by OpenUI itself.
 */
function compileStandardOpenUISection(source: string, directive: OpenUIDirective): OUICompileResult<OUISectionPayload> {
  const { result, issues, lines } = parseProgram(source, getStandardParser())
  const sourceMap: OUISourceMap = {
    lineOf: (id) => lines.get(id),
    statementOf: () => undefined,
  }
  for (const issue of issues) {
    if (issue.code === 'unknown-component') {
      issue.fixHint = 'Use a component from the standard OpenUI library (see the OpenUI section guide), or remove the `// @openui` line to write a Loom section.'
    }
  }
  if (!result?.root) return { value: null, issues, sourceMap }

  const meta: OKFSectionMeta = { type: OPENUI_SECTION_TYPE, title: directive.title, resource: '.' }
  if (directive.heading) meta.heading = directive.heading
  return {
    value: { meta, data: { type: OPENUI_SECTION_TYPE, source: openUIProgramOf(source) } },
    rootComponent: result.root.typeName,
    issues,
    sourceMap,
  }
}

/**
 * Compile a section `.oui` file: either a Loom section (root must be a
 * section component) or a standard OpenUI program behind an `// @openui` directive.
 */
export function compileOUISection(source: string): OUICompileResult<OUISectionPayload> {
  const directive = readOpenUIDirective(source)
  if (directive) return compileStandardOpenUISection(source, directive)

  const program = compileProgram(source)
  const { root, issues, sourceMap, rootComponent } = program
  if (!root) return { value: null, issues, sourceMap }

  const sectionType = OUI_SECTION_TYPES.get(root.typeName)
  if (!sectionType) {
    const lineIssue = wrongRoot('a section component', root.typeName)
    lineIssue.line = sourceMap.lineOf('root')
    lineIssue.fixHint = `Use one of: ${[...OUI_SECTION_TYPES.keys()].join(', ')}.`
    return { value: null, rootComponent, issues: [...issues, lineIssue], sourceMap }
  }

  return {
    value: {
      meta: sectionMetaFrom(root, sectionType),
      data: program.value as OKFSectionData,
    },
    rootComponent,
    issues,
    sourceMap,
  }
}

/** Compile a `topic.oui` manifest (root must be `Topic`). */
export function compileOUITopic(source: string): OUICompileResult<OUITopicManifest> {
  const program = compileProgram(source)
  if (program.root && program.rootComponent !== 'Topic') {
    const issue = wrongRoot('Topic(…)', program.rootComponent)
    issue.line = program.sourceMap.lineOf('root')
    return { value: null, rootComponent: program.rootComponent, issues: [...program.issues, issue], sourceMap: program.sourceMap }
  }
  return { ...program, value: program.value as OUITopicManifest | null }
}

/** Compile the content `index.oui` catalog (root must be `Catalog`). */
export function compileOUICatalog(source: string): OUICompileResult<OUICatalogManifest> {
  const program = compileProgram(source)
  if (program.root && program.rootComponent !== 'Catalog') {
    const issue = wrongRoot('Catalog(…)', program.rootComponent)
    issue.line = program.sourceMap.lineOf('root')
    return { value: null, rootComponent: program.rootComponent, issues: [...program.issues, issue], sourceMap: program.sourceMap }
  }
  return { ...program, value: program.value as OUICatalogManifest | null }
}
