import { useState } from 'react'
import { CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import './reflection-sequence.css'

export interface SequenceItem {
  id: string
  text: string
  icon?: string
}

export interface ReflectionSequenceChallenge {
  prompt: string
  items: SequenceItem[]
  solution: string[]
}

export interface ReflectionSequenceProps {
  title?: string
  prompt?: string
  items?: SequenceItem[]
  solution?: string[]
  challenges?: ReflectionSequenceChallenge[]
}

function ReflectionSequenceSingle({
  prompt,
  items,
  solution,
}: {
  prompt: string
  items: SequenceItem[]
  solution: string[]
}) {
  const [slots, setSlots] = useState<Record<number, SequenceItem | null>>(() => {
    const initial: Record<number, SequenceItem | null> = {}
    for (let i = 0; i < items.length; i++) {
      initial[i] = null
    }
    return initial
  })
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  })

  const isPlaced = (id: string) => {
    return Object.values(slots).some((item) => item?.id === id)
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setSelectedItemId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const item = items.find((x) => x.id === id)
    if (item) {
      placeItemInSlot(slotIndex, item)
    }
  }

  const handleItemTap = (id: string) => {
    if (isPlaced(id)) return
    if (selectedItemId === id) {
      setSelectedItemId(null)
    } else {
      setSelectedItemId(id)
    }
  }

  const handleSlotTap = (slotIndex: number) => {
    if (slots[slotIndex]) {
      removeItemFromSlot(slotIndex)
      return
    }
    if (selectedItemId) {
      const item = items.find((x) => x.id === selectedItemId)
      if (item) {
        placeItemInSlot(slotIndex, item)
      }
      setSelectedItemId(null)
    }
  }

  const placeItemInSlot = (slotIndex: number, item: SequenceItem) => {
    const previousSlotIndex = Object.keys(slots).find(
      (key) => slots[parseInt(key)]?.id === item.id
    )
    setSlots((prev) => {
      const next = { ...prev }
      if (previousSlotIndex !== undefined) {
        next[parseInt(previousSlotIndex)] = null
      }
      next[slotIndex] = item
      return next
    })
    setFeedback({ text: '', type: '' })
  }

  const removeItemFromSlot = (slotIndex: number) => {
    setSlots((prev) => ({
      ...prev,
      [slotIndex]: null,
    }))
    setFeedback({ text: '', type: '' })
  }

  const handleVerify = () => {
    let filledCount = 0
    let isCorrect = true

    for (let i = 0; i < solution.length; i++) {
      const item = slots[i]
      if (!item) {
        isCorrect = false
        continue
      }
      filledCount++
      if (item.id !== solution[i]) {
        isCorrect = false
      }
    }

    if (filledCount < solution.length) {
      setFeedback({
        text: 'Please place all steps in slots before verifying.',
        type: 'error',
      })
      return
    }

    if (isCorrect) {
      setFeedback({
        text: 'Correct! You have mapped the process flow sequence accurately.',
        type: 'success',
      })
    } else {
      setFeedback({
        text: 'Incorrect sequence. Analyze dependencies and try rearranging the steps.',
        type: 'error',
      })
    }
  }

  return (
    <div className="sequence-body">
      <div className="sequence-prompt">{prompt}</div>

      <div className="sequence-source-pool">
        {items.map((item) => {
          const placed = isPlaced(item.id)
          const isSelected = selectedItemId === item.id

          return (
            <div
              key={item.id}
              draggable={!placed}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onClick={() => handleItemTap(item.id)}
              className={`sequence-drag-item ${placed ? 'placed' : ''} ${isSelected ? 'selected' : ''}`}
            >
              <span>{item.text}</span>
            </div>
          )
        })}
      </div>

      <div className="sequence-slots-list">
        {items.map((_, idx) => {
          const placedItem = slots[idx]

          return (
            <div
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => handleSlotTap(idx)}
              className={`sequence-drop-slot ${placedItem ? 'filled' : ''} ${selectedItemId && !placedItem ? 'highlight-target' : ''}`}
            >
              <span className="sequence-slot-num">{String(idx + 1).padStart(2, '0')}</span>
              <div className="sequence-slot-content">
                {placedItem ? (
                  <div className="sequence-placed-wrapper">
                    <span className="sequence-placed-text">{placedItem.text}</span>
                    <button
                      className="sequence-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItemFromSlot(idx)
                      }}
                      aria-label="Remove item"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="sequence-slot-placeholder">
                    {selectedItemId ? 'Tap to place step here' : 'Drop step card here'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="sequence-footer">
        <button className="sequence-verify-btn" onClick={handleVerify}>
          Verify Sequence Model
        </button>
        
        {feedback.text && (
          <div className={`sequence-feedback-msg ${feedback.type}`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="feedback-icon" />
            ) : (
              <AlertCircle size={16} className="feedback-icon" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReflectionSequence({
  title,
  prompt = '',
  items = [],
  solution = [],
  challenges,
}: ReflectionSequenceProps) {
  const normalizedChallenges = challenges && challenges.length > 0
    ? challenges
    : [{ prompt, items, solution }]

  const [currentIndex, setCurrentIndex] = useState(0)

  const currentChallenge = normalizedChallenges[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, normalizedChallenges.length - 1))
  }

  return (
    <div className="sequence-section" data-testid="sequence-section">
      {title && (
        <h3 className="bullets-section-title">{title}</h3>
      )}

      {/* Single Challenge Renderer with index key to reset state */}
      <ReflectionSequenceSingle
        key={currentIndex}
        prompt={currentChallenge.prompt}
        items={currentChallenge.items}
        solution={currentChallenge.solution}
      />

      {/* Pagination Controls */}
      {normalizedChallenges.length > 1 && (
        <div className="quiz-nav" style={{ marginTop: '24px', borderTop: '1px solid rgba(198, 208, 245, 0.05)', paddingTop: '16px' }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="quiz-nav-btn"
            style={{ display: 'inline-flex', alignItems: 'center', opacity: currentIndex === 0 ? 0.4 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} style={{ marginRight: '4px' }} />
            Previous Scenario
          </button>
          <span style={{ color: 'var(--ctp-subtext0)', fontSize: '14px', fontFamily: 'monospace' }}>
            {currentIndex + 1} / {normalizedChallenges.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === normalizedChallenges.length - 1}
            className="quiz-nav-btn"
            style={{ display: 'inline-flex', alignItems: 'center', opacity: currentIndex === normalizedChallenges.length - 1 ? 0.4 : 1, cursor: currentIndex === normalizedChallenges.length - 1 ? 'not-allowed' : 'pointer' }}
          >
            Next Scenario
            <ChevronRight size={16} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      )}
    </div>
  )
}

export default ReflectionSequence
