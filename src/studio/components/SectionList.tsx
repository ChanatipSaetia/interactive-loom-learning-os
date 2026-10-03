import { useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp, BookOpen, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import type { TopicWorkspace, WorkspaceSnapshot } from '../../core/supporting/authoring-editor/workspace'
import { AddSectionDialog } from './AddSectionDialog'
import { ConfirmDialog, RenameDialog } from './dialogs'

/** Sidebar item key for the topic metadata form. */
export const TOPIC_ITEM = '__topic__'

interface Props {
  workspace: TopicWorkspace
  snapshot: WorkspaceSnapshot
  selected: string
  onSelect: (name: string) => void
  run: (action: () => Promise<void>, success?: string) => Promise<void>
}

export function SectionList({ workspace, snapshot, selected, onSelect, run }: Props) {
  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)

  const selectedIndex = snapshot.sections.findIndex((s) => s.name === selected)

  return (
    <nav className="studio-sidebar" aria-label="Topic sections">
      <button
        type="button"
        className={`studio-topic-item${selected === TOPIC_ITEM ? ' is-selected' : ''}`}
        onClick={() => onSelect(TOPIC_ITEM)}
        data-testid="studio-topic-item"
      >
        <BookOpen size={15} />
        <span>Topic settings</span>
        {snapshot.topicDirty && <span className="studio-dirty-dot" aria-label="Unsaved changes" />}
      </button>

      <div className="studio-sidebar-heading">
        <span>Sections</span>
        <button type="button" className="studio-icon-button" onClick={() => setAdding(true)} aria-label="Add section" data-testid="studio-add-section">
          <Plus size={15} />
        </button>
      </div>

      <ol className="studio-section-list">
        {snapshot.sections.map((s, index) => {
          const dirty = snapshot.dirtySections.includes(s.name)
          const hasErrors = s.validation.diagnostics.some((d) => d.tier < 3)
          const hasWarnings = !hasErrors && s.validation.diagnostics.length > 0
          const payload = s.validation.payload ?? s.lastValid
          return (
            <li
              key={s.name}
              className={`studio-section-item${s.name === selected ? ' is-selected' : ''}${dropAt === index ? ' is-drop-target' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragFrom(index)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return
                e.preventDefault()
                setDropAt(index)
              }}
              onDragLeave={() => setDropAt(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (dragFrom !== null) void run(() => workspace.moveSection(dragFrom, index))
                setDragFrom(null)
                setDropAt(null)
              }}
              onDragEnd={() => {
                setDragFrom(null)
                setDropAt(null)
              }}
              data-testid={`studio-section-${s.name}`}
            >
              <GripVertical size={14} className="studio-grip" aria-hidden />
              <button type="button" className="studio-section-main" onClick={() => onSelect(s.name)}>
                <span className="studio-section-name">
                  {s.name}
                  {dirty && <span className="studio-dirty-dot" aria-label="Unsaved changes" />}
                  {hasErrors && <AlertCircle size={13} className="studio-error-icon" aria-label="Has errors" />}
                  {hasWarnings && <AlertTriangle size={13} className="studio-warning-icon" aria-label="Has warnings" />}
                </span>
                <span className="studio-section-meta">
                  <span className="studio-type-badge">{payload?.meta.type ?? '?'}</span>
                  <span className="studio-section-title">{payload?.meta.title}</span>
                </span>
              </button>
              <span className="studio-section-actions">
                <button type="button" className="studio-icon-button" aria-label={`Move ${s.name} up`} disabled={index === 0}
                  onClick={() => run(() => workspace.moveSection(index, index - 1))}><ArrowUp size={13} /></button>
                <button type="button" className="studio-icon-button" aria-label={`Move ${s.name} down`} disabled={index === snapshot.sections.length - 1}
                  onClick={() => run(() => workspace.moveSection(index, index + 1))}><ArrowDown size={13} /></button>
                <button type="button" className="studio-icon-button" aria-label={`Rename ${s.name}`} onClick={() => setRenaming(s.name)}><Pencil size={13} /></button>
                <button type="button" className="studio-icon-button studio-icon-button--danger" aria-label={`Delete ${s.name}`} onClick={() => setDeleting(s.name)}><Trash2 size={13} /></button>
              </span>
            </li>
          )
        })}
      </ol>

      {snapshot.sections.length === 0 && (
        <p className="studio-empty">No sections yet. Use <strong>+</strong> to add one.</p>
      )}

      <AddSectionDialog
        open={adding}
        workspace={workspace}
        onClose={() => setAdding(false)}
        onAdd={async (name, type, title) => {
          await run(() => workspace.addSection(name, type, title, selectedIndex >= 0 ? selectedIndex + 1 : snapshot.sections.length), `Added ${name}`)
          onSelect(name)
          setAdding(false)
        }}
      />
      <RenameDialog
        name={renaming}
        validate={(next) => (renaming ? workspace.checkSectionName(next, renaming) : null)}
        onClose={() => setRenaming(null)}
        onRename={async (next) => {
          const from = renaming!
          setRenaming(null)
          await run(() => workspace.renameSection(from, next), `Renamed to ${next}`)
          if (selected === from) onSelect(next)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete section"
        confirmLabel="Delete"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          const name = deleting!
          setDeleting(null)
          await run(() => workspace.deleteSection(name), `Deleted ${name}`)
        }}
      >
        Delete <code>sections/{deleting}.oui</code>? The file is removed from the folder immediately.
      </ConfirmDialog>
    </nav>
  )
}
