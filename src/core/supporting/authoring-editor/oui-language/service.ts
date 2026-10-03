/**
 * OpenUI Lang language service — editor-agnostic.
 *
 * Powers the VS Code extension (tools/vscode-oui) and the in-app CodeMirror
 * editor. All positions are string offsets; adapters convert to their own
 * coordinate systems.
 */
import { compileOUICatalog, compileOUITopic } from '../../../learning-engine/composition/oui/compile'
import { validateOUISection } from '../../../learning-engine/validation/oui-gateway'
import {
  cursorContext,
  indexStatements,
  scan,
  tokenAt,
  type OUICursorContext,
  type OUIStatement,
  type OUIToken,
} from './scanner'
import { getOUILanguageSpec, type OUIComponentSpec, type OUIParamSpec } from './spec'

// ============================================================================
// Types
// ============================================================================

export type OUIFileKind = 'section' | 'topic' | 'catalog'

export interface OUIRange {
  start: number
  end: number
}

export type OUICompletionKind = 'component' | 'reference' | 'state' | 'builtin' | 'keyword' | 'value' | 'id' | 'snippet'

export interface OUICompletion {
  label: string
  kind: OUICompletionKind
  detail?: string
  documentation?: string
  /** Text to insert; a snippet (`${1:name}` placeholders) when `isSnippet`. */
  insertText: string
  isSnippet: boolean
  /** Lower sorts first. */
  sortText: string
  /** Range replaced by `insertText`. */
  replace: OUIRange
}

export interface OUISignatureHelp {
  label: string
  documentation?: string
  parameters: Array<{ label: [number, number]; name: string; documentation?: string }>
  activeParameter: number
}

export interface OUIHover {
  /** Markdown. */
  contents: string
  range: OUIRange
}

export interface OUIDiagnostic {
  range: OUIRange
  severity: 'error' | 'warning'
  tier: 1 | 2 | 3
  message: string
  fixHint?: string
}

export interface OUISymbol {
  name: string
  component?: string
  range: OUIRange
  selectionRange: OUIRange
}

/** Workspace knowledge an editor host can supply (e.g. files on disk). */
export interface OUIWorkspaceHints {
  /** Section file names (without `.oui`) of the current topic. */
  sectionNames?: string[]
  /** Topic folder IDs of the content root. */
  topicIds?: string[]
}

export function fileKindFromPath(path: string): OUIFileKind {
  const file = path.split(/[\\/]/).pop() ?? path
  if (file === 'index.oui') return 'catalog'
  if (file === 'topic.oui') return 'topic'
  return 'section'
}

// ============================================================================
// Document analysis
// ============================================================================

interface IdDecl {
  component: string
  id: string
  range: OUIRange
}

interface Document {
  source: string
  tokens: OUIToken[]
  statements: OUIStatement[]
  ids: IdDecl[]
}

function analyze(source: string): Document {
  const tokens = scan(source)
  const statements = indexStatements(tokens)
  const spec = getOUILanguageSpec()
  const ids: IdDecl[] = []
  const significant = tokens.filter((t) => t.type !== 'comment' && t.type !== 'newline')
  for (let i = 0; i + 2 < significant.length; i++) {
    const [name, open, first] = [significant[i], significant[i + 1], significant[i + 2]]
    if (name.type !== 'ident' || open.text !== '(' || first.type !== 'string') continue
    if (spec.components.get(name.text)?.params[0]?.name !== 'id') continue
    ids.push({ component: name.text, id: unquote(first.text), range: { start: first.start, end: first.end } })
  }
  return { source, tokens, statements, ids }
}

function unquote(text: string): string {
  const quote = text[0]
  let inner = text.slice(1)
  if (inner.endsWith(quote)) inner = inner.slice(0, -1)
  return inner.replace(/\\(.)/g, '$1')
}

interface Expected {
  component?: OUIComponentSpec
  param?: OUIParamSpec
  inArray: boolean
  /** Object literal frame belongs directly to this param. */
  inObject: boolean
}

function expectedAt(ctx: OUICursorContext): Expected {
  const spec = getOUILanguageSpec()
  let arrayDepth = 0
  let inObject = false
  for (let i = ctx.frames.length - 1; i >= 0; i--) {
    const frame = ctx.frames[i]
    if (frame.kind === 'array') arrayDepth++
    else if (frame.kind === 'object') inObject = true
    else if (frame.kind === 'call') {
      const component = frame.name ? spec.components.get(frame.name) : undefined
      return { component, param: component?.params[frame.index], inArray: arrayDepth > 0, inObject }
    } else if (frame.kind === 'builtin') {
      return { inArray: false, inObject }
    }
  }
  return { inArray: false, inObject }
}

function acceptedComponents(exp: Expected): string[] {
  if (!exp.param) return []
  return exp.inArray ? exp.param.elementComponents : exp.param.components
}

function acceptedKinds(exp: Expected): string[] {
  if (!exp.param) return ['any']
  return exp.inArray ? exp.param.elementKinds : exp.param.kinds
}

/** Plain-string params that hold the ID of another component. */
const ID_TARGETS: Record<string, string> = {
  'ScenarioChoice.next': 'ScenarioNode',
  'Scenario.startNode': 'ScenarioNode',
  'DecisionChoice.next': 'DecisionNode',
  'DecisionTree.root': 'DecisionNode',
  'TradeoffStep.recommended': 'TradeoffChoice',
  'StateMachine.initialState': 'MachineState',
  'MatrixBlock.dependsOn': 'MatrixBlock',
}

function idTargets(exp: Expected): string[] {
  if (!exp.component || !exp.param) return []
  const explicit = ID_TARGETS[`${exp.component.name}.${exp.param.name}`]
  if (explicit) return [explicit]
  const kinds = acceptedKinds(exp)
  return kinds.includes('string') ? acceptedComponents(exp) : []
}

// ============================================================================
// Completions
// ============================================================================

function placeholder(param: OUIParamSpec, n: number): string {
  const kinds = param.kinds
  if (kinds.includes('array') && kinds.length === 1) return `[\${${n}}]`
  if (kinds.includes('object') && kinds.length === 1) return `{\${${n}}}`
  if (kinds.length === 1 && kinds[0] === 'string') {
    return `"\${${n}:${param.enumValues.length ? param.enumValues[0] : param.name}}"`
  }
  if (kinds.length === 1 && kinds[0] === 'number') return `\${${n}:0}`
  if (kinds.length === 1 && kinds[0] === 'boolean') return `\${${n}:false}`
  return `\${${n}:${param.name}}`
}

/** Snippet that calls a component with placeholders for its required params. */
export function componentSnippet(component: OUIComponentSpec): string {
  const required = component.params.filter((p) => !p.optional)
  if (required.length === 0) return `${component.name}($0)`
  return `${component.name}(${required.map((p, i) => placeholder(p, i + 1)).join(', ')})`
}

function componentDoc(component: OUIComponentSpec): string {
  return `\`\`\`oui\n${component.signature}\n\`\`\`\n${component.description}`
}

function rootSnippets(kind: OUIFileKind, replace: OUIRange): OUICompletion[] {
  const spec = getOUILanguageSpec()
  const names = kind === 'topic' ? ['Topic'] : kind === 'catalog' ? ['Catalog'] : spec.sectionComponents
  return names.map((name, i) => {
    const component = spec.components.get(name)!
    return {
      label: `root = ${name}(…)`,
      kind: 'snippet' as const,
      detail: component.group,
      documentation: componentDoc(component),
      insertText: `root = ${componentSnippet(component)}`,
      isSnippet: true,
      sortText: `0${String(i).padStart(3, '0')}`,
      replace,
    }
  })
}

export function getCompletions(
  source: string,
  offset: number,
  kind: OUIFileKind = 'section',
  hints: OUIWorkspaceHints = {},
): OUICompletion[] {
  const doc = analyze(source)
  const ctx = cursorContext(source, doc.tokens, offset)
  const spec = getOUILanguageSpec()
  if (ctx.inComment) return []

  const replace: OUIRange = { start: ctx.prefixStart, end: offset }
  const exp = expectedAt(ctx)

  // --- Inside a string: enum values and IDs ---
  if (ctx.inString && ctx.token) {
    const stringRange: OUIRange = { start: ctx.token.start + 1, end: ctx.token.terminated ? ctx.token.end - 1 : ctx.token.end }
    const values = new Map<string, { detail: string; kind: OUICompletionKind }>()
    if (exp.param && !exp.inArray) exp.param.enumValues.forEach((v) => values.set(v, { detail: exp.param!.type, kind: 'value' }))
    const targets = idTargets(exp)
    doc.ids.filter((d) => targets.includes(d.component) && !(ctx.token!.start === d.range.start))
      .forEach((d) => values.set(d.id, { detail: d.component, kind: 'id' }))
    const key = exp.component && exp.param ? `${exp.component.name}.${exp.param.name}` : ''
    if (key === 'SectionRef.name' || key === 'RoadmapStep.sectionId') hints.sectionNames?.forEach((n) => values.set(n, { detail: 'section file', kind: 'id' }))
    if (key === 'TopicRef.id') hints.topicIds?.forEach((n) => values.set(n, { detail: 'topic folder', kind: 'id' }))
    return [...values].map(([value, info], i) => ({
      label: value,
      kind: info.kind,
      detail: info.detail,
      insertText: value,
      isSnippet: false,
      sortText: `0${String(i).padStart(4, '0')}`,
      replace: stringRange,
    }))
  }

  // --- New top-level statement ---
  if (ctx.atStatementStart) {
    return doc.statements.some((s) => s.name === 'root') ? [] : rootSnippets(kind, replace)
  }

  // --- Object literal keys (TradeoffChoice metrics → metric IDs) ---
  if (ctx.inObjectKey) {
    if (exp.component?.name === 'TradeoffChoice' && exp.param?.name === 'metrics') {
      return doc.ids.filter((d) => d.component === 'TradeoffMetric').map((d, i) => ({
        label: d.id,
        kind: 'id' as const,
        detail: 'TradeoffMetric',
        insertText: /^[A-Za-z_]\w*$/.test(d.id) ? `${d.id}: ` : `"${d.id}": `,
        isSnippet: false,
        sortText: `0${String(i).padStart(4, '0')}`,
        replace,
      }))
    }
    return []
  }

  // --- Expressions ---
  const items: OUICompletion[] = []
  const comps = acceptedComponents(exp)
  const kinds = acceptedKinds(exp)
  const anyValue = kinds.includes('any')
  // `$state` and `@builtins` only where a plain value fits and no component is expected.
  const wantsPrimitive = anyValue || (comps.length === 0 && kinds.some((k) => k === 'string' || k === 'number' || k === 'boolean'))

  const componentNames = comps.length ? comps : anyValue ? [...spec.components.keys()] : []
  componentNames.forEach((name, i) => {
    const component = spec.components.get(name)
    if (!component) return
    items.push({
      label: name,
      kind: 'component',
      detail: component.group,
      documentation: componentDoc(component),
      insertText: componentSnippet(component),
      isSnippet: true,
      sortText: `${comps.length ? '1' : '3'}${String(i).padStart(4, '0')}`,
      replace,
    })
  })

  const current = doc.statements.find((s) => s.start <= offset && offset <= s.end)
  doc.statements
    .filter((s) => s.name !== 'root' && !s.name.startsWith('$') && s !== current)
    .filter((s) => anyValue || (s.component !== undefined && comps.includes(s.component)))
    .forEach((s, i) => items.push({
      label: s.name,
      kind: 'reference',
      detail: s.component ?? 'value',
      insertText: s.name,
      isSnippet: false,
      sortText: `0${String(i).padStart(4, '0')}`,
      replace,
    }))

  if (wantsPrimitive) {
    doc.statements.filter((s) => s.name.startsWith('$')).forEach((s) => items.push({
      label: s.name,
      kind: 'state',
      detail: 'state',
      insertText: s.name,
      isSnippet: false,
      sortText: `2${s.name}`,
      replace,
    }))
    for (const builtin of spec.builtins.values()) {
      items.push({
        label: `@${builtin.name}`,
        kind: 'builtin',
        detail: builtin.signature,
        documentation: builtin.description,
        insertText: `@${builtin.name}(\${1})`,
        isSnippet: true,
        sortText: `4${builtin.name}`,
        replace,
      })
    }
  }

  if (exp.param && !exp.inArray) {
    exp.param.enumValues.forEach((v) => items.push({
      label: JSON.stringify(v), kind: 'value', detail: exp.param!.name, insertText: JSON.stringify(v), isSnippet: false, sortText: `0${v}`, replace,
    }))
  }
  const literals = [
    ...(kinds.includes('boolean') || anyValue ? ['true', 'false'] : []),
    ...(exp.param?.optional ? ['null'] : []),
  ]
  literals.forEach((l) => items.push({ label: l, kind: 'keyword', insertText: l, isSnippet: false, sortText: `2${l}`, replace }))

  return items
}

// ============================================================================
// Signature help
// ============================================================================

export function getSignatureHelp(source: string, offset: number): OUISignatureHelp | null {
  const doc = analyze(source)
  const ctx = cursorContext(source, doc.tokens, offset)
  if (ctx.inComment) return null
  const spec = getOUILanguageSpec()

  for (let i = ctx.frames.length - 1; i >= 0; i--) {
    const frame = ctx.frames[i]
    if (frame.kind === 'builtin' && frame.name) {
      const builtin = spec.builtins.get(frame.name)
      if (!builtin) return null
      const inner = builtin.signature.slice(builtin.signature.indexOf('(') + 1, builtin.signature.indexOf(')'))
      let cursor = builtin.signature.indexOf('(') + 1
      const parameters = inner.split(', ').map((p) => {
        const start = builtin.signature.indexOf(p, cursor)
        cursor = start + p.length
        return { label: [start, start + p.length] as [number, number], name: p }
      })
      return { label: builtin.signature, documentation: builtin.description, parameters, activeParameter: frame.index }
    }
    if (frame.kind !== 'call' || !frame.name) continue
    const component = spec.components.get(frame.name)
    if (!component) return null

    let label = `${component.name}(`
    const parameters = component.params.map((p, idx) => {
      if (idx > 0) label += ', '
      const text = `${p.name}${p.optional ? '?' : ''}: ${p.type}`
      const start = label.length
      label += text
      return { label: [start, start + text.length] as [number, number], name: p.name, documentation: paramDoc(p) }
    })
    label += ')'
    return {
      label,
      documentation: component.description,
      parameters,
      activeParameter: frame.index < component.params.length ? frame.index : -1,
    }
  }
  return null
}

function paramDoc(param: OUIParamSpec): string {
  const parts = [`${param.optional ? 'Optional' : 'Required'} \`${param.type}\``]
  if (param.description) parts.push(param.description)
  if (param.enumValues.length) parts.push(`One of: ${param.enumValues.map((v) => `"${v}"`).join(', ')}`)
  return parts.join(' — ')
}

// ============================================================================
// Hover & definition
// ============================================================================

export function getHover(source: string, offset: number): OUIHover | null {
  const doc = analyze(source)
  const token = tokenAt(doc.tokens, offset)
  if (!token || token.type === 'comment' || token.type === 'punct' || token.type === 'operator') return null
  const spec = getOUILanguageSpec()
  const range = { start: token.start, end: token.end }

  if (token.type === 'builtin') {
    const builtin = spec.builtins.get(token.text.slice(1))
    return builtin ? { contents: `\`\`\`oui\n${builtin.signature}\n\`\`\`\n${builtin.description}`, range } : null
  }

  if (token.type === 'ident') {
    const component = spec.components.get(token.text)
    const next = doc.tokens.find((t) => t.start >= token.end && t.type !== 'newline' && t.type !== 'comment')
    if (component && next?.text === '(') return { contents: componentDoc(component), range }
    const statement = doc.statements.find((s) => s.name === token.text)
    if (statement && statement.nameStart !== token.start) {
      return { contents: `${statementPreview(doc, statement)}\n\n${paramHover(source, doc, token) ?? ''}`.trim(), range }
    }
  }

  if (token.type === 'state') {
    const statement = doc.statements.find((s) => s.name === token.text)
    if (statement) return { contents: statementPreview(doc, statement), range }
  }

  const param = paramHover(source, doc, token)
  return param ? { contents: param, range } : null
}

/** Explain which positional parameter the token is the value of. */
function paramHover(source: string, doc: Document, token: OUIToken): string | null {
  const ctx = cursorContext(source, doc.tokens, token.start)
  const exp = expectedAt(ctx)
  if (!exp.component || !exp.param) return null
  const position = `${exp.component.name} › ${exp.param.name}${exp.param.optional ? '?' : ''}`
  const element = exp.inArray ? ' (element)' : ''
  return `**${position}**${element}: \`${exp.param.type}\`\n\n${paramDoc(exp.param)}`
}

function statementPreview(doc: Document, statement: OUIStatement): string {
  const text = doc.source.slice(statement.start, statement.end)
  const firstLine = text.split('\n')[0]
  const preview = firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine + (text.includes('\n') ? ' …' : '')
  const line = doc.source.slice(0, statement.start).split('\n').length
  return `\`\`\`oui\n${preview}\n\`\`\`\nDefined on line ${line}`
}

export function getDefinition(source: string, offset: number): OUIRange | null {
  const doc = analyze(source)
  const token = tokenAt(doc.tokens, offset)
  if (!token) return null
  if (token.type === 'ident' || token.type === 'state') {
    const statement = doc.statements.find((s) => s.name === token.text)
    return statement ? { start: statement.nameStart, end: statement.nameEnd } : null
  }
  if (token.type === 'string') {
    const ctx = cursorContext(source, doc.tokens, token.start + 1)
    const targets = idTargets(expectedAt(ctx))
    const decl = doc.ids.find((d) => d.id === unquote(token.text) && targets.includes(d.component) && d.range.start !== token.start)
    return decl ? decl.range : null
  }
  return null
}

export function getDocumentSymbols(source: string): OUISymbol[] {
  return analyze(source).statements.map((s) => ({
    name: s.name,
    component: s.component,
    range: { start: s.start, end: s.end },
    selectionRange: { start: s.nameStart, end: s.nameEnd },
  }))
}

// ============================================================================
// Diagnostics
// ============================================================================

interface RawDiagnostic {
  tier: 1 | 2 | 3
  line?: number
  message: string
  fixHint?: string
}

export function getDiagnostics(source: string, kind: OUIFileKind = 'section'): OUIDiagnostic[] {
  let raw: RawDiagnostic[]
  if (kind === 'section') raw = validateOUISection(source).diagnostics
  else raw = (kind === 'topic' ? compileOUITopic(source) : compileOUICatalog(source)).issues

  const doc = analyze(source)
  return raw.map((d) => ({
    range: rangeForLine(doc, d.line),
    severity: d.tier === 3 ? 'warning' : 'error',
    tier: d.tier,
    message: d.message,
    fixHint: d.fixHint,
  }))
}

/** Underline the statement name on `line` (1-based), else the line's text. */
function rangeForLine(doc: Document, line: number | undefined): OUIRange {
  const lines = doc.source.split('\n')
  const index = Math.min(Math.max((line ?? 1) - 1, 0), Math.max(lines.length - 1, 0))
  const lineStart = lines.slice(0, index).reduce((n, l) => n + l.length + 1, 0)
  const lineEnd = lineStart + (lines[index]?.length ?? 0)
  const statement = doc.statements.find((s) => s.nameStart >= lineStart && s.nameStart <= lineEnd)
  if (statement) return { start: statement.nameStart, end: lineEnd }
  const text = lines[index] ?? ''
  const indent = text.length - text.trimStart().length
  return { start: lineStart + indent, end: Math.max(lineEnd, lineStart + indent) }
}
