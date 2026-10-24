/**
 * The Loom MCP App (decisions 180–196 in grill-log-adaptive-learning.md): what
 * a chat shows when its model calls `show_topic`. It starts as a card with the
 * topic's title, its sections and ▶ Play; Play plays the topic in Present mode
 * right there in the conversation, Read shows it to work through by hand, and
 * Full screen asks the chat to give either the whole window. It
 * reads and checks the topic with the same steps as Loom Viewer, and hands any
 * errors back to the chat's model. Save my progress hands the chat today's
 * progress note to keep in the learner's drive (decision 199).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, BookOpen, Check, ChevronDown, ExternalLink, Loader2, Maximize2, Minimize2, Palette, Play, Save, Send, X } from 'lucide-react'
import type { App, McpUiDisplayMode, McpUiHostContext } from '@modelcontextprotocol/ext-apps'
import { UISystemProvider } from '../core/ui-system'
import { HUDProvider } from '../core/learning-engine/composition/context/HUDContext'
import { LearnerMemoryProvider, ProgressProvider, progressNote, progressNoteMessage, stampEvent } from '../core/supporting/learner-progress'
import { appMemoryAdapter } from './memory'
import { PresentMode, kindLabel, preloadPresenters, unlockSpeech, type PresentSection } from '../core/supporting/presentation'
import { readTopicText } from '../core/supporting/authoring-editor/workspace/archive'
import { compileViewerTopic, loadErrorReport, noteTopicOf, topicErrorReport, type ViewerTopic } from '../viewer/compileTopic'
import { TopicView } from '../viewer/ViewerApp'
import { topicLinkUrl } from '../viewer/topic-link'
import { SYSTEM_THEMES, THEMES, systemThemeId } from '../core/ui-system/theme/themes'

type View = 'card' | 'present' | 'read'

/** What the tool input holds once it has been read, with its source for Continue in Viewer. */
type Loaded = ({ topic: ViewerTopic; report: string | null } | { topic: null; report: string }) & { oui?: string }

/** Events from the app carry this device name; the local server stamps its own when it keeps them. */
const DEVICE = 'mcp-app'

/** Loom Viewer on the site the app was loaded from (`<site>/mcp-app/v1/app.js` → `<site>/viewer.html`). */
// (not `new URL('../../viewer.html', import.meta.url)`, which Vite would bundle as an asset)
const VIEWER_URL = import.meta.url.replace(/mcp-app\/v\d+\/[^/]*$/, 'viewer.html')

/** Decision 196: Liquid Glass when the chat is dark, Liquid Glass Light when it is light. */
export function themeForHost(theme: McpUiHostContext['theme']): string {
  if (theme === 'light') return SYSTEM_THEMES.light
  if (theme === 'dark') return SYSTEM_THEMES.dark
  return systemThemeId()
}

function applyTheme(id: string) {
  if (id) document.documentElement.dataset.theme = id
  else delete document.documentElement.dataset.theme
}

/**
 * Touch screens: the chat's own scrolling takes the swipes a scroll box inside
 * the app would need, so Read opens full screen there, or grows to its full
 * height where the chat has no full screen.
 */
const TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

/**
 * How far the chat's own bars reach over the app in full screen (the phone's status bar, the chat's
 * close button and title, its message bar), as CSS variables for `.mcp-full`: the insets the chat
 * reports plus a margin, and never less than room for typical bars, since a chat may report only the
 * phone's own (Claude's phone app covers about 110px at the top and 100px at the bottom).
 */
function applyInsets(insets: McpUiHostContext['safeAreaInsets']) {
  const least = TOUCH ? { top: 112, right: 0, bottom: 104, left: 0 } : { top: 56, right: 0, bottom: 88, left: 0 }
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const margin = side === 'top' || side === 'bottom' ? 12 : 0
    document.documentElement.style.setProperty(`--mcp-inset-${side}`, `${Math.max(least[side], (insets?.[side] ?? 0) + margin)}px`)
  }
}

/** Every Loom theme in a dropdown (the system picker on phones). */
function ThemePicker({ themeId, onPick }: { themeId: string; onPick: (id: string) => void }) {
  return (
    <span className="mcp-theme" title="Theme">
      <Palette size={14} className="mcp-theme-icon" aria-hidden />
      <select value={themeId} onChange={(e) => onPick(e.target.value)} aria-label="Theme" data-testid="mcp-theme">
        {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
      <ChevronDown size={14} className="mcp-theme-arrow" aria-hidden />
    </span>
  )
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

const PROGRESS_LABEL = { idle: 'Save my progress', sent: 'Sent to the chat', empty: 'Nothing to save yet', failed: 'Not sent' }
const PROGRESS_HINT = {
  idle: 'Ask the chat to save today\'s progress note to Loom/progress/ in your drive',
  sent: 'The chat has the note; approve the save there. Press again to send an updated note.',
  empty: 'Play or answer something first',
  failed: 'The chat did not take the message. Try again, or open the topic in Viewer.',
}

export function McpApp({ app }: { app: App }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [writing, setWriting] = useState(false)
  const [view, setView] = useState<View>('card')
  const [asked, setAsked] = useState(false)
  const [startMode, setStartMode] = useState<'present' | 'read'>('present')
  /** The chat is showing the app fullscreen. */
  const [full, setFull] = useState(false)
  /** False when the server keeps no learner memory (decision 186). */
  const [kept, setKept] = useState(true)
  const memory = useMemo(() => appMemoryAdapter(app, () => setKept(false)), [app])
  const lastSeen = useRef('')
  const told = useRef(false)
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])

  /** The chat's light or dark mode (decision 196) until the learner picks a theme, which lasts the session. */
  const [themeId, setThemeId] = useState(() => document.documentElement.dataset.theme ?? '')
  const picked = useRef(false)
  const showTheme = useCallback((id: string) => {
    applyTheme(id)
    setThemeId(id)
  }, [])
  const pickTheme = useCallback((id: string) => {
    picked.current = true
    showTheme(id)
  }, [showTheme])

  useEffect(() => {
    app.ontoolinputpartial = () => setWriting(true)
    app.ontoolinput = (params) => {
      const args = (params.arguments ?? {}) as { oui?: unknown; mode?: unknown }
      // open_topic and edit_topic send the topic in their result, not their input
      if (typeof args.oui !== 'string') {
        setWriting(true)
        return
      }
      setWriting(false)
      const oui = args.oui
      setLoaded({ ...loadTopic(oui), oui })
      setStartMode(args.mode === 'read' ? 'read' : 'present')
      setView('card')
      setAsked(false)
      told.current = false
    }
    // open_topic and edit_topic send the topic in their result rather than their input
    app.ontoolresult = (result) => {
      const oui = (result.structuredContent as { oui?: unknown } | undefined)?.oui
      if (typeof oui !== 'string') return
      setWriting(false)
      setLoaded({ ...loadTopic(oui), oui })
      setView('card')
      told.current = false
    }
    const followHost = (theme: McpUiHostContext['theme']) => {
      if (!picked.current) showTheme(themeForHost(theme))
    }
    app.onhostcontextchanged = (context) => {
      if (context.theme) followHost(context.theme)
      if (context.safeAreaInsets) applyInsets(context.safeAreaInsets)
      // The learner may leave fullscreen with the chat's own control; on a touch screen Read
      // cannot scroll inside the conversation, so it goes back to the card
      if (context.displayMode) {
        setFull(context.displayMode === 'fullscreen')
        if (context.displayMode === 'inline' && TOUCH && viewRef.current === 'read') setView('card')
      }
    }
    applyInsets(undefined)
    void app.connect().then(() => {
      followHost(app.getHostContext()?.theme)
      applyInsets(app.getHostContext()?.safeAreaInsets)
    })
  }, [app, showTheme])

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
    if (next === 'present') unlockSpeech()
    setView(next)
    window.scrollTo(0, 0)
    if (next === 'read' && TOUCH && canFullscreen && !full) void displayMode('fullscreen')
  }, [canFullscreen, displayMode, full])

  const close = useCallback(async () => {
    setView('card')
    if (full) await displayMode('inline')
  }, [displayMode, full])

  /** Open the topic in Loom Viewer, where progress is kept (decision 186), at Present. */
  const [linkNote, setLinkNote] = useState<string | null>(null)
  const continueInViewer = useCallback(async () => {
    const url = loaded?.oui ? await topicLinkUrl(VIEWER_URL, loaded.oui) : null
    if (!url) {
      setLinkNote('This topic is too long for a link. Copy it from the chat and paste it into Loom Viewer.')
      return
    }
    const result = await app.openLink({ url }).catch(() => ({ isError: true }))
    setLinkNote(result?.isError ? 'The chat did not open the link.' : null)
  }, [app, loaded])

  /** A section played in Present counts as seen (decision 154). */
  const recordSeen = useCallback((sectionIndex: number) => {
    const name = topic?.sections[sectionIndex]?.name
    const key = `${topic?.topicId}/${name}`
    if (!topic || !name || key === lastSeen.current) return
    lastSeen.current = key
    void memory.append([stampEvent({ topic: topic.topicId, item: `sections/${name}.oui`, kind: 'seen' }, DEVICE)])
  }, [memory, topic])

  /** Save my progress (decision 199): the chat saves the note with its drive connector, the learner approves it there. */
  const [progress, setProgress] = useState<'idle' | 'sent' | 'empty' | 'failed'>('idle')
  const saveProgress = useCallback(async () => {
    if (!topic) return
    const note = progressNote(noteTopicOf(topic), await memory.readAll())
    if (note.empty) {
      setProgress('empty')
      return
    }
    const result = await app.sendMessage({ role: 'user', content: [{ type: 'text', text: progressNoteMessage(note) }] }).catch(() => ({ isError: true }))
    setProgress(result?.isError ? 'failed' : 'sent')
  }, [app, memory, topic])

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
        <button type="button" className="mcp-button mcp-small" onClick={() => open('present')}><Play size={14} /> Present</button>
      )}
      <ThemePicker themeId={themeId} onPick={pickTheme} />
      <button
        type="button"
        className="mcp-button mcp-quiet mcp-small"
        onClick={() => void saveProgress()}
        title={PROGRESS_HINT[progress]}
        aria-label={PROGRESS_LABEL[progress]}
        data-testid="mcp-save-progress"
      >
        {progress === 'sent' ? <Check size={14} /> : <Save size={14} />} <span className="mcp-wide-only">{PROGRESS_LABEL[progress]}</span>
      </button>
      <button type="button" className="mcp-button mcp-quiet mcp-small" onClick={() => void continueInViewer()} title="Open in Loom Viewer" data-testid="mcp-viewer">
        <ExternalLink size={14} /> <span className="mcp-wide-only">Viewer</span>
      </button>
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
                <PresentMode sections={presentSections} onExit={() => open('read')} onSectionChange={recordSeen} fillParent />
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
        <div className={`mcp-read${full ? ' mcp-full' : TOUCH ? ' mcp-read-natural' : ''}`} data-testid="mcp-read">
          {bar}
          {/* Read scrolls inside a frame of fixed height, so the chat's frame stays that size and
              the sections' modals (taxonomy details, help) open where the learner is looking */}
          <main className="main-content mcp-read-scroll" data-testid="mcp-read-scroll">
            <LearnerMemoryProvider port={memory} device={DEVICE}>
              <TopicView topic={topic} />
            </LearnerMemoryProvider>
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
          <button type="button" className="mcp-button mcp-quiet" onClick={() => void continueInViewer()} data-testid="mcp-viewer">
            <ExternalLink size={14} /> Open in Viewer
          </button>
          <ThemePicker themeId={themeId} onPick={pickTheme} />
        </div>
      )}
      {linkNote && <p className="mcp-note">{linkNote}</p>}
      {!kept && <p className="mcp-note" data-testid="mcp-not-kept">This chat does not keep your progress. Open the topic in Viewer to keep it.</p>}
    </div>
  )
}
