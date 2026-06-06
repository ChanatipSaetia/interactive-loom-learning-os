import { useState, useCallback, useEffect, useRef, useMemo, type ComponentType, type DragEvent as ReactDragEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, X } from 'lucide-react'
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
}

export interface TradeoffStep {
  id: string
  title: string
  description: string
  choices: TradeoffChoice[]
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

function ChoiceCard({
  choice,
  onClick,
  isPlaced,
  scenarioIdx,
  stepIdx,
}: {
  choice: TradeoffChoice
  onClick: (choiceId: string) => void
  isPlaced: boolean
  scenarioIdx: number
  stepIdx: number
}) {
  const handleDragStart = (e: ReactDragEvent<HTMLDivElement>) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', choice.id)
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  return (
    <div
      className={`choice-card${isPlaced ? ' choice-card-placed' : ''}`}
      draggable={!isPlaced}
      onDragStart={handleDragStart}
      onClick={() => !isPlaced && onClick(choice.id)}
      role={isPlaced ? undefined : 'button'}
      tabIndex={isPlaced ? -1 : 0}
      onKeyDown={(e) => {
        if (!isPlaced && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick(choice.id)
        }
      }}
      aria-disabled={isPlaced}
      data-testid={`choice-card-${scenarioIdx}-${stepIdx}-${choice.id}`}
    >
      <div className="choice-card-label" data-testid={`choice-card-label-${scenarioIdx}-${stepIdx}-${choice.id}`}>
        {choice.label}
      </div>
      <div className="choice-card-description">{choice.description}</div>
      {isPlaced && (
        <span className="choice-placed-badge" data-testid={`choice-placed-badge-${scenarioIdx}-${stepIdx}-${choice.id}`}>
          Placed
        </span>
      )}
    </div>
  )
}

function StepSection({
  step,
  chosenChoiceId,
  onDrop,
  onClickChoice,
  scenarioIdx,
  stepIdx,
}: {
  step: TradeoffStep
  chosenChoiceId: string | null
  onDrop: (choiceId: string) => void
  onClickChoice: (choiceId: string) => void
  scenarioIdx: number
  stepIdx: number
}) {
  const dropZoneRef = useRef<HTMLDivElement | null>(null)

  const handleDragOver = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }, [])

  const handleDrop = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const choiceId = e.dataTransfer.getData('text/plain')
      if (choiceId) {
        onDrop(choiceId)
      }
    },
    [onDrop],
  )

  const chosenChoice = step.choices.find((c) => c.id === chosenChoiceId) || null

  return (
    <div className={`step-section${chosenChoiceId ? '' : ' step-section-unselected'}`} data-testid={`step-section-${scenarioIdx}-${stepIdx}`}>
      <h4 className="step-title" data-testid={`step-title-${scenarioIdx}-${stepIdx}`}>
        {step.title}
      </h4>
      <p className="step-description" data-testid={`step-description-${scenarioIdx}-${stepIdx}`}>
        {step.description}
      </p>

      <div className="step-choices-tray" data-testid={`step-choices-tray-${scenarioIdx}-${stepIdx}`}>
        {step.choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            choice={choice}
            onClick={onClickChoice}
            isPlaced={choice.id === chosenChoiceId}
            scenarioIdx={scenarioIdx}
            stepIdx={stepIdx}
          />
        ))}
      </div>

      <div
        ref={dropZoneRef}
        className={`drop-zone${chosenChoice ? ' drop-zone-filled' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-testid={`drop-zone-${scenarioIdx}-${stepIdx}`}
      >
        {chosenChoice ? (
          <div className="drop-zone-content" data-testid={`drop-zone-content-${scenarioIdx}-${stepIdx}`}>
            <span className="drop-zone-label">{chosenChoice.label}</span>
            <button
              className="drop-zone-remove"
              onClick={() => onDrop('')}
              data-testid={`drop-zone-remove-${scenarioIdx}-${stepIdx}`}
              aria-label="Remove choice"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="drop-zone-placeholder" data-testid={`drop-zone-placeholder-${scenarioIdx}-${stepIdx}`}>
            Drag or click a choice here
          </span>
        )}
      </div>
    </div>
  )
}

function TradeoffSandboxSection({ title, scenarios }: TradeoffSandboxSectionProps) {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)

  const [chosenIds, setChosenIds] = useState<Record<string, string | null>>({})

  const scenario = scenarios[scenarioIdx]

  useEffect(() => {
    setChosenIds({})
  }, [scenarioIdx])

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

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

  const handleStepDrop = useCallback(
    (_stepId: string, choiceId: string) => {
      setChosenIds((prev) => {
        if (choiceId === '') {
          const next = { ...prev }
          delete next[_stepId]
          return next
        }
        return { ...prev, [_stepId]: choiceId }
      })
    },
    [],
  )

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
          <div className="scenario-dropdown" ref={dropdownRef} data-testid="scenario-dropdown">
            <button
              id="scenario-select"
              className="scenario-select"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              data-testid="scenario-select"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              {scenario.title}
            </button>
            {dropdownOpen && (
              <ul className="scenario-options" role="listbox">
                {scenarios.map((s, idx) => (
                  <li
                    key={s.id}
                    className={`scenario-option${idx === scenarioIdx ? ' scenario-option-active' : ''}`}
                    role="option"
                    aria-selected={idx === scenarioIdx}
                    onClick={() => {
                      setScenarioIdx(idx)
                      setDropdownOpen(false)
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
                      return (
                        <div
                          key={choice.id}
                          className={`compare-card${isChosen ? ' compare-card-chosen' : ''}`}
                          data-testid={`compare-card-${sIdx}-${choice.id}`}
                        >
                          <div className="compare-card-header">
                            <span
                              className="compare-card-label"
                              data-testid={`compare-card-label-${sIdx}-${choice.id}`}
                            >
                              {choice.label}
                            </span>
                            {isChosen && (
                              <span className="compare-badge" data-testid={`compare-badge-${sIdx}-${choice.id}`}>
                                Selected
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
                                  {pro.title}
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
                                  {con.title}
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
              onDrop={(choiceId: string) => handleStepDrop(step.id, choiceId)}
              onClickChoice={(choiceId: string) => handleChoiceSelect(step.id, choiceId)}
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
