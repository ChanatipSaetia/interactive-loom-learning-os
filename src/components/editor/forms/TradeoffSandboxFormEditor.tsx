import { useState, useCallback } from 'react'
import { Sliders, ListChecks, Plus, Trash2, ThumbsUp, ThumbsDown, HelpCircle, Compass } from 'lucide-react'
import { TradeoffHelpModal } from '../../../sections/tradeoff-sandbox/TradeoffHelpModal'
import type { OKFTradeoffSectionData } from '../../../core/okf/types'
import type { TradeoffScenario, TradeoffStep, TradeoffChoice, MetricDef, TradeoffProCon } from '../../../sections/tradeoff-sandbox'

interface TradeoffSandboxFormEditorProps {
  data: OKFTradeoffSectionData
  onChange: (data: OKFTradeoffSectionData) => void
}

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
    <div className="visual-form-card visual-form-card--sub" data-testid={`tc-pc-${type}-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title" style={{ color: isPro ? 'var(--ctp-green)' : 'var(--ctp-red)' }}>
          {isPro ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
          {isPro ? 'Pro' : 'Con'} #{index + 1}
        </span>
        <button
          className="form-remove-btn"
          onClick={onRemove}
          data-testid={`tc-pc-remove-${type}-${index}`}
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
              data-testid={`tc-pc-${type}-${index}-title`}
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
              data-testid={`tc-pc-${type}-${index}-description`}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

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
    <div className="visual-form-card visual-form-card--sub" data-testid={`tc-choice-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <ListChecks size={13} /> Choice #{index + 1}: <code className="card-code-pill">{choice.label || choice.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`tc-choice-remove-${index}`}
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
                data-testid={`tc-choice-${index}-id`}
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
                data-testid={`tc-choice-${index}-label`}
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
              data-testid={`tc-choice-${index}-description`}
            />
          </label>
        </div>

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
                      data-testid={`tc-choice-${index}-metric-${m.id}`}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="visual-form-grid-2">
          <div className="visual-form-field">
            <span className="visual-form-key" style={{ color: 'var(--ctp-green)' }}>Pros ({choice.pros.length})</span>
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
            <span className="visual-form-key" style={{ color: 'var(--ctp-red)' }}>Cons ({choice.cons.length})</span>
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
    <div className="visual-form-card visual-form-card--sub" data-testid={`tc-step-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <ListChecks size={13} /> Step #{index + 1}: <code className="card-code-pill">{step.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`tc-step-remove-${index}`}
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
                data-testid={`tc-step-${index}-id`}
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
                data-testid={`tc-step-${index}-title`}
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
              data-testid={`tc-step-${index}-description`}
            />
          </label>
        </div>

        <div className="visual-form-field visual-form-field--array">
          <span className="visual-form-key">Choices ({step.choices.length})</span>
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
  const handleStepChange = useCallback(
    (si: number, updatedStep: TradeoffStep) => {
      const updated = [...scenario.steps]
      updated[si] = updatedStep
      onChange({ ...scenario, steps: updated })
    },
    [scenario, onChange]
  )

  return (
    <div className="visual-form-card" data-testid={`tc-scenario-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Sliders size={14} /> Scenario #{index + 1}: <code className="card-code-pill">{scenario.title || scenario.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`tc-scenario-remove-${index}`}
            type="button"
            title="Remove scenario"
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
                value={scenario.id}
                onChange={(e) => onChange({ ...scenario, id: e.target.value })}
                data-testid={`tc-scenario-${index}-id`}
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
                data-testid={`tc-scenario-${index}-title`}
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
              data-testid={`tc-scenario-${index}-description`}
            />
          </label>
        </div>

        <div className="visual-form-field visual-form-field--array">
          <span className="visual-form-key">Steps ({scenario.steps.length})</span>
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
    </div>
  )
}

type TradeoffSubTab = 'scenarios' | 'parameters'

export function TradeoffSandboxFormEditor({ data, onChange }: TradeoffSandboxFormEditorProps) {
  const [activeTab, setActiveTab] = useState<TradeoffSubTab>('scenarios')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

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
          className={`flowchart-sub-tab ${activeTab === 'parameters' ? 'active' : ''}`}
          onClick={() => setActiveTab('parameters')}
          data-testid="to-tab-parameters"
          type="button"
        >
          <Compass size={14} />
          <span>Parameters & Metrics</span>
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

      {/* Parameters & Metrics Sub-Tab */}
      {activeTab === 'parameters' && (
        <div className="visual-form-card" data-testid="to-parameters-tab-content">
          <div className="visual-form-card-header">
            <span className="card-header-title">
              <Compass size={14} /> Global Trade-off Metrics Overview
            </span>
          </div>
          <div className="visual-form-card-body">
            <p className="visual-form-empty" style={{ fontStyle: 'normal' }}>
              Metrics and parameters are dynamically configured inside each scenario card. Switch to the <strong>Scenarios</strong> tab to edit specific step metric deltas and pros/cons.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
