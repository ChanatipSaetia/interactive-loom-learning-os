import { useState, useCallback } from 'react'
import { Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, ListOrdered, CheckCircle2 } from 'lucide-react'
import { ReflectionSequenceHelpModal } from './ReflectionSequenceHelpModal'
import type { OKFReflectionSequenceSectionData, OKFReflectionSequenceChallenge } from '../../../../okf/types'

interface ReflectionSequenceFormEditorProps {
  data: OKFReflectionSequenceSectionData
  onChange: (data: OKFReflectionSequenceSectionData) => void
}

function ChallengeItemEditor({
  challenge,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
}: {
  challenge: OKFReflectionSequenceChallenge
  index: number
  total: number
  onChange: (challenge: OKFReflectionSequenceChallenge) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canRemove: boolean
}) {
  const items = challenge.items || []
  const solution = challenge.solution || []

  const handlePromptChange = useCallback(
    (prompt: string) => {
      onChange({ ...challenge, prompt })
    },
    [challenge, onChange]
  )

  const handleAddItem = useCallback(() => {
    const newItemId = `step-${items.length + 1}`
    const updatedItems = [...items, { id: newItemId, text: `Step ${items.length + 1}` }]
    const updatedSolution = [...solution, newItemId]
    onChange({ ...challenge, items: updatedItems, solution: updatedSolution })
  }, [challenge, items, solution, onChange])

  const handleItemChange = useCallback(
    (itemIndex: number, field: 'id' | 'text', value: string) => {
      const oldId = items[itemIndex].id
      const updatedItems = [...items]
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value }

      let updatedSolution = [...solution]
      if (field === 'id' && oldId !== value) {
        updatedSolution = updatedSolution.map((id) => (id === oldId ? value : id))
      }

      onChange({ ...challenge, items: updatedItems, solution: updatedSolution })
    },
    [challenge, items, solution, onChange]
  )

  const handleRemoveItem = useCallback(
    (itemIndex: number) => {
      const removedId = items[itemIndex].id
      const updatedItems = items.filter((_, i) => i !== itemIndex)
      const updatedSolution = solution.filter((id) => id !== removedId)
      onChange({ ...challenge, items: updatedItems, solution: updatedSolution })
    },
    [challenge, items, solution, onChange]
  )

  const handleSolutionOrderChange = useCallback(
    (solIndex: number, newId: string) => {
      const updatedSolution = [...solution]
      updatedSolution[solIndex] = newId
      onChange({ ...challenge, solution: updatedSolution })
    },
    [challenge, solution, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`sequence-challenge-card-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <ListOrdered size={14} className="text-primary" />
          <span>Challenge #{index + 1}</span>
          <span className="sub-tab-badge">{items.length} steps</span>
        </span>

        <div className="form-action-group">
          <button
            className="form-reorder-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            data-testid={`sequence-move-up-${index}`}
            type="button"
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            className="form-reorder-btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            data-testid={`sequence-move-down-${index}`}
            type="button"
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
          {canRemove && (
            <button
              className="form-remove-btn"
              onClick={onRemove}
              data-testid={`sequence-remove-${index}`}
              type="button"
              title="Remove challenge"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Challenge Prompt</span>
            <input
              className="visual-form-input"
              value={challenge.prompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="e.g. Arrange the process steps in correct execution sequence:"
              data-testid={`sequence-prompt-input-${index}`}
            />
          </label>
        </div>

        {/* Steps Pool List */}
        <div className="visual-form-card visual-form-card--sub" style={{ marginTop: '12px' }}>
          <div className="visual-form-card-header">
            <span className="card-header-title" style={{ fontSize: '12px' }}>
              Sequence Step Pool ({items.length} cards)
            </span>
            <button
              className="form-add-btn"
              onClick={handleAddItem}
              data-testid={`sequence-add-item-${index}`}
              type="button"
              style={{ padding: '2px 6px', fontSize: '10px' }}
            >
              <Plus size={10} /> Add Step Card
            </button>
          </div>

          <div className="visual-form-card-body" style={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
            {items.map((item, ii) => (
              <div key={ii} className="visual-form-grid-2" style={{ alignItems: 'center' }}>
                <input
                  className="visual-form-input"
                  value={item.id}
                  onChange={(e) => handleItemChange(ii, 'id', e.target.value)}
                  placeholder="ID (e.g. step-1)"
                  style={{ flex: '0 0 110px' }}
                  data-testid={`sequence-${index}-item-id-${ii}`}
                />
                <div style={{ display: 'flex', gap: '6px', flex: '1' }}>
                  <input
                    className="visual-form-input"
                    value={item.text}
                    onChange={(e) => handleItemChange(ii, 'text', e.target.value)}
                    placeholder="Step text card content..."
                    data-testid={`sequence-${index}-item-text-${ii}`}
                  />
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveItem(ii)}
                    data-testid={`sequence-${index}-item-remove-${ii}`}
                    type="button"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Correct Solution Order */}
        <div className="visual-form-card visual-form-card--sub" style={{ marginTop: '12px' }}>
          <div className="visual-form-card-header">
            <span className="card-header-title" style={{ fontSize: '12px', color: 'var(--ctp-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Correct Solution Order Sequence
            </span>
          </div>

          <div className="visual-form-card-body" style={{ gap: '6px', display: 'flex', flexDirection: 'column' }}>
            {solution.map((solId, si) => (
              <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="visual-form-key" style={{ width: '60px' }}>Slot #{si + 1}:</span>
                <select
                  className="visual-form-select"
                  value={solId}
                  onChange={(e) => handleSolutionOrderChange(si, e.target.value)}
                  data-testid={`sequence-${index}-solution-${si}`}
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.id} — {it.text || '(empty)'}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReflectionSequenceFormEditor({ data, onChange }: ReflectionSequenceFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const challenges = data.challenges || []

  const handleChallengeChange = useCallback(
    (cIndex: number, updatedChallenge: OKFReflectionSequenceChallenge) => {
      const updated = [...challenges]
      updated[cIndex] = updatedChallenge
      onChange({ ...data, challenges: updated })
    },
    [data, challenges, onChange]
  )

  const handleAddChallenge = useCallback(() => {
    const newChallenge: OKFReflectionSequenceChallenge = {
      prompt: 'Arrange the process steps in sequence:',
      items: [
        { id: 'step-1', text: 'First Step' },
        { id: 'step-2', text: 'Second Step' },
      ],
      solution: ['step-1', 'step-2'],
    }
    onChange({ ...data, challenges: [...challenges, newChallenge] })
  }, [data, challenges, onChange])

  const handleRemoveChallenge = useCallback(
    (cIndex: number) => {
      const updated = challenges.filter((_, i) => i !== cIndex)
      onChange({ ...data, challenges: updated })
    },
    [data, challenges, onChange]
  )

  const handleMoveChallenge = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= challenges.length) return
      const updated = [...challenges]
      const [moved] = updated.splice(fromIdx, 1)
      updated.splice(toIdx, 0, moved)
      onChange({ ...data, challenges: updated })
    },
    [data, challenges, onChange]
  )

  return (
    <div className="visual-form" data-testid="reflection-sequence-form-editor">
      {/* Section Header */}
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListOrdered size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sequence Challenges ({challenges.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="form-add-btn"
            onClick={handleAddChallenge}
            data-testid="reflection-sequence-add-challenge"
            type="button"
          >
            <Plus size={13} /> Add Challenge
          </button>
          <button
            className="fc-help-btn"
            onClick={() => setIsHelpOpen(true)}
            data-testid="reflection-sequence-editor-help-btn"
            type="button"
          >
            <HelpCircle size={13} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <ReflectionSequenceHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Challenges List */}
      <div className="visual-form-object-list">
        {challenges.map((challenge, i) => (
          <ChallengeItemEditor
            key={i}
            challenge={challenge}
            index={i}
            total={challenges.length}
            onChange={(updated) => handleChallengeChange(i, updated)}
            onRemove={() => handleRemoveChallenge(i)}
            onMoveUp={() => handleMoveChallenge(i, i - 1)}
            onMoveDown={() => handleMoveChallenge(i, i + 1)}
            canRemove={challenges.length > 1}
          />
        ))}
      </div>
    </div>
  )
}
