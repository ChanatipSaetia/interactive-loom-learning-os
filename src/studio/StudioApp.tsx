/**
 * Loom Studio — standalone authoring app for one OpenUI Lang topic folder.
 * See grill-log-openui-input.md (decisions 15–22).
 */
import { useCallback, useEffect, useState } from 'react'
import { Eye, FolderOpen, Sparkles } from 'lucide-react'
import { UISystemProvider } from '../core/ui-system'
import {
  TopicWorkspace,
  fileSystemAccessFolder,
  memoryFolder,
  pickTopicFolder,
  supportsFolderPicker,
  type TopicFolder,
} from '../core/supporting/authoring-editor/workspace'
import { StudioWorkspace } from './components/StudioWorkspace'

declare global {
  interface Window {
    /** Dev-only hook so automated tests can open folders without the native picker. */
    __loomStudio?: {
      openFolder(handle: FileSystemDirectoryHandle): Promise<void>
      openMemory(name: string, files: Record<string, string>): Promise<void>
    }
  }
}

export function StudioApp() {
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
      await open(await pickTopicFolder())
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [open, workspace])

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
        : <Landing onPick={pick} error={error} />}
    </UISystemProvider>
  )
}

function Landing({ onPick, error }: { onPick: () => void; error: string | null }) {
  const supported = supportsFolderPicker()
  return (
    <div className="studio-landing" data-testid="studio-landing">
      <div className="studio-landing-card">
        <div className="studio-brand"><Sparkles size={20} /> Loom Studio</div>
        <h1>Edit a topic folder</h1>
        <p>
          Open a topic folder, such as <code>public/content/demo</code>, to edit its <code>topic.oui</code> and
          sections. Pick an empty folder to start a new topic.
        </p>
        {!supported && (
          <p className="studio-warning" role="alert">
            This browser cannot open local folders. Use a Chromium-based browser such as Chrome or Edge.
          </p>
        )}
        <div className="studio-landing-actions">
          {supported && (
            <button type="button" className="studio-button studio-button--primary" onClick={onPick} data-testid="studio-open-folder">
              <FolderOpen size={16} /> Open topic folder
            </button>
          )}
          <a className="studio-button" href="viewer.html" data-testid="studio-open-viewer">
            <Eye size={16} /> View an exported topic
          </a>
        </div>
        {error && <pre className="studio-error" role="alert">{error}</pre>}
      </div>
    </div>
  )
}
