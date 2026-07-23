import { useState, useCallback } from 'react'
import { Sliders, ListChecks, Plus, Trash2, ThumbsUp, ThumbsDown, HelpCircle, Compass, Star, Binary, ChevronDown, ChevronRight } from 'lucide-react'
import { TradeoffHelpModal } from '../../../sections/tradeoff-sandbox/TradeoffHelpModal'
import type { OKFTradeoffSectionData } from '../../../core/okf/types'
import type { TradeoffScenario, TradeoffStep, TradeoffChoice, MetricDef, TradeoffProCon } from '../../../sections/tradeoff-sandbox'

interface TradeoffSandboxFormEditorProps {
  data: OKFTradeoffSectionData
  onChange: (data: OKFTradeoffSectionData) => void
}

/* --- Metric Editor (shared across scenarios) --- */

function MetricEditor({
  metric,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  metric: MetricDef
  index: number
  onChange: (metric: MetricDef) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof MetricDef, value: string | number | undefined) => {
      onChange({ ...metric, [field]: value })
    },
    [metric, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`to-metric-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Binary size={13} /> Metric #{index + 1}: <code className="card-code-pill">{metric.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`to-metric-remove-${index}`}
            type="button"
            title="Remove metric"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">ID</span>
              <input
                className="visual-form-input"
                value={metric.id}
                onChange={(e) => handleFieldChange('id', e.target.value)}
                data-testid={`to-metric-${index}-id`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Label</span>
              <input
                className="visual-form-input"
                value={metric.label}
                onChange={(e) => handleFieldChange('label', e.target.value)}
                data-testid={`to-metric-${index}-label`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-grid-3">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Base Value</span>
              <input
                className="visual-form-input"
                type="number"
                value={metric.baseValue}
                onChange={(e) => handleFieldChange('baseValue', parseFloat(e.target.value) || 0)}
                data-testid={`to-metric-${index}-baseValue`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Min</span>
              <input
                className="visual-form-input"
                type="number"
                value={metric.min ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  handleFieldChange('min', v !== '' ? parseFloat(v) : undefined)
                }}
                placeholder="optional"
                data-testid={`to-metric-${index}-min`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Max</span>
              <input
                className="visual-form-input"
                type="number"
                value={metric.max ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  handleFieldChange('max', v !== '' ? parseFloat(v) : undefined)
                }}
                placeholder="optional"
                data-testid={`to-metric-${index}-max`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Direction</span>
            <select
              className="visual-form-select"
              value={metric.direction ?? 'higher'}
              onChange={(e) => handleFieldChange('direction', e.target.value as 'higher' | 'lower')}
              data-testid={`to-metric-${index}-direction`}
            >
              <option value="higher">Higher is Better</option>
              <option value="lower">Lower is Better</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}

/* --- Pro/Con Editor --- */

function ProConEditor({
  item,
  index,
  type,
  onChange,
  onRemove,
}: {
  item: TradeoffProCon
  index: number
  type: 'pro' | 'con'
  onChange: (item: TradeoffProCon) => void
  onRemove: () => void
}) {
  const isPro = type === 'pro'

  return (
    <div className="visual-form-card visual-form-card--sub" data-testid={`to-pc-${type}-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title" style={{ color: isPro ? 'var(--ctp-green)' : 'var(--ctp-red)' }}>
          {isPro ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
          {isPro ? 'Pro' : 'Con'} #{index + 1}
        </span>
        <button
          className="form-remove-btn"
          onClick={onRemove}
          data-testid={`to-pc-remove-${type}-${index}`}
          type="button"
          title={`Remove ${type}`}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Title</span>
            <input
              className="visual-form-input"
              value={item.title}
              onChange={(e) => onChange({ ...item, title: e.target.value })}
              data-testid={`to-pc-${type}-${index}-title`}
            />
          </label>
        </div>
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Description</span>
            <textarea
              className="visual-form-textarea"
              value={item.description}
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              rows={2}
              data-testid={`to-pc-${type}-${index}-description`}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

/* --- Choice Editor --- */

function ChoiceEditor({
  choice,
  index,
  metrics,
  onChange,
  onRemove,
  canRemove,
}: {
  choice: TradeoffChoice
  index: number
  metrics: MetricDef[]
  onChange: (choice: TradeoffChoice) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleProChange = useCallback(
    (i: number, item: TradeoffProCon) => {
      const updated = [...choice.pros]
      updated[i] = item
      onChange({ ...choice, pros: updated })
    },
    [choice, onChange]
  )

  const handleConChange = useCallback(
    (i: number, item: TradeoffProCon) => {
      const updated = [...choice.cons]
      updated[i] = item
      onChange({ ...choice, cons: updated })
    },
    [choice, onChange]
  )

  const handleMetricDeltaChange = useCallback(
    (metricId: string, value: string) => {
      const updated = { ...choice.metrics }
      updated[metricId] = parseFloat(value) || 0
      onChange({ ...choice, metrics: updated })
    },
    [choice, onChange]
  )

  return (
    <div className="visual-form-card visual-form-card--sub" data-testid={`to-choice-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title" style={{ fontSize: '18px' }}>
          <ListChecks size={18} /> Choice #{index + 1}: <code className="card-code-pill">{choice.label || choice.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`to-choice-remove-${index}`}
            type="button"
            title="Remove choice"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">ID</span>
              <input
                className="visual-form-input"
                value={choice.id}
                onChange={(e) => onChange({ ...choice, id: e.target.value })}
                data-testid={`to-choice-${index}-id`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Label</span>
              <input
                className="visual-form-input"
                value={choice.label}
                onChange={(e) => onChange({ ...choice, label: e.target.value })}
                data-testid={`to-choice-${index}-label`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Description</span>
            <textarea
              className="visual-form-textarea"
              value={choice.description}
              onChange={(e) => onChange({ ...choice, description: e.target.value })}
              rows={2}
              data-testid={`to-choice-${index}-description`}
            />
          </label>
        </div>

        {/* Metric Deltas */}
        {metrics.length > 0 && (
          <div className="visual-form-field">
            <span className="visual-form-key">Metric Deltas</span>
            <div className="visual-form-grid-2">
              {metrics.map((m) => (
                <div key={m.id} className="visual-form-field">
                  <label className="visual-form-label">
                    <span className="visual-form-key">{m.label}</span>
                    <input
                      className="visual-form-input"
                      type="number"
                      value={choice.metrics[m.id] ?? 0}
                      onChange={(e) => handleMetricDeltaChange(m.id, e.target.value)}
                      data-testid={`to-choice-${index}-metric-${m.id}`}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why This Fits */}
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Why This Fits (optional)</span>
            <textarea
              className="visual-form-textarea"
              value={choice.whyThisFits ?? ''}
              onChange={(e) => onChange({ ...choice, whyThisFits: e.target.value || undefined })}
              rows={2}
              placeholder="Explanation for why this choice fits the scenario best"
              data-testid={`to-choice-${index}-whyThisFits`}
            />
          </label>
        </div>

        {/* When To Use */}
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">When To Use (optional)</span>
            <textarea
              className="visual-form-textarea"
              value={choice.whenToUse ?? ''}
              onChange={(e) => onChange({ ...choice, whenToUse: e.target.value || undefined })}
              rows={2}
              placeholder="When this alternative should be considered"
              data-testid={`to-choice-${index}-whenToUse`}
            />
          </label>
        </div>

        {/* Pros & Cons */}
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <div className="visual-form-section-header">
              <span className="visual-form-key" style={{ color: 'var(--ctp-green)' }}>Pros ({choice.pros.length})</span>
              <button
                className="form-add-btn form-add-btn--sm"
                onClick={() => {
                  onChange({
                    ...choice,
                    pros: [...choice.pros, { title: '', description: '' }],
                  })
                }}
                data-testid={`to-choice-${index}-add-pro`}
                type="button"
              >
                <Plus size={11} /> Add Pro
              </button>
            </div>
            <div className="visual-form-object-list">
              {choice.pros.map((pro, i) => (
                <ProConEditor
                  key={i}
                  item={pro}
                  index={i}
                  type="pro"
                  onChange={(updated) => handleProChange(i, updated)}
                  onRemove={() => {
                    const updated = [...choice.pros]
                    updated.splice(i, 1)
                    onChange({ ...choice, pros: updated })
                  }}
                />
              ))}
            </div>
          </div>

          <div className="visual-form-field">
            <div className="visual-form-section-header">
              <span className="visual-form-key" style={{ color: 'var(--ctp-red)' }}>Cons ({choice.cons.length})</span>
              <button
                className="form-add-btn form-add-btn--sm"
                onClick={() => {
                  onChange({
                    ...choice,
                    cons: [...choice.cons, { title: '', description: '' }],
                  })
                }}
                data-testid={`to-choice-${index}-add-con`}
                type="button"
              >
                <Plus size={11} /> Add Con
              </button>
            </div>
            <div className="visual-form-object-list">
              {choice.cons.map((con, i) => (
                <ProConEditor
                  key={i}
                  item={con}
                  index={i}
                  type="con"
                  onChange={(updated) => handleConChange(i, updated)}
                  onRemove={() => {
                    const updated = [...choice.cons]
                    updated.splice(i, 1)
                    onChange({ ...choice, cons: updated })
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- Step Editor --- */

function StepEditor({
  step,
  index,
  metrics,
  onChange,
  onRemove,
  canRemove,
}: {
  step: TradeoffStep
  index: number
  metrics: MetricDef[]
  onChange: (step: TradeoffStep) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleChoiceChange = useCallback(
    (ci: number, updatedChoice: TradeoffChoice) => {
      const updated = [...step.choices]
      updated[ci] = updatedChoice
      onChange({ ...step, choices: updated })
    },
    [step, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`to-step-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title" style={{ fontSize: '20px' }}>
          <ListChecks size={20} /> Step #{index + 1}: <code className="card-code-pill">{step.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`to-step-remove-${index}`}
            type="button"
            title="Remove step"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">ID</span>
              <input
                className="visual-form-input"
                value={step.id}
                onChange={(e) => onChange({ ...step, id: e.target.value })}
                data-testid={`to-step-${index}-id`}
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Title</span>
              <input
                className="visual-form-input"
                value={step.title}
                onChange={(e) => onChange({ ...step, title: e.target.value })}
                data-testid={`to-step-${index}-title`}
              />
            </label>
          </div>
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Description</span>
            <textarea
              className="visual-form-textarea"
              value={step.description}
              onChange={(e) => onChange({ ...step, description: e.target.value })}
              rows={2}
              data-testid={`to-step-${index}-description`}
            />
          </label>
        </div>

        {/* Recommended Choice */}
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Star size={12} style={{ color: 'var(--ctp-yellow)' }} /> Recommended Choice (optional)
            </span>
            <select
              className="visual-form-select"
              value={step.recommended ?? ''}
              onChange={(e) => onChange({ ...step, recommended: e.target.value || undefined })}
              data-testid={`to-step-${index}-recommended`}
            >
              <option value="">(none)</option>
              {step.choices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.label || c.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Choices */}
        <div className="visual-form-field visual-form-field--array">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Choices ({step.choices.length})</span>
            <button
              className="form-add-btn form-add-btn--sm"
              onClick={() => {
                const metricDeltas: Record<string, number> = {}
                metrics.forEach((m) => { metricDeltas[m.id] = 0 })
                onChange({
                  ...step,
                  choices: [
                    ...step.choices,
                    {
                      id: `c${step.choices.length + 1}`,
                      label: '',
                      description: '',
                      metrics: metricDeltas,
                      pros: [],
                      cons: [],
                    },
                  ],
                })
              }}
              data-testid={`to-step-${index}-add-choice`}
              type="button"
            >
              <Plus size={12} /> Add Choice
            </button>
          </div>
          <div className="visual-form-object-list">
            {step.choices.map((choice, ci) => (
              <ChoiceEditor
                key={choice.id || ci}
                choice={choice}
                index={ci}
                metrics={metrics}
                onChange={(updated) => handleChoiceChange(ci, updated)}
                onRemove={() => {
                  const updated = step.choices.filter((_, j) => j !== ci)
                  onChange({ ...step, choices: updated })
                }}
                canRemove={step.choices.length > 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* --- Scenario Editor (collapsible, default closed) --- */

function ScenarioEditor({
  scenario,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  scenario: TradeoffScenario
  index: number
  onChange: (scenario: TradeoffScenario) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const handleStepChange = useCallback(
    (si: number, updatedStep: TradeoffStep) => {
      const updated = [...scenario.steps]
      updated[si] = updatedStep
      onChange({ ...scenario, steps: updated })
    },
    [scenario, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`to-scenario-${index}`}>
      <div
        className="visual-form-card-header collapsible-header"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v) } }}
        data-testid={`to-scenario-${index}-toggle`}
      >
        <span className="card-header-title">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Sliders size={14} /> Scenario #{index + 1}: <code className="card-code-pill">{scenario.title || scenario.id}</code>
          <span style={{ fontSize: '11px', color: 'var(--ctp-subtext2)', fontWeight: 400, marginLeft: '6px' }}>
            {scenario.metrics.length} metrics · {scenario.steps.length} steps
          </span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {canRemove && (
            <button
              className="form-remove-btn"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              data-testid={`to-scenario-remove-${index}`}
              type="button"
              title="Remove scenario"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="visual-form-card-body">
          <div className="visual-form-grid-2">
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">ID</span>
                <input
                  className="visual-form-input"
                  value={scenario.id}
                  onChange={(e) => onChange({ ...scenario, id: e.target.value })}
                  data-testid={`to-scenario-${index}-id`}
                />
              </label>
            </div>
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Title</span>
                <input
                  className="visual-form-input"
                  value={scenario.title}
                  onChange={(e) => onChange({ ...scenario, title: e.target.value })}
                  data-testid={`to-scenario-${index}-title`}
                />
              </label>
            </div>
          </div>

          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Description</span>
              <textarea
                className="visual-form-textarea"
                value={scenario.description}
                onChange={(e) => onChange({ ...scenario, description: e.target.value })}
                rows={2}
                data-testid={`to-scenario-${index}-description`}
              />
            </label>
          </div>

          {/* Steps */}
          <div className="visual-form-field visual-form-field--array">
            <div className="visual-form-section-header">
              <span className="visual-form-key">Steps ({scenario.steps.length})</span>
              <button
                className="form-add-btn form-add-btn--sm"
                onClick={() => {
                  const metricDeltas: Record<string, number> = {}
                  scenario.metrics.forEach((m) => { metricDeltas[m.id] = 0 })
                  onChange({
                    ...scenario,
                    steps: [
                      ...scenario.steps,
                      {
                        id: `s${scenario.steps.length + 1}`,
                        title: '',
                        description: '',
                        choices: [
                          {
                            id: `c1`,
                            label: '',
                            description: '',
                            metrics: { ...metricDeltas },
                            pros: [],
                            cons: [],
                          },
                          {
                            id: `c2`,
                            label: '',
                            description: '',
                            metrics: { ...metricDeltas },
                            pros: [],
                            cons: [],
                          },
                        ],
                      },
                    ],
                  })
                }}
                data-testid={`to-scenario-${index}-add-step`}
                type="button"
              >
                <Plus size={12} /> Add Step
              </button>
            </div>
            <div className="visual-form-object-list">
              {scenario.steps.map((step, si) => (
                <StepEditor
                  key={step.id || si}
                  step={step}
                  index={si}
                  metrics={scenario.metrics}
                  onChange={(updated) => handleStepChange(si, updated)}
                  onRemove={() => {
                    const updated = scenario.steps.filter((_, j) => j !== si)
                    onChange({ ...scenario, steps: updated })
                  }}
                  canRemove={scenario.steps.length > 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* --- Main Editor --- */

type TradeoffSubTab = 'scenarios' | 'metrics'

export function TradeoffSandboxFormEditor({ data, onChange }: TradeoffSandboxFormEditorProps) {
  const [activeTab, setActiveTab] = useState<TradeoffSubTab>('scenarios')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  /* Collect all unique metrics across all scenarios (for overview tab) */
  const allMetrics = data.scenarios.flatMap((s) => s.metrics)

  const handleScenarioChange = useCallback(
    (si: number, updatedScenario: TradeoffScenario) => {
      const updated = [...data.scenarios]
      updated[si] = updatedScenario
      onChange({ ...data, scenarios: updated })
    },
    [data, onChange]
  )

  const handleRemoveScenario = useCallback(
    (si: number) => {
      const updated = data.scenarios.filter((_, i) => i !== si)
      onChange({ ...data, scenarios: updated })
    },
    [data, onChange]
  )

  const handleAddScenario = useCallback(() => {
    const newScenario: TradeoffScenario = {
      id: `s${data.scenarios.length + 1}`,
      title: '',
      description: '',
      metrics: [],
      steps: [],
    }
    onChange({ ...data, scenarios: [...data.scenarios, newScenario] })
  }, [data, onChange])

  /* --- Per-scenario metric handlers --- */
  const handleScenarioMetricChange = useCallback(
    (si: number, mi: number, updatedMetric: MetricDef) => {
      const updatedScenarios = [...data.scenarios]
      const scenario = updatedScenarios[si]
      const updatedMetrics = [...scenario.metrics]
      updatedMetrics[mi] = updatedMetric
      updatedScenarios[si] = { ...scenario, metrics: updatedMetrics }
      onChange({ ...data, scenarios: updatedScenarios })
    },
    [data, onChange]
  )

  const handleRemoveScenarioMetric = useCallback(
    (si: number, mi: number) => {
      const updatedScenarios = [...data.scenarios]
      const scenario = updatedScenarios[si]
      const updatedMetrics = scenario.metrics.filter((_, i) => i !== mi)
      updatedScenarios[si] = { ...scenario, metrics: updatedMetrics }
      onChange({ ...data, scenarios: updatedScenarios })
    },
    [data, onChange]
  )

  const handleAddScenarioMetric = useCallback(
    (si: number) => {
      const updatedScenarios = [...data.scenarios]
      const scenario = updatedScenarios[si]
      const newMetric: MetricDef = {
        id: `m${scenario.metrics.length + 1}`,
        label: '',
        baseValue: 50,
        min: 0,
        max: 100,
        direction: 'higher',
      }
      updatedScenarios[si] = { ...scenario, metrics: [...scenario.metrics, newMetric] }
      onChange({ ...data, scenarios: updatedScenarios })
    },
    [data, onChange]
  )

  return (
    <div className="visual-form" data-testid="tradeoff-sandbox-form-editor">
      {/* Sub-Tabs */}
      <div className="flowchart-sub-tabs" data-testid="to-sub-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenarios')}
          data-testid="to-tab-scenarios"
          type="button"
        >
          <Sliders size={14} />
          <span>Scenarios</span>
          <span className="sub-tab-badge">{data.scenarios.length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
          data-testid="to-tab-metrics"
          type="button"
        >
          <Binary size={14} />
          <span>Metrics</span>
          <span className="sub-tab-badge">{allMetrics.length}</span>
        </button>

        <button
          className="to-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="tradeoff-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <TradeoffHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Scenarios Sub-Tab */}
      {activeTab === 'scenarios' && (
        <div className="visual-form-field visual-form-field--array" data-testid="to-scenarios-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Trade-off Scenarios ({data.scenarios.length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddScenario}
              data-testid="tradeoff-add-scenario"
              type="button"
            >
              <Plus size={13} /> Add Scenario
            </button>
          </div>

          <div className="visual-form-object-list">
            {data.scenarios.map((scenario, i) => (
              <ScenarioEditor
                key={scenario.id || i}
                scenario={scenario}
                index={i}
                onChange={(updated) => handleScenarioChange(i, updated)}
                onRemove={() => handleRemoveScenario(i)}
                canRemove={data.scenarios.length > 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Metrics Overview Sub-Tab */}
      {activeTab === 'metrics' && (
        <div className="visual-form-field visual-form-field--array" data-testid="to-metrics-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">
              Metrics Overview ({allMetrics.length} across {data.scenarios.length} scenario{data.scenarios.length !== 1 ? 's' : ''})
            </span>
          </div>

          {data.scenarios.length === 0 ? (
            <div className="visual-form-card">
              <div className="visual-form-card-body">
                <p className="visual-form-empty">Add a scenario first, then configure metrics per-scenario in the <strong>Scenarios</strong> tab.</p>
              </div>
            </div>
          ) : (
            data.scenarios.map((scenario, si) => (
              <div key={scenario.id || si} className="visual-form-card">
                <div className="visual-form-card-header">
                  <span className="card-header-title">
                    <Compass size={14} /> Metrics for: <code className="card-code-pill">{scenario.title || scenario.id}</code>
                  </span>
                </div>
                <div className="visual-form-card-body">
                  <div className="visual-form-section-header">
                    <span className="visual-form-key">Metrics ({scenario.metrics.length})</span>
                    <button
                      className="form-add-btn form-add-btn--sm"
                      onClick={() => handleAddScenarioMetric(si)}
                      data-testid={`to-scenario-${si}-add-metric`}
                      type="button"
                    >
                      <Plus size={12} /> Add Metric
                    </button>
                  </div>

                  <div className="visual-form-object-list">
                    {scenario.metrics.map((metric, mi) => (
                      <MetricEditor
                        key={metric.id || mi}
                        metric={metric}
                        index={mi}
                        onChange={(updated) => handleScenarioMetricChange(si, mi, updated)}
                        onRemove={() => handleRemoveScenarioMetric(si, mi)}
                        canRemove={scenario.metrics.length > 0}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
