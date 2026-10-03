import { useEffect, useState } from 'react'
import { Modal } from '../../core/ui-system'
import { SECTION_TEMPLATES, type TopicWorkspace } from '../../core/supporting/authoring-editor/workspace'

interface Props {
  open: boolean
  workspace: TopicWorkspace
  onClose: () => void
  onAdd: (name: string, type: string, title: string) => Promise<void>
}

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function AddSectionDialog({ open, workspace, onClose, onAdd }: Props) {
  const [type, setType] = useState(SECTION_TEMPLATES[0].type)
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(SECTION_TEMPLATES[0].type)
    setTitle('')
    setName('')
    setNameTouched(false)
  }, [open])

  const template = SECTION_TEMPLATES.find((t) => t.type === type)!
  const effectiveTitle = title || template.label
  const effectiveName = nameTouched ? name : slugify(effectiveTitle) || type
  const problem = workspace.checkSectionName(effectiveName)

  return (
    <Modal open={open} onClose={onClose} title="Add section" maxWidth="xl">
      <form
        className="studio-dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (!problem) void onAdd(effectiveName, type, effectiveTitle)
        }}
      >
        <h2>Add section</h2>
        <div className="studio-template-grid" role="radiogroup" aria-label="Section type">
          {SECTION_TEMPLATES.map((t) => (
            <button
              key={t.type}
              type="button"
              role="radio"
              aria-checked={t.type === type}
              className={`studio-template${t.type === type ? ' is-selected' : ''}`}
              onClick={() => setType(t.type)}
              data-testid={`studio-template-${t.type}`}
            >
              <strong>{t.label}</strong>
              <span>{t.description}</span>
            </button>
          ))}
        </div>
        <label className="studio-field">
          <span>Title</span>
          <input value={title} placeholder={template.label} onChange={(e) => setTitle(e.target.value)} data-testid="studio-add-title" />
        </label>
        <label className="studio-field">
          <span>File name</span>
          <div className="studio-filename">
            <span>sections/</span>
            <input
              value={effectiveName}
              onChange={(e) => {
                setNameTouched(true)
                setName(e.target.value)
              }}
              data-testid="studio-add-name"
            />
            <span>.oui</span>
          </div>
          {problem && <small className="studio-field-error">{problem}</small>}
        </label>
        <div className="studio-dialog-actions">
          <button type="button" className="studio-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="studio-button studio-button--primary" disabled={!!problem} data-testid="studio-confirm">
            Add {template.label}
          </button>
        </div>
      </form>
    </Modal>
  )
}
