import { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2, HelpCircle, ArrowUp, ArrowDown, FileCode, Tag, CheckCircle2 } from 'lucide-react'
import { ReflectionTemplateHelpModal } from './ReflectionTemplateHelpModal'
import type { OKFReflectionTemplateSectionData, OKFReflectionTemplateChallenge } from '../../../../okf/types'
import type { ChipItem } from '.'

interface ReflectionTemplateFormEditorProps {
  data: OKFReflectionTemplateSectionData
  onChange: (data: OKFReflectionTemplateSectionData) => void
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
  challenge: OKFReflectionTemplateChallenge
  index: number
  total: number
  onChange: (challenge: OKFReflectionTemplateChallenge) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canRemove: boolean
}) {
  const chips = challenge.chips || []
  const solution = challenge.solution || {}

  // Parse zones embedded in template string (e.g. {zone-1}, {zone-2})
  const detectedZoneIds = useMemo(() => {
    const ids: string[] = []
    const regex = /\{zone-([a-zA-Z0-9_-]+)\}/g
    let match
    while ((match = regex.exec(challenge.template || '')) !== null) {
      const zid = `zone-${match[1]}`
      if (!ids.includes(zid)) {
        ids.push(zid)
      }
    }
    return ids
  }, [challenge.template])

  const handleFieldChange = useCallback(
    <K extends keyof OKFReflectionTemplateChallenge>(field: K, value: OKFReflectionTemplateChallenge[K]) => {
      onChange({ ...challenge, [field]: value })
    },
    [challenge, onChange]
  )

  const handleInsertZonePlaceholder = useCallback(() => {
    const nextZoneNum = detectedZoneIds.length + 1
    const placeholder = `{zone-${nextZoneNum}}`
    const currentTemplate = challenge.template || ''
    const updatedTemplate = currentTemplate ? `${currentTemplate} ${placeholder}` : placeholder
    onChange({ ...challenge, template: updatedTemplate })
  }, [challenge, detectedZoneIds, onChange])

  const handleAddChip = useCallback(() => {
    const newChipId = `c${chips.length + 1}`
    const updatedChips = [...chips, { id: newChipId, text: `Answer ${chips.length + 1}` }]
    onChange({ ...challenge, chips: updatedChips })
  }, [challenge, chips, onChange])

  const handleChipChange = useCallback(
    (chipIndex: number, field: keyof ChipItem, value: string) => {
      const oldId = chips[chipIndex].id
      const updatedChips = [...chips]
      updatedChips[chipIndex] = { ...updatedChips[chipIndex], [field]: value }

      let updatedSolution = { ...solution }
      if (field === 'id' && oldId !== value) {
        Object.keys(updatedSolution).forEach((zoneKey) => {
          if (updatedSolution[zoneKey] === oldId) {
            updatedSolution[zoneKey] = value
          }
        })
      }

      onChange({ ...challenge, chips: updatedChips, solution: updatedSolution })
    },
    [challenge, chips, solution, onChange]
  )

  const handleRemoveChip = useCallback(
    (chipIndex: number) => {
      const removedId = chips[chipIndex].id
      const updatedChips = chips.filter((_, i) => i !== chipIndex)
      const updatedSolution = { ...solution }
      Object.keys(updatedSolution).forEach((zoneKey) => {
        if (updatedSolution[zoneKey] === removedId) {
          delete updatedSolution[zoneKey]
        }
      })
      onChange({ ...challenge, chips: updatedChips, solution: updatedSolution })
    },
    [challenge, chips, solution, onChange]
  )

  const handleSolutionZoneMappingChange = useCallback(
    (zoneId: string, chipId: string) => {
      const updatedSolution = { ...solution, [zoneId]: chipId }
      onChange({ ...challenge, solution: updatedSolution })
    },
    [challenge, solution, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`template-challenge-card-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <FileCode size={14} className="text-primary" />
          <span>Challenge #{index + 1}</span>
          <span className="sub-tab-badge">{detectedZoneIds.length} drop zones</span>
        </span>

        <div className="form-action-group">
          <button
            className="form-reorder-btn"
            onClick={onMoveUp}
            disabled={index === 0}
            data-testid={`template-move-up-${index}`}
            type="button"
            title="Move up"
          >
            <ArrowUp size={12} />
          </button>
          <button
            className="form-reorder-btn"
            onClick={onMoveDown}
            disabled={index === total - 1}
            data-testid={`template-move-down-${index}`}
            type="button"
            title="Move down"
          >
            <ArrowDown size={12} />
          </button>
          {canRemove && (
            <button
              className="form-remove-btn"
              onClick={onRemove}
              data-testid={`template-remove-${index}`}
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
              onChange={(e) => handleFieldChange('prompt', e.target.value)}
              placeholder="e.g. Complete the explanation template:"
              data-testid={`template-prompt-input-${index}`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Sentence Template (Embed {"{zone-1}"}, {"{zone-2}"})</span>
              <button
                className="form-add-btn"
                onClick={handleInsertZonePlaceholder}
                type="button"
                style={{ padding: '2px 6px', fontSize: '10px' }}
              >
                + Insert Drop Zone
              </button>
            </span>
            <textarea
              className="visual-form-textarea"
              value={challenge.template}
              onChange={(e) => handleFieldChange('template', e.target.value)}
              placeholder="e.g. The system uses {zone-1} to handle {zone-2}..."
              rows={3}
              data-testid={`template-template-input-${index}`}
            />
          </label>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Success Explanation (Optional)</span>
            <input
              className="visual-form-input"
              value={challenge.explanation ?? ''}
              onChange={(e) => handleFieldChange('explanation', e.target.value || undefined)}
              placeholder="e.g. Correct! Kafka acts as event stream buffer while Redis caches transient states."
              data-testid={`template-explanation-input-${index}`}
            />
          </label>
        </div>

        {/* Answer Chips Bank */}
        <div className="visual-form-card visual-form-card--sub" style={{ marginTop: '12px' }}>
          <div className="visual-form-card-header">
            <span className="card-header-title" style={{ fontSize: '12px' }}>
              <Tag size={12} className="text-secondary" /> Selectable Answer Chips ({chips.length} chips)
            </span>
            <button
              className="form-add-btn"
              onClick={handleAddChip}
              data-testid={`template-add-chip-${index}`}
              type="button"
              style={{ padding: '2px 6px', fontSize: '10px' }}
            >
              <Plus size={10} /> Add Chip
            </button>
          </div>

          <div className="visual-form-card-body" style={{ gap: '8px', display: 'flex', flexDirection: 'column' }}>
            {chips.map((chip, ci) => (
              <div key={ci} className="visual-form-grid-2" style={{ alignItems: 'center' }}>
                <input
                  className="visual-form-input"
                  value={chip.id}
                  onChange={(e) => handleChipChange(ci, 'id', e.target.value)}
                  placeholder="Chip ID (e.g. c1)"
                  style={{ flex: '0 0 100px' }}
                  data-testid={`template-${index}-chip-id-${ci}`}
                />
                <div style={{ display: 'flex', gap: '6px', flex: '1' }}>
                  <input
                    className="visual-form-input"
                    value={chip.text}
                    onChange={(e) => handleChipChange(ci, 'text', e.target.value)}
                    placeholder="Chip text content..."
                    data-testid={`template-${index}-chip-text-${ci}`}
                  />
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveChip(ci)}
                    data-testid={`template-${index}-chip-remove-${ci}`}
                    type="button"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Solution Mapping */}
        {detectedZoneIds.length > 0 && (
          <div className="visual-form-card visual-form-card--sub" style={{ marginTop: '12px' }}>
            <div className="visual-form-card-header">
              <span className="card-header-title" style={{ fontSize: '12px', color: 'var(--ctp-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Correct Solution Zone Mapping
              </span>
            </div>

            <div className="visual-form-card-body" style={{ gap: '6px', display: 'flex', flexDirection: 'column' }}>
              {detectedZoneIds.map((zoneId) => (
                <div key={zoneId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="visual-form-key" style={{ width: '90px', textTransform: 'none' }}><code>{zoneId}</code>:</span>
                  <select
                    className="visual-form-select"
                    value={solution[zoneId] || ''}
                    onChange={(e) => handleSolutionZoneMappingChange(zoneId, e.target.value)}
                    data-testid={`template-${index}-solution-${zoneId}`}
                  >
                    <option value="">-- Select Correct Chip --</option>
                    {chips.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.id} — {ch.text || '(empty)'}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReflectionTemplateFormEditor({ data, onChange }: ReflectionTemplateFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const challenges = data.challenges || []

  const handleChallengeChange = useCallback(
    (cIndex: number, updatedChallenge: OKFReflectionTemplateChallenge) => {
      const updated = [...challenges]
      updated[cIndex] = updatedChallenge
      onChange({ ...data, challenges: updated })
    },
    [data, challenges, onChange]
  )

  const handleAddChallenge = useCallback(() => {
    const newChallenge: OKFReflectionTemplateChallenge = {
      prompt: 'Complete the sentence structure:',
      template: 'The architecture uses {zone-1} to handle {zone-2}.',
      chips: [
        { id: 'c1', text: 'Microservices' },
        { id: 'c2', text: 'high concurrency' },
      ],
      solution: { 'zone-1': 'c1', 'zone-2': 'c2' },
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
    <div className="visual-form" data-testid="reflection-template-form-editor">
      {/* Section Header */}
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Template Challenges ({challenges.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="form-add-btn"
            onClick={handleAddChallenge}
            data-testid="reflection-template-add-challenge"
            type="button"
          >
            <Plus size={13} /> Add Challenge
          </button>
          <button
            className="fc-help-btn"
            onClick={() => setIsHelpOpen(true)}
            data-testid="reflection-template-editor-help-btn"
            type="button"
          >
            <HelpCircle size={13} />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <ReflectionTemplateHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

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
