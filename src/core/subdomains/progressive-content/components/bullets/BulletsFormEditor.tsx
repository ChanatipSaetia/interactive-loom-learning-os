import { useState, useCallback } from 'react'
import { Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, List, Layers, CornerDownRight } from 'lucide-react'
import { BulletsHelpModal } from './BulletsHelpModal'
import type { OKFBulletSectionData } from '../../../../okf/types'

export interface BulletItem {
  text: string
  children?: BulletItem[]
}

interface BulletsFormEditorProps {
  data: OKFBulletSectionData
  onChange: (data: OKFBulletSectionData) => void
}

function BulletItemEditor({
  item,
  index,
  total,
  path,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: {
  item: BulletItem
  index: number
  total: number
  path: string
  onChange: (updated: BulletItem) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canRemove: boolean
}) {
  const children = item.children || []

  const handleTextChange = useCallback(
    (text: string) => {
      onChange({ ...item, text })
    },
    [item, onChange]
  )

  const handleAddChild = useCallback(() => {
    const updatedChildren = [...children, { text: '' }]
    onChange({ ...item, children: updatedChildren })
  }, [item, children, onChange])

  const handleChildChange = useCallback(
    (childIndex: number, text: string) => {
      const updatedChildren = [...children]
      updatedChildren[childIndex] = { ...updatedChildren[childIndex], text }
      onChange({ ...item, children: updatedChildren })
    },
    [item, children, onChange]
  )

  const handleRemoveChild = useCallback(
    (childIndex: number) => {
      const updatedChildren = children.filter((_, i) => i !== childIndex)
      onChange({ ...item, children: updatedChildren.length ? updatedChildren : undefined })
    },
    [item, children, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`bullet-item-card-${path}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <List size={14} className="text-primary" />
          <span>Bullet #{index + 1}</span>
          {children.length > 0 && <span className="sub-tab-badge">{children.length} sub-items</span>}
        </span>

        <div className="form-action-group">
          <button
            className="form-add-btn"
            onClick={handleAddChild}
            data-testid={`bullet-add-child-${path}`}
            type="button"
            title="Add sub-bullet child"
            style={{ padding: '3px 8px', fontSize: '11px' }}
          >
            <Plus size={11} /> Child
          </button>
          <button
            className="form-reorder-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            data-testid={`bullet-move-up-${path}`}
            type="button"
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            className="form-reorder-btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            data-testid={`bullet-move-down-${path}`}
            type="button"
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
          {canRemove && (
            <button
              className="form-remove-btn"
              onClick={onRemove}
              data-testid={`bullet-remove-${path}`}
              type="button"
              title="Remove bullet item"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Bullet Point Text</span>
            <input
              className="visual-form-input"
              value={item.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter bullet point text..."
              data-testid={`bullet-text-input-${path}`}
            />
          </label>
        </div>

        {/* Child Sub-Bullets */}
        {children.length > 0 && (
          <div className="visual-form-card visual-form-card--sub" style={{ marginTop: '12px' }}>
            <div className="visual-form-card-header">
              <span className="card-header-title" style={{ fontSize: '12px', color: 'var(--ctp-subtext0)' }}>
                <CornerDownRight size={12} className="text-secondary" /> Sub-Bullet Items ({children.length})
              </span>
            </div>

            <div className="visual-form-card-body" style={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
              {children.map((child, ci) => (
                <div key={ci} className="visual-form-field" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    className="visual-form-input"
                    value={child.text}
                    onChange={(e) => handleChildChange(ci, e.target.value)}
                    placeholder={`Sub-bullet #${ci + 1} text...`}
                    data-testid={`bullet-child-input-${path}-${ci}`}
                  />
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveChild(ci)}
                    data-testid={`bullet-child-remove-${path}-${ci}`}
                    type="button"
                    title="Remove sub-bullet"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function BulletsFormEditor({ data, onChange }: BulletsFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const items = data.items || []

  const handleItemChange = useCallback(
    (index: number, updatedItem: BulletItem) => {
      const updated = [...items]
      updated[index] = updatedItem
      onChange({ ...data, items: updated })
    },
    [data, items, onChange]
  )

  const handleAddItem = useCallback(() => {
    const newItem: BulletItem = { text: '' }
    onChange({ ...data, items: [...items, newItem] })
  }, [data, items, onChange])

  const handleRemoveItem = useCallback(
    (index: number) => {
      const updated = items.filter((_, i) => i !== index)
      onChange({ ...data, items: updated })
    },
    [data, items, onChange]
  )

  const handleMoveItem = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= items.length) return
      const updated = [...items]
      const [moved] = updated.splice(fromIdx, 1)
      updated.splice(toIdx, 0, moved)
      onChange({ ...data, items: updated })
    },
    [data, items, onChange]
  )

  return (
    <div className="visual-form" data-testid="bullets-form-editor">
      {/* Header */}
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bullet Points ({items.length} top-level)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="form-add-btn"
            onClick={handleAddItem}
            data-testid="bullets-add-item"
            type="button"
          >
            <Plus size={13} /> Add Bullet
          </button>
          <button
            className="fc-help-btn"
            onClick={() => setIsHelpOpen(true)}
            data-testid="bullets-editor-help-btn"
            type="button"
          >
            <HelpCircle size={13} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <BulletsHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Bullets List */}
      <div className="visual-form-object-list">
        {items.map((item, i) => (
          <BulletItemEditor
            key={i}
            item={item}
            index={i}
            total={items.length}
            path={`${i}`}
            onChange={(updated) => handleItemChange(i, updated)}
            onRemove={() => handleRemoveItem(i)}
            onMoveUp={() => handleMoveItem(i, i - 1)}
            onMoveDown={() => handleMoveItem(i, i + 1)}
            canRemove={items.length > 1}
          />
        ))}
      </div>
    </div>
  )
}
