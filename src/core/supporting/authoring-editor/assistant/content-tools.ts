/**
 * The assistant's content tools in Loom Viewer (grill-log-ai-assistant.md,
 * decisions 120–126): `navigate` walks the open topic one level at a time,
 * `read` gives a place's content as readable text. Both run in the page, on
 * the same sources and errors the topic context is built from, and address
 * places by Pick pointer (`sections/quiz.oui #q2`).
 */
import type { ElementNode } from '@openuidev/lang-core'
import {
  capResult,
  contentTreeOf,
  headlineOf,
  listParts,
  renderElement,
  sectionTitle,
  summaryOf,
  type ElementIndex,
} from '../../../learning-engine/composition/oui/content-tree'
import { readOpenUIDirective } from '../../../learning-engine/sub-contexts/progressive-content/openui-standard'
import type { AssistantTopicContext } from './context'
import { fileStatements } from './context'
import { statementOfAnchor } from '../pick/tray'

/** An OpenAI-style function tool. */
export interface ToolDefinition {
  type: 'function'
  function: { name: string; description: string; parameters: Record<string, unknown> }
}

const ADDRESS_HELP = 'An address from navigate, a pick or the topic context, e.g. "sections/quiz.oui #q2"; a file alone means the whole section.'

export const CONTENT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'navigate',
      description:
        'List the parts of the open topic. Without an address: its sections in reading order, with titles. With an address: the parts inside that place (questions, steps, cards, choices…), each with its own address.',
      parameters: {
        type: 'object',
        properties: { address: { type: 'string', description: `${ADDRESS_HELP} Leave it out for the list of sections.` } },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read',
      description:
        'Get the content of one place in the topic as readable text: a section (its text, with its larger parts listed by address) or a part (all its details, including correct answers and explanations).',
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: ADDRESS_HELP },
          source: { type: 'boolean', description: 'Return the openui-lang source instead. Only for fixing an error.' },
        },
        required: ['address'],
        additionalProperties: false,
      },
    },
  },
]

export const CONTENT_TOOL_NAMES = new Set(CONTENT_TOOLS.map((t) => t.function.name))

export interface ToolOutcome {
  /** What goes back to the model. */
  content: string
  /** What the learner sees in the "Looked at" line. */
  label: string
  /** The place looked at, for "Show on page". */
  file?: string
  anchor?: string
}

export interface ContentAddress {
  file: string
  anchor: string
}

/**
 * `sections/quiz.oui #q2` → file and anchor. Takes small slips: no
 * `sections/`, no `.oui`, no space before `#`, a leading `/` or `#` alone
 * on a pointer copied with its topic ID.
 */
export function parseAddress(raw: string, files: Record<string, string>): ContentAddress | null {
  const text = raw.trim().replace(/:\d+(?=\s*#|$)/, '')
  const hash = text.indexOf('#')
  let file = (hash < 0 ? text : text.slice(0, hash)).trim().replace(/^\/+/, '')
  const anchor = hash < 0 ? 'root' : text.slice(hash + 1).trim() || 'root'
  if (!file) return null
  if (files[file] !== undefined) return { file, anchor }
  if (!file.endsWith('.oui')) file = `${file}.oui`
  const candidates = [file, `sections/${file}`, file.replace(/^[^/]+\//, ''), `sections/${file.split('/').pop()}`]
  const found = candidates.find((c) => files[c] !== undefined)
  return found ? { file: found, anchor } : null
}

const clip = (text: string, max = 70) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

const narrationFileOf = (file: string) => file.replace(/\.oui$/, '.narrate.oui')

/** Runs content tools against one topic; parsed trees are reused within a request. */
export class ContentToolRunner {
  private trees = new Map<string, ElementIndex | null>()

  constructor(private readonly context: AssistantTopicContext) {}

  private tree(file: string): ElementIndex | null {
    if (!this.trees.has(file)) {
      const source = this.context.files[file]
      this.trees.set(file, source === undefined ? null : contentTreeOf(source, file))
    }
    return this.trees.get(file)!
  }

  private sectionFiles(): string[] {
    return this.context.fileOrder.filter((f) => f !== 'topic.oui')
  }

  private errorsOf(file: string): string[] {
    return this.context.diagnostics[file] ?? []
  }

  private titleOf(file: string): string {
    return sectionTitle(this.context.files[file], this.tree(file)) ?? file
  }

  /** Run one call; `args` is the model's JSON argument string. */
  run(name: string, args: string): ToolOutcome {
    let parsed: { address?: unknown; source?: unknown }
    try {
      parsed = args.trim() ? JSON.parse(args) : {}
    } catch {
      return { content: 'Error: the arguments are not valid JSON.', label: `${name} (bad arguments)` }
    }
    const address = typeof parsed.address === 'string' && parsed.address.trim() ? parsed.address : undefined
    if (name === 'navigate') return address ? this.navigateIn(address) : this.outline()
    if (name === 'read') {
      if (!address) return { content: 'Error: read needs an address. Call navigate() for the list of sections.', label: 'read (no address)' }
      return this.read(address, parsed.source === true)
    }
    return { content: `Error: there is no tool "${name}". The tools are navigate and read.`, label: name }
  }

  /** navigate(): the sections in reading order. */
  private outline(): ToolOutcome {
    const topicTree = this.tree('topic.oui')
    const topicTitle = (topicTree?.root.props as Record<string, unknown> | undefined)?.title
    const sections = this.sectionFiles()
    const lines = [`Topic${typeof topicTitle === 'string' ? ` "${topicTitle}"` : ''}: ${sections.length} sections in reading order. navigate(address) lists the parts inside one; read(address) gives its content.`, '']
    sections.forEach((file, i) => {
      const source = this.context.files[file]
      if (source === undefined) {
        lines.push(`${i + 1}. ${file} (missing)`)
        return
      }
      const tree = this.tree(file)
      const directive = readOpenUIDirective(source)
      const what = directive ? `OpenUI section "${directive.title}"` : tree ? summaryOf(tree.root) : 'does not compile'
      const errors = this.errorsOf(file).length ? ' (has errors)' : ''
      lines.push(`${i + 1}. ${file} ${what}${errors}`)
    })
    return { content: capResult(lines.join('\n'), undefined, 'navigate a section for its parts'), label: 'Topic outline' }
  }

  private resolve(raw: string): { address: ContentAddress; tree: ElementIndex; element: ElementNode } | ToolOutcome {
    const address = parseAddress(raw, this.context.files)
    if (!address) return { content: `Error: no file in the topic matches "${raw}". Call navigate() for the list of sections.`, label: clip(raw) }
    const tree = this.tree(address.file)
    if (!tree) return this.broken(address)
    const element = tree.find(address.anchor)
    if (!element) {
      return { content: `Error: there is no place #${address.anchor} in ${address.file}. navigate("${address.file}") lists its parts.`, label: clip(raw), file: address.file }
    }
    return { address, tree, element }
  }

  /** A file that does not parse: its errors and source, so the model can explain the fix. */
  private broken(address: ContentAddress): ToolOutcome {
    const errors = this.errorsOf(address.file)
    const content = [
      `${address.file} does not compile, so the learner does not see it.`,
      errors.length ? `Errors:\n${errors.map((e) => `- ${e}`).join('\n')}` : '',
      `Source:\n\`\`\`oui\n${this.context.files[address.file]?.trimEnd() ?? ''}\n\`\`\``,
    ].filter(Boolean)
    return { content: capResult(content.join('\n\n'), undefined, 'the rest of the file is not shown'), label: this.titleOf(address.file), file: address.file, anchor: 'root' }
  }

  private labelOf(address: ContentAddress, element: ElementNode, tree: ElementIndex): string {
    const section = this.titleOf(address.file)
    if (element === tree.root) return section
    const headline = headlineOf(element)
    return `${section} › ${headline ? clip(headline, 60) : element.typeName}`
  }

  /** navigate(address): the parts inside a place. */
  private navigateIn(raw: string): ToolOutcome {
    const found = this.resolve(raw)
    if (!('element' in found)) return found
    const { address, tree, element } = found
    const lines = [`Parts of ${address.file} #${address.anchor}, ${summaryOf(element)}:`]
    const parts = listParts(element, tree)
    lines.push(...(parts.length ? parts : ['(no parts inside; read it for its content)']))
    const narration = narrationFileOf(address.file)
    if (element === tree.root && this.context.files[narration] !== undefined) {
      const steps = this.tree(narration)?.root
      lines.push('', `Narration script for Present mode: ${narration}${steps ? ` ${summaryOf(steps).replace(/^\S+/, '').trim()}` : ''}`)
    }
    return { content: capResult(lines.join('\n'), undefined, 'navigate a part for what is inside it'), label: this.labelOf(address, element, tree), file: address.file, anchor: address.anchor }
  }

  /** read(address): a place as readable text, or its source. */
  private read(raw: string, source: boolean): ToolOutcome {
    if (source) {
      const address = parseAddress(raw, this.context.files)
      if (!address) return { content: `Error: no file in the topic matches "${raw}". Call navigate() for the list of sections.`, label: clip(raw) }
      const text = this.context.files[address.file]!
      let body = text.trimEnd()
      if (address.anchor !== 'root') {
        const statement = fileStatements(text).find((s) => s.name === statementOfAnchor(address.anchor))
        if (!statement) return { content: `Error: there is no statement ${statementOfAnchor(address.anchor)} in ${address.file}.`, label: clip(raw), file: address.file }
        body = statement.text
      }
      const errors = this.errorsOf(address.file)
      const content = [`Source of ${address.file} #${address.anchor}:\n\`\`\`oui\n${body}\n\`\`\``, errors.length ? `Errors in this file:\n${errors.map((e) => `- ${e}`).join('\n')}` : '']
      return { content: capResult(content.filter(Boolean).join('\n\n'), undefined, 'read a single statement'), label: `${this.titleOf(address.file)} (source)`, file: address.file, anchor: address.anchor }
    }
    const found = this.resolve(raw)
    if (!('element' in found)) return found
    const { address, tree, element } = found
    const lines = [`${address.file} #${address.anchor}`, renderElement(element, tree)]
    const errors = this.errorsOf(address.file)
    if (errors.length) lines.push('', `Errors in this file (the learner may not see all of it):\n${errors.map((e) => `- ${e}`).join('\n')}`)
    return { content: capResult(lines.join('\n')), label: this.labelOf(address, element, tree), file: address.file, anchor: address.anchor }
  }
}
