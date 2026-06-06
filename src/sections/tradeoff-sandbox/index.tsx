import { useState, useCallback, useEffect, useRef, useMemo, type ComponentType } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, X, Star } from 'lucide-react'
import { SectionRegistry } from '../../core/registry'
import './tradeoff-sandbox.css'

export interface MetricDef {
  id: string
  label: string
  baseValue: number
  min?: number
  max?: number
  direction?: 'higher' | 'lower'
}

export interface TradeoffProCon {
  title: string
  description: string
}

export interface TradeoffChoice {
  id: string
  label: string
  description: string
  metrics: Record<string, number>
  pros: TradeoffProCon[]
  cons: TradeoffProCon[]
  whyThisFits?: string
  whenToUse?: string
}

export interface TradeoffStep {
  id: string
  title: string
  description: string
  choices: TradeoffChoice[]
  recommended?: string
}

export interface TradeoffScenario {
  id: string
  title: string
  description: string
  metrics: MetricDef[]
  steps: TradeoffStep[]
}

export interface TradeoffSandboxSectionProps {
  title?: string
  scenarios: TradeoffScenario[]
}

function MetricBar({ metric, value, max }: { metric: MetricDef; value: number; max: number }) {
  const clamped = Math.max(metric.min ?? 0, Math.min(metric.max ?? 100, value))
  const pct = max !== 0 ? (clamped / max) * 100 : 0
  const direction = metric.direction ?? 'higher'
  const delta = value - metric.baseValue

  let fillColor = 'var(--ctp-blue)'
  if (delta !== 0) {
    if (direction === 'higher') {
      fillColor = delta > 0 ? 'var(--ctp-green)' : 'var(--ctp-red)'
    } else {
      fillColor = delta < 0 ? 'var(--ctp-green)' : 'var(--ctp-red)'
    }
  }

  return (
    <div className="metric-bar" data-testid={`metric-bar-${metric.id}`}>
      <div className="metric-bar-header">
        <span className="metric-label" data-testid={`metric-label-${metric.id}`}>{metric.label}</span>
        <span className="metric-value" data-testid={`metric-value-${metric.id}`}>{clamped}</span>
      </div>
      <div className="metric-track" data-testid={`metric-track-${metric.id}`}>
        <div
          className="metric-fill"
          data-testid={`metric-fill-${metric.id}`}
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  )
}

function FloatingDropdown({
  step,
  chosenChoiceId,
  onSelect,
  scenarioIdx,
  stepIdx,
}: {
  step: TradeoffStep
  chosenChoiceId: string | null
  onSelect: (choiceId: string) => void
  scenarioIdx: number
  stepIdx: number
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [chosenChoiceId])

  const handleSelect = useCallback(
    (choiceId: string) => {
      onSelect(choiceId)
      setOpen(false)
    },
    [onSelect],
  )

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const recommendedId = step.recommended

  return (
    <div className="step-dropdown-wrapper" ref={dropdownRef} data-testid={`step-dropdown-wrapper-${scenarioIdx}-${stepIdx}`}>
      <button
        className="step-dropdown-trigger"
        type="button"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={`step-dropdown-trigger-${scenarioIdx}-${stepIdx}`}
      >
        <span className="dropdown-chevron" data-testid={`dropdown-chevron-${scenarioIdx}-${stepIdx}`}>▼</span>
      </button>
      {open && (
        <ul className="step-dropdown-menu" role="listbox" data-testid={`step-dropdown-menu-${scenarioIdx}-${stepIdx}`}>
          {step.choices.map((choice) => {
            const isRecommended = recommendedId === choice.id
            const isSelected = chosenChoiceId === choice.id
            return (
              <li
                key={choice.id}
                role="option"
                aria-selected={isSelected}
                className={`dropdown-option${isSelected ? ' dropdown-option-selected' : ''}${isRecommended ? ' dropdown-option-recommended' : ''}`}
                onClick={() => handleSelect(choice.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(choice.id)
                  }
                }}
                tabIndex={0}
                data-testid={`dropdown-option-${scenarioIdx}-${stepIdx}-${choice.id}`}
              >
                <span className="dropdown-option-label">{choice.label}</span>
                {isRecommended && (
                  <span className="recommended-badge" data-testid={`recommended-badge-${scenarioIdx}-${stepIdx}-${choice.id}`} title="Recommended">
                    <Star size={12} style={{ fill: 'currentColor' }} />
                    <span style={{ display: 'none' }}>Recommended</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StepSection({
  step,
  chosenChoiceId,
  onChoiceSelect,
  onClear,
  onOpenDetails,
  scenarioIdx,
  stepIdx,
}: {
  step: TradeoffStep
  chosenChoiceId: string | null
  onChoiceSelect: (choiceId: string) => void
  onClear: () => void
  onOpenDetails: () => void
  scenarioIdx: number
  stepIdx: number
}) {
  const chosenChoice = step.choices.find((c) => c.id === chosenChoiceId) || null
  const isRecommended = chosenChoice && step.recommended === chosenChoiceId

  return (
    <div className={`step-section${chosenChoiceId ? '' : ' step-section-unselected'}`} data-testid={`step-section-${scenarioIdx}-${stepIdx}`}>
      <div className="step-header">
        <h4 className="step-title" data-testid={`step-title-${scenarioIdx}-${stepIdx}`}>
          {step.title}
        </h4>
        <FloatingDropdown
          step={step}
          chosenChoiceId={chosenChoiceId}
          onSelect={onChoiceSelect}
          scenarioIdx={scenarioIdx}
          stepIdx={stepIdx}
        />
      </div>
      <p className="step-description" data-testid={`step-description-${scenarioIdx}-${stepIdx}`}>
        {step.description}
      </p>

      <div
        className={`drop-zone${chosenChoice ? ' drop-zone-filled' : ''}`}
        data-testid={`drop-zone-${scenarioIdx}-${stepIdx}`}
      >
        {chosenChoice ? (
          <div className="drop-zone-content" data-testid={`drop-zone-content-${scenarioIdx}-${stepIdx}`}>
            <span className="drop-zone-label" data-testid={`drop-zone-label-${scenarioIdx}-${stepIdx}`}>
              {chosenChoice.label}
            </span>
            {isRecommended && (
              <span className="drop-zone-recommended-badge" data-testid={`drop-zone-recommended-badge-${scenarioIdx}-${stepIdx}`} title="Recommended">
                <Star size={12} style={{ fill: 'currentColor' }} />
                <span style={{ display: 'none' }}>Recommended</span>
              </span>
            )}
            <button
              className="drop-zone-info"
              onClick={onOpenDetails}
              data-testid={`drop-zone-info-${scenarioIdx}-${stepIdx}`}
              aria-label="View details"
              title="View details"
            >
              ⓘ
            </button>
            <button
              className="drop-zone-remove"
              onClick={onClear}
              data-testid={`drop-zone-remove-${scenarioIdx}-${stepIdx}`}
              aria-label="Remove choice"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="drop-zone-placeholder" data-testid={`drop-zone-placeholder-${scenarioIdx}-${stepIdx}`}>
            Select a choice from the dropdown
          </span>
        )}
      </div>
    </div>
  )
}

function DetailsModal({
  choice,
  step,
  onClose,
}: {
  choice: TradeoffChoice
  step: TradeoffStep
  onClose: () => void
}) {
  const isRecommended = step.recommended === choice.id

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="details-overlay"
          data-testid="details-overlay"
          onClick={onClose}
        />
        <Dialog.Content className="details-dialog" data-testid="details-dialog">
          <Dialog.Title className="details-dialog-title" data-testid="details-dialog-title">
            Choice Details
          </Dialog.Title>
          <Dialog.Description className="details-dialog-description">
            Detailed information about the selected choice.
          </Dialog.Description>
          <Dialog.Close
            className="details-dialog-close"
            data-testid="details-dialog-close"
          >
            ✕
          </Dialog.Close>

          <div className="details-header" data-testid="details-header">
            <h4 className="details-choice-label" data-testid="details-choice-label">
              {choice.label}
            </h4>
            {isRecommended && (
              <span className="details-recommended-badge" data-testid="details-recommended-badge" title="Recommended">
                <Star size={14} style={{ fill: 'currentColor' }} />
                <span style={{ display: 'none' }}>Recommended</span>
              </span>
            )}
            <p className="details-description" data-testid="details-description">
              {choice.description}
            </p>
          </div>

          {choice.pros.length > 0 && (
            <div className="details-section" data-testid="details-pros-section">
              <h5 className="details-section-title">Pros</h5>
              <ul className="details-pros" data-testid="details-pros">
                {choice.pros.map((pro, pIdx) => (
                  <li key={pIdx} className="details-pro-item" data-testid={`details-pro-${pIdx}`}>
                    <Check className="details-icon details-icon-pro" />
                    <div>
                      <span className="details-procon-title">{pro.title}</span>
                      {pro.description && (
                        <span className="details-procon-desc">{pro.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {choice.cons.length > 0 && (
            <div className="details-section" data-testid="details-cons-section">
              <h5 className="details-section-title">Cons</h5>
              <ul className="details-cons" data-testid="details-cons">
                {choice.cons.map((con, cIdx) => (
                  <li key={cIdx} className="details-con-item" data-testid={`details-con-${cIdx}`}>
                    <X className="details-icon details-icon-con" />
                    <div>
                      <span className="details-procon-title">{con.title}</span>
                      {con.description && (
                        <span className="details-procon-desc">{con.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isRecommended && choice.whyThisFits && (
            <div className="details-recommendation-box" data-testid="details-recommendation-box">
              <h5 className="details-rec-title">Why this fits</h5>
              <p className="details-rec-text" data-testid="details-rec-text">{choice.whyThisFits}</p>
            </div>
          )}

          {!isRecommended && choice.whenToUse && (
            <div className="details-alternative-box" data-testid="details-alternative-box">
              <h5 className="details-alt-title">Alternative / When to use</h5>
              <p className="details-alt-text" data-testid="details-alt-text">{choice.whenToUse}</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TradeoffSandboxSection({ title, scenarios }: TradeoffSandboxSectionProps) {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false)
  const scenarioDropdownRef = useRef<HTMLDivElement | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

  const [chosenIds, setChosenIds] = useState<Record<string, string>>({})

  const [detailsTarget, setDetailsTarget] = useState<{ stepId: string; choiceId: string } | null>(null)

  const scenario = scenarios[scenarioIdx]

  useEffect(() => {
    setChosenIds({})
    setDetailsTarget(null)
  }, [scenarioIdx])

  useEffect(() => {
    if (!scenarioDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (scenarioDropdownRef.current && !scenarioDropdownRef.current.contains(e.target as Node)) {
        setScenarioDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [scenarioDropdownOpen])

  const handleChoiceSelect = useCallback((stepId: string, choiceId: string) => {
    setChosenIds((prev) => {
      const current = prev[stepId]
      if (current === choiceId) {
        const next = { ...prev }
        delete next[stepId]
        return next
      }
      return { ...prev, [stepId]: choiceId }
    })
  }, [])

  const handleClearChoice = useCallback((stepId: string) => {
    setChosenIds((prev) => {
      const next = { ...prev }
      delete next[stepId]
      return next
    })
  }, [])

  const handleOpenDetails = useCallback((stepId: string, choiceId: string) => {
    setDetailsTarget({ stepId, choiceId })
  }, [])

  const handleCloseDetails = useCallback(() => {
    setDetailsTarget(null)
  }, [])

  const currentValues = useMemo(() => {
    const values: Record<string, number> = {}
    scenario.metrics.forEach((m) => {
      values[m.id] = m.baseValue
    })
    scenario.steps.forEach((step) => {
      const chosenId = chosenIds[step.id]
      if (chosenId) {
        const choice = step.choices.find((c) => c.id === chosenId)
        if (choice) {
          Object.entries(choice.metrics).forEach(([mid, delta]) => {
            values[mid] = (values[mid] ?? 0) + delta
          })
        }
      }
    })
    return values
  }, [scenario, chosenIds])

  const totalSteps = scenario.steps.length
  const placedCount = Object.keys(chosenIds).length

  let feedbackText = ''
  let feedbackState: 'empty' | 'partial' | 'complete' = 'empty'
  if (placedCount === 0) {
    feedbackText = 'Make your first choice to begin evaluating trade-offs.'
    feedbackState = 'empty'
  } else if (placedCount < totalSteps) {
    feedbackText = `${placedCount} of ${totalSteps} decisions made — review your metrics and continue.`
    feedbackState = 'partial'
  } else {
    feedbackText = 'All decisions made — review your final architecture trade-offs.'
    feedbackState = 'complete'
  }

  const detailsChoice = useMemo(() => {
    if (!detailsTarget) return null
    const step = scenario.steps.find((s) => s.id === detailsTarget.stepId)
    if (!step) return null
    const choice = step.choices.find((c) => c.id === detailsTarget.choiceId)
    if (!choice) return null
    return { choice, step }
  }, [detailsTarget, scenario])

  return (
    <div className="tradeoff-sandbox" data-testid="tradeoff-sandbox">
      {title && (
        <h3 className="tradeoff-sandbox-title" data-testid="tradeoff-sandbox-title">
          {title}
        </h3>
      )}

      {scenarios.length > 1 && (
        <div className="scenario-selector">
          <label htmlFor="scenario-select" className="scenario-label">
            Scenario:
          </label>
          <div className="scenario-dropdown" ref={scenarioDropdownRef} data-testid="scenario-dropdown">
            <button
              id="scenario-select"
              className="scenario-select"
              type="button"
              onClick={() => setScenarioDropdownOpen(!scenarioDropdownOpen)}
              data-testid="scenario-select"
              aria-haspopup="listbox"
              aria-expanded={scenarioDropdownOpen}
            >
              {scenario.title}
            </button>
            {scenarioDropdownOpen && (
              <ul className="scenario-options" role="listbox">
                {scenarios.map((s, idx) => (
                  <li
                    key={s.id}
                    className={`scenario-option${idx === scenarioIdx ? ' scenario-option-active' : ''}`}
                    role="option"
                    aria-selected={idx === scenarioIdx}
                    onClick={() => {
                      setScenarioIdx(idx)
                      setScenarioDropdownOpen(false)
                    }}
                  >
                    {s.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="scenario-banner" data-testid="scenario-banner">
        <p className="scenario-description">{scenario.description}</p>
      </div>

      <div className={`feedback-banner feedback-banner-${feedbackState}`} data-testid="feedback-banner">
        <span className="feedback-text" data-testid="feedback-text">{feedbackText}</span>
      </div>

      <Dialog.Root open={compareOpen} onOpenChange={setCompareOpen}>
        <Dialog.Trigger asChild>
          <button className="compare-all-button" data-testid="compare-all-button">
            Compare All
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay
            className="compare-overlay"
            data-testid="compare-overlay"
            onClick={() => setCompareOpen(false)}
          />
          <Dialog.Content className="compare-dialog" data-testid="compare-dialog">
            <Dialog.Title className="compare-dialog-title" data-testid="compare-dialog-title">
              Compare All Options
            </Dialog.Title>
            <Dialog.Description className="compare-dialog-description">
              Side-by-side comparison of all choices for this scenario.
            </Dialog.Description>
            <Dialog.Close
              className="compare-dialog-close"
              data-testid="compare-dialog-close"
            >
              ✕
            </Dialog.Close>

            <div className="compare-scenarios" data-testid="compare-scenarios">
              {scenario.steps.map((step, sIdx) => (
                <div key={step.id} className="compare-step" data-testid={`compare-step-${sIdx}`}>
                  <h5 className="compare-step-title" data-testid={`compare-step-title-${sIdx}`}>
                    {step.title}
                  </h5>
                  <div className="compare-grid" data-testid={`compare-grid-${sIdx}`}>
                    {step.choices.map((choice) => {
                      const isChosen = chosenIds[step.id] === choice.id
                      const isRecommended = step.recommended === choice.id
                      return (
                        <div
                          key={choice.id}
                          className={`compare-card${isChosen ? ' compare-card-chosen' : ''}${isRecommended ? ' compare-card-recommended' : ''}`}
                          data-testid={`compare-card-${sIdx}-${choice.id}`}
                        >
                          <div className="compare-card-header">
                            <span
                              className="compare-card-label"
                              data-testid={`compare-card-label-${sIdx}-${choice.id}`}
                            >
                              {choice.label}
                            </span>
                            {isRecommended && (
                              <span className="compare-recommended-badge" data-testid={`compare-recommended-badge-${sIdx}-${choice.id}`} title="Recommended">
                                <Star size={14} style={{ fill: 'currentColor' }} />
                                <span style={{ display: 'none' }}>Recommended</span>
                              </span>
                            )}
                            {isChosen && (
                              <span className="compare-badge" data-testid={`compare-badge-${sIdx}-${choice.id}`} title="Selected">
                                <Check size={14} strokeWidth={3} />
                                <span style={{ display: 'none' }}>Selected</span>
                              </span>
                            )}
                          </div>

                          {choice.pros.length > 0 && (
                            <ul className="compare-pros" data-testid={`compare-pros-${sIdx}-${choice.id}`}>
                              {choice.pros.map((pro, pIdx) => (
                                <li
                                  key={pIdx}
                                  className="compare-pro"
                                  data-testid={`compare-pro-${sIdx}-${choice.id}-${pIdx}`}
                                >
                                  <Check className="compare-icon compare-icon-pro" />
                                  <div className="compare-procon-content">
                                    <span className="compare-procon-title">{pro.title}</span>
                                    {pro.description && (
                                      <span className="compare-procon-desc">{pro.description}</span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          {choice.cons.length > 0 && (
                            <ul className="compare-cons" data-testid={`compare-cons-${sIdx}-${choice.id}`}>
                              {choice.cons.map((con, cIdx) => (
                                <li
                                  key={cIdx}
                                  className="compare-con"
                                  data-testid={`compare-con-${sIdx}-${choice.id}-${cIdx}`}
                                >
                                  <X className="compare-icon compare-icon-con" />
                                  <div className="compare-procon-content">
                                    <span className="compare-procon-title">{con.title}</span>
                                    {con.description && (
                                      <span className="compare-procon-desc">{con.description}</span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {detailsChoice && (
        <DetailsModal
          choice={detailsChoice.choice}
          step={detailsChoice.step}
          onClose={handleCloseDetails}
        />
      )}

      <div className="tradeoff-layout">
        <div className="metric-dashboard" data-testid="metric-dashboard">
          <div className="dashboard-header">
            <h4 className="dashboard-title">Metric Dashboard</h4>
            <span className="progress-indicator" data-testid="progress-indicator">
              {placedCount} / {totalSteps}
            </span>
          </div>
          <div className="metric-bars" data-testid="metric-bars">
            {scenario.metrics.map((metric) => (
              <MetricBar
                key={metric.id}
                metric={metric}
                value={currentValues[metric.id] ?? metric.baseValue}
                max={metric.max ?? 100}
              />
            ))}
          </div>
        </div>

        <div className="steps-panel" data-testid="steps-panel">
          {scenario.steps.map((step, sIdx) => (
            <StepSection
              key={step.id}
              step={step}
              chosenChoiceId={chosenIds[step.id] ?? null}
              onChoiceSelect={(choiceId: string) => handleChoiceSelect(step.id, choiceId)}
              onClear={() => handleClearChoice(step.id)}
              onOpenDetails={() => {
                const chosenId = chosenIds[step.id]
                if (chosenId) {
                  handleOpenDetails(step.id, chosenId)
                }
              }}
              scenarioIdx={scenarioIdx}
              stepIdx={sIdx}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

SectionRegistry.register('tradeoff-sandbox', TradeoffSandboxSection as ComponentType<unknown>)

export default TradeoffSandboxSection
