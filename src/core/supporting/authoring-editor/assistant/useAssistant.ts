/**
 * State of the AI assistant for one page (grill-log-ai-assistant.md,
 * decisions 55–61): the active profile, the topic's thread, the request in
 * flight, the Assistant panel and the settings dialog.
 *
 * Requests are laid out for prompt caching (decision 63): the same system
 * prompt for the whole conversation, then the thread as it was sent before,
 * then the new message, which carries a <topic-context> block built from the
 * current sources (`getContext`) with only what the earlier blocks in the
 * history do not already hold. The block is stored with the message, so the
 * next request repeats it unchanged.
 *
 * Messages are written in the Pick message bar, which hands them to `send`.
 *
 * With an `editor` (Studio), replies may propose `oui-edit` blocks
 * (decisions 54 and 58): each finished reply is dry-run against the current
 * buffers, and when the result does not validate the problems go back to the
 * model once, automatically. Applying a block writes the buffer only; Save
 * writes the files.
 *
 * With the profile's tools on, the model can call the content tools
 * (decisions 120–124, and 129 in Studio): up to `MAX_TOOL_ROUNDS` rounds of
 * calls (`MAX_STUDIO_TOOL_ROUNDS` in Studio) run in the page before it must
 * answer, and each round is kept on the reply. In Studio the edit tools
 * stage their changes in the thread's changeset (decisions 130–135), which
 * the author applies to the buffers statement by statement.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getLoomAssistantPrompt, type AssistantApp } from '../../../learning-engine/composition/oui/assistant-prompt'
import { AssistantError, chatCompletion, isLoopbackHost, listModels } from './client'
import { buildTopicContext, type AssistantTopicContext } from './context'
import { CONTENT_TOOLS, CONTENT_TOOL_NAMES, ContentToolRunner, STUDIO_CONTENT_TOOLS } from './content-tools'
import { EDIT_TOOLS, EDIT_TOOL_NAMES, EditToolRunner } from './edit-tools'
import { applyRank, changesetNote, decide, fileView, stagedContext, type Changeset } from './changeset'
import { applyEditBlock, applyOrder, checkProposal, parseEditBlocks } from './edits'
import {
  activeProfile,
  connectionOf,
  loadAssistantSettings,
  saveAssistantSettings,
  type AssistantProfile,
  type AssistantSettings,
} from './profiles'
import {
  EMPTY_THREAD,
  historyMessages,
  historyStart,
  knownContext,
  loadThread,
  newMessageId,
  saveThread,
  threadPointers,
  toolStepMessages,
  type AssistantThread,
  type EditHunkState,
  type ThreadMessage,
  type ThreadPick,
  type ToolStep,
  type ToolStepCall,
  clipThinking,
} from './thread'

/** Tool rounds per message before the model must answer (decision 124). */
export const MAX_TOOL_ROUNDS = 6

/** Studio's limit, for reading and editing several sections in one turn (decision 136). */
export const MAX_STUDIO_TOOL_ROUNDS = 16

const LIMIT_NOTE = '\n\n(Tool limit reached for this message: answer now with what you have.)'
const UNCHANGED = 'Unchanged since your earlier call with the same arguments: use that result.'

/** The server refused a request because of its tools (it does not support tool calling). */
const rejectsTools = (error: unknown) =>
  error instanceof AssistantError && !error.partial && error.kind === 'http' && (error.status === 400 || error.status === 422)

/** Results of earlier calls by tool and arguments, to answer a repeated read with "unchanged". */
function earlierResults(messages: readonly ThreadMessage[]): Map<string, string> {
  const out = new Map<string, string>()
  for (const message of messages) {
    for (const step of message.steps ?? []) {
      for (const call of step.calls) if (!call.result.startsWith(UNCHANGED)) out.set(callKey(call.name, call.args), call.result.replace(LIMIT_NOTE, ''))
    }
  }
  return out
}

function callKey(name: string, args: string): string {
  try {
    const parsed = JSON.parse(args || '{}') as Record<string, unknown>
    return `${name}:${JSON.stringify(Object.keys(parsed).sort().map((k) => [k, parsed[k]]))}`
  } catch {
    return `${name}:${args}`
  }
}

export interface AssistantDraft {
  mode: 'comment' | 'ask'
  message: string
  picks: ThreadPick[]
}

/** Where Studio puts proposed edits: the editor buffers, never the disk. */
export interface AssistantEditor {
  /** Put a file's new text into the buffers; returns why it could not, or null. */
  write(file: string, source: string): string | null
  /** Show a statement in the code editor. */
  reveal(file: string, statement?: string): void
}

/** The message Studio sends itself when a proposal does not validate. */
export function retryMessage(problems: readonly string[]): string {
  return `Your proposed edits do not check out:\n${problems.map((p) => `- ${p}`).join('\n')}\n\nSend corrected oui-edit blocks (complete statements) for the files involved.`
}

export interface UseAssistantOptions {
  topicId: string
  app: AssistantApp
  /** The topic as it is now; called when a request is built. */
  getContext: () => AssistantTopicContext
  /** Studio: lets replies propose edits that are applied to the buffers. */
  editor?: AssistantEditor
  /** For tests: replaces `fetch`. */
  fetchImpl?: typeof fetch
}

const NOTICE_KEY = (profileId: string) => `loom-ai-remote-ok:${profileId}`

export function hostOf(baseUrl: string): string {
  try {
    return new URL(baseUrl).host
  } catch {
    return baseUrl
  }
}

/** Remote profiles show a one-time notice before their first send (decision 61). */
function needsRemoteNotice(profile: AssistantProfile): boolean {
  try {
    if (isLoopbackHost(new URL(profile.baseUrl).hostname)) return false
  } catch {
    return false
  }
  try {
    return localStorage.getItem(NOTICE_KEY(profile.id)) !== '1'
  } catch {
    return true
  }
}

function acknowledgeRemoteNotice(profileId: string) {
  try {
    localStorage.setItem(NOTICE_KEY(profileId), '1')
  } catch {
    // Blocked storage: the notice shows again next time.
  }
}

/** The thread of one topic, kept in localStorage (not while a reply streams). */
function useThread(topicId: string) {
  const [thread, setThread] = useState<AssistantThread>(() => loadThread(topicId))
  const [loadedFor, setLoadedFor] = useState(topicId)
  if (loadedFor !== topicId) {
    setLoadedFor(topicId)
    setThread(loadThread(topicId))
  }
  const streaming = thread.messages.some((m) => m.status === 'streaming')
  useEffect(() => {
    if (!streaming) saveThread(topicId, thread)
  }, [topicId, thread, streaming])
  return [thread, setThread] as const
}

export interface RemoteNotice {
  host: string
  profileName: string
}

export function useAssistant({ topicId, app, getContext, editor, fetchImpl }: UseAssistantOptions) {
  const [settings, setSettings] = useState<AssistantSettings>(loadAssistantSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [unread, setUnread] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [notice, setNotice] = useState<RemoteNotice | null>(null)
  const [thread, setThread] = useThread(topicId)
  const abort = useRef<AbortController | null>(null)
  const noticeAnswer = useRef<((ok: boolean) => void) | null>(null)
  const panelOpenRef = useRef(panelOpen)
  panelOpenRef.current = panelOpen
  const contextRef = useRef(getContext)
  contextRef.current = getContext
  const editorRef = useRef(editor)
  editorRef.current = editor
  const threadRef = useRef(thread)
  threadRef.current = thread

  const profile = activeProfile(settings)
  const busy = thread.messages.some((m) => m.status === 'streaming')

  // A new topic stops the reply for the old one.
  useEffect(() => () => abort.current?.abort(), [topicId])

  // The model list for the panel's model menu; failures just leave it empty.
  useEffect(() => {
    if (!panelOpen || !profile) return
    const controller = new AbortController()
    listModels(connectionOf(profile), { signal: controller.signal, fetch: fetchImpl })
      .then((list) => !controller.signal.aborted && setModels(list))
      .catch(() => !controller.signal.aborted && setModels([]))
    return () => controller.abort()
  }, [panelOpen, profile?.id, profile?.baseUrl, fetchImpl]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateSettings = useCallback((next: AssistantSettings) => {
    saveAssistantSettings(next)
    setSettings(next)
  }, [])

  const updateProfile = useCallback((patch: Partial<AssistantProfile>) => {
    setSettings((current) => {
      const next = { ...current, profiles: current.profiles.map((p) => (p.id === current.activeId ? { ...p, ...patch } : p)) }
      saveAssistantSettings(next)
      return next
    })
  }, [])

  const selectProfile = useCallback((id: string) => {
    setSettings((current) => {
      const next = { ...current, activeId: id }
      saveAssistantSettings(next)
      return next
    })
  }, [])

  const patchMessage = useCallback((id: string, patch: Partial<ThreadMessage> | ((m: ThreadMessage) => Partial<ThreadMessage>)) => {
    setThread((t) => ({ ...t, messages: t.messages.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)) }))
  }, [setThread])

  /**
   * Ask the model about `messages` (which end with the user's message).
   * `retry` marks the automatic second request after a proposal that did
   * not validate; it never triggers another one.
   */
  const run = useCallback(async (thread: ThreadMessage[], profile: AssistantProfile, retry = false): Promise<void> => {
    const controller = new AbortController()
    abort.current?.abort()
    abort.current = controller
    // The content tools (decisions 120, 129) and Studio's edit tools; off for the rest of this request once the server refuses them.
    const studio = app === 'studio' && !!editorRef.current
    let tools = (app === 'viewer' || studio) && profile.tools
    const toolList = studio ? [...STUDIO_CONTENT_TOOLS, ...EDIT_TOOLS] : CONTENT_TOOLS
    const toolNames = toolList.map((t) => t.function.name).join(', ')
    const maxRounds = studio ? MAX_STUDIO_TOOL_ROUNDS : MAX_TOOL_ROUNDS
    let staged: Changeset = threadRef.current.staged ?? []
    let toolsRefused = false
    let messages = thread
    let start = historyStart(messages, profile.tokenBudget, threadRef.current.start)
    const last = messages[messages.length - 1]
    // The new message's topic context: what the history from `start` does not hold yet.
    const withContext = (from: number): ThreadMessage => {
      const block = buildTopicContext(contextRef.current(), threadPointers(messages), {
        known: knownContext(messages.slice(from, -1)),
        // Viewer's prompt has no Full reference, so its entries always come with the context.
        reference: app === 'viewer' || !profile.fullReference,
        // With the tools, the model reads the section in view when it needs it (decision 127).
        wholeView: !tools,
      })
      return { ...last, context: block.text, sent: block.keys }
    }
    // What the author decided about staged changes goes with the next message they write (decision 135).
    if (studio && last?.role === 'user' && last.context === undefined && last.stagedNote === undefined && !last.auto) {
      const { note, changeset } = changesetNote(staged)
      if (note) {
        staged = changeset
        messages = [...messages.slice(0, -1), { ...last, stagedNote: note }]
      }
    }
    const prepare = () => {
      if (last?.role !== 'user' || last.context !== undefined) return
      messages = [...messages.slice(0, -1), { ...withContext(start), stagedNote: messages[messages.length - 1].stagedNote }]
      // The block itself can push the history over the budget; then cut and build it again.
      const moved = historyStart(messages, profile.tokenBudget, messages[start]?.id)
      if (moved !== start) {
        start = moved
        messages = [...messages.slice(0, -1), { ...withContext(start), stagedNote: messages[messages.length - 1].stagedNote }]
      }
    }
    prepare()
    const reply: ThreadMessage = {
      id: newMessageId(),
      role: 'assistant',
      text: '',
      status: 'streaming',
      via: { host: hostOf(profile.baseUrl), model: profile.model },
      at: Date.now(),
    }
    setThread({ messages: [...messages, reply], start: messages[start]?.id, staged })

    let followUp: ThreadMessage[] | null = null
    let steps: ToolStep[] = []
    // Thinking time (decision 128): from a round's first reasoning to its first text or the round's end.
    let thoughtMs = 0
    let thinkingSince: number | null = null
    const stopThinking = () => {
      if (thinkingSince === null) return
      thoughtMs += Date.now() - thinkingSince
      thinkingSince = null
      patchMessage(reply.id, { thoughtMs })
    }
    try {
      let result: Awaited<ReturnType<typeof chatCompletion>>
      for (let round = 0; ; round++) {
        // The same for every request of the conversation, so it stays cached.
        const system = getLoomAssistantPrompt({ app, fullReference: profile.fullReference, tools })
        try {
          result = await chatCompletion(
            connectionOf(profile),
            {
              model: profile.model,
              messages: [{ role: 'system', content: system }, ...historyMessages(messages, start, { app, tools }), ...toolStepMessages(steps)],
              tools: tools ? toolList : undefined,
              toolChoice: tools && round >= maxRounds ? 'none' : undefined,
              signal: controller.signal,
              onDelta: (delta) => {
                stopThinking()
                patchMessage(reply.id, (m) => ({ text: m.text + delta }))
              },
              onReasoning: (delta) => {
                thinkingSince ??= Date.now()
                patchMessage(reply.id, (m) => ({ thinking: (m.thinking ?? '') + delta }))
              },
            },
            { fetch: fetchImpl },
          )
        } catch (error) {
          if (!tools || round > 0 || !rejectsTools(error)) throw error
          // Sent again without tools; the switch turns off once that works (decision 120).
          tools = false
          toolsRefused = true
          if (last?.role === 'user' && last.context === undefined) {
            // Built for the tools; without them the section in view goes whole again.
            messages = [...messages.slice(0, -1), { ...messages[messages.length - 1], context: undefined, sent: undefined }]
            prepare()
            setThread({ messages: [...messages, reply], start: messages[start]?.id, staged })
          }
          round--
          continue
        }
        stopThinking()
        const calls = tools && round < maxRounds ? result.toolCalls : undefined
        if (!calls?.length) break
        const earlier = earlierResults([...messages.slice(start), { ...reply, steps }])
        const step: ToolStep = {
          text: result.text,
          ...(result.reasoning ? { thinking: clipThinking(result.reasoning) } : {}),
          calls: calls.map((call): ToolStepCall => {
            const name = call.function.name
            if (studio && EDIT_TOOL_NAMES.has(name)) {
              const outcome = new EditToolRunner(contextRef.current(), staged).run(name, call.function.arguments)
              staged = outcome.changeset
              return { id: call.id, name, args: call.function.arguments, result: outcome.content, label: outcome.label, file: outcome.file, anchor: outcome.anchor }
            }
            // Reads see the staged changes (decision 129).
            const outcome = CONTENT_TOOL_NAMES.has(name)
              ? new ContentToolRunner(studio ? stagedContext(contextRef.current(), staged) : contextRef.current(), studio).run(name, call.function.arguments)
              : { content: `Error: there is no tool "${name}". The tools are ${toolNames}.`, label: name }
            const key = callKey(name, call.function.arguments)
            const content = earlier.get(key) === outcome.content ? UNCHANGED : outcome.content
            return { id: call.id, name, args: call.function.arguments, result: content, label: outcome.label, file: outcome.file, anchor: outcome.anchor }
          }),
        }
        if (round === maxRounds - 1) step.calls = step.calls.map((c, i, all) => (i === all.length - 1 ? { ...c, result: c.result + LIMIT_NOTE } : c))
        steps = [...steps, step]
        // The text and thinking written with the calls move into the round; the answer streams in fresh.
        patchMessage(reply.id, { text: '', thinking: undefined, steps })
        if (studio) setThread((t) => ({ ...t, staged }))
      }
      if (toolsRefused) {
        setSettings((current) => {
          const next = { ...current, profiles: current.profiles.map((p) => (p.id === profile.id ? { ...p, tools: false } : p)) }
          saveAssistantSettings(next)
          return next
        })
      }
      const done: ThreadMessage = { ...reply, text: result.text, status: 'done' }
      const blocks = editorRef.current ? parseEditBlocks(result.text) : []
      if (blocks.length) {
        const check = checkProposal(topicId, blocks, contextRef.current().files)
        done.edits = blocks.map((b): EditHunkState => (b.error ? { state: 'failed', error: b.error } : { state: 'pending' }))
        done.problems = check.problems
        if (check.problems.length && !retry) {
          const auto: ThreadMessage = { id: newMessageId(), role: 'user', text: retryMessage(check.problems), picks: [], mode: 'comment', auto: true, at: Date.now() }
          followUp = [...messages, done, auto]
        }
      }
      patchMessage(reply.id, {
        text: done.text,
        status: 'done',
        edits: done.edits,
        problems: done.problems,
        thinking: result.reasoning ? clipThinking(result.reasoning) : undefined,
        ...(steps.length ? { steps } : {}),
        ...(thoughtMs ? { thoughtMs } : {}),
      })
    } catch (error) {
      stopThinking()
      const failure = error instanceof AssistantError ? error : new AssistantError('bad-response', String(error))
      if (failure.kind === 'aborted') {
        patchMessage(reply.id, (m) => ({ text: failure.partial ?? m.text, status: 'stopped' }))
      } else {
        patchMessage(reply.id, (m) => ({ text: failure.partial ?? m.text, status: 'error', error: { kind: failure.kind, message: failure.message } }))
      }
    } finally {
      if (abort.current === controller) abort.current = null
      if (!panelOpenRef.current && !followUp) setUnread(true)
    }
    if (followUp && !controller.signal.aborted) await run(followUp, profile, true)
  }, [app, fetchImpl, patchMessage, setThread, topicId])

  /**
   * Send a draft from the message bar. Resolves to true once it is sent (the bar
   * then clears); false when it was not (no profile yet, the notice was
   * declined, or a reply is still streaming).
   */
  const send = useCallback(async (draft: AssistantDraft): Promise<boolean> => {
    if (!profile || !profile.model.trim()) {
      setSettingsOpen(true)
      return false
    }
    if (busy || (!draft.message.trim() && draft.picks.length === 0)) return false
    if (needsRemoteNotice(profile)) {
      setNotice({ host: hostOf(profile.baseUrl), profileName: profile.name })
      const ok = await new Promise<boolean>((resolve) => {
        noticeAnswer.current = resolve
      })
      if (!ok) return false
      acknowledgeRemoteNotice(profile.id)
    }
    const message: ThreadMessage = {
      id: newMessageId(),
      role: 'user',
      text: draft.message.trim(),
      picks: draft.picks,
      mode: draft.mode,
      at: Date.now(),
    }
    setPanelOpen(true)
    setUnread(false)
    void run([...thread.messages, message], profile)
    return true
  }, [busy, profile, run, thread.messages])

  const answerNotice = useCallback((ok: boolean) => {
    setNotice(null)
    noticeAnswer.current?.(ok)
    noticeAnswer.current = null
  }, [])

  const stop = useCallback(() => abort.current?.abort(), [])

  /** Ask again after a failed or stopped reply. */
  const retry = useCallback(() => {
    if (!profile || busy) return
    const messages = [...thread.messages]
    while (messages.length && messages[messages.length - 1].role === 'assistant') messages.pop()
    if (!messages.length) return
    // Its topic context is built again, from the sources as they are now.
    const last = { ...messages[messages.length - 1] }
    delete last.context
    delete last.sent
    void run([...messages.slice(0, -1), last], profile)
  }, [busy, profile, run, thread.messages])

  const setHunk = useCallback((messageId: string, index: number, hunk: EditHunkState) => {
    patchMessage(messageId, (m) => {
      const edits = [...(m.edits ?? [])]
      edits[index] = hunk
      return { edits }
    })
  }, [patchMessage])

  /** Apply one proposed block to the buffers; returns the changed statement to show, if any. */
  const applyOne = useCallback((message: ThreadMessage, index: number): { file: string; statement?: string } | null => {
    const target = editorRef.current
    const block = parseEditBlocks(message.text)[index]
    if (!target || !block) return null
    const result = applyEditBlock(contextRef.current().files[block.file], block)
    const error = result.ok ? target.write(block.file, result.source) : result.error ?? 'The edit could not be applied.'
    setHunk(message.id, index, error ? { state: 'failed', error } : { state: 'applied' })
    if (error) return null
    return { file: block.file, statement: result.changes.find((c) => c.kind !== 'delete' && c.kind !== 'create')?.name ?? 'root' }
  }, [setHunk])

  const applyEdit = useCallback((messageId: string, index: number) => {
    const message = threadRef.current.messages.find((m) => m.id === messageId)
    if (!message) return
    const shown = applyOne(message, index)
    if (shown) editorRef.current?.reveal(shown.file, shown.statement)
  }, [applyOne])

  /** Apply every pending block: new files, then sections, then topic.oui. */
  const applyAllEdits = useCallback((messageId: string) => {
    const message = threadRef.current.messages.find((m) => m.id === messageId)
    if (!message) return
    let first: { file: string; statement?: string } | null = null
    for (const block of applyOrder(parseEditBlocks(message.text))) {
      if ((message.edits?.[block.index]?.state ?? 'pending') !== 'pending') continue
      const shown = applyOne(message, block.index)
      first ??= shown
    }
    if (first) editorRef.current?.reveal(first.file, first.statement)
  }, [applyOne])

  const rejectEdit = useCallback((messageId: string, index: number) => setHunk(messageId, index, { state: 'rejected' }), [setHunk])

  const showEdit = useCallback((file: string, statement?: string) => editorRef.current?.reveal(file, statement), [])

  const setStaged = useCallback((update: (staged: Changeset) => Changeset) => {
    setThread((t) => {
      const { staged: before, ...rest } = t
      const staged = update(before ?? [])
      return staged.length ? { ...rest, staged } : rest
    })
  }, [setThread])

  /**
   * Apply one staged file's pending changes (or those named in `names`) to
   * its buffer (decision 133). Conflicts stay staged. A new section brings
   * its SectionRef along, so it lands where the model put it. Returns why it
   * could not be applied, or null.
   */
  const applyStagedFile = useCallback((file: string, names?: ReadonlySet<string>): string | null => {
    const target = editorRef.current
    const staged = threadRef.current.staged ?? []
    const entry = staged.find((s) => s.file === file)
    if (!target || !entry) return null
    const files = contextRef.current().files
    const view = fileView(files[file], entry, names)
    const pending = entry.changes.filter((c) => c.state === 'pending' && (!names || names.has(c.name)))
    // SectionRefs go with their new files; on their own they wait.
    const waiting = file === 'topic.oui'
      ? new Set(pending.filter((c) => c.kind === 'section' && files[`sections/${c.name}.oui`] === undefined).map((c) => c.name))
      : new Set<string>()
    const chosen = new Set(pending.map((c) => c.name).filter((n) => !view.conflicts.has(n) && !waiting.has(n)))
    if (!chosen.size) return view.conflicts.size ? 'These changes clash with edits in the editor; reject them or ask again.' : null
    let next = waiting.size ? fileView(files[file], entry, chosen).source : view.source
    if (next !== undefined && next !== files[file]) {
      const error = target.write(file, next)
      if (error) return error
    }
    let decided = decide(staged, file, chosen, 'applied')
    const created = entry.changes.find((c) => c.kind === 'create' && chosen.has(c.name))
    const section = created ? /^sections\/([^/.]+)\.oui$/.exec(file)?.[1] : undefined
    const topic = section ? decided.find((s) => s.file === 'topic.oui') : undefined
    if (section && topic?.changes.some((c) => c.kind === 'section' && c.name === section && c.state === 'pending')) {
      next = fileView(contextRef.current().files['topic.oui'], topic, new Set([section])).source
      const error = next !== undefined ? target.write('topic.oui', next) : null
      if (!error) decided = decide(decided, 'topic.oui', new Set([section]), 'applied')
    }
    threadRef.current = { ...threadRef.current, staged: decided }
    setStaged(() => decided)
    return null
  }, [setStaged])

  /** Apply every staged file: new files, then sections, then topic.oui. Returns the errors by file. */
  const applyAllStaged = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {}
    const order = [...(threadRef.current.staged ?? [])].sort((a, b) => applyRank(a) - applyRank(b))
    let first: string | null = null
    for (const entry of order) {
      if (!entry.changes.some((c) => c.state === 'pending')) continue
      const error = applyStagedFile(entry.file)
      if (error) errors[entry.file] = error
      else first ??= entry.file
    }
    if (first) editorRef.current?.reveal(first)
    return errors
  }, [applyStagedFile])

  /** Reject a staged file's pending changes (or those named); a new file takes its SectionRef with it. */
  const rejectStagedFile = useCallback((file: string, names?: ReadonlySet<string>) => {
    setStaged((staged) => {
      const entry = staged.find((s) => s.file === file)
      let next = decide(staged, file, names ?? null, 'rejected')
      const section = /^sections\/([^/.]+)\.oui$/.exec(file)?.[1]
      if (section && entry?.changes.some((c) => c.kind === 'create' && c.state === 'pending' && (!names || names.has(c.name)))) {
        next = decide(next, 'topic.oui', new Set([section]), 'rejected')
      }
      return next
    })
  }, [setStaged])

  const rejectAllStaged = useCallback(() => {
    setStaged((staged) => staged.reduce((acc, s) => decide(acc, s.file, null, 'rejected'), staged))
  }, [setStaged])

  const newChat = useCallback(() => {
    abort.current?.abort()
    setThread(EMPTY_THREAD)
  }, [setThread])

  const togglePanel = useCallback((open?: boolean) => {
    setPanelOpen((current) => {
      const next = open ?? !current
      if (next) setUnread(false)
      return next
    })
  }, [])

  // Esc stops a streaming reply.
  useEffect(() => {
    if (!busy) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, stop])

  return {
    app,
    topicId,
    settings,
    profile,
    models,
    thread,
    busy,
    unread,
    panelOpen,
    settingsOpen,
    notice,
    send,
    stop,
    retry,
    newChat,
    togglePanel,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    answerNotice,
    /** Studio: replies can propose edits. */
    canEdit: !!editor,
    currentFiles: () => contextRef.current().files,
    applyEdit,
    applyAllEdits,
    /** Studio: the changeset the edit tools staged (decision 133). */
    staged: thread.staged ?? [],
    applyStagedFile,
    applyAllStaged,
    rejectStagedFile,
    rejectAllStaged,
    rejectEdit,
    showEdit,
    updateSettings,
    updateProfile,
    selectProfile,
  }
}

export type AssistantState = ReturnType<typeof useAssistant>
