/**
 * Loom Viewer — read-only page that shows topics exported from Loom Studio
 * (a single-file `.loom.oui` or a `.zip`) or a topic folder picked from disk,
 * rendered with the learning app's section components and themes.
 * Refresh reads the same file, folder or (for pasted text) the clipboard
 * again, so changes made by an AI show up without reopening anything.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, BookOpen, Check, ClipboardPaste, Copy, FileUp, FolderOpen, Play, RefreshCw, Sparkles } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import { AudioToggle } from '../core/delivery/web-app-shell/AudioToggle'
import { LoomToolsNav } from '../core/delivery/web-app-shell/LoomToolsNav'
import { HUDDrawer, SectionRenderer } from '../core/delivery/web-app-shell/TopicShell'
import { HUDProvider } from '../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../core/supporting/learner-progress'
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
import { compileViewerTopic, loadErrorReport, topicErrorReport, type ViewerTopic } from './compileTopic'
import { copyText } from '../core/ui-system/clipboard'
import { PickMode, PickSection, sourceResolver } from '../core/supporting/authoring-editor/pick'
import { AssistantDock, AssistantToggle, pickBridgeOf, useAssistant, type AssistantTopicContext } from '../core/supporting/authoring-editor/assistant'
import type { PickSource } from '../core/learning-engine/composition/oui/pick-report'
import { PresentMode, preloadPresenters, type PresentSection } from '../core/supporting/presentation'
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

/** File System Access pickers (Chromium); other browsers fall back to file inputs. */
interface PickerWindow {
  showOpenFilePicker?: (options?: { id?: string; multiple?: boolean }) => Promise<FileSystemFileHandle[]>
  showDirectoryPicker?: (options?: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

const pickers = () => window as unknown as PickerWindow

/** The topic's sections that compiled, in order, for Present mode. */
function presentSectionsOf(topic: ViewerTopic): PresentSection[] {
  return topic.sections.flatMap((s, sectionIndex) => (s.config ? [{ name: s.name, sectionIndex, config: s.config }] : []))
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

export function ViewerApp() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [mode, setMode] = useState<'read' | 'present'>('read')
  const [presentStart, setPresentStart] = useState(0)
  const presentAt = useRef(0)
  const current = useRef({ loaded, selected })
  current.current = { loaded, selected }

  const load = useCallback(async (source: string, read: ReadTopics, options: { refresh?: ReadTopics; refreshHint: string; pasted?: boolean }) => {
    try {
      const topics = (await read()).map(compileViewerTopic)
      setLoaded({ source, topics, refresh: options.refresh ?? read, refreshHint: options.refreshHint, pasted: !!options.pasted, revision: 0 })
      setSelected(0)
      setError(null)
      setStatus(null)
      setPicking(false)
      setMode('read')
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
  const openDirectory = useCallback(
    (handle: FileSystemDirectoryHandle) => load(`${handle.name}/`, readDirectory(handle), { refreshHint: `Reload ${handle.name}/ from disk` }),
    [load],
  )
  const openText = useCallback(
    (text: string) => load('Pasted text', async () => readTopicText(text), {
      refresh: readClipboard,
      refreshHint: 'Open the updated topic from the clipboard (or press Ctrl/Cmd+V)',
      pasted: true,
    }),
    [load],
  )
  const openFolder = useCallback(
    (files: FileList) => {
      const list = Array.from(files)
      const name = list[0]?.webkitRelativePath.split('/')[0] || 'folder'
      return load(`${name}/`, () => readTopicFolderFiles(list), { refreshHint: `Read ${name}/ again` })
    },
    [load],
  )

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
  }), [topic, pickFileOrder, pickSource])
  const assistant = useAssistant({ topicId: topic?.topicId ?? '', app: 'viewer', getContext: getAssistantContext })
  const presentSections = useMemo(() => (topic ? presentSectionsOf(topic) : []), [topic])
  const presenting = mode === 'present' && !!topic && presentSections.length > 0
  // Present renderers load while the learner reads, so the switch is instant
  useEffect(() => preloadPresenters(presentSections), [presentSections])

  const startPresent = useCallback(() => {
    setPresentStart(sectionInView(presentSections))
    setPicking(false)
    setMode('present')
    window.scrollTo(0, 0)
  }, [presentSections])
  const onPresentSection = useCallback((sectionIndex: number) => { presentAt.current = sectionIndex }, [])
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

  return (
    <UISystemProvider>
      <div className="app-layout viewer">
        <header className="topnav">
          <button type="button" className="topnav-title viewer-brand" onClick={() => setLoaded(null)} title="Open another topic">
            <Sparkles size={16} /> Loom&nbsp;Viewer
          </button>
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
            <LoomToolsNav current="viewer" />
            {topic && presentSections.length > 0 && (
              <div className="viewer-mode" role="group" aria-label="Viewer mode" data-testid="viewer-mode">
                <button type="button" aria-pressed={!presenting} onClick={() => presenting && exitPresent(presentAt.current)} data-testid="viewer-mode-read">
                  <BookOpen size={14} /> <span className="viewer-pill-label">Read</span>
                </button>
                <button type="button" aria-pressed={presenting} onClick={() => !presenting && startPresent()} data-testid="viewer-mode-present">
                  <Play size={14} /> <span className="viewer-pill-label">Present</span>
                </button>
              </div>
            )}
            {topic && !presenting && <AssistantToggle assistant={assistant} className="viewer-pill" />}
            {loaded && (
              <button
                type="button"
                className="viewer-pill"
                onClick={refresh}
                disabled={refreshing}
                title={loaded.refreshHint}
                aria-label={loaded.refreshHint}
                data-testid="viewer-refresh"
              >
                <RefreshCw size={14} className={refreshing ? 'viewer-spin' : undefined} /> <span className="viewer-pill-label">Refresh</span>
              </button>
            )}
            {loaded && (
              <button type="button" className="viewer-pill" onClick={() => setLoaded(null)} aria-label="Open another topic" data-testid="viewer-open-another">
                <FileUp size={14} /> <span className="viewer-pill-label">Open…</span>
              </button>
            )}
            <AudioToggle />
            <ThemeToggle />
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
                    onExit={exitPresent}
                    onSectionChange={onPresentSection}
                  />
                </HUDProvider>
              </ProgressProvider>
            )
            : topic
            ? <TopicView key={`${loaded.source}:${topic.topicId}:${loaded.revision}`} topic={topic} />
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
          Writing a topic with Claude, Gemini, Copilot or another AI chat? <a href="create.html" data-testid="viewer-llm-prompt">Get the Loom prompt and a step-by-step guide</a>,
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

function TopicView({ topic }: { topic: ViewerTopic }) {
  const title = topic.manifest?.title ?? topic.topicId
  const report = useMemo(() => topicErrorReport(topic), [topic])
  const errorCount = (topic.error ? 1 : 0) + topic.sections.filter((s) => s.error).length
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
              </ul>
            </section>
          )}
          <div className="topic-content topic-container-content">
            {topic.sections.map((section, idx) => section.config && (
              <SectionErrorBoundary key={section.name} sectionName={String(section.config.props.title ?? section.name)}>
                <PickSection file={`sections/${section.name}.oui`} label={String(section.config.props.title ?? section.name)} sourceMap={section.sourceMap}>
                  <SectionRenderer config={section.config} sectionIndex={idx} />
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
