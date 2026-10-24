/**
 * The Loom MCP App (decisions 180–196 in grill-log-adaptive-learning.md): what
 * a chat shows when its model calls `show_topic`. It starts as a card with the
 * topic's title, its sections and ▶ Play; Play plays the topic in Present mode
 * right there in the conversation, Read shows it to work through by hand, and
 * Full screen asks the chat to give either the whole window. It
 * reads and checks the topic with the same steps as Loom Viewer, and hands any
 * errors back to the chat's model.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, Loader2, Maximize2, Minimize2, Play, Send, X } from 'lucide-react'
import type { App, McpUiDisplayMode, McpUiHostContext } from '@modelcontextprotocol/ext-apps'
import { UISystemProvider } from '../core/ui-system'
import { HUDProvider } from '../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../core/supporting/learner-progress'
import { PresentMode, kindLabel, preloadPresenters, type PresentSection } from '../core/supporting/presentation'
import { readTopicText } from '../core/supporting/authoring-editor/workspace/archive'
import { compileViewerTopic, loadErrorReport, topicErrorReport, type ViewerTopic } from '../viewer/compileTopic'
import { TopicView } from '../viewer/ViewerApp'
import { SYSTEM_THEMES, systemThemeId } from '../core/ui-system/theme/themes'

type View = 'card' | 'present' | 'read'

/** What the tool input holds once it has been read. */
type Loaded = { topic: ViewerTopic; report: string | null } | { topic: null; report: string }

/** Decision 196: Liquid Glass when the chat is dark, Liquid Glass Light when it is light. */
export function themeForHost(theme: McpUiHostContext['theme']): string {
  if (theme === 'light') return SYSTEM_THEMES.light
  if (theme === 'dark') return SYSTEM_THEMES.dark
  return systemThemeId()
}

function applyHostTheme(context: McpUiHostContext | undefined) {
  document.documentElement.dataset.theme = themeForHost(context?.theme)
}

/** Read `.loom.oui` text as Loom Viewer does (decision 184). */
export function loadTopic(oui: string): Loaded {
  try {
    const topic = compileViewerTopic(readTopicText(oui)[0])
    return { topic, report: topicErrorReport(topic) }
  } catch (e) {
    return { topic: null, report: loadErrorReport(e instanceof Error ? e.message : String(e)) }
  }
}

function presentSectionsOf(topic: ViewerTopic): PresentSection[] {
  return topic.sections.flatMap((s, sectionIndex) => (s.config ? [{ name: s.name, sectionIndex, config: s.config, sourceMap: s.sourceMap, narration: s.narration }] : []))
}

const textOf = (text: string) => ({ content: [{ type: 'text' as const, text }] })

export function McpApp({ app }: { app: App }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [writing, setWriting] = useState(false)
  const [view, setView] = useState<View>('card')
  const [asked, setAsked] = useState(false)
  const [startMode, setStartMode] = useState<'present' | 'read'>('present')
  /** The chat is showing the app fullscreen. */
  const [full, setFull] = useState(false)
  const told = useRef(false)

  useEffect(() => {
    app.ontoolinputpartial = () => setWriting(true)
    app.ontoolinput = (params) => {
      const args = (params.arguments ?? {}) as { oui?: unknown; mode?: unknown }
      setWriting(false)
      setLoaded(loadTopic(String(args.oui ?? '')))
      setStartMode(args.mode === 'read' ? 'read' : 'present')
      setView('card')
      setAsked(false)
      told.current = false
    }
    app.onhostcontextchanged = (context) => {
      if (context.theme) applyHostTheme({ ...app.getHostContext(), ...context })
      // The learner may leave fullscreen with the chat's own control
      if (context.displayMode) setFull(context.displayMode === 'fullscreen')
    }
    void app.connect().then(() => applyHostTheme(app.getHostContext()))
  }, [app])

  // The chat's model learns about errors at once, without the learner pressing anything (decision 184)
  useEffect(() => {
    if (!loaded?.report || told.current) return
    told.current = true
    void app.updateModelContext(textOf(loaded.report)).catch(() => {})
  }, [app, loaded])

  const topic = loaded?.topic ?? null
  const presentSections = useMemo(() => (topic ? presentSectionsOf(topic) : []), [topic])
  useEffect(() => preloadPresenters(presentSections), [presentSections])

  const canFullscreen = app.getHostContext()?.availableDisplayModes?.includes('fullscreen') ?? false

  const displayMode = useCallback(async (mode: McpUiDisplayMode) => {
    const modes = app.getHostContext()?.availableDisplayModes
    if (modes && !modes.includes(mode)) return
    const result = await app.requestDisplayMode({ mode }).catch(() => null)
    setFull((result?.mode ?? mode) === 'fullscreen')
  }, [app])

  /** Present and Read open in the conversation itself; Full screen is the learner's choice. */
  const open = useCallback((next: 'present' | 'read') => {
    setView(next)
    window.scrollTo(0, 0)
  }, [])

  const close = useCallback(async () => {
    setView('card')
    if (full) await displayMode('inline')
  }, [displayMode, full])

  const askToFix = useCallback(async () => {
    if (!loaded?.report) return
    setAsked(true)
    await app.sendMessage({ role: 'user', content: [{ type: 'text', text: loaded.report }] }).catch(() => setAsked(false))
  }, [app, loaded])

  if (!loaded) {
    return (
      <div className="mcp-card" data-testid="mcp-waiting">
        <Loader2 size={16} className="mcp-spin" aria-hidden /> {writing ? 'Writing the topic…' : 'Waiting for a topic…'}
      </div>
    )
  }

  const bar = topic && (view === 'present' || view === 'read') && (
    <div className="mcp-bar">
      <span className="mcp-bar-title">{topic.manifest?.title ?? topic.topicId}</span>
      {view === 'read' && presentSections.length > 0 && (
        <button type="button" className="mcp-button mcp-small" onClick={() => setView('present')}><Play size={14} /> Present</button>
      )}
      {canFullscreen && (
        <button type="button" className="mcp-button mcp-quiet mcp-small" onClick={() => void displayMode(full ? 'inline' : 'fullscreen')} data-testid="mcp-fullscreen">
          {full ? <><Minimize2 size={14} /> Exit full screen</> : <><Maximize2 size={14} /> Full screen</>}
        </button>
      )}
      <button type="button" className="mcp-button mcp-quiet mcp-small" onClick={() => void close()} aria-label="Close" title="Close" data-testid="mcp-close"><X size={14} /></button>
    </div>
  )

  if (topic && view === 'present' && presentSections.length > 0) {
    return (
      <UISystemProvider>
        <ProgressProvider>
          <HUDProvider>
            <div className={`mcp-player${full ? ' mcp-full' : ''}`} data-testid="mcp-present">
              {bar}
              <div className="mcp-stage">
                <PresentMode sections={presentSections} onExit={() => setView('read')} fillParent />
              </div>
            </div>
          </HUDProvider>
        </ProgressProvider>
      </UISystemProvider>
    )
  }

  if (topic && view === 'read') {
    return (
      <UISystemProvider>
        <div className={`mcp-read${full ? ' mcp-full' : ''}`} data-testid="mcp-read">
          {bar}
          <main className="main-content">
            <TopicView topic={topic} />
          </main>
        </div>
      </UISystemProvider>
    )
  }

  const errors = loaded.report !== null
  return (
    <div className="mcp-card" data-testid="mcp-card">
      <div className="mcp-card-head">
        <h1>{topic?.manifest?.title ?? topic?.topicId ?? 'This topic could not be opened'}</h1>
        {topic?.manifest?.description && <p>{topic.manifest.description}</p>}
      </div>
      {topic && topic.sections.length > 0 && (
        <ol className="mcp-sections">
          {topic.sections.map((s) => (
            <li key={s.name} className={s.error ? 'mcp-section-error' : undefined}>
              <span>{String(s.config?.props.title || s.name)}</span>
              {s.config && <em>{kindLabel(s.config.type)}</em>}
            </li>
          ))}
        </ol>
      )}
      {errors && (
        <div className="mcp-errors" role="alert" data-testid="mcp-errors">
          <AlertTriangle size={16} aria-hidden />
          <span>{topic ? 'Some parts of this topic have errors. The chat has been told what to fix.' : 'The chat has been told why.'}</span>
          <button type="button" className="mcp-button mcp-quiet" onClick={() => void askToFix()} disabled={asked} data-testid="mcp-ask-fix">
            <Send size={14} /> {asked ? 'Asked' : 'Ask the chat to fix it'}
          </button>
        </div>
      )}
      {topic && (
        <div className="mcp-actions">
          {presentSections.length > 0 && (
            <button type="button" className="mcp-button mcp-play" onClick={() => open(startMode)} data-testid="mcp-play">
              {startMode === 'read' ? <><BookOpen size={16} /> Read</> : <><Play size={16} /> Play</>}
            </button>
          )}
          {presentSections.length > 0 && (
            <button type="button" className="mcp-button mcp-quiet" onClick={() => open(startMode === 'read' ? 'present' : 'read')} data-testid="mcp-other-mode">
              {startMode === 'read' ? <><Play size={14} /> Present</> : <><BookOpen size={14} /> Read</>}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
