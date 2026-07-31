import { useState, useCallback } from 'react'
import { Folder, Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, MessageSquare, Image, Layers } from 'lucide-react'
import { FlashcardsHelpModal } from '../../../core/subdomains/practice-assessment/components/flashcards/FlashcardsHelpModal'
import type { OKFFlashcardSectionData } from '../../../core/okf/types'
import type { WordTerm } from '../../../types'

interface FlashcardsFormEditorProps {
  data: OKFFlashcardSectionData
  onChange: (data: OKFFlashcardSectionData) => void
}

function FlashcardEditorItem({
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
  const [showDialogue, setShowDialogue] = useState<boolean>(!!term.dialogue)

  const handleFieldChange = useCallback(
    <K extends keyof WordTerm>(field: K, value: WordTerm[K]) => {
      onChange({ ...term, [field]: value })
    },
    [term, onChange]
  )

  const handleDialogueChange = useCallback(
    (field: 'user' | 'aiThoughts' | 'aiQuestion', value: string) => {
      const currentDialogue = term.dialogue || { user: '', aiThoughts: '', aiQuestion: '' }
      onChange({
        ...term,
        dialogue: {
          ...currentDialogue,
          [field]: value,
        },
      })
    },
    [term, onChange]
  )

  const handleToggleDialogue = useCallback(
    (enabled: boolean) => {
      setShowDialogue(enabled)
      if (enabled) {
        if (!term.dialogue) {
          onChange({
            ...term,
            dialogue: { user: '', aiThoughts: '', aiQuestion: '' },
          })
        }
      } else {
        const updated = { ...term }
        delete updated.dialogue
        onChange(updated)
      }
    },
    [term, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`flashcard-${index}`}>
      {/* Card Header Toolbar */}
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Folder size={14} className="text-primary" />
          <span>Card #{index + 1}:</span>
          <code className="card-code-pill">{term.word || term.id || `term-${index + 1}`}</code>
          {term.category && <span className="sub-tab-badge" style={{ textTransform: 'uppercase' }}>{term.category}</span>}
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
        {/* Section 1: Basic Term Meta */}
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">ID</span>
              <input
                className="visual-form-input"
                value={term.id}
                onChange={(e) => handleFieldChange('id', e.target.value)}
                placeholder="e.g. t1"
                data-testid={`flashcard-${index}-id`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Word / Term Title</span>
              <input
                className="visual-form-input"
                value={term.word}
                onChange={(e) => handleFieldChange('word', e.target.value)}
                placeholder="e.g. Visual Hierarchy"
                data-testid={`flashcard-${index}-word`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Pronunciation (Phonetic)</span>
              <input
                className="visual-form-input"
                value={term.pronunciation}
                onChange={(e) => handleFieldChange('pronunciation', e.target.value)}
                placeholder="e.g. vɪʒ·u·əl haɪ·ər·ɑːr·ki"
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
                placeholder="e.g. hierarchy, pattern, mechanism"
                data-testid={`flashcard-${index}-category`}
              />
            </label>
          </div>
        </div>

        {/* Section 2: Media & Content Definitions */}
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Image size={12} /> Image Asset URL (Optional)
            </span>
            <input
              className="visual-form-input"
              value={term.image ?? ''}
              onChange={(e) => handleFieldChange('image', e.target.value || undefined)}
              placeholder="e.g. /images/terms/hierarchy.png"
              data-testid={`flashcard-${index}-image`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Short Definition (Card Front Quote)</span>
            <textarea
              className="visual-form-textarea"
              value={term.shortDefinition}
              onChange={(e) => handleFieldChange('shortDefinition', e.target.value)}
              placeholder="Brief summary sentence displayed on card front..."
              rows={2}
              data-testid={`flashcard-${index}-shortDefinition`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Detailed Definition (Card Back Explanation)</span>
            <textarea
              className="visual-form-textarea"
              value={term.detailedDefinition}
              onChange={(e) => handleFieldChange('detailedDefinition', e.target.value)}
              placeholder="Comprehensive concept explanation shown on flip..."
              rows={3}
              data-testid={`flashcard-${index}-detailedDefinition`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Why It Matters (Architectural Significance)</span>
            <textarea
              className="visual-form-textarea"
              value={term.whyItMatters}
              onChange={(e) => handleFieldChange('whyItMatters', e.target.value)}
              placeholder="Why this concept or decision is critical..."
              rows={2}
              data-testid={`flashcard-${index}-whyItMatters`}
            />
          </label>
        </div>

        {/* Section 3: AI Dialogue Simulation (Optional Schema Field) */}
        <div className="visual-form-card visual-form-card--sub" style={{ marginTop: '12px' }}>
          <div className="visual-form-card-header">
            <label className="visual-form-label" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showDialogue}
                onChange={(e) => handleToggleDialogue(e.target.checked)}
                data-testid={`flashcard-${index}-toggle-dialogue`}
              />
              <span className="card-header-title" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={13} /> Interactive AI Dialogue Simulation
              </span>
            </label>
          </div>

          {showDialogue && (
            <div className="visual-form-card-body">
              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">User Directive / Prompt</span>
                  <input
                    className="visual-form-input"
                    value={term.dialogue?.user ?? ''}
                    onChange={(e) => handleDialogueChange('user', e.target.value)}
                    placeholder="e.g. Create a high impact landing hero section"
                    data-testid={`flashcard-${index}-dialogue-user`}
                  />
                </label>
              </div>

              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">AI Rationale / Reasoning Thoughts</span>
                  <textarea
                    className="visual-form-textarea"
                    value={term.dialogue?.aiThoughts ?? ''}
                    onChange={(e) => handleDialogueChange('aiThoughts', e.target.value)}
                    placeholder="e.g. Evaluating font scale ratio and contrast requirements..."
                    rows={2}
                    data-testid={`flashcard-${index}-dialogue-aiThoughts`}
                  />
                </label>
              </div>

              <div className="visual-form-field">
                <label className="visual-form-label">
                  <span className="visual-form-key">AI Alignment Inquiry (Follow-up Question)</span>
                  <input
                    className="visual-form-input"
                    value={term.dialogue?.aiQuestion ?? ''}
                    onChange={(e) => handleDialogueChange('aiQuestion', e.target.value)}
                    placeholder="e.g. Would you prefer a 1.25 major third or 1.414 augmented scale?"
                    data-testid={`flashcard-${index}-dialogue-aiQuestion`}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function FlashcardsFormEditor({ data, onChange }: FlashcardsFormEditorProps) {
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
      {/* Editor Header Bar */}
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Flashcards Deck ({data.terms.length} cards)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="form-add-btn"
            onClick={handleAddTerm}
            data-testid="flashcards-add-term"
            type="button"
          >
            <Plus size={13} /> Add Flashcard
          </button>
          <button
            className="fc-help-btn"
            onClick={() => setIsHelpOpen(true)}
            data-testid="flashcards-editor-help-btn"
            type="button"
          >
            <HelpCircle size={13} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <FlashcardsHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Cards List */}
      <div className="visual-form-object-list">
        {data.terms.map((term, i) => (
          <FlashcardEditorItem
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
  )
}
