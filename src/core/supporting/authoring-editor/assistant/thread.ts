/**
 * The assistant conversation of one topic (grill-log-ai-assistant.md,
 * decision 56), kept in localStorage under `loom-ai-thread:<topicId>`.
 *
 * Messages store what the person wrote, the picks they sent (as chips) and
 * the replies. A user message also keeps the <topic-context> block it was
 * sent with (built from the current sources at that moment, see
 * `context.ts`), so every later request repeats the earlier turns byte for
 * byte and servers can reuse their prompt cache (decision 63).
 *
 * Once the history outgrows the profile's token budget, the oldest turns
 * are dropped in one step, down to half the budget, and the thread keeps
 * where it starts (`start`): the prefix then stays the same for the
 * following requests instead of shifting by one turn each time.
 *
 * A reply that used the content tools (decisions 120–124) keeps its tool
 * rounds (`steps`): the calls, their results and any text written with
 * them, sent again unchanged with later requests.
 */
import type { ChatMessage } from './client'
import type { ContextPointer } from './context'
import type { AssistantApp } from '../../../learning-engine/composition/oui/assistant-prompt'
import { readChangeset, type Changeset } from './changeset'

/** A pick sent with a message, shown as a chip. */
export interface ThreadPick {
  file: string
  anchor: string
  /** For people: section title and anchor. */
  label: string
  /** Comment written on the pick; empty for a mention. */
  note: string
}

export type ThreadMessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

/** What became of one proposed `oui-edit` block (decision 54). */
export interface EditHunkState {
  state: 'pending' | 'applied' | 'rejected' | 'failed'
  error?: string
}

/** One content-tool call of a reply and what it returned (decision 124). */
export interface ToolStepCall {
  id: string
  name: string
  /** The model's JSON arguments, as sent. */
  args: string
  /** What went back to the model. */
  result: string
  /** What the learner sees: "Looked at <label>". */
  label: string
  /** The place looked at, for Show on page. */
  file?: string
  anchor?: string
  /** A web page read (decision 142), opened from the activity pill. */
  url?: string
}

/** One tool round: the text the model wrote with its calls, then the calls. */
export interface ToolStep {
  text: string
  /** What the model thought before these calls; shown only, never sent back (decision 128). */
  thinking?: string
  calls: ToolStepCall[]
}

/** Thinking kept per round or reply; longer reasoning is cut, so the thread fits in localStorage. */
export const MAX_THINKING = 20000

export const clipThinking = (text: string) => (text.length > MAX_THINKING ? `${text.slice(0, MAX_THINKING)}…` : text)

export interface ThreadMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** User messages: the picks sent with it. */
  picks?: ThreadPick[]
  /** User messages: Ask (a question; do not change anything) or Comment. */
  mode?: 'comment' | 'ask'
  /** Assistant messages. */
  status?: ThreadMessageStatus
  /** Assistant messages that failed: what went wrong. */
  error?: { kind: string; message: string }
  /** Assistant messages: where the answer came from. */
  via?: { host: string; model: string }
  /** Assistant messages in Studio: one state per `oui-edit` block, in reply order. */
  edits?: EditHunkState[]
  /** Assistant messages: the content-tool rounds before the answer (Viewer). */
  steps?: ToolStep[]
  /** Assistant messages: what the model thought before its answer; shown only, never sent back (decision 128). */
  thinking?: string
  /** Assistant messages: how long the model spent thinking, in all rounds. */
  thoughtMs?: number
  /** Assistant messages with a plan card: the `propose_plan` call that was built (decision 139). */
  planBuilt?: string
  /** Assistant messages with edits: what the dry run found wrong (empty when they check out). */
  problems?: string[]
  /** User messages Studio sent itself: the validation retry. */
  auto?: boolean
  /** User messages: the <topic-context> block sent with it ('' when nothing was new). */
  context?: string
  /** User messages: keys of the parts that block carries (see `buildTopicContext`). */
  sent?: string[]
  /** User messages in Studio: what the author decided about staged changes since the last turn (decision 135). */
  stagedNote?: string
  at: number
}

export interface AssistantThread {
  messages: ThreadMessage[]
  /** Id of the first message still sent; earlier ones were dropped for the token budget. */
  start?: string
  /** Studio: changes the edit tools staged, kept until applied or rejected (decisions 133–135). */
  staged?: Changeset
}

export const EMPTY_THREAD: AssistantThread = { messages: [] }

const storageKey = (topicId: string) => `loom-ai-thread:${topicId}`

export function newMessageId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }
}

function readPick(value: unknown): ThreadPick | null {
  const pick = value as Partial<ThreadPick>
  if (!pick || typeof pick.file !== 'string' || typeof pick.anchor !== 'string') return null
  return { file: pick.file, anchor: pick.anchor, label: typeof pick.label === 'string' ? pick.label : pick.anchor, note: typeof pick.note === 'string' ? pick.note : '' }
}

function readStep(value: unknown): ToolStep | null {
  const step = value as Partial<ToolStep>
  if (!step || !Array.isArray(step.calls)) return null
  const calls = step.calls.flatMap((raw): ToolStepCall[] => {
    const call = raw as Partial<ToolStepCall>
    if (!call || typeof call.id !== 'string' || typeof call.name !== 'string' || typeof call.result !== 'string') return []
    const out: ToolStepCall = { id: call.id, name: call.name, args: typeof call.args === 'string' ? call.args : '{}', result: call.result, label: typeof call.label === 'string' ? call.label : call.name }
    if (typeof call.file === 'string') out.file = call.file
    if (typeof call.anchor === 'string') out.anchor = call.anchor
    if (typeof call.url === 'string' && /^https?:\/\//.test(call.url)) out.url = call.url
    return [out]
  })
  if (!calls.length) return null
  const out: ToolStep = { text: typeof step.text === 'string' ? step.text : '', calls }
  if (typeof step.thinking === 'string' && step.thinking) out.thinking = clipThinking(step.thinking)
  return out
}

function readMessage(value: unknown): ThreadMessage | null {
  const message = value as Partial<ThreadMessage>
  if (!message || typeof message.id !== 'string' || (message.role !== 'user' && message.role !== 'assistant')) return null
  const out: ThreadMessage = { id: message.id, role: message.role, text: typeof message.text === 'string' ? message.text : '', at: typeof message.at === 'number' ? message.at : 0 }
  if (message.role === 'user') {
    out.picks = Array.isArray(message.picks) ? message.picks.map(readPick).filter((p): p is ThreadPick => p !== null) : []
    out.mode = message.mode === 'ask' ? 'ask' : 'comment'
    if (message.auto === true) out.auto = true
    if (typeof message.stagedNote === 'string' && message.stagedNote) out.stagedNote = message.stagedNote
    if (typeof message.context === 'string') {
      out.context = message.context
      out.sent = Array.isArray(message.sent) ? message.sent.filter((k): k is string => typeof k === 'string') : []
    }
  } else {
    // A reply that was still streaming when the page closed ends there.
    out.status = message.status === 'streaming' ? 'stopped' : message.status && ['done', 'stopped', 'error'].includes(message.status) ? message.status : 'done'
    if (message.error && typeof message.error.message === 'string') out.error = { kind: String(message.error.kind ?? 'http'), message: message.error.message }
    if (message.via && typeof message.via.host === 'string' && typeof message.via.model === 'string') out.via = { host: message.via.host, model: message.via.model }
    if (Array.isArray(message.edits)) {
      out.edits = message.edits.map((e) => ({
        state: e && ['pending', 'applied', 'rejected', 'failed'].includes(e.state) ? e.state : 'pending',
        ...(e && typeof e.error === 'string' ? { error: e.error } : {}),
      }))
    }
    if (typeof message.thinking === 'string' && message.thinking) out.thinking = clipThinking(message.thinking)
    if (typeof message.thoughtMs === 'number' && message.thoughtMs > 0) out.thoughtMs = message.thoughtMs
    if (Array.isArray(message.steps)) {
      const steps = message.steps.map(readStep).filter((s): s is ToolStep => s !== null)
      if (steps.length) out.steps = steps
    }
    if (typeof message.planBuilt === 'string') out.planBuilt = message.planBuilt
    if (Array.isArray(message.problems)) out.problems = message.problems.filter((p): p is string => typeof p === 'string')
  }
  return out
}

export function loadThread(topicId: string): AssistantThread {
  try {
    const raw = localStorage.getItem(storageKey(topicId))
    if (!raw) return EMPTY_THREAD
    const parsed = JSON.parse(raw) as { messages?: unknown; start?: unknown; staged?: unknown }
    const messages = Array.isArray(parsed.messages) ? parsed.messages.map(readMessage).filter((m): m is ThreadMessage => m !== null) : []
    const thread: AssistantThread = typeof parsed.start === 'string' && messages.some((m) => m.id === parsed.start) ? { messages, start: parsed.start } : { messages }
    const staged = readChangeset(parsed.staged)
    if (staged.length) thread.staged = staged
    return thread
  } catch {
    return EMPTY_THREAD
  }
}

export function saveThread(topicId: string, thread: AssistantThread): void {
  try {
    if (thread.messages.length === 0 && !thread.staged?.length) localStorage.removeItem(storageKey(topicId))
    else localStorage.setItem(storageKey(topicId), JSON.stringify(thread))
  } catch {
    // Storage full or blocked: the thread lasts for this page only.
  }
}

/** Rough token count: characters ÷ 4. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4)

/**
 * What a user message says to the model: its topic context, its picks (with comments), then the text.
 * In Viewer every pick is something the learner asks about; nothing is a change request (decision 119).
 */
export function userMessageContent(message: ThreadMessage, app: AssistantApp = 'studio'): string {
  const parts: string[] = []
  if (message.context) parts.push(message.context)
  if (message.stagedNote) parts.push(message.stagedNote)
  const picks = message.picks ?? []
  if (picks.length) {
    const list = picks
      .map((pick) => `- ${pick.file} #${pick.anchor}${pick.note.trim() ? `\n${pick.note.trim().split('\n').map((l) => `  ${l}`).join('\n')}` : ''}`)
      .join('\n')
    const heading = app === 'viewer' || message.mode === 'ask' ? 'About these places' : picks.some((p) => p.note.trim()) ? 'Comments on these places' : 'These places'
    parts.push(`${heading}:\n${list}`)
  }
  if (message.text.trim()) parts.push(message.text.trim())
  if (app === 'studio' && message.mode === 'ask') parts.push('(This is a question: answer it, do not propose changes unless asked.)')
  return parts.join('\n\n')
}

const EDIT_BLOCK = /^[ \t]*```oui-edit([^\n]*)\n[\s\S]*?\n[ \t]*```[ \t]*$/gm

/**
 * What an earlier reply says to the model; failed replies are left out.
 * Proposed edits go back as one line each with what became of them, not the
 * whole block again (decision 56).
 */
function assistantMessageContent(message: ThreadMessage): string | null {
  if (message.status === 'error' || !message.text.trim()) return null
  let index = 0
  const text = message.text.replace(EDIT_BLOCK, (_block, info: string) => {
    const file = /\bfile=("?)([^\s"]+)\1/.exec(info)?.[2] ?? '?'
    const hunk = message.edits?.[index++]
    const state = hunk?.state === 'failed' ? `failed: ${hunk.error ?? 'could not be applied'}` : hunk?.state ?? 'pending'
    return `[Proposed edit to ${file}: ${state}]`
  })
  return message.status === 'stopped' ? `${text}\n\n(stopped before the end)` : text
}

export interface HistoryForRequest {
  messages: ChatMessage[]
  /** Index in the thread of the first message sent; earlier ones did not fit the budget. */
  firstSent: number
}

export interface HistoryOptions {
  app?: AssistantApp
  /** The request offers the content tools: tool rounds go as tool messages, else as "[Looked at …]" lines. */
  tools?: boolean
}

const lookedAt = (steps: readonly ToolStep[]) =>
  steps.flatMap((step) => step.calls.map((call) => `[Looked at ${call.name}(${call.args === '{}' ? '' : call.args}): ${call.label}]`)).join('\n')

/** One thread message as chat messages: a reply with tool rounds becomes several. */
function chatMessagesOf(message: ThreadMessage, options: HistoryOptions = {}): ChatMessage[] {
  if (message.role === 'user') return [{ role: 'user', content: userMessageContent(message, options.app) }]
  const text = assistantMessageContent(message)
  if (text === null) return []
  const steps = message.steps ?? []
  if (!steps.length) return [{ role: 'assistant', content: text }]
  if (!options.tools) return [{ role: 'assistant', content: `${lookedAt(steps)}\n\n${text}` }]
  return [...toolStepMessages(steps), { role: 'assistant', content: text }]
}

/** Tool rounds as chat messages: the assistant's calls, then one tool message per result. */
export function toolStepMessages(steps: readonly ToolStep[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const step of steps) {
    out.push({
      role: 'assistant',
      content: step.text,
      tool_calls: step.calls.map((call) => ({ id: call.id, type: 'function', function: { name: call.name, arguments: call.args } })),
    })
    for (const call of step.calls) out.push({ role: 'tool', tool_call_id: call.id, content: call.result })
  }
  return out
}

const costOf = (message: ThreadMessage) =>
  chatMessagesOf(message, { tools: true }).reduce((sum, m) => sum + estimateTokens(m.content + (m.tool_calls ? JSON.stringify(m.tool_calls) : '')) + 4, 0)

/**
 * Where the history sent with the next request starts: at `start` (the
 * thread's current start) while everything from there fits `budget` tokens;
 * otherwise at the first user turn from which the rest fits half the budget.
 * It always starts on a user turn (chat templates of many local models want
 * that), and the last user message is always sent, whatever its size.
 */
export function historyStart(thread: readonly ThreadMessage[], budget: number, start?: string): number {
  const users = thread.flatMap((m, i) => (m.role === 'user' ? [i] : []))
  if (!users.length) return thread.length
  const from = Math.max(0, thread.findIndex((m) => m.id === start))
  let index = users.find((i) => i >= from) ?? users[users.length - 1]
  const costs = thread.map(costOf)
  const rest = (i: number) => costs.slice(i).reduce((a, b) => a + b, 0)
  if (rest(index) <= budget) return index
  for (const i of users) {
    if (i < index) continue
    index = i
    if (rest(i) <= budget / 2) break
  }
  return index
}

/** The thread from `from` on, as chat messages; failed replies are left out. */
export function historyMessages(thread: readonly ThreadMessage[], from: number, options: HistoryOptions = {}): ChatMessage[] {
  return thread.slice(from).flatMap((message) => chatMessagesOf(message, options))
}

/** The history for the next request with the thread starting at `start`. */
export function historyForRequest(thread: readonly ThreadMessage[], budget: number, start?: string): HistoryForRequest {
  const firstSent = historyStart(thread, budget, start)
  return { messages: historyMessages(thread, firstSent), firstSent }
}

/** Keys of the topic-context parts the given messages already carry. */
export function knownContext(messages: readonly ThreadMessage[]): Set<string> {
  const known = new Set<string>()
  for (const message of messages) message.sent?.forEach((key) => known.add(key))
  return known
}

/** Every place picked in the thread, once each, in the order first sent. */
export function threadPointers(thread: readonly ThreadMessage[]): ContextPointer[] {
  const seen = new Set<string>()
  const out: ContextPointer[] = []
  for (const message of thread) {
    for (const pick of message.picks ?? []) {
      const key = `${pick.file}#${pick.anchor}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ file: pick.file, anchor: pick.anchor })
    }
  }
  return out
}
