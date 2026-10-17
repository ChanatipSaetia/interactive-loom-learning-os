/**
 * The assistant conversation of one topic (grill-log-ai-assistant.md,
 * decision 56), kept in localStorage under `loom-ai-thread:<topicId>`.
 *
 * Messages store what the person wrote, the picks they sent (as chips) and
 * the replies, never copies of the source: every request resolves the
 * thread's picks against the current sources (see `context.ts`). Older
 * turns are dropped, oldest first, once the profile's token budget is
 * spent; the system prompt and the topic context are always sent.
 */
import type { ChatMessage } from './client'
import type { ContextPointer } from './context'

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
  /** Assistant messages with edits: what the dry run found wrong (empty when they check out). */
  problems?: string[]
  /** User messages Studio sent itself: the validation retry. */
  auto?: boolean
  at: number
}

export interface AssistantThread {
  messages: ThreadMessage[]
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

function readMessage(value: unknown): ThreadMessage | null {
  const message = value as Partial<ThreadMessage>
  if (!message || typeof message.id !== 'string' || (message.role !== 'user' && message.role !== 'assistant')) return null
  const out: ThreadMessage = { id: message.id, role: message.role, text: typeof message.text === 'string' ? message.text : '', at: typeof message.at === 'number' ? message.at : 0 }
  if (message.role === 'user') {
    out.picks = Array.isArray(message.picks) ? message.picks.map(readPick).filter((p): p is ThreadPick => p !== null) : []
    out.mode = message.mode === 'ask' ? 'ask' : 'comment'
    if (message.auto === true) out.auto = true
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
    if (Array.isArray(message.problems)) out.problems = message.problems.filter((p): p is string => typeof p === 'string')
  }
  return out
}

export function loadThread(topicId: string): AssistantThread {
  try {
    const raw = localStorage.getItem(storageKey(topicId))
    if (!raw) return EMPTY_THREAD
    const parsed = JSON.parse(raw) as { messages?: unknown }
    const messages = Array.isArray(parsed.messages) ? parsed.messages.map(readMessage).filter((m): m is ThreadMessage => m !== null) : []
    return { messages }
  } catch {
    return EMPTY_THREAD
  }
}

export function saveThread(topicId: string, thread: AssistantThread): void {
  try {
    if (thread.messages.length === 0) localStorage.removeItem(storageKey(topicId))
    else localStorage.setItem(storageKey(topicId), JSON.stringify(thread))
  } catch {
    // Storage full or blocked: the thread lasts for this page only.
  }
}

/** Rough token count: characters ÷ 4. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4)

/** What a user message says to the model: its picks (with comments), then the text. */
export function userMessageContent(message: ThreadMessage): string {
  const parts: string[] = []
  const picks = message.picks ?? []
  if (picks.length) {
    const list = picks
      .map((pick) => `- ${pick.file} #${pick.anchor}${pick.note.trim() ? `\n${pick.note.trim().split('\n').map((l) => `  ${l}`).join('\n')}` : ''}`)
      .join('\n')
    parts.push(`${message.mode === 'ask' ? 'About these places' : picks.some((p) => p.note.trim()) ? 'Comments on these places' : 'These places'}:\n${list}`)
  }
  if (message.text.trim()) parts.push(message.text.trim())
  if (message.mode === 'ask') parts.push('(This is a question: answer it, do not propose changes unless asked.)')
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

/**
 * The thread as chat messages, newest kept first until `budget` tokens are
 * used. The last user message is always sent, whatever its size.
 */
export function historyForRequest(thread: readonly ThreadMessage[], budget: number): HistoryForRequest {
  const sent: Array<{ index: number; message: ChatMessage }> = []
  let used = 0
  let sentUser = false
  for (let i = thread.length - 1; i >= 0; i--) {
    const message = thread[i]
    const content = message.role === 'user' ? userMessageContent(message) : assistantMessageContent(message)
    if (content === null) continue
    const cost = estimateTokens(content) + 4
    if (sentUser && used + cost > budget) break
    used += cost
    sent.unshift({ index: i, message: { role: message.role, content } })
    if (message.role === 'user') sentUser = true
  }
  // Chat templates of many local models want the history to start with a user turn.
  while (sent.length && sent[0].message.role === 'assistant') sent.shift()
  return { messages: sent.map((s) => s.message), firstSent: sent[0]?.index ?? thread.length }
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
