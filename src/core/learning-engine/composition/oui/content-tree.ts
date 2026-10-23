/**
 * Readable content of an `.oui` file for the assistant's content tools
 * (grill-log-ai-assistant.md, decisions 121–123).
 *
 * Works on the parsed element tree, by prop name, for every component
 * (Loom and standard OpenUI) without per-type code. A place is addressed by
 * its Pick anchor: the nearest named statement, then the prop path from it
 * (`q2`, `q2.choices[1]`, `root.questions[0]`), the same anchors the
 * compiler's source map gives.
 *
 * A part is an element inside another one. Parts that hold parts of their
 * own (a quiz's questions, a flowchart's steps) are listed with their
 * anchors; leaf parts (a question's choices, a step's events) are written
 * out inline, so reading a section gives its summary and reading a part
 * gives its details.
 */
import type { ElementNode } from '@openuidev/lang-core'
import { parseOUIElements } from './compile'
import { readOpenUIDirective } from '../../sub-contexts/progressive-content/openui-standard'

export interface ElementIndex {
  root: ElementNode
  /** The file the tree came from, for full addresses (`sections/quiz.oui #q2`). */
  file?: string
  /** The anchor of an element in this file. */
  anchorOf(element: ElementNode): string | undefined
  /** The element at an anchor, if any. */
  find(anchor: string): ElementNode | undefined
}

const isElement = (value: unknown): value is ElementNode =>
  !!value && typeof value === 'object' && (value as ElementNode).type === 'element'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !isElement(value)

/** Every element of the tree by anchor, as the compiler's source map names them. */
export function indexElements(root: ElementNode, file?: string): ElementIndex {
  const anchors = new Map<ElementNode, string>()
  const byAnchor = new Map<string, ElementNode>()
  const visit = (value: unknown, owner: string, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, i) => visit(item, owner, `${path}[${i}]`))
    } else if (isElement(value)) {
      const named = value.statementId
      const anchor = named ?? `${owner}${path}`
      if (!anchors.has(value)) anchors.set(value, anchor)
      if (!byAnchor.has(anchor)) byAnchor.set(anchor, value)
      const nextOwner = named ?? owner
      const base = named ? '' : path
      for (const [key, prop] of Object.entries(value.props ?? {})) visit(prop, nextOwner, `${base}.${key}`)
    } else if (isPlainObject(value)) {
      for (const [key, prop] of Object.entries(value)) visit(prop, owner, `${path}.${key}`)
    }
  }
  visit(root, root.statementId ?? 'root', '')
  // A file is read from `#root`, whatever the parser took as its root.
  if (!byAnchor.has('root')) byAnchor.set('root', root)
  return { root, file, anchorOf: (element) => anchors.get(element), find: (anchor) => byAnchor.get(anchor) }
}

/** `sections/quiz.oui #q2`, or `#q2` when the index has no file. */
export const addressOf = (element: ElementNode, index: ElementIndex) =>
  `${index.file ? `${index.file} ` : ''}#${index.anchorOf(element) ?? '?'}`

/** The elements directly inside an element's props (not inside those elements). */
export function partsOf(element: ElementNode): ElementNode[] {
  const out: ElementNode[] = []
  const collect = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(collect)
    else if (isElement(value)) out.push(value)
    else if (isPlainObject(value)) Object.values(value).forEach(collect)
  }
  Object.values(element.props ?? {}).forEach(collect)
  return out
}

/** A part with parts of its own is listed by address; a leaf part is written out inline. */
const isContainer = (element: ElementNode) => partsOf(element).length > 0

const SUMMARY_PROPS = ['title', 'question', 'prompt', 'text', 'label', 'name', 'heading', 'front', 'term', 'statement', 'caption', 'description']

const clip = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

/** The text an element is best known by: its title, question, text… */
export function headlineOf(element: ElementNode): string | undefined {
  const props = (element.props ?? {}) as Record<string, unknown>
  for (const key of SUMMARY_PROPS) if (typeof props[key] === 'string' && (props[key] as string).trim()) return props[key] as string
  const first = Object.entries(props).find(([key, value]) => key !== 'id' && typeof value === 'string' && value.trim() && !isSvg(value))
  return first?.[1] as string | undefined
}

/** `(3 questions)`-style counts of the element lists in its props. */
function countsOf(element: ElementNode): string {
  const counts = Object.entries(element.props ?? {})
    .filter(([, value]) => Array.isArray(value) && value.some(isElement))
    .map(([key, value]) => `${(value as unknown[]).length} ${key}`)
  return counts.length ? ` (${counts.join(', ')})` : ''
}

/** One line for an element: its type, headline and counts. */
export function summaryOf(element: ElementNode): string {
  const headline = headlineOf(element)
  return `${element.typeName}${headline ? ` "${clip(headline, 90)}"` : ''}${countsOf(element)}`
}

const isSvg = (text: string) => /^\s*<svg[\s>]/i.test(text)

/** A drawing as what it says and names, not its markup. */
function describeSvg(markup: string): string {
  const texts = [...markup.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi)].map((m) => clip(m[1].replace(/<[^>]+>/g, ''), 60)).filter(Boolean)
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
  const parts = ['(drawing)']
  if (texts.length) parts.push(`labels: ${texts.join(' | ')}`)
  if (ids.length) parts.push(`shapes: ${ids.join(', ')}`)
  return parts.join('; ')
}

function scalar(value: unknown): string | undefined {
  if (typeof value === 'string') return isSvg(value) ? describeSvg(value) : value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

const indentLines = (text: string, pad: string) => text.split('\n').map((line, i) => (i ? `${pad}  ${line}` : line)).join('\n')

/**
 * An element as labelled lines (prop names as labels). Leaf parts are written
 * out inline; parts with parts of their own become `→ <anchor> <summary>`.
 */
function renderProps(element: ElementNode, index: ElementIndex, pad: string, out: string[]) {
  const partLine = (child: ElementNode) => `→ ${addressOf(child, index)} ${summaryOf(child)}`
  const renderValue = (key: string | null, value: unknown, depth: string) => {
    const label = key === null ? '- ' : `${key}: `
    const text = scalar(value)
    if (text !== undefined) {
      out.push(`${depth}${label}${indentLines(text, depth)}`)
    } else if (isElement(value)) {
      if (isContainer(value)) {
        out.push(`${depth}${label}${partLine(value)}`)
      } else {
        out.push(`${depth}${label}${value.typeName}`)
        renderProps(value, index, `${depth}  `, out)
      }
    } else if (Array.isArray(value)) {
      if (!value.length) return
      if (key !== null) out.push(`${depth}${key}:`)
      value.forEach((item) => renderValue(null, item, key !== null ? `${depth}  ` : depth))
    } else if (isPlainObject(value)) {
      if (key !== null) out.push(`${depth}${key}:`)
      for (const [k, v] of Object.entries(value)) renderValue(k, v, key !== null ? `${depth}  ` : depth)
    }
  }
  for (const [key, value] of Object.entries(element.props ?? {})) {
    if (value === null || value === undefined) continue
    renderValue(key, value, pad)
  }
}

/** Results stop here, about 2k tokens (decision 122). */
export const READ_LIMIT = 8000

/** Cut a result at a line break before `limit` characters, saying so. */
export function capResult(text: string, limit = READ_LIMIT, hint = 'read the parts listed above'): string {
  if (text.length <= limit) return text
  const cut = text.lastIndexOf('\n', limit)
  return `${text.slice(0, cut > 0 ? cut : limit)}\n… (truncated; ${hint})`
}

/** The readable content of one element: a header line, then its props. */
export function renderElement(element: ElementNode, index: ElementIndex): string {
  const out = [`${element.typeName}${countsOf(element)}`]
  renderProps(element, index, '', out)
  return capResult(out.join('\n'))
}

/** The parts directly inside an element, one line each with its anchor. */
export function listParts(element: ElementNode, index: ElementIndex): string[] {
  return partsOf(element).map((part) => `- ${addressOf(part, index)} ${summaryOf(part)}`)
}

/** A file's element tree and index, or null when it does not parse. */
export function contentTreeOf(source: string, file?: string): ElementIndex | null {
  try {
    const root = parseOUIElements(source)
    return root ? indexElements(root, file) : null
  } catch {
    return null
  }
}

/** A section's title: its root's title prop, or a standard OpenUI section's directive title. */
export function sectionTitle(source: string | undefined, tree?: ElementIndex | null): string | undefined {
  if (source === undefined) return undefined
  const directive = readOpenUIDirective(source)
  if (directive) return directive.title
  const root = (tree === undefined ? contentTreeOf(source) : tree)?.root
  const title = (root?.props as Record<string, unknown> | undefined)?.title
  return typeof title === 'string' ? title : undefined
}
