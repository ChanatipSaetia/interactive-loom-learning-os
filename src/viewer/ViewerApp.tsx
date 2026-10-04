/**
 * Loom Viewer — read-only page that shows topics exported from Loom Studio
 * (a single-file `.loom.oui` or a `.zip`) or a topic folder picked from disk,
 * rendered with the learning app's section components and themes.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, BookOpen, Check, ClipboardPaste, Copy, FileUp, FolderOpen, Sparkles } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import { AudioToggle } from '../core/delivery/web-app-shell/AudioToggle'
import { HUDDrawer, SectionRenderer } from '../core/delivery/web-app-shell/TopicShell'
import { HUDProvider } from '../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../core/supporting/learner-progress'
import { SectionErrorBoundary } from '../core/ui-system/primitives/SectionErrorBoundary'
import { readTopicArchive, readTopicFolderFiles, readTopicText, type TopicFiles } from '../core/supporting/authoring-editor/workspace'
import { compileViewerTopic, loadErrorReport, topicErrorReport, type ViewerTopic } from './compileTopic'
import { copyText } from '../core/ui-system/clipboard'
import '../core/delivery/web-app-shell/layout.css'

interface Loaded {
  source: string
  topics: ViewerTopic[]
}

export function ViewerApp() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [selected, setSelected] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (source: string, read: () => Promise<TopicFiles[]>) => {
    try {
      const topics = (await read()).map(compileViewerTopic)
      setLoaded({ source, topics })
      setSelected(0)
      setError(null)
      window.scrollTo(0, 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const openFile = useCallback((file: File) => load(file.name, () => readTopicArchive(file, { singleSection: true })), [load])
  const openText = useCallback((text: string) => load('Pasted text', async () => readTopicText(text)), [load])
  const openFolder = useCallback(
    (files: FileList) => load(files[0]?.webkitRelativePath.split('/')[0] || 'folder', () => readTopicFolderFiles(Array.from(files))),
    [load],
  )

  const topic = loaded?.topics[selected]

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
          {topic
            ? <TopicView key={`${loaded.source}:${topic.topicId}`} topic={topic} />
            : <Landing onFile={openFile} onFolder={openFolder} onText={openText} error={error} />}
        </main>
      </div>
    </UISystemProvider>
  )
}

function Landing({ onFile, onFolder, onText, error }: {
  onFile: (file: File) => void
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

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
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
          exported from Loom Studio, or pick a topic folder. You can also drop a file here.
        </p>
        <p className="viewer-hint">
          Writing a topic with Claude, Gemini or another AI chat? <a href="create.html" data-testid="viewer-llm-prompt">Get the Loom prompt and a step-by-step guide</a>,
          then open its answer here.
        </p>
        <div className="viewer-actions">
          <button type="button" className="viewer-button viewer-button--primary" onClick={() => setPasting((p) => !p)} aria-expanded={pasting} data-testid="viewer-paste-toggle">
            <ClipboardPaste size={16} /> Paste text
          </button>
          <button type="button" className="viewer-button" onClick={() => fileInput.current?.click()} data-testid="viewer-open-file">
            <FileUp size={16} /> Open file
          </button>
          <button type="button" className="viewer-button" onClick={() => folderInput.current?.click()} data-testid="viewer-open-folder">
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
          <h2 className="topic-page-title">{title}</h2>
          {(meta || topic.manifest?.description) && (
            <div className="viewer-topic-meta">
              {meta && <span className="viewer-topic-category">{meta}</span>}
              {topic.manifest?.description && <p>{topic.manifest.description}</p>}
            </div>
          )}
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
                <SectionRenderer config={section.config} sectionIndex={idx} />
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
