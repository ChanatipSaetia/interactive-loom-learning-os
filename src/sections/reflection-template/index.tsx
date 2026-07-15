import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import './reflection-template.css'

export interface ChipItem {
  id: string
  text: string
}

export interface ReflectionTemplateChallenge {
  prompt: string
  template: string
  chips: ChipItem[]
  solution: Record<string, string> // zoneId -> chipId
  explanation?: string
}

export interface ReflectionTemplateProps {
  title?: string
  prompt?: string
  template?: string
  chips?: ChipItem[]
  solution?: Record<string, string>
  explanation?: string
  challenges?: ReflectionTemplateChallenge[]
}

function ReflectionTemplateSingle({
  prompt,
  template,
  chips,
  solution,
  explanation,
}: {
  prompt: string
  template: string
  chips: ChipItem[]
  solution: Record<string, string>
  explanation?: string
}) {
  const zoneIds = useMemo(() => {
    const ids: string[] = []
    const regex = /\{zone-([a-zA-Z0-9_-]+)\}/g
    let match
    while ((match = regex.exec(template)) !== null) {
      ids.push(`zone-${match[1]}`)
    }
    return ids
  }, [template])

  const [blanks, setBlanks] = useState<Record<string, ChipItem | null>>(() => {
    const initial: Record<string, ChipItem | null> = {}
    zoneIds.forEach((id) => {
      initial[id] = null
    })
    return initial
  })

  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  })

  const isChipUsed = useCallback((id: string) => {
    return Object.values(blanks).some((item) => item?.id === id)
  }, [blanks])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setSelectedChipId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const placeChipInZone = useCallback((zoneId: string, chip: ChipItem) => {
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
    <div className="template-body">
      <div className="template-prompt">{prompt}</div>

      <div className="template-sentence-container">{renderedSentence}</div>

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
  )
}

export function ReflectionTemplate({
  title,
  prompt = '',
  template = '',
  chips = [],
  solution = {},
  explanation,
  challenges,
}: ReflectionTemplateProps) {
  const normalizedChallenges = challenges && challenges.length > 0
    ? challenges
    : [{ prompt, template, chips, solution, explanation }]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    setCurrentIndex(0)
  }, [challenges])

  const currentChallenge = normalizedChallenges[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, normalizedChallenges.length - 1))
  }

  return (
    <div className="reflection-template-section" data-testid="reflection-section">
      {title && (
        <h3 className="bullets-section-title">{title}</h3>
      )}

      {/* Single Challenge Renderer with index key to reset state */}
      <ReflectionTemplateSingle
        key={currentIndex}
        prompt={currentChallenge.prompt}
        template={currentChallenge.template}
        chips={currentChallenge.chips}
        solution={currentChallenge.solution}
        explanation={currentChallenge.explanation}
      />

      {/* Pagination Controls */}
      {normalizedChallenges.length > 1 && (
        <div className="quiz-nav" style={{ marginTop: '24px', borderTop: '1px solid color-mix(in srgb, var(--ctp-text) 5%, transparent)', paddingTop: '16px' }}>
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

export default ReflectionTemplate
