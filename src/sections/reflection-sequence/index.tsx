import { useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import './reflection-sequence.css'

export interface SequenceItem {
  id: string
  text: string
  icon?: string
}

export interface ReflectionSequenceProps {
  title?: string
  prompt: string
  items: SequenceItem[]
  solution: string[]
}

export function ReflectionSequence({ title, prompt, items = [], solution = [] }: ReflectionSequenceProps) {
  // Map of slot index (0-indexed) to placed SequenceItem or null
  const [slots, setSlots] = useState<Record<number, SequenceItem | null>>(() => {
    const initial: Record<number, SequenceItem | null> = {}
    for (let i = 0; i < items.length; i++) {
      initial[i] = null
    }
    return initial
  })

  // Selected item ID for tap-to-move mobile interaction fallback
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  
  // Verification feedback state
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  })

  // Helper: check if an item is already placed in any slot
  const isPlaced = (id: string) => {
    return Object.values(slots).some((item) => item?.id === id)
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setSelectedItemId(null) // clear tap selection on drag
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

  // --- Mobile Tap-to-Move Fallback Handlers ---
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
      // If slot is filled, return item to pool
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

  // --- Common slot state update operations ---
  const placeItemInSlot = (slotIndex: number, item: SequenceItem) => {
    // If the item is already in another slot, clear that slot first
    const previousSlotIndex = Object.keys(slots).find(
      (key) => slots[parseInt(key)]?.id === item.id
    )

    setSlots((prev) => {
      const next = { ...prev }
      if (previousSlotIndex !== undefined) {
        next[parseInt(previousSlotIndex)] = null
      }
      // If there was an item in this slot, it returns to pool naturally because of isPlaced
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

  // --- Verification ---
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
    <div className="sequence-section" data-testid="sequence-section">
      {title && (
        <h3 className="bullets-section-title">{title}</h3>
      )}

      <div className="sequence-body">
        <div className="sequence-prompt">{prompt}</div>

        {/* Source Pool of draggable steps */}
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

        {/* Target Slots List */}
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

        {/* Action button and Feedback info */}
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
    </div>
  )
}

export default ReflectionSequence
