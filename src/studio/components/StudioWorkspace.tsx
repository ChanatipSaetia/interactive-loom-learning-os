import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { FileArchive, FileCode, FolderOpen, RefreshCw, Save, Sparkles, Upload, X } from 'lucide-react'
import { HUDProvider } from '../../core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../../core/supporting/learner-progress'
import {
  SOURCE_EXTENSION,
  TopicWorkspace,
  createTopicSource,
  createTopicZip,
  readTopicArchive,
} from '../../core/supporting/authoring-editor/workspace'
import { PickMode, PickToggle, sourceResolver } from '../../core/supporting/authoring-editor/pick'
import { ThemeToggle } from '../../core/ui-system/motion/theme-toggle'
import { LoomToolsNav } from '../../core/delivery/web-app-shell/LoomToolsNav'
import { useWorkspace } from '../useWorkspace'
import { downloadFile } from '../download'
import { SectionList, TOPIC_ITEM } from './SectionList'
import { SectionEditor } from './SectionEditor'
import { TopicMetaForm } from './TopicMetaForm'

/** Studio always edits a folder on disk. */
const FOLDER_SOURCE = { kind: 'folder' } as const

interface Props {
  workspace: TopicWorkspace
  onOpenFolder: () => void
  /**
   * Reopen the current folder from disk (Refresh, or after an import),
   * selecting `section` and showing `status` once it is open.
   */
  onReload: (section?: string, status?: string) => Promise<void>
  /** Section to select first (kept across a reload). */
  initialSection?: string
  /** Message to show first (e.g. after a reload). */
  initialStatus?: string
}

export function StudioWorkspace({ workspace, onOpenFolder, onReload, initialSection, initialStatus }: Props) {
  const snap = useWorkspace(workspace)
  const [selected, setSelected] = useState<string>(() =>
    initialSection && (initialSection === TOPIC_ITEM || snap.sections.some((s) => s.name === initialSection))
      ? initialSection
      : snap.sections[0]?.name ?? TOPIC_ITEM)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(
    () => (initialStatus ? { kind: 'ok', text: initialStatus } : null),
  )
  const [picking, setPicking] = useState(false)

  // Pick tray line hints come from the editor buffers, marked (unsaved) when they differ from disk.
  const pickResolver = useMemo(() => sourceResolver(
    Object.fromEntries(snap.sections.map((s) => [`sections/${s.name}.oui`, s.source])),
    new Set(snap.dirtySections.map((name) => `sections/${name}.oui`)),
  ), [snap.sections, snap.dirtySections])

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

  /** Reload the topic from disk, e.g. after an AI agent edited the files. */
  const refresh = useCallback(async () => {
    if (workspace.isDirty && !window.confirm(
      `You have ${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}. Discard ${dirtyCount === 1 ? 'it' : 'them'} and reload the topic from disk?`,
    )) return
    setRefreshing(true)
    await run(() => onReload(selected, 'Reloaded from disk'))
    setRefreshing(false)
  }, [dirtyCount, onReload, run, selected, workspace])

  const importInput = useRef<HTMLInputElement>(null)

  const exportSource = useCallback(() => {
    const topic = workspace.exportFiles()
    downloadFile(`${topic.topicId}${SOURCE_EXTENSION}`, createTopicSource([topic]), 'text/plain')
    setStatus({ kind: 'ok', text: `Exported ${topic.topicId}${SOURCE_EXTENSION}` })
  }, [workspace])

  const exportZip = useCallback(() => {
    const topic = workspace.exportFiles()
    downloadFile(`${topic.topicId}.zip`, createTopicZip([topic]), 'application/zip')
    setStatus({ kind: 'ok', text: `Exported ${topic.topicId}.zip` })
  }, [workspace])

  const importFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await run(async () => {
      const topics = await readTopicArchive(file)
      const topic = topics.find((t) => t.topicId === snap.topicId) ?? topics[0]
      const sectionCount = Object.keys(topic.files).filter((p) => p.startsWith('sections/')).length
      const message = [
        `Import "${topic.topicId}" (${sectionCount} section${sectionCount === 1 ? '' : 's'}) from ${file.name} into ${snap.topicId}/?`,
        topics.length > 1 ? `The file holds ${topics.length} topics; only this one is imported.` : '',
        'This overwrites topic.oui and deletes section files that are not in the import.',
        workspace.isDirty ? 'Your unsaved changes will be lost.' : '',
      ].filter(Boolean).join('\n\n')
      if (!window.confirm(message)) return
      await TopicWorkspace.replaceFolderContents(workspace.folder, topic.files)
      await onReload(selected, `Imported ${file.name}`)
    })
  }, [onReload, run, selected, snap.topicId, workspace])

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
            <span className="topnav-title studio-brand"><Sparkles size={16} /> Loom&nbsp;Studio</span>
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
              <LoomToolsNav current="studio" newTab />
              <ThemeToggle />
              <PickToggle active={picking} onChange={setPicking} className="studio-button" />
              <button type="button" className="studio-button" onClick={() => importInput.current?.click()} title="Import a topic from a .loom.oui file or a .zip" data-testid="studio-import">
                <Upload size={15} /> Import
              </button>
              <input
                ref={importInput}
                type="file"
                accept=".oui,.zip,application/zip"
                hidden
                onChange={importFile}
                data-testid="studio-import-input"
              />
              <button type="button" className="studio-button" onClick={exportSource} title="Export all files as a single .loom.oui file" data-testid="studio-export-file">
                <FileCode size={15} /> Export file
              </button>
              <button type="button" className="studio-button" onClick={exportZip} title="Export the topic folder as a .zip" data-testid="studio-export-zip">
                <FileArchive size={15} /> Export zip
              </button>
              <button
                type="button"
                className="studio-button"
                onClick={refresh}
                disabled={refreshing}
                title="Reload the topic from disk to pick up changes made outside Studio (e.g. by an AI agent)"
                data-testid="studio-refresh"
              >
                <RefreshCw size={15} className={refreshing ? 'studio-spin' : undefined} /> Refresh
              </button>
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
          <PickMode topicId={snap.topicId} active={picking} onActiveChange={setPicking} resolve={pickResolver} source={FOLDER_SOURCE} />
        </div>
      </HUDProvider>
    </ProgressProvider>
  )
}
