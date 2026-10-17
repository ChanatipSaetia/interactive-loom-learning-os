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
 * Messages are written in the panel's message box (with whatever the Pick
 * tray holds) or sent from the tray (`send`).
 *
 * With an `editor` (Studio), replies may propose `oui-edit` blocks
 * (decisions 54 and 58): each finished reply is dry-run against the current
 * buffers, and when the result does not validate the problems go back to the
 * model once, automatically. Applying a block writes the buffer only; Save
 * writes the files.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getLoomAssistantPrompt, type AssistantApp } from '../../../learning-engine/composition/oui/assistant-prompt'
import { AssistantError, chatCompletion, isLoopbackHost, listModels } from './client'
import { buildTopicContext, type AssistantTopicContext } from './context'
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
  type AssistantThread,
  type EditHunkState,
  type ThreadMessage,
  type ThreadPick,
} from './thread'

export interface AssistantDraft {
  mode: 'comment' | 'ask'
  message: string
  picks: ThreadPick[]
}

/** The Pick tray as the panel's message box sees it: its picks go with the next message. */
export interface AssistantTray {
  /** Places in the tray. */
  count: number
  /** The tray's draft: mode, its own message and picks. */
  take(): AssistantDraft
  /** Empty the tray after its draft was sent. */
  clear(): void
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
  const trayRef = useRef<AssistantTray | null>(null)
  const [trayCount, setTrayCount] = useState(0)

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
    let messages = thread
    let start = historyStart(messages, profile.tokenBudget, threadRef.current.start)
    const last = messages[messages.length - 1]
    if (last?.role === 'user' && last.context === undefined) {
      // The new message's topic context: what the history from `start` does not hold yet.
      const withContext = (from: number): ThreadMessage => {
        const block = buildTopicContext(contextRef.current(), threadPointers(messages), {
          known: knownContext(messages.slice(from, -1)),
          reference: !profile.fullReference,
        })
        return { ...last, context: block.text, sent: block.keys }
      }
      messages = [...messages.slice(0, -1), withContext(start)]
      // The block itself can push the history over the budget; then cut and build it again.
      const moved = historyStart(messages, profile.tokenBudget, messages[start]?.id)
      if (moved !== start) {
        start = moved
        messages = [...messages.slice(0, -1), withContext(start)]
      }
    }
    const reply: ThreadMessage = {
      id: newMessageId(),
      role: 'assistant',
      text: '',
      status: 'streaming',
      via: { host: hostOf(profile.baseUrl), model: profile.model },
      at: Date.now(),
    }
    setThread({ messages: [...messages, reply], start: messages[start]?.id })

    // The same for every request of the conversation, so it stays cached.
    const system = getLoomAssistantPrompt({ app, fullReference: profile.fullReference })
    let followUp: ThreadMessage[] | null = null
    try {
      const result = await chatCompletion(
        connectionOf(profile),
        {
          model: profile.model,
          messages: [{ role: 'system', content: system }, ...historyMessages(messages, start)],
          signal: controller.signal,
          onDelta: (delta) => patchMessage(reply.id, (m) => ({ text: m.text + delta })),
        },
        { fetch: fetchImpl },
      )
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
      patchMessage(reply.id, { text: done.text, status: 'done', edits: done.edits, problems: done.problems })
    } catch (error) {
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
   * Send a draft from the tray. Resolves to true once it is sent (the tray
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

  /** Send what was typed in the panel, together with the Pick tray's picks (which then clear). */
  const sendMessage = useCallback(async (text: string): Promise<boolean> => {
    const tray = trayRef.current
    const draft = tray?.take()
    const picks = draft?.picks ?? []
    const message = [draft?.message.trim() ?? '', text.trim()].filter(Boolean).join('\n\n')
    const ok = await send({ mode: picks.length && draft ? draft.mode : 'comment', message, picks })
    if (ok && draft && (picks.length || draft.message.trim())) tray?.clear()
    return ok
  }, [send])

  /** The Pick tray registers itself here (null when it goes away). */
  const connectTray = useCallback((tray: AssistantTray | null) => {
    trayRef.current = tray
    setTrayCount(tray?.count ?? 0)
  }, [])

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
    sendMessage,
    connectTray,
    /** Places in the Pick tray, sent with the panel's next message. */
    trayCount,
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
    rejectEdit,
    showEdit,
    updateSettings,
    updateProfile,
    selectProfile,
  }
}

export type AssistantState = ReturnType<typeof useAssistant>
