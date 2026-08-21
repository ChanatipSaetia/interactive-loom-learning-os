import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { ReflectionSequenceHelpModal } from './ReflectionSequenceHelpModal'
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

import type { SectionResultProps, SectionResultContract } from '../../../types'
import type { ReflectionSynthesisEvents, ReflectionAnswered, ReflectionCompleted } from '../../events'

export interface ReflectionSequenceProps extends SectionResultProps<ReflectionCompleted | ReflectionAnswered, ReflectionSynthesisEvents> {
  title?: string
  prompt?: string
  items?: SequenceItem[]
  solution?: string[]
  challenges?: ReflectionSequenceChallenge[]
  sectionIndex?: number
  sectionId?: string
}

function ReflectionSequenceSingle({
  prompt,
  items,
  solution,
  onVerifyResult,
}: {
  prompt: string
  items: SequenceItem[]
  solution: string[]
  onVerifyResult?: (isCorrect: boolean) => void
}) {
  const { playSound } = useSound()
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
    const itemId = e.dataTransfer.getData('text/plain')
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    playSound('stepNext')
    setSlots((prev) => {
      const next = { ...prev }
      const previousSlotIndex = Object.keys(next).find((k) => next[parseInt(k)]?.id === itemId)
      if (previousSlotIndex !== undefined) {
        next[parseInt(previousSlotIndex)] = null
      }
      next[slotIndex] = item
      return next
    })
    setFeedback({ text: '', type: '' })
  }

  const handleItemTap = (itemId: string) => {
    if (isPlaced(itemId)) return

    playSound('click')
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    } else {
      setSelectedItemId(itemId)
    }
  }

  const handleSlotTap = (slotIndex: number) => {
    if (!selectedItemId) {
      if (slots[slotIndex]) {
        removeItemFromSlot(slotIndex)
      }
      return
    }

    const item = items.find((i) => i.id === selectedItemId)
    if (!item) return

    playSound('stepNext')
    setSlots((prev) => {
      const next = { ...prev }
      const previousSlotIndex = Object.keys(next).find((k) => next[parseInt(k)]?.id === selectedItemId)
      if (previousSlotIndex !== undefined) {
        next[parseInt(previousSlotIndex)] = null
      }
      next[slotIndex] = item
      return next
    })
    setSelectedItemId(null)
    setFeedback({ text: '', type: '' })
  }

  const removeItemFromSlot = (slotIndex: number) => {
    playSound('stepPrev')
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
      playSound('boundary')
      setFeedback({
        text: 'Please place all sequence steps before verifying.',
        type: 'error',
      })
      onVerifyResult?.(false)
      return
    }

    if (isCorrect) {
      playSound('success')
      setFeedback({
        text: 'Correct! You have mapped the process flow sequence accurately.',
        type: 'success',
      })
      onVerifyResult?.(true)
    } else {
      playSound('error')
      setFeedback({
        text: 'Incorrect sequence. Analyze dependencies and try rearranging the steps.',
        type: 'error',
      })
      onVerifyResult?.(false)
    }
  }


  return (
    <div className="sequence-card" data-testid="sequence-card">
      <div className="sequence-prompt-banner">
        <span className="sequence-prompt-text">{prompt}</span>
      </div>

      <div className="sequence-pool">
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
  sectionIndex = 0,
  sectionId = 'reflection-sequence',
  onResultChange,
  onEvent,
}: ReflectionSequenceProps) {
  const normalizedChallenges = challenges && challenges.length > 0
    ? challenges
    : [{ prompt, items, solution }]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [clearedChallenges, setClearedChallenges] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setCurrentIndex(0)
  }, [challenges])

  const currentChallenge = normalizedChallenges[currentIndex]

  const handleChallengeVerify = (isCorrect: boolean) => {
    const nextCleared = { ...clearedChallenges, [currentIndex]: isCorrect }
    setClearedChallenges(nextCleared)

    // 1. Emit single answer event
    const answeredEvent: ReflectionAnswered = {
      type: 'ReflectionAnswered',
      challengeId: `challenge_${currentIndex}`,
      challengeIndex: currentIndex,
      isCorrect,
      timestamp: Date.now(),
    }
    onEvent?.(answeredEvent)

    // 2. Compute aggregate progress and emit Result Contract
    const correctCount = Object.values(nextCleared).filter(Boolean).length
    const isCompleted = correctCount === normalizedChallenges.length
    const normalizedScore = Math.round((correctCount / normalizedChallenges.length) * 100)

    const completedPayload: ReflectionCompleted = {
      type: 'ReflectionCompleted',
      sectionType: 'reflection-sequence',
      totalChallenges: normalizedChallenges.length,
      correctCount,
      timestamp: Date.now(),
    }

    if (isCompleted) {
      onEvent?.(completedPayload)
    }

    const resultContract: SectionResultContract<ReflectionCompleted | ReflectionAnswered> = {
      sectionId,
      sectionType: 'reflection-sequence',
      status: isCompleted ? 'completed' : 'in_progress',
      score: normalizedScore,
      accuracy: correctCount / normalizedChallenges.length,
      completedAt: isCompleted ? Date.now() : undefined,
      payload: isCompleted ? completedPayload : answeredEvent,
    }

    onResultChange?.(resultContract)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, normalizedChallenges.length - 1))
  }

  return (
    <div className="sequence-section" data-testid="sequence-section">
      <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={ReflectionSequenceHelpModal} titleTestId="reflection-sequence-title" />

      {/* Single Challenge Renderer with index key to reset state */}
      <ReflectionSequenceSingle
        key={currentIndex}
        prompt={currentChallenge.prompt}
        items={currentChallenge.items}
        solution={currentChallenge.solution}
        onVerifyResult={handleChallengeVerify}
      />

      {/* Pagination Controls */}
      {normalizedChallenges.length > 1 && (
        <div className="sequence-nav">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="sequence-nav-btn"
          >
            <ChevronLeft size={16} style={{ marginRight: '4px' }} />
            Previous Scenario
          </button>
          <span className="sequence-nav-counter">
            {currentIndex + 1} / {normalizedChallenges.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === normalizedChallenges.length - 1}
            className="sequence-nav-btn"
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
