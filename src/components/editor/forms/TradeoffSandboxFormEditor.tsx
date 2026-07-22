import { useCallback } from 'react'
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
  return (
    <fieldset className="visual-form-nested" data-testid={`tc-pc-${type}-${index}`}>
      <legend>
        {type === 'pro' ? 'Pro' : 'Con'} {index + 1}
        <button className="form-remove-btn" onClick={onRemove} data-testid={`tc-pc-remove-${type}-${index}`}>×</button>
      </legend>
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
    </fieldset>
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
    <fieldset className="visual-form-nested" data-testid={`tc-choice-${index}`}>
      <legend>
        Choice {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`tc-choice-remove-${index}`}>×</button> : null}
      </legend>
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
      <div className="visual-form-field">
        <span className="visual-form-key">Metric Deltas</span>
        <div className="visual-form-string-list">
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
      <div className="visual-form-field">
        <span className="visual-form-key">Pros</span>
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
        <span className="visual-form-key">Cons</span>
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
    </fieldset>
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
    <fieldset className="visual-form-nested" data-testid={`tc-step-${index}`}>
      <legend>
        Step {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`tc-step-remove-${index}`}>×</button> : null}
      </legend>
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
    </fieldset>
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
    <fieldset className="visual-form-nested" data-testid={`tc-scenario-${index}`}>
      <legend>
        Scenario {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`tc-scenario-remove-${index}`}>×</button> : null}
      </legend>
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
    </fieldset>
  )
}

export function TradeoffSandboxFormEditor({ data, onChange }: TradeoffSandboxFormEditorProps) {
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
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Scenarios ({data.scenarios.length})</span>
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
        <button
          className="form-add-btn"
          onClick={handleAddScenario}
          data-testid="tradeoff-add-scenario"
        >
          + Add Scenario
        </button>
      </div>
    </div>
  )
}
