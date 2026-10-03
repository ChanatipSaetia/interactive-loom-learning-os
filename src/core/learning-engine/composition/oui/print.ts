/**
 * OpenUI Lang printer — section data → `.oui` source.
 *
 * Each section component's `fromData` builds a call tree; this module prints
 * it as readable OpenUI Lang:
 *   - calls with a `name` hint, or whose ID is referenced elsewhere, are
 *     hoisted into their own `name = …` statements (top-down order);
 *   - references print as the hoisted statement name, else as the string ID;
 *   - positional arguments follow the component's schema order, trailing
 *     omitted arguments are dropped and gaps become `null`;
 *   - lines longer than the print width break one argument per line.
 *
 * Used by the OKF → OpenUI converter and by the editor to save Visual Form edits.
 */
import type { OUICall, OUIRef, OUIValue } from '../../sub-contexts/openui-kernel'
import type { OKFSectionData, OKFSectionMeta } from '../okf/types'
import { Catalog, getLoomOUIComponent, LOOM_OUI_COMPONENTS, SectionRef, Topic, TopicRef } from './library'
import type { OUITopicManifest } from './compile'

export interface OUIPrintOptions {
  /** Preferred maximum line width. Default 100. */
  width?: number
  /** Comment lines placed at the top of the file (without `//`). */
  header?: string[]
}

const RESERVED = new Set(['root', 'true', 'false', 'null'])

function isCall(value: unknown): value is OUICall {
  return !!value && typeof value === 'object' && (value as OUICall).kind === 'call'
}

function isRef(value: unknown): value is OUIRef {
  return !!value && typeof value === 'object' && (value as OUIRef).kind === 'ref'
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

/** Turn an ID or title into a readable camelCase statement name. */
export function identifierFrom(hint: string | undefined, component: string): string {
  const words = (hint ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  let name = words
    .map((w, i) => {
      const word = w === w.toUpperCase() ? w.toLowerCase() : w
      return i === 0 ? lowerFirst(word) : word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join('')
  if (!/^[A-Za-z_]/.test(name)) name = lowerFirst(component) + (name ? name.charAt(0).toUpperCase() + name.slice(1) : '')
  return name
}

function paramOrder(component: string): string[] {
  const def = getLoomOUIComponent(component)
  const shape = (def?.definition.props as unknown as { shape?: Record<string, unknown> })?.shape
  return shape ? Object.keys(shape) : []
}

function positionalArgs(c: OUICall): OUIValue[] {
  const order = paramOrder(c.component)
  const unknown = Object.keys(c.props).filter((k) => !order.includes(k) && c.props[k] !== undefined)
  if (unknown.length) throw new Error(`${c.component} has no parameter(s): ${unknown.join(', ')}`)
  const args = order.map((key) => c.props[key])
  while (args.length && (args[args.length - 1] === undefined)) args.pop()
  return args.map((a) => (a === undefined ? null : a))
}

const refKey = (component: string, id: string) => `${component}\u0000${id}`

interface Hoisted {
  name: string
  call: OUICall
}

/** Print a call tree as an OpenUI Lang program with `root = <rootCall>`. */
export function printOUIProgram(rootCall: OUICall, options: OUIPrintOptions = {}): string {
  const width = options.width ?? 100

  // 1. Which (component, id) pairs are referenced?
  const referenced = new Set<string>()
  const collectRefs = (value: OUIValue) => {
    if (isRef(value)) value.components.forEach((c) => referenced.add(refKey(c, value.id)))
    else if (isCall(value)) Object.values(value.props).forEach(collectRefs)
    else if (Array.isArray(value)) value.forEach(collectRefs)
    else if (value && typeof value === 'object') Object.values(value).forEach(collectRefs)
  }
  collectRefs(rootCall)

  // 2. Hoist named / referenced calls (pre-order = top-down), assigning unique names.
  const hoisted: Hoisted[] = []
  const hoistedNames = new Map<OUICall, string>()
  const byRef = new Map<string, string>()
  const used = new Set<string>(RESERVED)
  const hoist = (value: OUIValue, isRoot = false) => {
    if (isCall(value)) {
      const id = typeof value.props.id === 'string' ? value.props.id : undefined
      const isReferenced = id !== undefined && referenced.has(refKey(value.component, id))
      if (!isRoot && (value.name !== undefined || isReferenced)) {
        const base = identifierFrom(value.name ?? id, value.component)
        let name = base
        for (let n = 2; used.has(name); n++) name = `${base}${n}`
        used.add(name)
        hoistedNames.set(value, name)
        hoisted.push({ name, call: value })
        if (id !== undefined && !byRef.has(refKey(value.component, id))) byRef.set(refKey(value.component, id), name)
      }
      Object.values(value.props).forEach((v) => hoist(v))
    } else if (Array.isArray(value)) value.forEach((v) => hoist(v))
    else if (value && typeof value === 'object' && !isRef(value)) Object.values(value).forEach((v) => hoist(v))
  }
  hoist(rootCall, true)

  // 3. Printing.
  const flat = (value: OUIValue, top = false): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') return JSON.stringify(value)
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (isRef(value)) {
      const name = value.components.map((c) => byRef.get(refKey(c, value.id))).find(Boolean)
      return name ?? JSON.stringify(value.id)
    }
    if (isCall(value)) {
      if (!top && hoistedNames.has(value)) return hoistedNames.get(value)!
      return `${value.component}(${positionalArgs(value).map((a) => flat(a)).join(', ')})`
    }
    if (Array.isArray(value)) return `[${value.map((v) => flat(v)).join(', ')}]`
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    return `{${entries.map(([k, v]) => `${printKey(k)}: ${flat(v)}`).join(', ')}}`
  }

  const fmt = (value: OUIValue, indent: number, used: number, top = false): string => {
    const one = flat(value, top)
    if (used + one.length <= width) return one
    const pad = ' '.repeat(indent + 2)
    const close = ' '.repeat(indent)
    const lines = (items: string[], open: string, end: string) =>
      items.length === 0 ? `${open}${end}` : `${open}\n${items.map((i) => `${pad}${i},`).join('\n')}\n${close}${end}`
    if (isCall(value) && (top || !hoistedNames.has(value))) {
      const args = positionalArgs(value).map((a) => fmt(a, indent + 2, indent + 3))
      return lines(args, `${value.component}(`, ')')
    }
    if (Array.isArray(value)) {
      return lines(value.map((v) => fmt(v, indent + 2, indent + 3)), '[', ']')
    }
    if (value && typeof value === 'object' && !isCall(value) && !isRef(value)) {
      const entries = Object.entries(value).filter(([, v]) => v !== undefined)
      return lines(entries.map(([k, v]) => `${printKey(k)}: ${fmt(v, indent + 2, indent + 4 + k.length)}`), '{', '}')
    }
    return one
  }

  const statement = (name: string, value: OUICall) => `${name} = ${fmt(value, 0, name.length + 3, true)}`

  const out: string[] = []
  for (const line of options.header ?? []) out.push(`// ${line}`)
  out.push(statement('root', rootCall))
  let previous: string | undefined
  for (const h of hoisted) {
    if (h.call.component !== previous || out[out.length - 1].includes('\n')) out.push('')
    out.push(statement(h.name, h.call))
    previous = h.call.component
  }
  return `${out.join('\n')}\n`
}

function printKey(key: string): string {
  return /^[A-Za-z_]\w*$/.test(key) ? key : JSON.stringify(key)
}

// ============================================================================
// Entry points
// ============================================================================

const SECTION_BY_TYPE = new Map(LOOM_OUI_COMPONENTS.filter((c) => c.sectionType).map((c) => [c.sectionType!, c]))

/** Print a section (OKF-compatible meta + data) as a `.oui` file. */
export function printOUISection(meta: OKFSectionMeta, data: OKFSectionData, options?: OUIPrintOptions): string {
  const type = data.type ?? meta.type
  const component = SECTION_BY_TYPE.get(type)
  if (!component?.fromData) throw new Error(`No OpenUI section component for type "${type}"`)
  return printOUIProgram(component.fromData(data as unknown as Record<string, unknown>, meta), options)
}

/** Print a `topic.oui` manifest. */
export function printOUITopic(manifest: OUITopicManifest, options?: OUIPrintOptions): string {
  return printOUIProgram({
    kind: 'call',
    component: Topic.name,
    props: {
      title: manifest.title,
      category: manifest.category,
      description: manifest.description,
      sections: manifest.sections.map((name) => ({ kind: 'call', component: SectionRef.name, props: { name } })),
      tags: manifest.tags?.length ? manifest.tags : undefined,
      difficulty: manifest.difficulty,
      updatedAt: manifest.updatedAt,
      isNew: manifest.isNew,
    },
  }, options)
}

/** Print the content `index.oui` catalog. */
export function printOUICatalog(topicIds: string[], options?: OUIPrintOptions): string {
  return printOUIProgram({
    kind: 'call',
    component: Catalog.name,
    props: { topics: topicIds.map((id) => ({ kind: 'call', component: TopicRef.name, props: { id } })) },
  }, options)
}
