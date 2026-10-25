/**
 * Loom Viewer — read-only page that shows topics exported from Loom Studio
 * (a single-file `.loom.oui` or a `.zip`) or a topic folder picked from disk,
 * rendered with the learning app's section components and themes.
 * Refresh reads the same file, folder or (for pasted text) the clipboard
 * again, so changes made by an AI show up without reopening anything.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, ArrowLeft, BookOpen, Check, ClipboardPaste, Copy, Download, FileUp, FolderOpen, MessageSquareShare, MoreHorizontal, Play, RefreshCw, Save, Sparkles, Upload } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import { AudioToggle } from '../core/delivery/web-app-shell/AudioToggle'
import { LoomToolsNav } from '../core/delivery/web-app-shell/LoomToolsNav'
import { HUDDrawer, SectionRenderer } from '../core/delivery/web-app-shell/TopicShell'
import { HUDProvider } from '../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider, mergeEvents, parseJSONL, progressNote, progressNoteMessage, toJSONL, useLearnerMemory, useSectionEventRecorder, type LearnerEvent } from '../core/supporting/learner-progress'
import type { SectionConfig } from '../core/learning-engine/registry'
import { SectionErrorBoundary } from '../core/ui-system/primitives/SectionErrorBoundary'
import {
  TopicArchiveError,
  groupTopicFiles,
  readDirectoryOUIFiles,
  readTopicArchive,
  readTopicFolderFiles,
  readTopicText,
  type TopicFiles,
} from '../core/supporting/authoring-editor/workspace'
import { compileViewerTopic, loadErrorReport, noteTopicOf, topicErrorReport, type ViewerTopic } from './compileTopic'
import { readTopicLink } from './topic-link'
import { isLoomFolder, readFileListFiles, readHandleFiles, readLoomFolder, saveNoteToFolder, type DomainTopic, type FolderFiles, type LoomLibrary } from './library'
import { DomainView, LibraryView } from './LibraryView'
import { copyText } from '../core/ui-system/clipboard'
import { PickMode, PickSection, sourceResolver, useNarrow } from '../core/supporting/authoring-editor/pick'
import { AssistantDock, AssistantToggle, pickBridgeOf, useAssistant, type AssistantTopicContext, type AssistantView } from '../core/supporting/authoring-editor/assistant'
import type { PickSource } from '../core/learning-engine/composition/oui/pick-report'
import { PresentMode, preloadPresenters, unlockSpeech, type PresentSection } from '../core/supporting/presentation'
import '../core/delivery/web-app-shell/layout.css'

type ReadTopics = () => Promise<TopicFiles[]>

interface Loaded {
  source: string
  topics: ViewerTopic[]
  /** Reads the source again (file, folder or clipboard). */
  refresh: ReadTopics
  /** Tooltip for the Refresh button. */
  refreshHint: string
  /** The topic came from pasted text: pasting again replaces it. */
  pasted: boolean
  /** Bumped on every refresh so the sections remount with the new content. */
  revision: number
}

interface Status {
  kind: 'ok' | 'error'
  text: string
}

/** A picked Loom folder: the library or one domain (decisions 210–215). */
interface Shelf {
  /** The picked folder's name. */
  name: string
  library: LoomLibrary
  /** The domain page on screen; null shows the library. */
  domainId: string | null
  /** Present when the folder was picked with the File System Access API: Save progress writes into it. */
  handle?: FileSystemDirectoryHandle
  reread: () => Promise<FolderFiles>
  /** Bumped on every read, so statuses are worked out again. */
  revision: number
  /** The domain folder (path prefix) the open topic came from. */
  from?: string
}

/** File System Access pickers (Chromium); other browsers fall back to file inputs. */
interface PickerWindow {
  showOpenFilePicker?: (options?: { id?: string; multiple?: boolean }) => Promise<FileSystemFileHandle[]>
  showDirectoryPicker?: (options?: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

const pickers = () => window as unknown as PickerWindow

/** The topic's sections that compiled, in order, for Present mode. */
function presentSectionsOf(topic: ViewerTopic): PresentSection[] {
  return topic.sections.flatMap((s, sectionIndex) => (s.config ? [{ name: s.name, sectionIndex, config: s.config, sourceMap: s.sourceMap, narration: s.narration }] : []))
}

/** Read mode's element for a section (its Pick wrapper). */
const readSectionElement = (name: string) =>
  document.querySelector<HTMLElement>(`.topic-content [data-oui-anchor="root"][data-oui-file="sections/${CSS.escape(name)}.oui"]`)

/** Present starts at the section being read: the first one still on screen below the top bar (decision 89). */
function sectionInView(sections: PresentSection[]): number {
  const top = document.querySelector('.topnav')?.getBoundingClientRect().bottom ?? 0
  const found = sections.findIndex((s) => (readSectionElement(s.name)?.getBoundingClientRect().bottom ?? -1) > top + 40)
  return found < 0 ? 0 : found
}

/** Where the learner is, for the assistant (decision 119): the mode and the section in view. */
function viewOf(topic: ViewerTopic | undefined, mode: 'read' | 'present', presentedIndex: number): AssistantView {
  const sections = topic ? presentSectionsOf(topic) : []
  const index = mode === 'present' ? presentedIndex : sections[sectionInView(sections)]?.sectionIndex
  const name = index === undefined ? undefined : topic?.sections[index]?.name
  return { mode, file: name ? `sections/${name}.oui` : undefined }
}

/** Where the open topic lives, for the note after copied pointers. */
function pickSourceOf(loaded: Loaded): PickSource {
  if (loaded.pasted) return { kind: 'text' }
  if (loaded.source.endsWith('/')) return { kind: 'folder' }
  return { kind: 'archive', name: loaded.source }
}

/** Viewer's errors by file, for the assistant (one line each). */
function viewerDiagnostics(topic: ViewerTopic): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  if (topic.error) out['topic.oui'] = topic.error.split('\n').slice(1).filter(Boolean)
  for (const section of topic.sections) {
    if (section.error) out[`sections/${section.name}.oui`] = section.error.split('\n').filter(Boolean)
  }
  for (const { file, error } of topic.narrationErrors) out[file] = error.split('\n').filter(Boolean)
  return out
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const readFile = (file: File): ReadTopics => () => readTopicArchive(file, { singleSection: true })

const readFileHandle = (handle: FileSystemFileHandle): ReadTopics => async () =>
  readTopicArchive(await handle.getFile(), { singleSection: true })

const readDirectory = (handle: FileSystemDirectoryHandle): ReadTopics => async () => {
  const topics = groupTopicFiles(await readDirectoryOUIFiles(handle), handle.name)
  if (topics.length === 0) throw new TopicArchiveError('No topic found: the folder has no topic.oui.')
  return topics
}

async function readClipboard(): Promise<TopicFiles[]> {
  if (!navigator.clipboard?.readText) {
    throw new Error('This browser does not let the page read the clipboard. Copy the updated text and press Ctrl/Cmd+V on this page.')
  }
  const text = await navigator.clipboard.readText()
  if (!text.trim()) throw new Error('The clipboard is empty. Copy the updated topic from your AI chat first.')
  return readTopicText(text)
}

/** Below this width the header's secondary controls move into a ⋯ menu, so the bar never overflows. */
const COMPACT_HEADER = '(max-width: 1199px)'

export function ViewerApp() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [shelf, setShelf] = useState<Shelf | null>(null)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [mode, setMode] = useState<'read' | 'present'>('read')
  const [presentStart, setPresentStart] = useState(0)
  /** Where the learner is in Present (topic section index and beat), for Read and Refresh to return to. */
  const presentAt = useRef({ sectionIndex: 0, beat: 0 })
  const [presentBeat, setPresentBeat] = useState(0)
  const current = useRef({ loaded, selected, shelf })
  const compact = useNarrow(COMPACT_HEADER)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  current.current = { loaded, selected, shelf }

  /** `viewer.html#present`: the first topic opened starts in Present (decision 178). */
  const linkPresent = useRef(new URLSearchParams(window.location.hash.slice(1)).has('present'))

  const load = useCallback(async (source: string, read: ReadTopics, options: { refresh?: ReadTopics; refreshHint: string; pasted?: boolean }) => {
    try {
      const topics = (await read()).map(compileViewerTopic)
      setLoaded({ source, topics, refresh: options.refresh ?? read, refreshHint: options.refreshHint, pasted: !!options.pasted, revision: 0 })
      setSelected(0)
      setError(null)
      setStatus(null)
      setPicking(false)
      setPresentStart(0)
      setPresentBeat(0)
      setMode(linkPresent.current ? 'present' : 'read')
      linkPresent.current = false
      window.scrollTo(0, 0)
    } catch (e) {
      setError(message(e))
    }
  }, [])

  /** Re-read the open topic, keeping the selected topic and the scroll position. */
  const refreshWith = useCallback(async (read: ReadTopics) => {
    const { loaded: before, selected: index } = current.current
    if (!before) return
    const topicId = before.topics[index]?.topicId
    const scrollY = window.scrollY
    setRefreshing(true)
    try {
      const topics = (await read()).map(compileViewerTopic)
      const keep = topics.findIndex((t) => t.topicId === topicId)
      // Present picks up at the same section and beat when that section is still there (decision 86)
      const placeName = before.topics[index]?.sections[presentAt.current.sectionIndex]?.name
      const at = keep < 0 || !placeName ? -1 : presentSectionsOf(topics[keep]).findIndex((s) => s.name === placeName)
      setPresentStart(Math.max(0, at))
      setPresentBeat(at < 0 ? 0 : presentAt.current.beat)
      setLoaded({ ...before, topics, revision: before.revision + 1 })
      setSelected(keep < 0 ? 0 : keep)
      setStatus({ kind: 'ok', text: 'Refreshed' })
      // Restore the reading position once the remounted sections have laid out.
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, keep < 0 ? 0 : scrollY)))
    } catch (e) {
      const notReadable = e instanceof DOMException && e.name === 'NotReadableError'
      setStatus({
        kind: 'error',
        text: notReadable
          ? `${before.source} changed on disk and this browser cannot read it again. Use Open… to open it again.`
          : `Could not refresh: ${message(e)}`,
      })
    } finally {
      setRefreshing(false)
    }
  }, [])

  const refresh = useCallback(() => {
    const read = current.current.loaded?.refresh
    if (read) void refreshWith(read)
  }, [refreshWith])

  const openFile = useCallback(
    (file: File) => load(file.name, readFile(file), { refreshHint: `Read ${file.name} again` }),
    [load],
  )
  const openFileHandle = useCallback(
    (handle: FileSystemFileHandle) => load(handle.name, readFileHandle(handle), { refreshHint: `Reload ${handle.name} from disk` }),
    [load],
  )
  /** A picked Loom folder (`index.oui` or `domain.oui`) opens as the library or the domain page. */
  const openShelf = useCallback((name: string, files: FolderFiles, reread: () => Promise<FolderFiles>, handle?: FileSystemDirectoryHandle) => {
    const library = readLoomFolder(files, name)
    setShelf({ name, library, domainId: library.kind === 'domain' ? library.domains[0]?.id ?? null : null, handle, reread, revision: 0 })
    setLoaded(null)
    setError(null)
    window.scrollTo(0, 0)
  }, [])
  const rereadShelf = useCallback(async () => {
    const before = current.current.shelf
    if (!before) return
    try {
      const files = await before.reread()
      setShelf((s) => s && { ...s, library: readLoomFolder(files, s.name), revision: s.revision + 1 })
    } catch (e) {
      setStatus({ kind: 'error', text: `Could not read ${before.name}/ again: ${message(e)}` })
    }
  }, [])
  const openDirectory = useCallback(
    async (handle: FileSystemDirectoryHandle) => {
      const files = await readHandleFiles(handle).catch(() => null)
      if (files && isLoomFolder(files)) return openShelf(handle.name, files, () => readHandleFiles(handle), handle)
      return load(`${handle.name}/`, readDirectory(handle), { refreshHint: `Reload ${handle.name}/ from disk` })
    },
    [load, openShelf],
  )
  /** A topic from the domain page; Refresh reads the folder again. */
  const openShelfTopic = useCallback((topic: DomainTopic) => {
    const from = current.current.shelf
    if (!from || !topic.topic || !topic.path) return
    const domain = from.library.domains.find((d) => d.topics.includes(topic))
    setShelf((s) => s && { ...s, from: domain?.prefix ?? '' })
    const path = topic.path
    const domainId = domain?.id
    void load(`${from.name}/${path}`, async () => [topic.topic!], {
      refresh: async () => {
        const files = await from.reread()
        return readTopicText(files[path] ?? '', topic.id).map((t) => ({ ...t, domainId: t.domainId ?? domainId }))
      },
      refreshHint: `Reload ${path} from disk`,
    })
  }, [load])
  const openText = useCallback(
    (text: string) => load('Pasted text', async () => readTopicText(text), {
      refresh: readClipboard,
      refreshHint: 'Open the updated topic from the clipboard (or press Ctrl/Cmd+V)',
      pasted: true,
    }),
    [load],
  )
  const openFolder = useCallback(
    async (files: FileList) => {
      const list = Array.from(files)
      const name = list[0]?.webkitRelativePath.split('/')[0] || 'folder'
      const folder = await readFileListFiles(list).catch(() => null)
      if (folder && isLoomFolder(folder)) return openShelf(name, folder, () => readFileListFiles(list))
      return load(`${name}/`, () => readTopicFolderFiles(list), { refreshHint: `Read ${name}/ again` })
    },
    [load, openShelf],
  )

  // A link that carries the topic (`#present&oui=…`, decision 179) opens it at once
  useEffect(() => {
    if (!new URLSearchParams(window.location.hash.slice(1)).has('oui')) return
    readTopicLink(window.location.hash)
      .then(({ oui }) => {
        if (!oui) return
        const read = async () => readTopicText(oui)
        return load('Linked topic', read, { refreshHint: 'Open the topic from the link again' })
      })
      .catch(() => setError('This link does not hold a readable topic. Ask the chat for a new link, or paste the topic instead.'))
  }, [load])

  // A topic opened from pasted text is replaced by the next paste (outside text fields).
  const pasted = !!loaded?.pasted
  useEffect(() => {
    if (!pasted) return
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('textarea, input, [contenteditable="true"]')) return
      const text = e.clipboardData?.getData('text/plain')
      if (!text?.trim()) return
      e.preventDefault()
      void refreshWith(async () => readTopicText(text))
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [pasted, refreshWith])

  // Status messages fade after a few seconds.
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), status.kind === 'ok' ? 2000 : 8000)
    return () => clearTimeout(timer)
  }, [status])

  const topic = loaded?.topics[selected]
  const pickResolver = useMemo(() => sourceResolver(topic?.files ?? {}), [topic])
  const pickSource = useMemo(() => (loaded ? pickSourceOf(loaded) : undefined), [loaded])
  const pickFileOrder = useMemo(
    () => (topic ? ['topic.oui', ...topic.sections.map((s) => `sections/${s.name}.oui`)] : []),
    [topic],
  )
  const getAssistantContext = useCallback((): AssistantTopicContext => ({
    topicId: topic?.topicId ?? '',
    files: topic?.files ?? {},
    fileOrder: pickFileOrder,
    diagnostics: topic ? viewerDiagnostics(topic) : {},
    source: pickSource,
    view: viewOf(topic, mode, presentAt.current.sectionIndex),
  }), [topic, pickFileOrder, pickSource, mode])
  const assistant = useAssistant({ topicId: topic?.topicId ?? '', app: 'viewer', getContext: getAssistantContext })
  const presentSections = useMemo(() => (topic ? presentSectionsOf(topic) : []), [topic])
  const presenting = mode === 'present' && !!topic && presentSections.length > 0
  // Present renderers load while the learner reads, so the switch is instant
  useEffect(() => preloadPresenters(presentSections), [presentSections])

  // The ⋯ menu closes on a click elsewhere, on Escape, and when the header widens
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])
  useEffect(() => { if (!compact) setMenuOpen(false) }, [compact])

  const startPresent = useCallback(() => {
    unlockSpeech()
    setPresentStart(sectionInView(presentSections))
    setPresentBeat(0)
    setPicking(false)
    setMode('present')
    window.scrollTo(0, 0)
  }, [presentSections])
  const memory = useLearnerMemory()
  const lastSeen = useRef('')
  const onPresentSection = useCallback((sectionIndex: number, beat: number) => {
    presentAt.current = { sectionIndex, beat }
    // A section played in Present counts as seen (decision 154)
    const name = topic?.sections[sectionIndex]?.name
    const key = `${topic?.topicId}/${name}`
    if (memory && topic && name && key !== lastSeen.current) {
      lastSeen.current = key
      memory.record({ topic: topic.topicId, item: `sections/${name}.oui`, kind: 'seen' })
    }
  }, [memory, topic])
  const exitPresent = useCallback((sectionIndex: number) => {
    setMode('read')
    const name = topic?.sections[sectionIndex]?.name
    // Back where the learner was in Present, once Read has laid out
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = name ? readSectionElement(name) : null
      if (!el) return
      const bar = document.querySelector('.topnav')?.getBoundingClientRect().height ?? 0
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - bar - 12)
    }))
  }, [topic])
  const pickAssistant = pickBridgeOf(assistant)

  // In the bar on wide screens, in the ⋯ menu on narrower ones
  const secondary = (
    <>
      {compact && <LoomToolsNav current="viewer" />}
      {loaded && (
        <button
          type="button"
          className="viewer-pill"
          onClick={refresh}
          data-closes-menu
          disabled={refreshing}
          title={loaded.refreshHint}
          aria-label={loaded.refreshHint}
          data-testid="viewer-refresh"
        >
          <RefreshCw size={14} className={refreshing ? 'viewer-spin' : undefined} /> <span className="viewer-pill-label">Refresh</span>
        </button>
      )}
      {loaded && (
        <button type="button" className="viewer-pill" onClick={() => setLoaded(null)} aria-label="Open another topic" data-closes-menu data-testid="viewer-open-another">
          <FileUp size={14} /> <span className="viewer-pill-label">Open…</span>
        </button>
      )}
      <MemoryButtons onStatus={setStatus} labels={compact} />
      {topic && !topic.error && (
        <ProgressNoteButton
          topic={topic}
          onStatus={setStatus}
          labels={compact}
          saveTo={shelf?.handle && shelf.from !== undefined ? { handle: shelf.handle, prefix: shelf.from } : undefined}
          onSaved={() => void rereadShelf()}
        />
      )}
      <AudioToggle />
      <ThemeToggle />
    </>
  )

  return (
    <UISystemProvider>
      <div className="app-layout viewer">
        <header className="topnav">
          <button type="button" className="topnav-title viewer-brand" onClick={() => setLoaded(null)} title="Open another topic">
            <Sparkles size={16} /> <span className="viewer-brand-label">Loom&nbsp;Viewer</span>
          </button>
          {loaded && shelf?.from !== undefined && (
            <button type="button" className="viewer-pill" onClick={() => { setLoaded(null); void rereadShelf() }} title="Back to the domain" data-testid="viewer-back-to-domain">
              <ArrowLeft size={14} /> <span className="viewer-pill-label">{shelf.library.domains.find((d) => d.prefix === shelf.from)?.title ?? 'Domain'}</span>
            </button>
          )}
          {loaded && (
            <div className="viewer-topic-picker">
              <span className="viewer-source" title={loaded.source}>{loaded.source}</span>
              {loaded.topics.length > 1 && (
                <select
                  value={selected}
                  onChange={(e) => {
                    setSelected(Number(e.target.value))
                    setMode('read')
                    window.scrollTo(0, 0)
                  }}
                  aria-label="Topic"
                  data-testid="viewer-topic-select"
                >
                  {loaded.topics.map((t, i) => (
                    <option key={t.topicId} value={i}>{t.manifest?.title ?? t.topicId}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="viewer-nav-actions">
            {status && (
              <span className={`viewer-status viewer-status--${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'} data-testid="viewer-status">
                {status.text}
              </span>
            )}
            {!compact && <LoomToolsNav current="viewer" />}
            {topic && presentSections.length > 0 && (
              <div className="viewer-mode" role="group" aria-label="Viewer mode" data-testid="viewer-mode">
                <button type="button" aria-pressed={!presenting} onClick={() => presenting && exitPresent(presentAt.current.sectionIndex)} data-testid="viewer-mode-read">
                  <BookOpen size={14} /> <span className="viewer-pill-label">Read</span>
                </button>
                <button type="button" aria-pressed={presenting} onClick={() => !presenting && startPresent()} data-testid="viewer-mode-present">
                  <Play size={14} /> <span className="viewer-pill-label">Present</span>
                </button>
              </div>
            )}
            {topic && !presenting && <AssistantToggle assistant={assistant} className="viewer-pill" />}
            {compact ? (
              <div className="viewer-menu-wrap" ref={menuRef}>
                <button type="button" className="viewer-pill viewer-pill--icon" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="More" data-testid="viewer-more">
                  <MoreHorizontal size={16} />
                </button>
                {menuOpen && (
                  // Refresh and Open close the menu; Sound and Theme stay open so they can be toggled again
                  <div className="viewer-menu" role="menu" onClick={(e) => (e.target as HTMLElement).closest('[data-closes-menu]') && setMenuOpen(false)}>
                    {secondary}
                  </div>
                )}
              </div>
            ) : secondary}
          </div>
        </header>
        <main className="main-content">
          {topic && presenting
            ? (
              <ProgressProvider>
                <HUDProvider>
                  <PresentMode
                    key={`${loaded.source}:${topic.topicId}:${loaded.revision}`}
                    sections={presentSections}
                    start={presentStart}
                    startBeat={presentBeat}
                    onExit={exitPresent}
                    onSectionChange={onPresentSection}
                  />
                </HUDProvider>
              </ProgressProvider>
            )
            : topic
            ? <TopicView key={`${loaded.source}:${topic.topicId}:${loaded.revision}`} topic={topic} />
            : shelf
            ? (() => {
              const domain = shelf.domainId ? shelf.library.domains.find((d) => d.id === shelf.domainId) : undefined
              return domain
                ? (
                  <DomainView
                    domain={domain}
                    revision={shelf.revision}
                    onOpenTopic={openShelfTopic}
                    onBack={shelf.library.kind === 'library' ? () => setShelf({ ...shelf, domainId: null }) : undefined}
                    onRefresh={() => void rereadShelf()}
                    onClose={() => setShelf(null)}
                  />
                )
                : (
                  <LibraryView
                    library={shelf.library}
                    name={shelf.name}
                    revision={shelf.revision}
                    onOpenDomain={(id) => setShelf({ ...shelf, domainId: id })}
                    onRefresh={() => void rereadShelf()}
                    onClose={() => setShelf(null)}
                  />
                )
            })()
            : (
              <Landing
                onFile={openFile}
                onFileHandle={openFileHandle}
                onDirectory={openDirectory}
                onFolder={openFolder}
                onText={openText}
                error={error}
              />
            )}
        </main>
        {topic && !presenting && (
          <PickMode
            topicId={topic.topicId}
            active={picking}
            onActiveChange={setPicking}
            resolve={pickResolver}
            source={pickSource}
            fileOrder={pickFileOrder}
            assistant={pickAssistant}
          />
        )}
        {topic && !presenting && <AssistantDock assistant={assistant} resolve={pickResolver} />}
      </div>
    </UISystemProvider>
  )
}

function Landing({ onFile, onFileHandle, onDirectory, onFolder, onText, error }: {
  onFile: (file: File) => void
  onFileHandle: (handle: FileSystemFileHandle) => void
  onDirectory: (handle: FileSystemDirectoryHandle) => void
  onFolder: (files: FileList) => void
  onText: (text: string) => void
  error: string | null
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const pasteArea = useRef<HTMLTextAreaElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pasting, setPasting] = useState(false)
  const [pasted, setPasted] = useState('')

  // Ctrl/Cmd+V anywhere on the start screen (outside a text field) opens the clipboard text.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('textarea, input, [contenteditable="true"]')) return
      const text = e.clipboardData?.getData('text/plain')
      if (!text?.trim()) return
      e.preventDefault()
      onText(text)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [onText])

  useEffect(() => {
    if (pasting) pasteArea.current?.focus()
  }, [pasting])

  // React does not type the non-standard folder-picker attribute.
  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '')
  }, [])

  // Open through a File System Access handle where the browser has one, so
  // Refresh can read the file or folder again after it changes on disk.
  const pick = async (viaHandle: () => Promise<void> | undefined, fallback: () => void) => {
    try {
      const picked = viaHandle()
      if (picked) await picked
      else fallback()
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) fallback()
    }
  }
  const pickFile = () => pick(
    () => pickers().showOpenFilePicker?.({ id: 'loom-viewer-file' }).then(([handle]) => onFileHandle(handle)),
    () => fileInput.current?.click(),
  )
  const pickFolder = () => pick(
    () => pickers().showDirectoryPicker?.({ id: 'loom-viewer-folder', mode: 'read' }).then(onDirectory),
    () => folderInput.current?.click(),
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    // Must be requested during the drop event; Chromium only.
    const item = e.dataTransfer.items?.[0] as (DataTransferItem & { getAsFileSystemHandle?: () => Promise<FileSystemHandle | null> }) | undefined
    const handle = item?.kind === 'file' ? item.getAsFileSystemHandle?.() : undefined
    if (!handle) {
      if (file) onFile(file)
      return
    }
    handle
      .then((h) => {
        if (h?.kind === 'directory') onDirectory(h as FileSystemDirectoryHandle)
        else if (h?.kind === 'file') onFileHandle(h as FileSystemFileHandle)
        else if (file) onFile(file)
      })
      .catch(() => file && onFile(file))
  }

  return (
    <div className="viewer-landing" data-testid="viewer-landing">
      <div
        className={`viewer-drop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <BookOpen size={36} className="viewer-drop-icon" />
        <h1>View a topic</h1>
        <p>
          Paste or open a <code>.loom.oui</code> topic (or a single section <code>.oui</code>), open a <code>.zip</code>{' '}
          exported from Loom Studio, or pick a topic folder. You can also drop a file or folder here.
        </p>
        <p className="viewer-hint">
          Learning with a tutor skill? Open your <code>Loom</code> folder (synced by Google Drive for desktop), or one domain in it, to see your topics and progress.
        </p>
        <p className="viewer-hint">
          Writing a topic with Claude or a coding agent? <a href="create.html" data-testid="viewer-llm-prompt">Add the Loom skill, step by step</a>,
          then open its answer here.
        </p>
        <div className="viewer-actions">
          <button type="button" className="viewer-button viewer-button--primary" onClick={() => setPasting((p) => !p)} aria-expanded={pasting} data-testid="viewer-paste-toggle">
            <ClipboardPaste size={16} /> Paste text
          </button>
          <button type="button" className="viewer-button" onClick={() => void pickFile()} data-testid="viewer-open-file">
            <FileUp size={16} /> Open file
          </button>
          <button type="button" className="viewer-button" onClick={() => void pickFolder()} data-testid="viewer-open-folder">
            <FolderOpen size={16} /> Open folder
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".oui,.zip,.txt,text/plain,application/zip"
          hidden
          data-testid="viewer-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onFile(file)
          }}
        />
        <input
          ref={folderInput}
          type="file"
          multiple
          hidden
          data-testid="viewer-folder-input"
          onChange={(e) => {
            const files = e.target.files
            if (files?.length) onFolder(files)
            e.target.value = ''
          }}
        />
        {pasting && (
          <form
            className="viewer-paste"
            onSubmit={(e) => {
              e.preventDefault()
              if (pasted.trim()) onText(pasted)
            }}
          >
            <textarea
              ref={pasteArea}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'Paste the topic from your AI chat here:\n// @loom-topic my-topic\n// === topic.oui ===\n…\n\nor a single section: root = Quiz(…)'}
              rows={8}
              spellCheck={false}
              aria-label="Topic text"
              data-testid="viewer-paste-input"
            />
            <button type="submit" className="viewer-button viewer-button--primary" disabled={!pasted.trim()} data-testid="viewer-paste-open">
              Open
            </button>
          </form>
        )}
        {error && (
          <div className="viewer-load-error">
            <pre className="viewer-error" role="alert">{error}</pre>
            <CopyErrorsButton text={loadErrorReport(error)} label="Copy error for your AI chat" testId="viewer-copy-load-error" />
          </div>
        )}
      </div>
    </div>
  )
}

/** Copies an error report for the AI chat and confirms for two seconds. */
function CopyErrorsButton({ text, label, testId }: { text: string; label: string; testId: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = async () => {
    setState((await copyText(text)) ? 'copied' : 'failed')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }
  return (
    <button type="button" className="viewer-button viewer-copy-errors" onClick={onClick} data-testid={testId}>
      {state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  )
}

export function TopicView({ topic }: { topic: ViewerTopic }) {
  const title = topic.manifest?.title ?? topic.topicId
  const report = useMemo(() => topicErrorReport(topic), [topic])
  const errorCount = (topic.error ? 1 : 0) + topic.sections.filter((s) => s.error).length + topic.narrationErrors.length
  const meta = useMemo(
    () => [topic.manifest?.category, topic.manifest?.difficulty].filter(Boolean).join(' · '),
    [topic.manifest],
  )

  return (
    <ProgressProvider>
      <HUDProvider>
        <div className="topic-page topic-container" data-topic-id={topic.topicId} data-testid="viewer-topic">
          <PickSection file="topic.oui" label={`Topic: ${title}`}>
            <h2 className="topic-page-title">{title}</h2>
            {(meta || topic.manifest?.description) && (
              <div className="viewer-topic-meta">
                {meta && <span className="viewer-topic-category">{meta}</span>}
                {topic.manifest?.description && <p>{topic.manifest.description}</p>}
              </div>
            )}
          </PickSection>
          {report && (
            <section className="viewer-error-summary" role="alert" aria-labelledby="viewer-error-title" data-testid="viewer-error-summary">
              <div className="viewer-error-summary-head">
                <AlertTriangle size={18} aria-hidden />
                <h3 id="viewer-error-title">
                  {errorCount === 1 ? '1 part of this topic has errors' : `${errorCount} parts of this topic have errors`}
                </h3>
              </div>
              <p>Copy them into the chat that wrote the topic and ask it to fix them.{topic.sections.some((section) => section.config) && ' The other sections are shown below.'}</p>
              <CopyErrorsButton text={report} label="Copy errors for your AI chat" testId="viewer-copy-errors" />
              <ul className="viewer-error-list">
                {topic.error && (
                  <li data-testid="viewer-section-error">
                    <strong>topic.oui</strong>
                    <pre>{topic.error}</pre>
                  </li>
                )}
                {topic.sections.filter((section) => section.error).map((section) => (
                  <li key={section.name} data-testid="viewer-section-error">
                    <strong>sections/{section.name}.oui</strong>
                    <pre>{section.error}</pre>
                  </li>
                ))}
                {topic.narrationErrors.map(({ file, error }) => (
                  <li key={file} data-testid="viewer-section-error">
                    <strong>{file}</strong>
                    <pre>{error}</pre>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="topic-content topic-container-content">
            {topic.sections.map((section, idx) => section.config && (
              <SectionErrorBoundary key={section.name} sectionName={String(section.config.props.title ?? section.name)}>
                <PickSection file={`sections/${section.name}.oui`} label={String(section.config.props.title ?? section.name)} sourceMap={section.sourceMap}>
                  <RecordedSection topicId={topic.topicId} name={section.name} config={section.config} sectionIndex={idx} />
                </PickSection>
              </SectionErrorBoundary>
            ))}
            {!topic.error && topic.sections.length === 0 && <p className="topic-page-placeholder">This topic has no sections yet.</p>}
          </div>
          <HUDDrawer />
        </div>
      </HUDProvider>
    </ProgressProvider>
  )
}

/** A section in Read mode whose answers go to learner memory. */
function RecordedSection({ topicId, name, config, sectionIndex }: { topicId: string; name: string; config: SectionConfig; sectionIndex: number }) {
  const onEvent = useSectionEventRecorder(topicId, name)
  return <SectionRenderer config={config} sectionIndex={sectionIndex} onEvent={onEvent} />
}

/**
 * Copy progress for chat (decision 203): today's progress note for the open
 * topic, as a message to paste into the chat that plans the next topic.
 */
function ProgressNoteButton({ topic, onStatus, labels, saveTo, onSaved }: {
  topic: ViewerTopic
  onStatus: (status: Status) => void
  labels: boolean
  /** The Loom folder the topic came from, opened with write access possible: Save progress writes the note into it (decision 211). */
  saveTo?: { handle: FileSystemDirectoryHandle; prefix: string }
  onSaved?: () => void
}) {
  const memory = useLearnerMemory()
  if (!memory) return null

  const todaysNote = async () => {
    const note = progressNote(noteTopicOf(topic), await memory.port.readAll())
    if (note.empty) onStatus({ kind: 'error', text: 'Nothing played or answered in this topic today yet.' })
    return note.empty ? null : note
  }
  const copy = async () => {
    const note = await todaysNote()
    if (!note) return
    const copied = await copyText(progressNoteMessage(note))
    onStatus(copied ? { kind: 'ok', text: 'Progress copied. Paste it into your AI chat.' } : { kind: 'error', text: 'The browser did not allow copying.' })
  }
  const save = async () => {
    const note = await todaysNote()
    if (!note || !saveTo) return
    const fileName = note.path.split('/').pop()!
    try {
      await saveNoteToFolder(saveTo.handle, saveTo.prefix, fileName, note.text)
      onStatus({ kind: 'ok', text: `Progress saved to ${saveTo.prefix}progress/${fileName}` })
      onSaved?.()
    } catch (e) {
      onStatus({ kind: 'error', text: `Could not save: ${message(e)}` })
    }
  }

  if (saveTo) {
    return (
      <button type="button" className="viewer-pill" onClick={() => void save()} title="Save today's progress in this topic to the domain's progress folder" aria-label="Save progress" data-closes-menu data-testid="viewer-save-progress">
        <Save size={14} />{labels && <> <span className="viewer-pill-label">Save progress</span></>}
      </button>
    )
  }
  return (
    <button type="button" className="viewer-pill" onClick={() => void copy()} title="Copy today's progress in this topic for your AI chat" aria-label="Copy progress for chat" data-closes-menu data-testid="viewer-copy-progress">
      <MessageSquareShare size={14} />{labels && <> <span className="viewer-pill-label">Copy progress</span></>}
    </button>
  )
}

/** Back up / Restore of learner memory as one JSONL file (decision 148). */
function MemoryButtons({ onStatus, labels }: { onStatus: (status: Status) => void; labels: boolean }) {
  const memory = useLearnerMemory()
  const input = useRef<HTMLInputElement>(null)
  if (!memory) return null

  const backup = async () => {
    const events = await memory.port.readAll()
    const url = URL.createObjectURL(new Blob([toJSONL(events)], { type: 'application/jsonl' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `loom-memory-${new Date().toISOString().slice(0, 10)}.jsonl`
    a.click()
    URL.revokeObjectURL(url)
    onStatus({ kind: 'ok', text: `Backed up ${events.length} events` })
  }
  const restore = async (file: File) => {
    const events: LearnerEvent[] = parseJSONL(await file.text())
    const before = (await memory.port.readAll()).length
    await memory.port.append(events)
    const added = mergeEvents(await memory.port.readAll()).length - before
    onStatus({ kind: 'ok', text: `Restored: ${added} new events` })
  }

  return (
    <>
      <button type="button" className="viewer-pill" onClick={() => void backup()} title="Back up your learning record" aria-label="Back up your learning record" data-closes-menu data-testid="viewer-backup">
        <Download size={14} />{labels && <> <span className="viewer-pill-label">Back up</span></>}
      </button>
      <button type="button" className="viewer-pill" onClick={() => input.current?.click()} title="Restore a backed-up learning record" aria-label="Restore a backed-up learning record" data-testid="viewer-restore">
        <Upload size={14} />{labels && <> <span className="viewer-pill-label">Restore</span></>}
      </button>
      <input
        ref={input}
        type="file"
        accept=".jsonl,.json,application/jsonl"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void restore(file).catch(() => onStatus({ kind: 'error', text: 'That file is not a Loom learning record.' }))
        }}
      />
    </>
  )
}
