import { useState, useEffect } from 'react'
import { useHUD } from '../../core/context/HUDContext'
import type { OKFFormulaVariable, OKFFormulaMetric } from '../../core/okf/types'
import './formula-sandbox.css'

export interface FormulaSandboxProps {
  title?: string
  variables: OKFFormulaVariable[]
  metrics: OKFFormulaMetric[]
}

function evaluateFormula(formulaStr: string, variablesState: Record<string, number>): number {
  let expression = formulaStr
  for (const [key, val] of Object.entries(variablesState)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g')
    expression = expression.replace(regex, String(val))
  }

  try {
    // Safe evaluation using Function
    const fn = new Function('Math', `return (${expression})`)
    return fn(Math)
  } catch (err) {
    console.error('Failed to evaluate formula:', formulaStr, 'Expression:', expression, err)
    return 0
  }
}

export function FormulaSandbox({ title, variables = [], metrics = [] }: FormulaSandboxProps) {
  const { openHUD } = useHUD()

  // Initialize variables state
  const [variablesState, setVariablesState] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    variables.forEach((v) => {
      initial[v.id] = v.defaultValue
    })
    return initial
  })

  // Computed metrics
  const [computedMetrics, setComputedMetrics] = useState<Record<string, number>>({})

  useEffect(() => {
    const updated: Record<string, number> = {}
    metrics.forEach((m) => {
      updated[m.id] = evaluateFormula(m.formula, variablesState)
    })
    setComputedMetrics(updated)
  }, [variablesState, metrics])

  const handleSliderChange = (id: string, val: number) => {
    setVariablesState((prev) => ({
      ...prev,
      [id]: val,
    }))
  }

  const handleMetricClick = (metric: OKFFormulaMetric) => {
    const val = computedMetrics[metric.id]
    const unit = metric.id === 'cost' ? '' : (metric.id === 'latency' ? ' ms' : '%')
    const formattedVal = metric.id === 'cost' ? `$${Number(val).toFixed(2)}` : `${val}${unit}`

    const bodyContent = `
      <strong>Current Value:</strong> <span class="hud-highlight">${formattedVal}</span><br/><br/>
      <strong>Definition:</strong> ${metric.description}<br/><br/>
      ${metric.analogy ? `<strong>Analogy:</strong><div class="hud-card">${metric.analogy}</div><br/>` : ''}
      ${metric.inScope && metric.inScope.length > 0 ? `<strong>In Scope:</strong><ul>${metric.inScope.map(i => `<li>${i}</li>`).join('')}</ul><br/>` : ''}
      ${metric.outOfScope && metric.outOfScope.length > 0 ? `<strong>Out of Scope:</strong><ul>${metric.outOfScope.map(o => `<li>${o}</li>`).join('')}</ul>` : ''}
    `
    openHUD(metric.label, bodyContent)
  }

  // Helper to determine color classes for metrics
  const getMetricClass = (id: string, val: number) => {
    if (id === 'recall') {
      return val > 75 ? 'green' : val > 45 ? 'peach' : 'red'
    }
    if (id === 'latency') {
      return val < 700 ? 'green' : val < 1200 ? 'sky' : 'red'
    }
    if (id === 'cost') {
      return val < 1.50 ? 'green' : val < 3.00 ? 'peach' : 'red'
    }
    return 'sky'
  }

  const getGaugeWidth = (id: string, val: number) => {
    if (id === 'recall') return `${val}%`
    if (id === 'latency') return `${Math.min((val / 2000) * 100, 100)}%`
    if (id === 'cost') return `${Math.min((val / 5.00) * 100, 100)}%`
    return '50%'
  }

  return (
    <div className="formula-sandbox-section" data-testid="formula-sandbox-section">
      {title && (
        <h3 className="tradeoff-sandbox-title">{title}</h3>
      )}

      <div className="sandbox-grid-layout">
        <div className="sandbox-controls-column">
          {variables.map((v) => (
            <div key={v.id} className="sandbox-slider-group">
              <div className="sandbox-slider-meta">
                <span className="sandbox-slider-label">{v.label}</span>
                <span className="sandbox-slider-val">{variablesState[v.id]}</span>
              </div>
              <input
                type="range"
                className="sandbox-range-input"
                min={v.min}
                max={v.max}
                step={v.step}
                value={variablesState[v.id]}
                onChange={(e) => handleSliderChange(v.id, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>

        <div className="sandbox-metrics-column">
          <h4 className="sandbox-metrics-header">Computed Metrics</h4>
          {metrics.map((m) => {
            const val = computedMetrics[m.id] || 0
            const valColorClass = getMetricClass(m.id, val)
            const unit = m.id === 'cost' ? '' : (m.id === 'latency' ? ' ms' : '%')
            const displayVal = m.id === 'cost' ? `$${Number(val).toFixed(2)}` : `${val}${unit}`

            return (
              <div key={m.id} className="sandbox-metric-row">
                <div className="sandbox-metric-meta">
                  <span className="sandbox-metric-name">{m.label}</span>
                  <button
                    className={`sandbox-metric-val ${valColorClass}`}
                    onClick={() => handleMetricClick(m)}
                    title="Click to view HUD details"
                  >
                    {displayVal}
                  </button>
                </div>
                <div className="sandbox-gauge-track">
                  <div
                    className={`sandbox-gauge-fill ${valColorClass}`}
                    style={{ width: getGaugeWidth(m.id, val) }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FormulaSandbox
