import { useEditor } from '../../core/context/EditorContext'
import { Pencil, PencilOff } from 'lucide-react'

export function EditSectionToggle({ sectionIndex }: { sectionIndex?: number }) {
  const { editMode, toggleEdit } = useEditor()

  return (
    <button
      className={`edit-section-toggle ${editMode ? 'active' : ''}`}
      data-testid={`edit-section-toggle-${sectionIndex ?? 'default'}`}
      onClick={() => toggleEdit(sectionIndex ?? null)}
      aria-label={editMode ? 'Exit edit mode' : 'Edit section'}
      title={editMode ? 'Exit edit mode' : 'Edit section'}
    >
      {editMode ? <PencilOff size={16} /> : <Pencil size={16} />}
      <span className="edit-section-toggle-label">{editMode ? 'Done' : 'Edit'}</span>
    </button>
  )
}
