import React, { useState, useMemo, useCallback } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import './reflection-template.css'

export interface ChipItem {
  id: string
  text: string
}

export interface ReflectionTemplateProps {
  title?: string
  prompt: string
  template: string
  chips: ChipItem[]
  solution: Record<string, string> // zoneId -> chipId
  explanation?: string
}

export function ReflectionTemplate({
  title,
  prompt,
  template = '',
  chips = [],
  solution = {},
  explanation,
}: ReflectionTemplateProps) {
  // Extract zone IDs from the template string
  const zoneIds = useMemo(() => {
    const ids: string[] = []
    const regex = /\{zone-([a-zA-Z0-9_-]+)\}/g
    let match
    while ((match = regex.exec(template)) !== null) {
      ids.push(`zone-${match[1]}`)
    }
    return ids
  }, [template])

  // Map of zoneId -> ChipItem or null
  const [blanks, setBlanks] = useState<Record<string, ChipItem | null>>(() => {
    const initial: Record<string, ChipItem | null> = {}
    zoneIds.forEach((id) => {
      initial[id] = null
    })
    return initial
  })

  // Selected chip ID for mobile tap fallback
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)

  // Verification feedback state
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  })

  const isChipUsed = useCallback((id: string) => {
    return Object.values(blanks).some((item) => item?.id === id)
  }, [blanks])

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setSelectedChipId(null) // clear tap selection
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // --- Common slot updates ---
  const placeChipInZone = useCallback((zoneId: string, chip: ChipItem) => {
    // If the chip is already in another zone, clear it there
    const previousZoneId = Object.keys(blanks).find(
      (key) => blanks[key]?.id === chip.id
    )

    setBlanks((prev) => {
      const next = { ...prev }
      if (previousZoneId) {
        next[previousZoneId] = null
      }
      next[zoneId] = chip
      return next
    })
    setFeedback({ text: '', type: '' })
  }, [blanks])

  const removeChipFromZone = useCallback((zoneId: string) => {
    setBlanks((prev) => ({
      ...prev,
      [zoneId]: null,
    }))
    setFeedback({ text: '', type: '' })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, zoneId: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const chip = chips.find((x) => x.id === id)
    if (chip) {
      placeChipInZone(zoneId, chip)
    }
  }, [chips, placeChipInZone])

  // --- Mobile Tap-to-Move Fallback Handlers ---
  const handleChipTap = (id: string) => {
    if (isChipUsed(id)) return

    if (selectedChipId === id) {
      setSelectedChipId(null)
    } else {
      setSelectedChipId(id)
    }
  }

  const handleZoneTap = useCallback((zoneId: string) => {
    if (blanks[zoneId]) {
      // If filled, clear it
      removeChipFromZone(zoneId)
      return
    }

    if (selectedChipId) {
      const chip = chips.find((x) => x.id === selectedChipId)
      if (chip) {
        placeChipInZone(zoneId, chip)
      }
      setSelectedChipId(null)
    }
  }, [blanks, selectedChipId, chips, placeChipInZone, removeChipFromZone])

  // --- Verification ---
  const handleVerify = () => {
    let unfilled = false
    let correctCount = 0

    for (const zoneId of zoneIds) {
      const placedChip = blanks[zoneId]
      if (!placedChip) {
        unfilled = true
        break
      }
      if (placedChip.id === solution[zoneId]) {
        correctCount++
      }
    }

    if (unfilled) {
      setFeedback({
        text: 'Please fill in all blanks within the sentence structure before checking.',
        type: 'error',
      })
      return
    }

    if (correctCount === zoneIds.length) {
      setFeedback({
        text: explanation || 'Correct! You have successfully completed the explanation template.',
        type: 'success',
      })
    } else {
      setFeedback({
        text: 'Incorrect reasoning. Adjust parameters and review the tradeoffs before retrying.',
        type: 'error',
      })
    }
  }

  // Segment the template text to render inline boxes
  const renderedSentence = useMemo(() => {
    const segments = template.split(/(\{zone-[a-zA-Z0-9_-]+\})/g)
    return segments.map((seg, idx) => {
      const match = seg.match(/^\{zone-([a-zA-Z0-9_-]+)\}$/)
      if (match) {
        const zoneId = `zone-${match[1]}`
        const placed = blanks[zoneId]
        const isHighlight = selectedChipId && !placed

        return (
          <span
            key={idx}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, zoneId)}
            onClick={() => handleZoneTap(zoneId)}
            className={`reflection-blank-dropzone ${placed ? 'filled' : ''} ${isHighlight ? 'highlight-target' : ''}`}
          >
            {placed ? placed.text : '[ ? ]'}
          </span>
        )
      }
      return <span key={idx}>{seg}</span>
    })
  }, [template, blanks, selectedChipId, handleDrop, handleZoneTap])

  return (
    <div className="reflection-template-section" data-testid="reflection-section">
      {title && (
        <h3 className="bullets-section-title">{title}</h3>
      )}

      <div className="template-body">
        <div className="template-prompt">{prompt}</div>

        {/* Dynamic Sentence template area */}
        <div className="template-sentence-container">{renderedSentence}</div>

        {/* Source Word Chips Pool */}
        <div className="template-chips-bank">
          {chips.map((chip) => {
            const used = isChipUsed(chip.id)
            const isSelected = selectedChipId === chip.id

            return (
              <div
                key={chip.id}
                draggable={!used}
                onDragStart={(e) => handleDragStart(e, chip.id)}
                onClick={() => handleChipTap(chip.id)}
                className={`template-chip-item ${used ? 'used' : ''} ${isSelected ? 'selected' : ''}`}
              >
                {chip.text}
              </div>
            )
          })}
        </div>

        {/* Action Button & Verification feedback */}
        <div className="template-footer">
          <button className="template-verify-btn" onClick={handleVerify}>
            Verify Explanation
          </button>

          {feedback.text && (
            <div className={`template-feedback-msg ${feedback.type}`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 size={16} className="feedback-icon" />
              ) : (
                <AlertCircle size={16} className="feedback-icon" />
              )}
              <div
                className="feedback-text-content"
                dangerouslySetInnerHTML={{ __html: feedback.text }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReflectionTemplate
