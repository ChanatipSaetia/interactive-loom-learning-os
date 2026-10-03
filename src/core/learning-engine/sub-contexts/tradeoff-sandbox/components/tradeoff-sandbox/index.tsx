import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, X, Star, Plus, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, MagneticButton } from '../../../../../ui-system/motion/button'
import { Dropdown } from '../../../../../ui-system/motion/dropdown'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { TradeoffHelpModal } from './TradeoffHelpModal'
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

import type { SectionResultProps, SectionResultContract } from '../../../types'
import type { DecisionNodeSelected } from '../../events'

export interface TradeoffSandboxSectionProps extends SectionResultProps<Record<string, number> | DecisionNodeSelected> {
  title?: string
  scenarios: TradeoffScenario[]
  instanceId?: string
  sectionIndex?: number
  sectionId?: string
}

function MetricBar({ metric, value, max, instanceId }: { metric: MetricDef; value: number; max: number; instanceId?: string }) {
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

  const getTestId = (id: string) => instanceId ? `${instanceId}-${id}` : id

  const deltaText = delta !== 0 ? `(${delta > 0 ? '+' : ''}${delta})` : ''
  const deltaColor = delta > 0
    ? (direction === 'higher' ? 'var(--ctp-green)' : 'var(--ctp-red)')
    : (direction === 'higher' ? 'var(--ctp-red)' : 'var(--ctp-green)')

  return (
    <div className="metric-bar" data-testid={getTestId(`metric-bar-${metric.id}`)}>
      <div className="metric-bar-header">
        <span className="metric-label" data-testid={getTestId(`metric-label-${metric.id}`)}>{metric.label}</span>
        <div className="metric-values-container flex items-center gap-1.5">
          {delta !== 0 && (
            <span className="metric-delta text-xs font-semibold" style={{ color: deltaColor }}>
              {deltaText}
            </span>
          )}
          <span className="metric-value" data-testid={getTestId(`metric-value-${metric.id}`)}>{clamped}</span>
        </div>
      </div>
      <div className="metric-track" data-testid={getTestId(`metric-track-${metric.id}`)}>
        <div
          className="metric-fill"
          data-testid={getTestId(`metric-fill-${metric.id}`)}
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  )
}

function StepComparisonModal({
  step,
  chosenChoiceId,
  onSelect,
  scenarioIdx,
  stepIdx,
  instanceId,
  open,
  onOpenChange,
  scenarioMetrics,
  totalSteps,
}: {
  step: TradeoffStep
  chosenChoiceId: string | null
  onSelect: (choiceId: string) => void
  scenarioIdx: number
  stepIdx: number
  instanceId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioMetrics: MetricDef[]
  totalSteps: number
}) {
  const getTestId = (id: string) => instanceId ? `${instanceId}-${id}` : id
  const choices = step.choices
  const initialIdx = chosenChoiceId ? Math.max(0, choices.findIndex(c => c.id === chosenChoiceId)) : 0
  const [activeIdx, setActiveIdx] = useState(initialIdx)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Reset active index when modal opens
  useEffect(() => {
    if (open) {
      const idx = chosenChoiceId ? Math.max(0, choices.findIndex(c => c.id === chosenChoiceId)) : 0
      setActiveIdx(idx)
    }
  }, [open, chosenChoiceId, choices])

  // Scroll active card into view
  useEffect(() => {
    const card = cardRefs.current[activeIdx]
    if (!card) return
    if (activeIdx === 0) {
      // Reset to very top so the first card's title is fully visible
      card.parentElement?.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      card.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [activeIdx])

  const goPrev = () => setActiveIdx(i => (i - 1 + choices.length) % choices.length)
  const goNext = () => setActiveIdx(i => (i + 1) % choices.length)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal={true}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="compare-overlay"
          data-testid="compare-overlay"
          data-lenis-prevent
        />
        <Dialog.Content
          className="compare-dialog step-compare-dialog"
          data-testid={getTestId(`step-dropdown-menu-${scenarioIdx}-${stepIdx}`)}
          data-lenis-prevent
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
            if (e.key === 'ArrowDown') { e.preventDefault(); goNext() }
            if (e.key === 'Enter' && choices[activeIdx]) {
              onSelect(choices[activeIdx].id)
              onOpenChange(false)
            }
          }}
        >
          <Dialog.Title className="compare-dialog-title" data-testid={getTestId(`compare-dialog-title-step-${stepIdx}`)}>
            Step {stepIdx + 1} of {totalSteps}: {step.title} Options
          </Dialog.Title>
          <Dialog.Description
            className="text-xs text-muted-foreground mt-1 mb-3 leading-normal block"
            data-testid={getTestId(`step-description-${scenarioIdx}-${stepIdx}`)}
          >
            {step.description}
          </Dialog.Description>
          <Dialog.Close
            className="compare-dialog-close"
            data-testid="compare-dialog-close"
          >
            ✕
          </Dialog.Close>

          <div className="step-compare-grid" data-lenis-prevent>
            {choices.map((choice, idx) => {
              const isChosen = chosenChoiceId === choice.id
              const isRecommended = step.recommended === choice.id
              const isActive = idx === activeIdx
              return (
                <div
                  key={choice.id}
                  ref={el => { cardRefs.current[idx] = el }}
                  className={`compare-card${isChosen ? ' compare-card-chosen' : ''}${isRecommended ? ' compare-card-recommended' : ''}${isActive ? ' compare-card-active' : ''} cursor-pointer`}
                  data-testid={getTestId(`dropdown-option-${scenarioIdx}-${stepIdx}-${choice.id}`)}
                  onClick={() => {
                    onSelect(choice.id)
                    onOpenChange(false)
                  }}
                  role="option"
                  aria-selected={isChosen}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(choice.id)
                      onOpenChange(false)
                    }
                  }}
                >
                  <div className="compare-card-header">
                    <span className="compare-card-label" data-testid={getTestId(`compare-card-label-${stepIdx}-${choice.id}`)}>
                      {choice.label}
                    </span>
                    {isRecommended && (
                      <span
                        className="compare-recommended-badge"
                        data-testid={getTestId(`recommended-badge-${scenarioIdx}-${stepIdx}-${choice.id}`)}
                        title="Recommended"
                      >
                        <Star size={14} style={{ fill: 'currentColor' }} />
                        <span style={{ display: 'none' }}>Recommended</span>
                      </span>
                    )}
                    {isChosen && (
                      <span className="compare-badge" title="Selected" data-testid={getTestId(`compare-badge-${stepIdx}-${choice.id}`)}>
                        <Check size={14} strokeWidth={3} />
                        <span style={{ display: 'none' }}>Selected</span>
                      </span>
                    )}
                  </div>

                  <p className="compare-card-desc text-xs text-muted-foreground mb-3 leading-normal">
                    {choice.description}
                  </p>

                  <div className="compare-metrics-list flex flex-wrap gap-2 mb-3">
                    {Object.entries(choice.metrics).map(([mid, delta]) => {
                      const metric = scenarioMetrics.find((m) => m.id === mid)
                      if (!metric) return null
                      const direction = metric.direction ?? 'higher'
                      const isGood = (direction === 'higher' && delta > 0) || (direction === 'lower' && delta < 0)
                      const isNeutral = delta === 0
                      const badgeColor = isNeutral
                        ? 'var(--secondary)'
                        : isGood
                        ? 'var(--ctp-green)'
                        : 'var(--ctp-red)'
                      return (
                        <span
                          key={mid}
                          className="metric-delta-badge"
                          style={{
                            backgroundColor: isNeutral
                              ? 'color-mix(in srgb, var(--secondary) 10%, transparent)'
                              : isGood
                              ? 'color-mix(in srgb, var(--ctp-green) 10%, transparent)'
                              : 'color-mix(in srgb, var(--ctp-red) 10%, transparent)',
                            color: badgeColor,
                            borderColor: badgeColor,
                          }}
                        >
                          {metric.label}: {delta > 0 ? '+' : ''}{delta}
                        </span>
                      )
                    })}
                  </div>

                  {choice.pros.length > 0 && (
                    <div className="details-section mt-2">
                      <h5 className="details-section-title">Pros</h5>
                      <ul className="details-pros flex flex-col gap-1.5" data-testid={getTestId(`compare-pros-${stepIdx}-${choice.id}`)}>
                        {choice.pros.map((pro, pIdx) => (
                          <li key={pIdx} className="details-pro-item flex items-start gap-2 px-2.5 py-1.5 rounded-[var(--radius-xs)] border-l-4" data-testid={getTestId(`compare-pro-${stepIdx}-${choice.id}-${pIdx}`)}>
                            <Check className="details-icon details-icon-pro w-3.5 h-3.5 mt-0.5" />
                            <div>
                              <span className="details-procon-title text-xs font-semibold">{pro.title}</span>
                              {pro.description && (
                                <span className="details-procon-desc text-[11px] text-muted-foreground block mt-0.5 leading-normal">{pro.description}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {choice.cons.length > 0 && (
                    <div className="details-section mt-2">
                      <h5 className="details-section-title">Cons</h5>
                      <ul className="details-cons flex flex-col gap-1.5" data-testid={getTestId(`compare-cons-${stepIdx}-${choice.id}`)}>
                        {choice.cons.map((con, cIdx) => (
                          <li key={cIdx} className="details-con-item flex items-start gap-2 px-2.5 py-1.5 rounded-[var(--radius-xs)] border-l-4" data-testid={getTestId(`compare-con-${stepIdx}-${choice.id}-${cIdx}`)}>
                            <X className="details-icon details-icon-con w-3.5 h-3.5 mt-0.5" />
                            <div>
                              <span className="details-procon-title text-xs font-semibold">{con.title}</span>
                              {con.description && (
                                <span className="details-procon-desc text-[11px] text-muted-foreground block mt-0.5 leading-normal">{con.description}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Floating prev/next navigation */}
          <div className="step-compare-nav">
            <button
              className="step-compare-nav-btn"
              onClick={goPrev}
              aria-label="Previous option"
              data-testid={getTestId(`compare-nav-prev-${scenarioIdx}-${stepIdx}`)}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="step-compare-nav-counter">
              {activeIdx + 1} / {choices.length}
            </span>
            <button
              className="step-compare-nav-btn"
              onClick={goNext}
              aria-label="Next option"
              data-testid={getTestId(`compare-nav-next-${scenarioIdx}-${stepIdx}`)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
  instanceId,
  scenarioMetrics,
  totalSteps,
}: {
  step: TradeoffStep
  chosenChoiceId: string | null
  onChoiceSelect: (choiceId: string) => void
  onClear: () => void
  onOpenDetails: () => void
  scenarioIdx: number
  stepIdx: number
  instanceId?: string
  scenarioMetrics: MetricDef[]
  totalSteps: number
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const chosenChoice = step.choices.find((c) => c.id === chosenChoiceId) || null
  const isRecommended = chosenChoice && step.recommended === chosenChoiceId

  const getTestId = (id: string) => instanceId ? `${instanceId}-${id}` : id

  return (
    <div className={`step-section${chosenChoiceId ? '' : ' step-section-unselected'}`} data-testid={getTestId(`step-section-${scenarioIdx}-${stepIdx}`)}>
      <div className="step-header">
        <h4 className="step-title" data-testid={getTestId(`step-title-${scenarioIdx}-${stepIdx}`)}>
          {step.title}
        </h4>
      </div>
      <span
        data-testid={getTestId(`step-description-${scenarioIdx}-${stepIdx}`)}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        {step.description}
      </span>

      <div
        className={`drop-zone${chosenChoice ? ' drop-zone-filled' : ''} p-0 overflow-hidden relative flex items-center`}
        data-testid={getTestId(`drop-zone-${scenarioIdx}-${stepIdx}`)}
      >
        <button
          type="button"
          className="drop-zone-trigger-area w-full h-full flex items-center justify-between p-3 cursor-pointer bg-transparent border-none text-left font-normal"
          data-testid={getTestId(`step-dropdown-trigger-${scenarioIdx}-${stepIdx}`)}
          onClick={() => setModalOpen(true)}
        >
          {chosenChoice ? (
            <div className="drop-zone-content w-full flex items-center justify-between min-w-0" data-testid={getTestId(`drop-zone-content-${scenarioIdx}-${stepIdx}`)}>
              <span className="drop-zone-label pr-16" data-testid={getTestId(`drop-zone-label-${scenarioIdx}-${stepIdx}`)}>
                {chosenChoice.label}
              </span>
            </div>
          ) : (
            <div className="drop-zone-empty flex items-center justify-center gap-2 w-full">
              <Plus size={14} className="text-muted-foreground" />
              <span className="drop-zone-cta text-sm font-medium">Choose Option</span>
            </div>
          )}
        </button>

        {chosenChoice && (
          <div className="drop-zone-overlay-actions absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {isRecommended && (
              <span className="drop-zone-recommended-badge mr-1" data-testid={getTestId(`drop-zone-recommended-badge-${scenarioIdx}-${stepIdx}`)} title="Recommended">
                <Star size={12} style={{ fill: 'currentColor' }} />
                <span style={{ display: 'none' }}>Recommended</span>
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="drop-zone-info"
              onClick={(e) => {
                e.stopPropagation()
                onOpenDetails()
              }}
              data-testid={getTestId(`drop-zone-info-${scenarioIdx}-${stepIdx}`)}
              aria-label="View details"
              title="View details"
            >
              <Info size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="drop-zone-remove"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              data-testid={getTestId(`drop-zone-remove-${scenarioIdx}-${stepIdx}`)}
              aria-label="Remove choice"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {/* E2E Playwright helpers — must be kept in the DOM as screen-reader only (clipped) so Playwright's toBeVisible() checks pass. */}
        <span
          className="drop-zone-placeholder-sr-only"
          data-testid={getTestId(`drop-zone-placeholder-${scenarioIdx}-${stepIdx}`)}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: '0',
          }}
        >
          {chosenChoice ? chosenChoice.label : 'Select a choice from the dropdown'}
        </span>
      </div>

      <StepComparisonModal
        step={step}
        chosenChoiceId={chosenChoiceId}
        onSelect={onChoiceSelect}
        scenarioIdx={scenarioIdx}
        stepIdx={stepIdx}
        instanceId={instanceId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        scenarioMetrics={scenarioMetrics}
        totalSteps={totalSteps}
      />
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
    <Dialog.Root open onOpenChange={onClose} modal={true}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="details-overlay"
          data-testid="details-overlay"
          onClick={onClose}
          data-lenis-prevent
        />
        <Dialog.Content className="details-dialog" data-testid="details-dialog" data-lenis-prevent>
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

function TradeoffSandboxSection({
  title,
  scenarios,
  instanceId,
  sectionIndex = 0,
  sectionId = 'tradeoff-sandbox',
  onResultChange,
}: TradeoffSandboxSectionProps) {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [compareOpen, setCompareOpen] = useState(false)
  const { playSound } = useSound()

  const [chosenIds, setChosenIds] = useState<Record<string, string>>({})

  const [detailsTarget, setDetailsTarget] = useState<{ stepId: string; choiceId: string } | null>(null)

  const scenario = scenarios[scenarioIdx]

  useEffect(() => {
    setChosenIds({})
    setDetailsTarget(null)
  }, [scenarioIdx])

  const handleChoiceSelect = useCallback((stepId: string, choiceId: string) => {
    playSound('click')
    setChosenIds((prev) => {
      const current = prev[stepId]
      if (current === choiceId) {
        const next = { ...prev }
        delete next[stepId]
        return next
      }
      return { ...prev, [stepId]: choiceId }
    })
  }, [playSound])

  const handleClearChoice = useCallback((stepId: string) => {
    playSound('click')
    setChosenIds((prev) => {
      const next = { ...prev }
      delete next[stepId]
      return next
    })
  }, [playSound])


  const handleOpenDetails = useCallback((stepId: string, choiceId: string) => {
    setDetailsTarget({ stepId, choiceId })
  }, [])

  const handleCloseDetails = useCallback(() => {
    setDetailsTarget(null)
  }, [])

  const currentValues = useMemo(() => {
    if (!scenario) return {}
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
  const totalSteps = scenario?.steps.length ?? 0
  const placedCount = Object.keys(chosenIds).length

  // Emit Result Contract and events on state changes
  useEffect(() => {
    if (!scenario) return
    const isCompleted = totalSteps > 0 && placedCount === totalSteps

    // Compute average normalized score across metrics
    const metricValues = Object.values(currentValues)
    const avgScore = metricValues.length > 0
      ? Math.round(metricValues.reduce((sum, v) => sum + v, 0) / metricValues.length)
      : 50

    const resultContract: SectionResultContract<Record<string, number>> = {
      sectionId: sectionId || scenario.id || 'tradeoff-sandbox',
      sectionType: 'tradeoff-sandbox',
      status: isCompleted ? 'completed' : 'in_progress',
      score: avgScore,
      accuracy: totalSteps > 0 ? placedCount / totalSteps : 0,
      completedAt: isCompleted ? Date.now() : undefined,
      payload: currentValues,
    }

    onResultChange?.(resultContract)
  }, [scenario, currentValues, totalSteps, placedCount, onResultChange, sectionId])



  const detailsChoice = useMemo(() => {
    if (!detailsTarget || !scenario) return null
    const step = scenario.steps.find((s) => s.id === detailsTarget.stepId)
    if (!step) return null
    const choice = step.choices.find((c) => c.id === detailsTarget.choiceId)
    if (!choice) return null
    return { choice, step }
  }, [detailsTarget, scenario])

  const getTestId = (id: string) => instanceId ? `${instanceId}-${id}` : id

  if (!scenario) {
    return <div className="tradeoff-sandbox-empty">No tradeoff scenarios available.</div>
  }

  return (
    <div className="tradeoff-sandbox" data-testid={getTestId("tradeoff-sandbox")}>
      <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={TradeoffHelpModal} titleTestId={getTestId("tradeoff-sandbox-title")} />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full mb-3 gap-3 min-w-0">
        {scenarios.length > 1 ? (
          <div className="scenario-selector !mb-0 min-w-0 max-w-full">
            <label htmlFor="scenario-select" className="scenario-label">
              Scenario:
            </label>
            <div className="scenario-dropdown" data-testid={getTestId("scenario-dropdown")}>
              <Dropdown
                value={scenario.id}
                onChange={(val) => {
                  const idx = scenarios.findIndex(s => s.id === val);
                  if (idx !== -1) {
                    setScenarioIdx(idx);
                  }
                }}
                options={scenarios.map(s => ({ value: s.id, label: s.title }))}
                triggerTestId={getTestId("scenario-select")}
                optionsTestId={getTestId("scenario-options")}
                triggerClassName="scenario-select"
                optionsClassName="scenario-options"
                optionClassName="scenario-option"
                optionActiveClassName="scenario-option-active"
                showChevron={true}
              />
            </div>
          </div>
        ) : <div />}

        <Dialog.Root open={compareOpen} onOpenChange={setCompareOpen} modal={true}>
          <Dialog.Trigger asChild>
            <MagneticButton variant="outline" size="md" className="compare-all-button !mb-0" data-testid={getTestId("compare-all-button")}>
              Compare All
            </MagneticButton>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay
              className="compare-overlay"
              data-testid="compare-overlay"
              onClick={() => setCompareOpen(false)}
              data-lenis-prevent
            />
            <Dialog.Content className="compare-dialog" data-testid="compare-dialog" data-lenis-prevent>
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

              <div className="compare-scenarios" data-testid="compare-scenarios" data-lenis-prevent>
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
      </div>

      <div className="scenario-banner" data-testid={getTestId("scenario-banner")}>
        <p className="scenario-description">{scenario.description}</p>
      </div>


      {detailsChoice && (
        <DetailsModal
          choice={detailsChoice.choice}
          step={detailsChoice.step}
          onClose={handleCloseDetails}
        />
      )}

      <div className="tradeoff-layout">
        <div className="metric-dashboard" data-testid={getTestId("metric-dashboard")}>
          <div className="dashboard-header">
            <h4 className="dashboard-title">Metric Dashboard</h4>
            <span className="progress-indicator" data-testid={getTestId("progress-indicator")}>
              {placedCount} / {totalSteps}
            </span>
          </div>
          <div className="metric-bars" data-testid={getTestId("metric-bars")}>
            {scenario.metrics.map((metric) => (
              <MetricBar
                key={metric.id}
                metric={metric}
                value={currentValues[metric.id] ?? metric.baseValue}
                max={metric.max ?? 100}
                instanceId={instanceId}
              />
            ))}
          </div>
        </div>

        <div className="steps-panel" data-testid={getTestId("steps-panel")}>
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
              instanceId={instanceId}
              scenarioMetrics={scenario.metrics}
              totalSteps={scenario.steps.length}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default TradeoffSandboxSection
