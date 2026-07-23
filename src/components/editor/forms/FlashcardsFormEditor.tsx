import { useState, useCallback } from 'react'
import { Folder, Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, Settings, Layers } from 'lucide-react'
import { FlashcardsHelpModal } from '../../../sections/flashcards/FlashcardsHelpModal'
import type { OKFFlashcardSectionData } from '../../../core/okf/types'
import type { WordTerm } from '../../../types'

interface FlashcardsFormEditorProps {
  data: OKFFlashcardSectionData
  onChange: (data: OKFFlashcardSectionData) => void
}

function FlashcardEditor({
  term,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: {
  term: WordTerm
  index: number
  total: number
  onChange: (term: WordTerm) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof WordTerm, value: string | { user: string; aiThoughts: string; aiQuestion: string } | undefined) => {
      onChange({ ...term, [field]: value })
    },
    [term, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`flashcard-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Folder size={13} /> Card #{index + 1}: <code className="card-code-pill">{term.word || term.id}</code>
        </span>
        <div className="form-action-group">
          <button
            className="form-reorder-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            data-testid={`flashcard-move-up-${index}`}
            type="button"
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            className="form-reorder-btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            data-testid={`flashcard-move-down-${index}`}
            type="button"
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
          {canRemove && (
            <button
              className="form-remove-btn"
              onClick={onRemove}
              data-testid={`flashcard-remove-${index}`}
              type="button"
              title="Remove flashcard"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">ID</span>
              <input
                className="visual-form-input"
                value={term.id}
                onChange={(e) => handleFieldChange('id', e.target.value)}
                data-testid={`flashcard-${index}-id`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Word / Term</span>
              <input
                className="visual-form-input"
                value={term.word}
                onChange={(e) => handleFieldChange('word', e.target.value)}
                data-testid={`flashcard-${index}-word`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Pronunciation</span>
              <input
                className="visual-form-input"
                value={term.pronunciation}
                onChange={(e) => handleFieldChange('pronunciation', e.target.value)}
                data-testid={`flashcard-${index}-pronunciation`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Category</span>
              <input
                className="visual-form-input"
                value={term.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                data-testid={`flashcard-${index}-category`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Image URL (Optional)</span>
            <input
              className="visual-form-input"
              value={term.image ?? ''}
              onChange={(e) => handleFieldChange('image', e.target.value)}
              placeholder="e.g. /images/terms/event.png"
              data-testid={`flashcard-${index}-image`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Short Definition</span>
            <textarea
              className="visual-form-textarea"
              value={term.shortDefinition}
              onChange={(e) => handleFieldChange('shortDefinition', e.target.value)}
              rows={2}
              data-testid={`flashcard-${index}-shortDefinition`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Detailed Definition</span>
            <textarea
              className="visual-form-textarea"
              value={term.detailedDefinition}
              onChange={(e) => handleFieldChange('detailedDefinition', e.target.value)}
              rows={3}
              data-testid={`flashcard-${index}-detailedDefinition`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Why It Matters</span>
            <textarea
              className="visual-form-textarea"
              value={term.whyItMatters}
              onChange={(e) => handleFieldChange('whyItMatters', e.target.value)}
              rows={2}
              data-testid={`flashcard-${index}-whyItMatters`}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

type FlashcardSubTab = 'cards' | 'overview'

export function FlashcardsFormEditor({ data, onChange }: FlashcardsFormEditorProps) {
  const [activeTab, setActiveTab] = useState<FlashcardSubTab>('cards')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const handleTermChange = useCallback(
    (termIndex: number, updatedTerm: WordTerm) => {
      const updated = [...data.terms]
      updated[termIndex] = updatedTerm
      onChange({ ...data, terms: updated })
    },
    [data, onChange]
  )

  const handleRemoveTerm = useCallback(
    (termIndex: number) => {
      const updated = data.terms.filter((_, i) => i !== termIndex)
      onChange({ ...data, terms: updated })
    },
    [data, onChange]
  )

  const handleMoveTerm = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= data.terms.length) return
      const updated = [...data.terms]
      const [movedItem] = updated.splice(fromIdx, 1)
      updated.splice(toIdx, 0, movedItem)
      onChange({ ...data, terms: updated })
    },
    [data, onChange]
  )

  const handleAddTerm = useCallback(() => {
    const newTerm: WordTerm = {
      id: `t${data.terms.length + 1}`,
      word: '',
      pronunciation: '',
      category: '',
      shortDefinition: '',
      detailedDefinition: '',
      whyItMatters: '',
    }
    onChange({ ...data, terms: [...data.terms, newTerm] })
  }, [data, onChange])

  return (
    <div className="visual-form" data-testid="flashcards-form-editor">
      {/* Sub-Tabs Navigation */}
      <div className="flowchart-sub-tabs" data-testid="fc-sub-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
          data-testid="fc-tab-cards"
          type="button"
        >
          <Layers size={14} />
          <span>Deck Cards</span>
          <span className="sub-tab-badge">{data.terms.length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          data-testid="fc-tab-overview"
          type="button"
        >
          <Settings size={14} />
          <span>Deck Overview</span>
        </button>

        <button
          className="fc-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="flashcards-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <FlashcardsHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Cards Sub-Tab */}
      {activeTab === 'cards' && (
        <div className="visual-form-field visual-form-field--array" data-testid="fc-cards-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Flashcards ({data.terms.length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddTerm}
              data-testid="flashcards-add-term"
              type="button"
            >
              <Plus size={13} /> Add Flashcard
            </button>
          </div>

          <div className="visual-form-object-list">
            {data.terms.map((term, i) => (
              <FlashcardEditor
                key={term.id || i}
                term={term}
                index={i}
                total={data.terms.length}
                onChange={(updated) => handleTermChange(i, updated)}
                onRemove={() => handleRemoveTerm(i)}
                onMoveUp={() => handleMoveTerm(i, i - 1)}
                onMoveDown={() => handleMoveTerm(i, i + 1)}
                canRemove={data.terms.length > 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overview Sub-Tab */}
      {activeTab === 'overview' && (
        <div className="visual-form-card" data-testid="fc-overview-tab-content">
          <div className="visual-form-card-header">
            <span className="card-header-title">
              <Folder size={14} /> Flashcard Deck Overview
            </span>
          </div>
          <div className="visual-form-card-body">
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Total Cards</span>
                <input
                  className="visual-form-input"
                  value={`${data.terms.length} terms in deck`}
                  disabled
                />
              </label>
            </div>
            <p className="visual-form-empty" style={{ fontStyle: 'normal' }}>
              Flashcards help learners reinforce core terms and domain language using spaced repetition or flip-card modes. Edit individual card content in the <strong>Deck Cards</strong> sub-tab.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
