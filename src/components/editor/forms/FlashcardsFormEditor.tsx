import { useCallback } from 'react'
import type { OKFFlashcardSectionData } from '../../../core/okf/types'
import type { WordTerm } from '../../../types'

interface FlashcardsFormEditorProps {
  data: OKFFlashcardSectionData
  onChange: (data: OKFFlashcardSectionData) => void
}

function FlashcardEditor({
  term,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  term: WordTerm
  index: number
  onChange: (term: WordTerm) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof WordTerm, value: string | { user: string; aiThoughts: string; aiQuestion: string } | undefined) => {
      onChange({ ...term, [field]: value })
    },
    [term, onChange]
  )

  return (
    <fieldset className="visual-form-nested" data-testid={`flashcard-${index}`}>
      <legend>
        {term.word || `Card ${index + 1}`} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`flashcard-remove-${index}`}>×</button> : null}
      </legend>
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
          <span className="visual-form-key">Word</span>
          <input
            className="visual-form-input"
            value={term.word}
            onChange={(e) => handleFieldChange('word', e.target.value)}
            data-testid={`flashcard-${index}-word`}
          />
        </label>
      </div>
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
    </fieldset>
  )
}

export function FlashcardsFormEditor({ data, onChange }: FlashcardsFormEditorProps) {
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
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Flashcards ({data.terms.length})</span>
        <div className="visual-form-object-list">
          {data.terms.map((term, i) => (
            <FlashcardEditor
              key={term.id || i}
              term={term}
              index={i}
              onChange={(updated) => handleTermChange(i, updated)}
              onRemove={() => handleRemoveTerm(i)}
              canRemove={data.terms.length > 1}
            />
          ))}
        </div>
        <button
          className="form-add-btn"
          onClick={handleAddTerm}
          data-testid="flashcards-add-term"
        >
          + Add Flashcard
        </button>
      </div>
    </div>
  )
}
