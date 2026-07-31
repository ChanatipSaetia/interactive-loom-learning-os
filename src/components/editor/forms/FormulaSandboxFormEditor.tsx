import { useState, useCallback } from 'react'
import { Sliders, Binary, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { FormulaHelpModal } from '../../../core/subdomains/tradeoff-sandbox/components/formula-sandbox/FormulaHelpModal'
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
    <div className="visual-form-card" data-testid={`fs-var-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Sliders size={13} /> Variable #{index + 1}: <code className="card-code-pill">{variable.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`fs-var-remove-${index}`}
            type="button"
            title="Remove variable"
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
        </div>

        <div className="visual-form-grid-3">
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
      </div>
    </div>
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
    <div className="visual-form-card" data-testid={`fs-metric-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <Binary size={13} /> Metric #{index + 1}: <code className="card-code-pill">{metric.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`fs-metric-remove-${index}`}
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

        {metric.analogy !== undefined && (
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
      </div>
    </div>
  )
}

type FormulaSubTab = 'variables' | 'metrics'

export function FormulaSandboxFormEditor({ data, onChange }: FormulaSandboxFormEditorProps) {
  const [activeTab, setActiveTab] = useState<FormulaSubTab>('variables')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

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
      {/* Sub-Tabs */}
      <div className="flowchart-sub-tabs" data-testid="fs-sub-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'variables' ? 'active' : ''}`}
          onClick={() => setActiveTab('variables')}
          data-testid="fs-tab-variables"
          type="button"
        >
          <Sliders size={14} />
          <span>Variables</span>
          <span className="sub-tab-badge">{data.variables.length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
          data-testid="fs-tab-metrics"
          type="button"
        >
          <Binary size={14} />
          <span>Metrics & Formulas</span>
          <span className="sub-tab-badge">{data.metrics.length}</span>
        </button>

        <button
          className="fm-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="formula-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <FormulaHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Variables Sub-Tab */}
      {activeTab === 'variables' && (
        <div className="visual-form-field visual-form-field--array" data-testid="fs-variables-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Variables ({data.variables.length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddVar}
              data-testid="fs-add-variable"
              type="button"
            >
              <Plus size={13} /> Add Variable
            </button>
          </div>
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
        </div>
      )}

      {/* Metrics Sub-Tab */}
      {activeTab === 'metrics' && (
        <div className="visual-form-field visual-form-field--array" data-testid="fs-metrics-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Metrics & Formulas ({data.metrics.length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddMetric}
              data-testid="fs-add-metric"
              type="button"
            >
              <Plus size={13} /> Add Metric
            </button>
          </div>
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
        </div>
      )}
    </div>
  )
}
