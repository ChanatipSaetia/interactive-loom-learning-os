/**
 * Loom Viewer — read-only page that shows topics exported from Loom Studio
 * (a single-file `.loom.oui` or a `.zip`) or a topic folder picked from disk,
 * rendered with the learning app's section components and themes.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { BookOpen, FileUp, FolderOpen, Sparkles } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import { AudioToggle } from '../core/delivery/web-app-shell/AudioToggle'
import { HUDDrawer, SectionRenderer } from '../core/delivery/web-app-shell/TopicShell'
import { HUDProvider } from '../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../core/supporting/learner-progress'
import { SectionErrorBoundary } from '../core/ui-system/primitives/SectionErrorBoundary'
import { readTopicArchive, readTopicFolderFiles, type TopicFiles } from '../core/supporting/authoring-editor/workspace'
import { compileViewerTopic, type ViewerTopic } from './compileTopic'
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

  const openFile = useCallback((file: File) => load(file.name, () => readTopicArchive(file)), [load])
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
              <button type="button" className="viewer-pill" onClick={() => setLoaded(null)} data-testid="viewer-open-another">
                <FileUp size={14} /> Open…
              </button>
            )}
            <AudioToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="main-content">
          {topic
            ? <TopicView key={`${loaded.source}:${topic.topicId}`} topic={topic} />
            : <Landing onFile={openFile} onFolder={openFolder} error={error} />}
        </main>
      </div>
    </UISystemProvider>
  )
}

function Landing({ onFile, onFolder, error }: {
  onFile: (file: File) => void
  onFolder: (files: FileList) => void
  error: string | null
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

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
          Open a <code>.loom.oui</code> or <code>.zip</code> file exported from Loom Studio, or pick a topic
          folder (one with a <code>topic.oui</code>, or a folder of several topics). You can also drop a file here.
        </p>
        <p className="viewer-hint">
          Writing a topic with Claude, Gemini or another AI chat? <a href="create.html" data-testid="viewer-llm-prompt">Get the Loom prompt and a step-by-step guide</a>,
          then open its answer here.
        </p>
        <div className="viewer-actions">
          <button type="button" className="viewer-button viewer-button--primary" onClick={() => fileInput.current?.click()} data-testid="viewer-open-file">
            <FileUp size={16} /> Open file
          </button>
          <button type="button" className="viewer-button" onClick={() => folderInput.current?.click()} data-testid="viewer-open-folder">
            <FolderOpen size={16} /> Open folder
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".oui,.zip,application/zip"
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
        {error && <pre className="viewer-error" role="alert">{error}</pre>}
      </div>
    </div>
  )
}

function TopicView({ topic }: { topic: ViewerTopic }) {
  const title = topic.manifest?.title ?? topic.topicId
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
          {topic.error && <pre className="viewer-error" role="alert">{topic.error}</pre>}
          <div className="topic-content topic-container-content">
            {topic.sections.map((section, idx) => section.config ? (
              <SectionErrorBoundary key={section.name} sectionName={String(section.config.props.title ?? section.name)}>
                <SectionRenderer config={section.config} sectionIndex={idx} />
              </SectionErrorBoundary>
            ) : (
              <div key={section.name} className="viewer-section-error" role="alert" data-testid="viewer-section-error">
                <strong>sections/{section.name}.oui</strong>
                <pre>{section.error}</pre>
              </div>
            ))}
            {!topic.error && topic.sections.length === 0 && <p className="topic-page-placeholder">This topic has no sections yet.</p>}
          </div>
          <HUDDrawer />
        </div>
      </HUDProvider>
    </ProgressProvider>
  )
}
