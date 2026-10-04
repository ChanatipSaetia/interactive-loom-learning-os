/**
 * Loom Studio — standalone authoring app for one OpenUI Lang topic folder.
 * See grill-log-openui-input.md (decisions 15–22).
 */
import { useCallback, useEffect, useState } from 'react'
import { ClipboardPaste, Eye, FolderOpen, Sparkles } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import { ThemeToggle } from '../core/ui-system/motion/theme-toggle'
import {
  TopicWorkspace,
  fileSystemAccessFolder,
  memoryFolder,
  pickTopicFolder,
  readTopicText,
  supportsFolderPicker,
  type TopicFolder,
} from '../core/supporting/authoring-editor/workspace'
import { StudioWorkspace } from './components/StudioWorkspace'
import { LoomToolsNav } from '../core/delivery/web-app-shell/LoomToolsNav'
import '../core/delivery/web-app-shell/layout.css'

declare global {
  interface Window {
    /** Dev-only hook so automated tests can open folders without the native picker. */
    __loomStudio?: {
      openFolder(handle: FileSystemDirectoryHandle): Promise<void>
      openMemory(name: string, files: Record<string, string>): Promise<void>
    }
  }
}

interface StudioAppProps {
  /** Folder picker; tests pass one instead of the native File System Access picker. */
  pickFolder?: () => Promise<TopicFolder>
}

export function StudioApp({ pickFolder }: StudioAppProps = {}) {
  const choose = pickFolder ?? pickTopicFolder
  const [workspace, setWorkspace] = useState<TopicWorkspace | null>(null)
  const [error, setError] = useState<string | null>(null)
  /** Bumped on every open so reopening the same folder remounts the editor. */
  const [generation, setGeneration] = useState(0)

  const open = useCallback(async (folder: TopicFolder) => {
    try {
      setWorkspace(await TopicWorkspace.open(folder))
      setGeneration((g) => g + 1)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const pick = useCallback(async () => {
    if (workspace?.isDirty && !window.confirm('You have unsaved changes. Open another folder anyway?')) return
    try {
      await open(await choose())
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [choose, open, workspace])

  /**
   * New topic from pasted text (a .loom.oui from an AI chat, or one section):
   * parse it, pick a folder (an empty one, or confirm replacing a topic),
   * write the files and open them for editing.
   */
  const createFromText = useCallback(async (text: string) => {
    try {
      // Parse first (synchronously), so the folder picker still opens inside the click.
      const topics = readTopicText(text)
      const topic = topics[0]
      const folder = await choose()
      const sections = Object.keys(topic.files).filter((p) => p.startsWith('sections/')).length
      const hasTopic = (await folder.readText('topic.oui')) !== null
        || (await folder.listFiles('sections')).some((f) => f.endsWith('.oui'))
      const message = [
        topics.length > 1 ? `The text holds ${topics.length} topics; only "${topic.topicId}" is created.` : '',
        hasTopic ? `The folder ${folder.name}/ already has a topic. Replace its topic.oui and sections with the pasted topic (${sections} section${sections === 1 ? '' : 's'})?` : '',
      ].filter(Boolean).join('\n\n')
      if (message && !window.confirm(message)) return
      await TopicWorkspace.replaceFolderContents(folder, topic.files)
      await open(folder)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [choose, open])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__loomStudio = {
      openFolder: (handle) => open(fileSystemAccessFolder(handle)),
      openMemory: (name, files) => open(memoryFolder(name, files)),
    }
    return () => {
      delete window.__loomStudio
    }
  }, [open])

  return (
    <UISystemProvider>
      {workspace
        ? (
          <StudioWorkspace
            key={`${workspace.getSnapshot().topicId}:${generation}`}
            workspace={workspace}
            onOpenFolder={pick}
            onReload={() => open(workspace.folder)}
          />
        )
        : <Landing onPick={pick} onCreate={createFromText} canPick={!!pickFolder || supportsFolderPicker()} error={error} />}
    </UISystemProvider>
  )
}

function Landing({ onPick, onCreate, canPick, error }: {
  onPick: () => void
  onCreate: (text: string) => void
  canPick: boolean
  error: string | null
}) {
  const [pasting, setPasting] = useState(false)
  const [text, setText] = useState('')
  return (
    <div className="app-layout studio-start">
      <header className="topnav">
        <span className="topnav-title studio-brand"><Sparkles size={16} /> Loom&nbsp;Studio</span>
        <div className="studio-nav-actions">
          <LoomToolsNav current="studio" />
          <ThemeToggle />
        </div>
      </header>
      <main className="studio-landing" data-testid="studio-landing">
        <div className="studio-landing-card">
          <h1>Edit a topic folder</h1>
          <p>
            Open a topic folder, such as <code>public/content/demo</code>, to edit its <code>topic.oui</code> and
            sections. Pick an empty folder to start a new topic, or paste a topic from your AI chat and choose a folder to save it in.
          </p>
          {!canPick && (
            <p className="studio-warning" role="alert">
              This browser cannot open local folders. Use a Chromium-based browser such as Chrome or Edge.
            </p>
          )}
          <div className="studio-landing-actions">
            {canPick && (
              <>
                <button type="button" className="studio-button studio-button--primary" onClick={onPick} data-testid="studio-open-folder">
                  <FolderOpen size={16} /> Open topic folder
                </button>
                <button type="button" className="studio-button" onClick={() => setPasting((p) => !p)} aria-expanded={pasting} data-testid="studio-paste-toggle">
                  <ClipboardPaste size={16} /> New topic from pasted text
                </button>
              </>
            )}
            <a className="studio-button" href="viewer.html" data-testid="studio-open-viewer">
              <Eye size={16} /> View an exported topic
            </a>
          </div>
          {canPick && pasting && (
            <form
              className="studio-paste"
              onSubmit={(e) => {
                e.preventDefault()
                if (text.trim()) onCreate(text)
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'Paste the topic from your AI chat:\n// @loom-topic my-topic\n// === topic.oui ===\n…'}
                rows={8}
                spellCheck={false}
                aria-label="Topic text"
                autoFocus
                data-testid="studio-paste-input"
              />
              <p className="studio-hint">Next you choose a folder: pick or create an empty one (its name becomes the topic ID).</p>
              <button type="submit" className="studio-button studio-button--primary" disabled={!text.trim()} data-testid="studio-paste-create">
                <FolderOpen size={16} /> Choose folder and create
              </button>
            </form>
          )}
          {error && <pre className="studio-error" role="alert">{error}</pre>}
        </div>
      </main>
    </div>
  )
}
