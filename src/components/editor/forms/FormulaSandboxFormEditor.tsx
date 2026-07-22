import { useCallback } from 'react'
import type {
  OKFFormulaSandboxSectionData,
  OKFFormulaVariable,
  OKFFormulaMetric,
} from '../../../core/okf/types'

interface FormulaSandboxFormEditorProps {
  data: OKFFormulaSandboxSectionData
  onChange: (data: OKFFormulaSandboxSectionData) => void
}

function FormulaVariableEditor({
  variable,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  variable: OKFFormulaVariable
  index: number
  onChange: (variable: OKFFormulaVariable) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof OKFFormulaVariable, value: string | number) => {
      onChange({ ...variable, [field]: value })
    },
    [variable, onChange]
  )

  return (
    <fieldset className="visual-form-nested" data-testid={`fs-var-${index}`}>
      <legend>
        Variable {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`fs-var-remove-${index}`}>×</button> : null}
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={variable.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            data-testid={`fs-var-${index}-id`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Label</span>
          <input
            className="visual-form-input"
            value={variable.label}
            onChange={(e) => handleFieldChange('label', e.target.value)}
            data-testid={`fs-var-${index}-label`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Min</span>
          <input
            className="visual-form-input"
            type="number"
            value={variable.min}
            onChange={(e) => handleFieldChange('min', parseFloat(e.target.value) || 0)}
            data-testid={`fs-var-${index}-min`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Max</span>
          <input
            className="visual-form-input"
            type="number"
            value={variable.max}
            onChange={(e) => handleFieldChange('max', parseFloat(e.target.value) || 0)}
            data-testid={`fs-var-${index}-max`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Step</span>
          <input
            className="visual-form-input"
            type="number"
            value={variable.step}
            onChange={(e) => handleFieldChange('step', parseFloat(e.target.value) || 1)}
            data-testid={`fs-var-${index}-step`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Default Value</span>
          <input
            className="visual-form-input"
            type="number"
            value={variable.defaultValue}
            onChange={(e) => handleFieldChange('defaultValue', parseFloat(e.target.value) || 0)}
            data-testid={`fs-var-${index}-defaultValue`}
          />
        </label>
      </div>
    </fieldset>
  )
}

function FormulaMetricEditor({
  metric,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  metric: OKFFormulaMetric
  index: number
  onChange: (metric: OKFFormulaMetric) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof OKFFormulaMetric, value: string) => {
      onChange({ ...metric, [field]: value })
    },
    [metric, onChange]
  )

  return (
    <fieldset className="visual-form-nested" data-testid={`fs-metric-${index}`}>
      <legend>
        Metric {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`fs-metric-remove-${index}`}>×</button> : null}
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={metric.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            data-testid={`fs-metric-${index}-id`}
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
            data-testid={`fs-metric-${index}-label`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Formula</span>
          <input
            className="visual-form-input"
            value={metric.formula}
            onChange={(e) => handleFieldChange('formula', e.target.value)}
            data-testid={`fs-metric-${index}-formula`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Description</span>
          <textarea
            className="visual-form-textarea"
            value={metric.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            rows={2}
            data-testid={`fs-metric-${index}-description`}
          />
        </label>
      </div>
      {metric.analogy && (
        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Analogy</span>
            <textarea
              className="visual-form-textarea"
              value={metric.analogy}
              onChange={(e) => handleFieldChange('analogy', e.target.value)}
              rows={2}
              data-testid={`fs-metric-${index}-analogy`}
            />
          </label>
        </div>
      )}
    </fieldset>
  )
}

export function FormulaSandboxFormEditor({ data, onChange }: FormulaSandboxFormEditorProps) {
  const handleVarChange = useCallback(
    (vi: number, updatedVar: OKFFormulaVariable) => {
      const updated = [...data.variables]
      updated[vi] = updatedVar
      onChange({ ...data, variables: updated })
    },
    [data, onChange]
  )

  const handleRemoveVar = useCallback(
    (vi: number) => {
      const updated = data.variables.filter((_, i) => i !== vi)
      onChange({ ...data, variables: updated })
    },
    [data, onChange]
  )

  const handleAddVar = useCallback(() => {
    const newVar: OKFFormulaVariable = {
      id: `v${data.variables.length + 1}`,
      label: '',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
    }
    onChange({ ...data, variables: [...data.variables, newVar] })
  }, [data, onChange])

  const handleMetricChange = useCallback(
    (mi: number, updatedMetric: OKFFormulaMetric) => {
      const updated = [...data.metrics]
      updated[mi] = updatedMetric
      onChange({ ...data, metrics: updated })
    },
    [data, onChange]
  )

  const handleRemoveMetric = useCallback(
    (mi: number) => {
      const updated = data.metrics.filter((_, i) => i !== mi)
      onChange({ ...data, metrics: updated })
    },
    [data, onChange]
  )

  const handleAddMetric = useCallback(() => {
    const newMetric: OKFFormulaMetric = {
      id: `m${data.metrics.length + 1}`,
      label: '',
      formula: '',
      description: '',
    }
    onChange({ ...data, metrics: [...data.metrics, newMetric] })
  }, [data, onChange])

  return (
    <div className="visual-form" data-testid="formula-sandbox-form-editor">
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Variables ({data.variables.length})</span>
        <div className="visual-form-object-list">
          {data.variables.map((v, i) => (
            <FormulaVariableEditor
              key={v.id || i}
              variable={v}
              index={i}
              onChange={(updated) => handleVarChange(i, updated)}
              onRemove={() => handleRemoveVar(i)}
              canRemove={data.variables.length > 0}
            />
          ))}
        </div>
        <button
          className="form-add-btn"
          onClick={handleAddVar}
          data-testid="fs-add-variable"
        >
          + Add Variable
        </button>
      </div>
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Metrics ({data.metrics.length})</span>
        <div className="visual-form-object-list">
          {data.metrics.map((m, i) => (
            <FormulaMetricEditor
              key={m.id || i}
              metric={m}
              index={i}
              onChange={(updated) => handleMetricChange(i, updated)}
              onRemove={() => handleRemoveMetric(i)}
              canRemove={data.metrics.length > 0}
            />
          ))}
        </div>
        <button
          className="form-add-btn"
          onClick={handleAddMetric}
          data-testid="fs-add-metric"
        >
          + Add Metric
        </button>
      </div>
    </div>
  )
}
