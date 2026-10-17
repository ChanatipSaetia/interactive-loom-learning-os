/**
 * State of the AI assistant for one page (grill-log-ai-assistant.md,
 * decisions 55–61): the active profile, the topic's thread, the request in
 * flight, the Assistant panel and the settings dialog.
 *
 * Every request is built afresh: the system prompt for the components in
 * play, the <topic-context> block from the current sources (`getContext`),
 * and as much of the thread as the profile's token budget allows.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getLoomAssistantPrompt, type AssistantApp } from '../../../learning-engine/composition/oui/assistant-prompt'
import { AssistantError, chatCompletion, isLoopbackHost, listModels } from './client'
import { buildTopicContext, type AssistantTopicContext } from './context'
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
  historyForRequest,
  loadThread,
  newMessageId,
  saveThread,
  threadPointers,
  type AssistantThread,
  type ThreadMessage,
  type ThreadPick,
} from './thread'

export interface AssistantDraft {
  mode: 'comment' | 'ask'
  message: string
  picks: ThreadPick[]
}

export interface UseAssistantOptions {
  topicId: string
  app: AssistantApp
  /** The topic as it is now; called when a request is built. */
  getContext: () => AssistantTopicContext
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

export function useAssistant({ topicId, app, getContext, fetchImpl }: UseAssistantOptions) {
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
    setThread((t) => ({ messages: t.messages.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)) }))
  }, [setThread])

  /** Ask the model about `messages` (which end with the user's message). */
  const run = useCallback(async (messages: ThreadMessage[], profile: AssistantProfile) => {
    const controller = new AbortController()
    abort.current?.abort()
    abort.current = controller
    const reply: ThreadMessage = {
      id: newMessageId(),
      role: 'assistant',
      text: '',
      status: 'streaming',
      via: { host: hostOf(profile.baseUrl), model: profile.model },
      at: Date.now(),
    }
    setThread({ messages: [...messages, reply] })

    const context = buildTopicContext(contextRef.current(), threadPointers(messages))
    const system = `${getLoomAssistantPrompt({ app, components: context.components, fullReference: profile.fullReference })}\n\n${context.text}`
    const history = historyForRequest(messages, profile.tokenBudget)
    try {
      const result = await chatCompletion(
        connectionOf(profile),
        {
          model: profile.model,
          messages: [{ role: 'system', content: system }, ...history.messages],
          signal: controller.signal,
          onDelta: (delta) => patchMessage(reply.id, (m) => ({ text: m.text + delta })),
        },
        { fetch: fetchImpl },
      )
      patchMessage(reply.id, { text: result.text, status: 'done' })
    } catch (error) {
      const failure = error instanceof AssistantError ? error : new AssistantError('bad-response', String(error))
      if (failure.kind === 'aborted') {
        patchMessage(reply.id, (m) => ({ text: failure.partial ?? m.text, status: 'stopped' }))
      } else {
        patchMessage(reply.id, (m) => ({ text: failure.partial ?? m.text, status: 'error', error: { kind: failure.kind, message: failure.message } }))
      }
    } finally {
      if (abort.current === controller) abort.current = null
      if (!panelOpenRef.current) setUnread(true)
    }
  }, [app, fetchImpl, patchMessage, setThread])

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
    if (messages.length) void run(messages, profile)
  }, [busy, profile, run, thread.messages])

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
    updateSettings,
    updateProfile,
    selectProfile,
  }
}

export type AssistantState = ReturnType<typeof useAssistant>
