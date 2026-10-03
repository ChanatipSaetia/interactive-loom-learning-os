import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from '../../core/ui-system'

interface ConfirmDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  danger?: boolean
  children: ReactNode
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, confirmLabel, danger, children, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="md">
      <div className="studio-dialog">
        <h2>{title}</h2>
        <p>{children}</p>
        <div className="studio-dialog-actions">
          <button type="button" className="studio-button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`studio-button ${danger ? 'studio-button--danger' : 'studio-button--primary'}`}
            onClick={onConfirm}
            data-testid="studio-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

interface RenameDialogProps {
  /** Section being renamed, or null when closed. */
  name: string | null
  validate: (next: string) => string | null
  onClose: () => void
  onRename: (next: string) => void
}

export function RenameDialog({ name, validate, onClose, onRename }: RenameDialogProps) {
  const [value, setValue] = useState(name ?? '')
  useEffect(() => setValue(name ?? ''), [name])
  const problem = value === name ? null : validate(value)

  return (
    <Modal open={name !== null} onClose={onClose} title="Rename section" maxWidth="md">
      <form
        className="studio-dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (!problem && value !== name) onRename(value)
        }}
      >
        <h2>Rename section</h2>
        <label className="studio-field">
          <span>File name</span>
          <div className="studio-filename">
            <span>sections/</span>
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} data-testid="studio-rename-input" />
            <span>.oui</span>
          </div>
          {problem && <small className="studio-field-error">{problem}</small>}
        </label>
        <div className="studio-dialog-actions">
          <button type="button" className="studio-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="studio-button studio-button--primary" disabled={!!problem || value === name} data-testid="studio-confirm">
            Rename
          </button>
        </div>
      </form>
    </Modal>
  )
}
