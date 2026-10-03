/**
 * OpenUI Lang language spec for editor tooling.
 *
 * Derived entirely from the Loom OpenUI library's JSON Schema, so
 * completions, signature help and hovers always match the components the
 * compiler accepts.
 */
import { ACTION_NAMES, BUILTINS } from '@openuidev/lang-core'
import { getLoomOUIJSONSchema, loomOUILibrary, OUI_SECTION_TYPES } from '../../../learning-engine/composition/oui/library'

type JSONSchema = {
  type?: string | string[]
  $ref?: string
  anyOf?: JSONSchema[]
  items?: JSONSchema
  enum?: unknown[]
  description?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  additionalProperties?: JSONSchema | boolean
}

export type OUIValueKind = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'component' | 'any'

export interface OUIParamSpec {
  name: string
  optional: boolean
  /** Display type, e.g. `string | Actor`, `QuizChoice[]`. */
  type: string
  description?: string
  /** Value kinds accepted directly (for `Step[]` this is ['array']). */
  kinds: OUIValueKind[]
  /** Components accepted directly (not inside an array). */
  components: string[]
  /** Components accepted as array elements. */
  elementComponents: string[]
  /** Kinds accepted as array elements. */
  elementKinds: OUIValueKind[]
  /** Allowed string literals, when the param is an enum. */
  enumValues: string[]
}

export interface OUIComponentSpec {
  name: string
  description: string
  group?: string
  params: OUIParamSpec[]
  /** Full signature, e.g. `Quiz(title: string, questions: QuizQuestion[], …)`. */
  signature: string
  /** True for section-level components (valid `root` of a section file). */
  isSection: boolean
}

export interface OUIBuiltinSpec {
  name: string
  signature: string
  description: string
}

export interface OUILanguageSpec {
  components: Map<string, OUIComponentSpec>
  builtins: Map<string, OUIBuiltinSpec>
  sectionComponents: string[]
}

function refName(ref: string): string {
  return ref.replace('#/$defs/', '')
}

function describeType(schema: JSONSchema): string {
  if (schema.$ref) return refName(schema.$ref)
  if (schema.anyOf) return schema.anyOf.map(describeType).join(' | ')
  if (schema.enum) return schema.enum.map((v) => JSON.stringify(v)).join(' | ')
  if (schema.type === 'array') {
    const inner = schema.items ? describeType(schema.items) : 'any'
    return inner.includes('|') ? `(${inner})[]` : `${inner}[]`
  }
  if (schema.type === 'object') {
    const value = typeof schema.additionalProperties === 'object' ? describeType(schema.additionalProperties) : 'any'
    return `Record<string, ${value}>`
  }
  if (schema.type === 'integer') return 'number'
  return typeof schema.type === 'string' ? schema.type : 'any'
}

function kindsOf(schema: JSONSchema | undefined, out: { kinds: Set<OUIValueKind>; components: Set<string>; enums: Set<string> }) {
  if (!schema) {
    out.kinds.add('any')
    return
  }
  if (schema.$ref) {
    out.kinds.add('component')
    out.components.add(refName(schema.$ref))
    return
  }
  if (schema.anyOf) {
    schema.anyOf.forEach((s) => kindsOf(s, out))
    return
  }
  if (schema.enum) {
    out.kinds.add('string')
    schema.enum.forEach((v) => out.enums.add(String(v)))
    return
  }
  const type = schema.type === 'integer' ? 'number' : schema.type
  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'array' || type === 'object') out.kinds.add(type)
  else out.kinds.add('any')
}

function paramSpec(name: string, schema: JSONSchema, optional: boolean): OUIParamSpec {
  const direct = { kinds: new Set<OUIValueKind>(), components: new Set<string>(), enums: new Set<string>() }
  kindsOf(schema, direct)
  const element = { kinds: new Set<OUIValueKind>(), components: new Set<string>(), enums: new Set<string>() }
  const arrays = schema.anyOf ? schema.anyOf.filter((s) => s.type === 'array') : schema.type === 'array' ? [schema] : []
  arrays.forEach((a) => kindsOf(a.items, element))
  return {
    name,
    optional,
    type: describeType(schema),
    description: schema.description,
    kinds: [...direct.kinds],
    components: [...direct.components],
    elementComponents: [...element.components],
    elementKinds: [...element.kinds],
    enumValues: [...direct.enums],
  }
}

let cached: OUILanguageSpec | null = null

/** Build (once) the language spec from the Loom OpenUI library. */
export function getOUILanguageSpec(): OUILanguageSpec {
  if (cached) return cached
  const schema = getLoomOUIJSONSchema() as unknown as { $defs: Record<string, JSONSchema> }
  const prompts = loomOUILibrary.toSpec().components as Record<string, { signature: string; description: string }>
  const groups = new Map<string, string>()
  for (const g of loomOUILibrary.componentGroups ?? []) g.components.forEach((c) => groups.set(c, g.name))

  const sectionComponents = [...OUI_SECTION_TYPES.keys()]

  const components = new Map<string, OUIComponentSpec>()
  for (const [name, def] of Object.entries(schema.$defs)) {
    if (!prompts[name]) continue
    const required = new Set(def.required ?? [])
    components.set(name, {
      name,
      description: def.description ?? prompts[name].description,
      group: groups.get(name),
      params: Object.entries(def.properties ?? {}).map(([p, s]) => paramSpec(p, s, !required.has(p))),
      signature: prompts[name].signature,
      isSection: sectionComponents.includes(name),
    })
  }

  const builtins = new Map<string, OUIBuiltinSpec>()
  for (const [name, def] of Object.entries(BUILTINS)) {
    if (ACTION_NAMES.has(name)) continue
    builtins.set(name, { name, signature: `@${def.signature}`, description: def.description })
  }
  builtins.set('Each', {
    name: 'Each',
    signature: '@Each(array, varName, template) → array',
    description: 'Render template once per element; the loop variable is only available inside the template.',
  })

  cached = { components, builtins, sectionComponents }
  return cached
}
