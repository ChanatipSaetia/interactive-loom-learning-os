import { useState, useCallback } from 'react'
import { Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, Layers, FileText, ShieldCheck, Tag } from 'lucide-react'
import { TaxonomyHelpModal } from '../../../core/subdomains/progressive-content/components/taxonomy-browser/TaxonomyHelpModal'
import type { OKFTaxonomySectionData } from '../../../core/okf/types'
import type { TaxonomyCategory } from '../../../core/subdomains/progressive-content/components/taxonomy-browser'

interface TaxonomyBrowserFormEditorProps {
  data: OKFTaxonomySectionData
  onChange: (data: OKFTaxonomySectionData) => void
}

type CardTab = 'identity' | 'content' | 'scope'

const COLOR_OPTIONS = [
  'blue',
  'peach',
  'pink',
  'mauve',
  'green',
  'teal',
  'sky',
  'lavender',
  'yellow',
  'red',
]

function CategoryItemEditor({
  category,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: {
  category: TaxonomyCategory
  index: number
  total: number
  onChange: (category: TaxonomyCategory) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canRemove: boolean
}) {
  const [activeTab, setActiveTab] = useState<CardTab>('identity')

  const handleFieldChange = useCallback(
    <K extends keyof TaxonomyCategory>(field: K, value: TaxonomyCategory[K]) => {
      onChange({ ...category, [field]: value })
    },
    [category, onChange]
  )

  const handleArrayItemChange = useCallback(
    (field: 'inScope' | 'outOfScope', itemIndex: number, value: string) => {
      const currentArray = category[field] || []
      const updated = [...currentArray]
      updated[itemIndex] = value
      onChange({ ...category, [field]: updated })
    },
    [category, onChange]
  )

  const handleAddArrayItem = useCallback(
    (field: 'inScope' | 'outOfScope') => {
      const currentArray = category[field] || []
      onChange({ ...category, [field]: [...currentArray, ''] })
    },
    [category, onChange]
  )

  const handleRemoveArrayItem = useCallback(
    (field: 'inScope' | 'outOfScope', itemIndex: number) => {
      const currentArray = category[field] || []
      const updated = currentArray.filter((_, i) => i !== itemIndex)
      onChange({ ...category, [field]: updated })
    },
    [category, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`taxonomy-category-card-${index}`}>
      {/* Category Card Header */}
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Layers size={14} className="text-primary" />
          <span>Category #{index + 1}:</span>
          <code className="card-code-pill">{category.title || `Category ${index + 1}`}</code>
          {category.color && (
            <span className="sub-tab-badge" style={{ backgroundColor: `var(--ctp-${category.color}, var(--primary))`, color: '#fff' }}>
              {category.color}
            </span>
          )}
        </span>

        <div className="form-action-group">
          <button
            className="form-reorder-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            data-testid={`taxonomy-move-up-${index}`}
            type="button"
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            className="form-reorder-btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            data-testid={`taxonomy-move-down-${index}`}
            type="button"
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
          {canRemove && (
            <button
              className="form-remove-btn"
              onClick={onRemove}
              data-testid={`taxonomy-remove-${index}`}
              type="button"
              title="Remove category"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Focused Sub-Tabs per Card */}
      <div className="flowchart-sub-tabs" style={{ margin: '8px 12px 0 12px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
          data-testid={`taxonomy-tab-identity-${index}`}
          type="button"
        >
          <Tag size={12} /> Identity
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
          data-testid={`taxonomy-tab-content-${index}`}
          type="button"
        >
          <FileText size={12} /> Content & Analogy
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'scope' ? 'active' : ''}`}
          onClick={() => setActiveTab('scope')}
          data-testid={`taxonomy-tab-scope-${index}`}
          type="button"
        >
          <ShieldCheck size={12} /> Scope ({ (category.inScope?.length || 0) + (category.outOfScope?.length || 0) })
        </button>
      </div>

      <div className="visual-form-card-body">
        {/* TAB 1: Identity & Colors */}
        {activeTab === 'identity' && (
          <>
            <div className="visual-form-grid-2">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Title</span>
                  <input
                    className="visual-form-input"
                    value={category.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="e.g. Presentation Layer"
                    data-testid={`taxonomy-${index}-title`}
                  />
                </label>
              </div>
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Subtitle</span>
                  <input
                    className="visual-form-input"
                    value={category.subtitle}
                    onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                    placeholder="e.g. User Interface & Experience"
                    data-testid={`taxonomy-${index}-subtitle`}
                  />
                </label>
              </div>
            </div>

            <div className="visual-form-grid-2">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Icon (Lucide Icon Name)</span>
                  <input
                    className="visual-form-input"
                    value={category.icon}
                    onChange={(e) => handleFieldChange('icon', e.target.value)}
                    placeholder="e.g. Layers, Cpu, Server, Database"
                    data-testid={`taxonomy-${index}-icon`}
                  />
                </label>
              </div>
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">Palette Accent Color</span>
                  <select
                    className="visual-form-select"
                    value={category.color}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    data-testid={`taxonomy-${index}-color`}
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: Content & Analogy */}
        {activeTab === 'content' && (
          <>
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Primary Focus</span>
                <input
                  className="visual-form-input"
                  value={category.primaryFocus}
                  onChange={(e) => handleFieldChange('primaryFocus', e.target.value)}
                  placeholder="e.g. User interaction, accessibility, visual layout"
                  data-testid={`taxonomy-${index}-primaryFocus`}
                />
              </label>
            </div>

            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Description (Overview Summary)</span>
                <textarea
                  className="visual-form-textarea"
                  value={category.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Core category explanation..."
                  rows={2}
                  data-testid={`taxonomy-${index}-description`}
                />
              </label>
            </div>

            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Details (Deep Conceptual Specifics)</span>
                <textarea
                  className="visual-form-textarea"
                  value={category.details}
                  onChange={(e) => handleFieldChange('details', e.target.value)}
                  placeholder="Extended technical details..."
                  rows={3}
                  data-testid={`taxonomy-${index}-details`}
                />
              </label>
            </div>

            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Real-World Analogy</span>
                <textarea
                  className="visual-form-textarea"
                  value={category.analogy}
                  onChange={(e) => handleFieldChange('analogy', e.target.value)}
                  placeholder="e.g. Like the dashboard of a car communicating state to the driver..."
                  rows={2}
                  data-testid={`taxonomy-${index}-analogy`}
                />
              </label>
            </div>
          </>
        )}

        {/* TAB 3: Scope Boundaries */}
        {activeTab === 'scope' && (
          <div className="visual-form-grid-2">
            {/* In Scope Column */}
            <div className="visual-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="visual-form-key" style={{ color: 'var(--ctp-green)' }}>✓ In Scope Responsibilities</span>
                <button
                  className="form-add-btn"
                  onClick={() => handleAddArrayItem('inScope')}
                  data-testid={`taxonomy-add-inscope-${index}`}
                  type="button"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <Plus size={10} /> Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(category.inScope || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      className="visual-form-input"
                      value={item}
                      onChange={(e) => handleArrayItemChange('inScope', i, e.target.value)}
                      placeholder={`In-scope item #${i + 1}`}
                      data-testid={`taxonomy-${index}-inscope-${i}`}
                    />
                    <button
                      className="form-remove-btn"
                      onClick={() => handleRemoveArrayItem('inScope', i)}
                      data-testid={`taxonomy-${index}-inscope-remove-${i}`}
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Out of Scope Column */}
            <div className="visual-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="visual-form-key" style={{ color: 'var(--ctp-red)' }}>✕ Out of Scope Non-Goals</span>
                <button
                  className="form-add-btn"
                  onClick={() => handleAddArrayItem('outOfScope')}
                  data-testid={`taxonomy-add-outscope-${index}`}
                  type="button"
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                >
                  <Plus size={10} /> Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(category.outOfScope || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      className="visual-form-input"
                      value={item}
                      onChange={(e) => handleArrayItemChange('outOfScope', i, e.target.value)}
                      placeholder={`Out-of-scope item #${i + 1}`}
                      data-testid={`taxonomy-${index}-outscope-${i}`}
                    />
                    <button
                      className="form-remove-btn"
                      onClick={() => handleRemoveArrayItem('outOfScope', i)}
                      data-testid={`taxonomy-${index}-outscope-remove-${i}`}
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function TaxonomyBrowserFormEditor({ data, onChange }: TaxonomyBrowserFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const categories = data.categories || []

  const handleCategoryChange = useCallback(
    (catIndex: number, updatedCategory: TaxonomyCategory) => {
      const updated = [...categories]
      updated[catIndex] = updatedCategory
      onChange({ ...data, categories: updated })
    },
    [data, categories, onChange]
  )

  const handleAddCategory = useCallback(() => {
    const newCategory: TaxonomyCategory = {
      icon: 'Layers',
      title: 'New Category',
      subtitle: 'Category Subtitle',
      description: '',
      details: '',
      analogy: '',
      primaryFocus: '',
      inScope: [],
      outOfScope: [],
      color: 'blue',
    }
    onChange({ ...data, categories: [...categories, newCategory] })
  }, [data, categories, onChange])

  const handleRemoveCategory = useCallback(
    (catIndex: number) => {
      const updated = categories.filter((_, i) => i !== catIndex)
      onChange({ ...data, categories: updated })
    },
    [data, categories, onChange]
  )

  const handleMoveCategory = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= categories.length) return
      const updated = [...categories]
      const [moved] = updated.splice(fromIdx, 1)
      updated.splice(toIdx, 0, moved)
      onChange({ ...data, categories: updated })
    },
    [data, categories, onChange]
  )

  return (
    <div className="visual-form" data-testid="taxonomy-browser-form-editor">
      {/* Section Header */}
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Taxonomy Categories ({categories.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="form-add-btn"
            onClick={handleAddCategory}
            data-testid="taxonomy-add-category"
            type="button"
          >
            <Plus size={13} /> Add Category
          </button>
          <button
            className="fc-help-btn"
            onClick={() => setIsHelpOpen(true)}
            data-testid="taxonomy-editor-help-btn"
            type="button"
          >
            <HelpCircle size={13} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <TaxonomyHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Category Items List */}
      <div className="visual-form-object-list">
        {categories.map((cat, i) => (
          <CategoryItemEditor
            key={i}
            category={cat}
            index={i}
            total={categories.length}
            onChange={(updated) => handleCategoryChange(i, updated)}
            onRemove={() => handleRemoveCategory(i)}
            onMoveUp={() => handleMoveCategory(i, i - 1)}
            onMoveDown={() => handleMoveCategory(i, i + 1)}
            canRemove={categories.length > 1}
          />
        ))}
      </div>
    </div>
  )
}
