/**
 * Standard OpenUI programs ↔ editable call trees.
 *
 * `openui` sections store their OpenUI Lang program verbatim. Structured
 * tooling (the Visual Form editor, the Text → OpenUI migration) works on a
 * plain call tree instead: this module parses a program against the standard
 * library into `OUICall`s and prints call trees back with the shared printer,
 * using the standard library's positional parameter order.
 *
 * Only *static* programs are editable as a tree. Programs using `$state`,
 * expressions, `@builtins`, actions, `Query()` or comments can't round-trip
 * through a tree without losing something, so they are reported as
 * not editable and stay source-only.
 */
import { createParser, isASTNode, type ElementNode, type Parser } from '@openuidev/lang-core'
import type { OUICall, OUIValue } from '../../sub-contexts/openui-kernel'
import { standardOpenUISchema } from '../../sub-contexts/progressive-content/openui-standard'
import { printOUIProgram } from './print'

type JSONSchema = {
  $ref?: string
  anyOf?: JSONSchema[]
  items?: JSONSchema
  type?: string | string[]
  enum?: unknown[]
  description?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
}

const DEFS = (standardOpenUISchema as unknown as { $defs: Record<string, JSONSchema> }).$defs

/** Positional parameter names of a standard component, in order. */
export function standardParamOrder(component: string): string[] {
  return Object.keys(DEFS[component]?.properties ?? {})
}

/** JSON Schema of a standard component's props. */
export function standardComponentSchema(component: string): JSONSchema | undefined {
  return DEFS[component]
}

export type { JSONSchema as StandardJSONSchema }

let parser: Parser | null = null
function getParser(): Parser {
  parser ??= createParser(standardOpenUISchema)
  return parser
}

export interface StandardProgramTree {
  /** The root call, or null when the program couldn't be parsed. */
  root: OUICall | null
  /** True when the tree round-trips to an equivalent program. */
  editable: boolean
  /** Why the program isn't editable as a tree. */
  reason?: string
}

class NotStatic extends Error {}

function toValue(value: unknown, isRoot = false): OUIValue {
  if (value === null || value === undefined) return value as null | undefined
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((v) => toValue(v))
  if (isASTNode(value)) throw new NotStatic('uses expressions, $state, @builtins or actions')
  const element = value as ElementNode
  if (element.type === 'element') {
    if (element.hasDynamicProps) throw new NotStatic('uses expressions, $state, @builtins or actions')
    const props: Record<string, OUIValue> = {}
    for (const [key, prop] of Object.entries(element.props)) {
      const converted = toValue(prop)
      if (converted !== null && converted !== undefined) props[key] = converted
    }
    const call: OUICall = { kind: 'call', component: element.typeName, props }
    if (!isRoot && element.statementId) call.name = element.statementId
    return call
  }
  if (typeof value === 'object') {
    const out: Record<string, OUIValue> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) out[key] = toValue(v)
    return out as unknown as OUIValue
  }
  throw new NotStatic('contains a value the form editor cannot represent')
}

/** True when `source` has a `//` comment outside string literals. */
function hasComment(source: string): boolean {
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    if (ch === '"' || ch === "'") {
      for (i++; i < source.length && source[i] !== ch && source[i] !== '\n'; i++) if (source[i] === '\\') i++
    } else if (ch === '/' && source[i + 1] === '/') return true
  }
  return false
}

/** Strip statement-name hints so two trees compare by content only. */
function shape(value: OUIValue): unknown {
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') {
    if ((value as OUICall).kind === 'call') {
      const call = value as OUICall
      return { c: call.component, p: shape(call.props as unknown as OUIValue) }
    }
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, shape(v as OUIValue)]))
  }
  return value
}

/** Parse a standard OpenUI program (without the `// @openui` directive) into a call tree. */
export function parseStandardProgram(program: string): StandardProgramTree {
  let result
  try {
    result = getParser().parse(program)
  } catch {
    return { root: null, editable: false, reason: 'the program could not be parsed' }
  }
  if (!result.root) return { root: null, editable: false, reason: 'there is no `root = …` statement' }
  if ((result.meta.errors ?? []).length || result.meta.incomplete || (result.meta.unresolved ?? []).length) {
    return { root: null, editable: false, reason: 'the program has errors; fix them in the code editor first' }
  }
  if ((result.queryStatements ?? []).length || (result.mutationStatements ?? []).length || Object.keys(result.stateDeclarations ?? {}).length) {
    return { root: null, editable: false, reason: 'it uses $state, Query() or Mutation()' }
  }
  if ((result.meta.orphaned ?? []).length) return { root: null, editable: false, reason: 'it has statements that are never used' }
  if (hasComment(program)) return { root: null, editable: false, reason: 'it contains comments, which the form would drop' }

  let root: OUICall
  try {
    root = toValue(result.root, true) as OUICall
  } catch (e) {
    return { root: null, editable: false, reason: e instanceof NotStatic ? `it ${e.message}` : 'it could not be read' }
  }

  // Safety net: the tree must print back to an equivalent program.
  try {
    const again = getParser().parse(printStandardProgram(root))
    const reparsed = again.root ? toValue(again.root, true) : null
    if (JSON.stringify(shape(reparsed)) !== JSON.stringify(shape(root))) {
      return { root, editable: false, reason: 'it would not round-trip through the form' }
    }
  } catch {
    return { root, editable: false, reason: 'it would not round-trip through the form' }
  }
  return { root, editable: true }
}

/** Print a call tree as a standard OpenUI program (no directive, no trailing newline). */
export function printStandardProgram(root: OUICall): string {
  return printOUIProgram(root, { paramOrder: standardParamOrder }).trimEnd()
}

/**
 * The standard-OpenUI equivalent of a legacy `text` section: one markdown
 * `TextContent` block per paragraph, stacked.
 */
export function paragraphsToStandardProgram(paragraphs: string[]): string {
  return printStandardProgram({
    kind: 'call',
    component: 'Stack',
    props: {
      children: paragraphs.map((text) => ({ kind: 'call', component: 'TextContent', props: { text } })),
    },
  })
}
