import { useCallback, useEffect, useState } from 'react'
import { FolderOpen, Save, Sparkles, X } from 'lucide-react'
import { HUDProvider } from '../../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../../core/supporting/learner-progress'
import type { TopicWorkspace } from '../../core/supporting/authoring-editor/workspace'
import { useWorkspace } from '../useWorkspace'
import { SectionList, TOPIC_ITEM } from './SectionList'
import { SectionEditor } from './SectionEditor'
import { TopicMetaForm } from './TopicMetaForm'

interface Props {
  workspace: TopicWorkspace
  onOpenFolder: () => void
}

export function StudioWorkspace({ workspace, onOpenFolder }: Props) {
  const snap = useWorkspace(workspace)
  const [selected, setSelected] = useState<string>(() => snap.sections[0]?.name ?? TOPIC_ITEM)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const dirtyCount = snap.dirtySections.length + (snap.topicDirty ? 1 : 0)

  const run = useCallback(async (action: () => Promise<void>, success?: string) => {
    try {
      await action()
      if (success) setStatus({ kind: 'ok', text: success })
    } catch (e) {
      setStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) })
    }
  }, [])

  const save = useCallback(async () => {
    if (!workspace.isDirty) return
    setSaving(true)
    await run(() => workspace.save(), 'Saved')
    setSaving(false)
  }, [run, workspace])

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!workspace.isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [save, workspace])

  // Status messages fade after a few seconds.
  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), status.kind === 'ok' ? 2500 : 8000)
    return () => clearTimeout(timer)
  }, [status])

  // Keep the selection valid after renames and deletes.
  useEffect(() => {
    if (selected !== TOPIC_ITEM && !snap.sections.some((s) => s.name === selected)) {
      setSelected(snap.sections[0]?.name ?? TOPIC_ITEM)
    }
  }, [selected, snap.sections])

  const section = snap.sections.find((s) => s.name === selected)

  return (
    <ProgressProvider>
      <HUDProvider>
        <div className="studio-shell" data-testid="studio-workspace">
          <header className="studio-header">
            <div className="studio-brand"><Sparkles size={18} /> Loom Studio</div>
            <div className="studio-header-topic">
              <span className="studio-header-title">{snap.metadata.title}</span>
              <span className="studio-header-folder">{snap.topicId}/</span>
            </div>
            <div className="studio-header-actions">
              {status && (
                <span className={`studio-status studio-status--${status.kind}`} role="status" data-testid="studio-status">
                  {status.text}
                </span>
              )}
              <button type="button" className="studio-button" onClick={onOpenFolder}>
                <FolderOpen size={15} /> Open folder
              </button>
              <button
                type="button"
                className="studio-button studio-button--primary"
                onClick={save}
                disabled={dirtyCount === 0 || saving}
                title="Save (Ctrl/Cmd+S)"
                data-testid="studio-save"
              >
                <Save size={15} /> {saving ? 'Saving…' : dirtyCount ? `Save (${dirtyCount})` : 'Saved'}
              </button>
            </div>
          </header>

          {snap.notices.length > 0 && (
            <div className="studio-notices" role="status">
              <ul>{snap.notices.map((n) => <li key={n}>{n}</li>)}</ul>
              <button type="button" className="studio-icon-button" aria-label="Dismiss" onClick={() => workspace.dismissNotices()}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className="studio-body">
            <SectionList workspace={workspace} snapshot={snap} selected={selected} onSelect={setSelected} run={run} />
            <main className="studio-main">
              {selected === TOPIC_ITEM || !section
                ? <TopicMetaForm workspace={workspace} metadata={snap.metadata} />
                : <SectionEditor key={section.name} workspace={workspace} section={section} sectionNames={snap.sections.map((s) => s.name)} />}
            </main>
          </div>
        </div>
      </HUDProvider>
    </ProgressProvider>
  )
}
