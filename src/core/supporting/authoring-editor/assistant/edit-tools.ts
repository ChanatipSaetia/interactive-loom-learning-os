/**
 * The Studio assistant's edit tools (grill-log-ai-assistant.md, decisions
 * 130–132): `edit_section`, `create_section` and `edit_topic` each change
 * one file and stage it (`changeset.ts`), never the buffers; the result is
 * the dry run's verdict, so the model fixes its own mistakes in the next
 * round. `describe_components` gives reference entries for writing new
 * statements.
 */
import { componentClosure, componentEntries } from '../../../learning-engine/composition/oui/assistant-prompt'
import {
  newErrors,
  parseStatements,
  stageSection,
  stageStatements,
  stageTopic,
  type Changeset,
  type StageResult,
} from './changeset'
import type { ToolDefinition, ToolOutcome } from './content-tools'
import { parseAddress } from './content-tools'
import type { AssistantTopicContext } from './context'

export const EDIT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'edit_section',
      description:
        'Stage changes to ONE file: a section (sections/<name>.oui) or its Present-mode narration script (sections/<name>.narrate.oui, created when missing). Give whole statements: a name that exists is replaced, a new name is added after the statements this call changed. Call once per file; the author reviews staged changes before they reach the editor.',
      parameters: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'The file, e.g. "sections/quiz.oui" or "sections/quiz.narrate.oui".' },
          statements: { type: 'string', description: 'Complete openui-lang statements, one `name = Expression` each (multi-line inside brackets is fine). Never partial statements or "...".' },
          delete: { type: 'array', items: { type: 'string' }, description: 'Names of statements to remove.' },
          summary: { type: 'string', description: 'One line for the author: what this change does.' },
        },
        required: ['file', 'summary'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_section',
      description: 'Stage a new section file sections/<name>.oui and list its SectionRef in topic.oui. To write its narration afterwards, call edit_section on sections/<name>.narrate.oui.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Section name: lowercase letters, digits, - and _.' },
          source: { type: 'string', description: 'The whole file, starting with `root = <Section>(...)` and every statement it references.' },
          after: { type: 'string', description: 'Name of the section it follows in topic.oui; leave out to add it at the end.' },
          summary: { type: 'string', description: 'One line for the author: what the section is for.' },
        },
        required: ['name', 'source', 'summary'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_topic',
      description: "Stage changes to the topic's metadata in topic.oui. Sections are added with create_section; removing or reordering sections is done by the author.",
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string', description: 'One line for the author: what this change does.' },
        },
        required: ['summary'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'describe_components',
      description: 'Reference entries (signature, what each argument is for, an example) for Loom components, with the components they contain. Use before writing a component you have not seen in the topic.',
      parameters: {
        type: 'object',
        properties: { names: { type: 'array', items: { type: 'string' }, description: 'Component names, e.g. ["Quiz", "Flashcards"].' } },
        required: ['names'],
        additionalProperties: false,
      },
    },
  },
]

/** A plan the author ticks and builds (decision 139). */
export const PLAN_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'propose_plan',
    description:
      'Show the author a plan as a card: sections to create or change, each with a checkbox, and a "Build these" button. Use it once you know the audience and goal, before staging edits for a new topic or a large change. The author answers with the items to build.',
    parameters: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'What the learner should be able to do afterwards, in one sentence.' },
        items: {
          type: 'array',
          description: 'The sections in reading order.',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['create', 'edit'] },
              name: { type: 'string', description: 'Section name (sections/<name>.oui), new or existing.' },
              type: { type: 'string', description: 'Section component, e.g. "Quiz", "Flowchart", "Flashcards".' },
              title: { type: 'string' },
              idea: { type: 'string', description: 'The key idea it teaches, or what changes, in one or two sentences.' },
            },
            required: ['action', 'name', 'type', 'title', 'idea'],
            additionalProperties: false,
          },
        },
      },
      required: ['goal', 'items'],
      additionalProperties: false,
    },
  },
}

export interface PlanItem {
  action: 'create' | 'edit'
  name: string
  type: string
  title: string
  idea: string
}

export interface Plan {
  goal: string
  items: PlanItem[]
}

/** The plan in a `propose_plan` call's arguments, or null when it is not one. */
export function readPlan(args: string): Plan | null {
  try {
    const parsed = JSON.parse(args) as { goal?: unknown; items?: unknown }
    if (!Array.isArray(parsed.items)) return null
    const items = parsed.items.flatMap((raw): PlanItem[] => {
      const item = raw as Record<string, unknown>
      if (!item || typeof item !== 'object') return []
      const text = (key: string) => (typeof item[key] === 'string' ? (item[key] as string).trim() : '')
      const name = text('name').replace(/^sections\//, '').replace(/\.oui$/, '')
      if (!name && !text('title')) return []
      return [{ action: item.action === 'edit' ? 'edit' : 'create', name, type: text('type'), title: text('title') || name, idea: text('idea') }]
    })
    return items.length ? { goal: typeof parsed.goal === 'string' ? parsed.goal.trim() : '', items } : null
  } catch {
    return null
  }
}

/** The message "Build these" sends with the ticked items. */
export function buildMessage(plan: Plan, ticked: readonly number[]): string {
  const items = ticked.map((i) => plan.items[i]).filter(Boolean)
  return [
    `Build ${items.length === 1 ? 'this section' : 'these sections'} from the plan${plan.goal ? ` (goal: ${plan.goal})` : ''}:`,
    ...items.map((item, i) => `${i + 1}. ${item.action === 'edit' ? 'Change' : 'Create'} ${item.name ? `sections/${item.name}.oui` : 'a section'} (${item.type || 'section'}) "${item.title}": ${item.idea}`),
    '',
    'Stage them all with the edit tools in this turn, then sum up what you staged.',
  ].join('\n')
}

export const EDIT_TOOL_NAMES = new Set(EDIT_TOOLS.map((t) => t.function.name))

export interface EditToolOutcome extends ToolOutcome {
  /** The changeset after the call (unchanged when it failed). */
  changeset: Changeset
}

const str = (value: unknown) => (typeof value === 'string' ? value : undefined)
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : undefined)

/** Runs edit calls against the buffers and the changeset staged so far. */
export class EditToolRunner {
  constructor(
    private readonly context: AssistantTopicContext,
    private changeset: Changeset,
  ) {}

  run(name: string, args: string): EditToolOutcome {
    let parsed: Record<string, unknown>
    try {
      parsed = args.trim() ? (JSON.parse(args) as Record<string, unknown>) : {}
    } catch {
      return { content: 'Error: the arguments are not valid JSON.', label: `${name} (bad arguments)`, changeset: this.changeset }
    }
    const summary = str(parsed.summary)?.trim() || name
    if (name === 'describe_components') return this.describe(strings(parsed.names) ?? [])
    if (name === 'propose_plan') {
      const plan = readPlan(args)
      if (!plan) return { content: 'Error: the plan needs items, each with action, name, type, title and idea.', label: 'Plan (not shown)', changeset: this.changeset }
      return {
        content: `Shown to the author as a plan card with ${plan.items.length} items. Do not stage anything yet: say in a sentence that they can tick the items to build and press Build these, or ask for changes to the plan.`,
        label: `Plan: ${plan.items.length} ${plan.items.length === 1 ? 'section' : 'sections'}`,
        changeset: this.changeset,
      }
    }
    if (name === 'edit_section') {
      const raw = str(parsed.file) ?? ''
      const file = parseAddress(raw, { ...this.context.files, ...this.narrationSlots() })?.file ?? raw.trim()
      const statements = parseStatements(str(parsed.statements) ?? '')
      if ((str(parsed.statements) ?? '').trim() && !statements.length) {
        return this.failed(file, 'the statements could not be read: write `name = Expression` statements.')
      }
      return this.finish(file, summary, stageStatements(this.changeset, this.context.files, file, statements, strings(parsed.delete) ?? [], summary))
    }
    if (name === 'create_section') {
      const section = (str(parsed.name) ?? '').trim().replace(/^sections\//, '').replace(/\.oui$/, '')
      const file = `sections/${section}.oui`
      const after = str(parsed.after)?.trim().replace(/^sections\//, '').replace(/\.oui$/, '') || undefined
      const result = stageSection(this.changeset, this.context.files, section, str(parsed.source) ?? '', after, summary)
      return this.finish(file, summary, result, ['topic.oui'])
    }
    if (name === 'edit_topic') {
      const patch = { title: parsed.title, category: parsed.category, description: parsed.description, tags: parsed.tags }
      return this.finish('topic.oui', summary, stageTopic(this.changeset, this.context.files, patch, summary))
    }
    return { content: `Error: there is no tool "${name}".`, label: name, changeset: this.changeset }
  }

  /** Narration files that do not exist yet, so `edit_section` can find them by a short name. */
  private narrationSlots(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const file of Object.keys(this.context.files)) {
      const narration = file.replace(/(?<!\.narrate)\.oui$/, '.narrate.oui')
      if (narration !== file && file.startsWith('sections/') && this.context.files[narration] === undefined) out[narration] = ''
    }
    return out
  }

  private failed(file: string, error: string): EditToolOutcome {
    return { content: `Not staged: ${error}`, label: `${file} (not staged)`, file, changeset: this.changeset }
  }

  private finish(file: string, summary: string, result: StageResult, also: string[] = []): EditToolOutcome {
    if (result.error) return this.failed(file, result.error)
    this.changeset = result.changeset
    const errors = [file, ...also].flatMap((f) => newErrors(this.context.topicId, f, this.context.files, this.changeset).map((e) => `${f} ${e}`))
    const done = `Staged ${result.staged?.join(', ') ?? 'the change'} in ${file}.`
    const content = errors.length
      ? `${done} The staged file has new errors; fix them with another call:\n${errors.map((e) => `- ${e}`).join('\n')}`
      : `${done} No new errors. The author reviews it before it reaches the editor.`
    return { content, label: summary, file, anchor: 'root', changeset: this.changeset }
  }

  private describe(names: string[]): EditToolOutcome {
    const closure = componentClosure(names)
    const unknown = names.filter((n) => !closure.includes(n))
    const entries = closure.length ? componentEntries(closure) : ''
    const content = [entries, unknown.length ? `Unknown components: ${unknown.join(', ')}. The component index in the system prompt lists them all.` : '']
      .filter(Boolean)
      .join('\n\n') || 'Error: give component names, e.g. ["Quiz"].'
    return { content, label: `Components: ${names.join(', ')}`, changeset: this.changeset }
  }
}
