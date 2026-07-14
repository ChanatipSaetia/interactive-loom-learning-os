import { useState, useEffect, useMemo } from 'react'
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

function computeMetricRange(formulaStr: string, variables: OKFFormulaVariable[]): { min: number; max: number } {
  let combos: Record<string, number>[] = [{}]
  
  for (const v of variables) {
    const values: number[] = []
    const stepsCount = Math.max(1, Math.floor((v.max - v.min) / v.step))
    for (let i = 0; i <= stepsCount; i++) {
      values.push(v.min + i * v.step)
    }
    if (values[values.length - 1] < v.max) {
      values.push(v.max)
    }

    const nextCombos: Record<string, number>[] = []
    for (const c of combos) {
      for (const val of values) {
        nextCombos.push({ ...c, [v.id]: val })
      }
    }
    combos = nextCombos
  }

  let min = Infinity
  let max = -Infinity

  for (const c of combos) {
    const val = evaluateFormula(formulaStr, c)
    if (val < min) min = val
    if (val > max) max = val
  }

  if (min === Infinity || max === -Infinity || min === max) {
    return { min: 0, max: 100 }
  }

  return { min, max }
}

function getMetricUnitAndFormat(metric: OKFFormulaMetric, val: number): { unit: string; display: string } {
  const match = metric.label.match(/\(([^)]+)\)/)
  const unit = match ? match[1] : ''

  if (unit === '$') {
    return { unit, display: `$${Number(val).toFixed(2)}` }
  }
  
  const formattedVal = Number.isInteger(val) ? val.toString() : val.toFixed(1)
  return { unit, display: `${formattedVal} ${unit}`.trim() }
}

function getMetricColorClass(id: string, val: number, range: { min: number; max: number }): string {
  const isCostOrLatency = 
    id.includes('cost') || 
    id.includes('latency') || 
    id.includes('fatigue') || 
    id.includes('overhead')
  
  const span = range.max - range.min
  if (span === 0) return 'sky'
  
  const ratio = (val - range.min) / span
  
  if (isCostOrLatency) {
    if (ratio < 0.35) return 'green'
    if (ratio < 0.7) return 'peach'
    return 'red'
  } else {
    if (ratio > 0.65) return 'green'
    if (ratio > 0.3) return 'peach'
    return 'red'
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

  // Precompute ranges
  const metricRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {}
    metrics.forEach((m) => {
      ranges[m.id] = computeMetricRange(m.formula, variables)
    })
    return ranges
  }, [metrics, variables])

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
    const val = computedMetrics[metric.id] || 0
    const { display } = getMetricUnitAndFormat(metric, val)

    const bodyContent = `
      <strong>Current Value:</strong> <span class="hud-highlight">${display}</span><br/><br/>
      <strong>Definition:</strong> ${metric.description}<br/><br/>
      ${metric.analogy ? `<strong>Analogy:</strong><div class="hud-card">${metric.analogy}</div><br/>` : ''}
      ${metric.inScope && metric.inScope.length > 0 ? `<strong>In Scope:</strong><ul>${metric.inScope.map(i => `<li>${i}</li>`).join('')}</ul><br/>` : ''}
      ${metric.outOfScope && metric.outOfScope.length > 0 ? `<strong>Out of Scope:</strong><ul>${metric.outOfScope.map(o => `<li>${o}</li>`).join('')}</ul>` : ''}
    `
    openHUD(metric.label, bodyContent)
  }

  return (
    <div className="formula-sandbox-section" data-testid="formula-sandbox-section">
      {title && (
        <h3 className="tradeoff-sandbox-title">{title}</h3>
      )}

      <div className="sandbox-layout">
        <div className="controls-panel">
          {variables.map((v) => (
            <div key={v.id} className="slider-group">
              <div className="slider-header">
                <span className="slider-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  {v.label}
                </span>
                <span className="slider-value">{variablesState[v.id]}</span>
              </div>
              <input
                type="range"
                className="range-input"
                min={v.min}
                max={v.max}
                step={v.step}
                value={variablesState[v.id]}
                onChange={(e) => handleSliderChange(v.id, parseFloat(e.target.value))}
              />
            </div>
          ))}

          <div className="formula-explanation">
            <strong>System Formulas:</strong><br />
            • Metrics are dynamically estimated using target variables.<br />
            • Values scale based on theoretical formulas mapping system properties.
          </div>
        </div>

        <div className="sandbox-metrics">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ctp-overlay2)', letterSpacing: '0.5px', margin: 0 }}>Computed Metrics</h4>
            <span style={{ fontSize: '12px', color: 'var(--ctp-subtext0)', fontStyle: 'italic' }}>
              * Values are dynamic formula-based estimates.
            </span>
          </div>
          {metrics.map((m) => {
            const val = computedMetrics[m.id] || 0
            const range = metricRanges[m.id] || { min: 0, max: 100 }
            const valColorClass = getMetricColorClass(m.id, val, range)
            const { display } = getMetricUnitAndFormat(m, val)

            // Calculate gauge percentage
            const span = range.max - range.min
            const percentage = span > 0 ? ((val - range.min) / span) * 100 : 0
            const gaugeWidth = `${Math.max(0, Math.min(percentage, 100))}%`

            // Identify variables used in formula for params checklist
            const variablesUsed = variables
              .filter((v) => new RegExp(`\\b${v.id}\\b`).test(m.formula))
              .map((v) => v.label)

            return (
              <div key={m.id} className="sim-metric-row">
                <div className="sim-metric-meta">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="sim-metric-name">{m.label}</span>
                    {variablesUsed.length > 0 && (
                      <span style={{ fontSize: '11px', color: 'var(--ctp-subtext1)', fontFamily: 'monospace' }}>
                        Inputs: {variablesUsed.join(', ')}
                      </span>
                    )}
                  </div>
                  <button
                    className={`sim-metric-val ${valColorClass}`}
                    onClick={() => handleMetricClick(m)}
                    title="Click to view HUD details"
                  >
                    {display}
                  </button>
                </div>
                <div className="gauge-bg">
                  <div
                    className={`gauge-fill ${valColorClass}`}
                    style={{ width: gaugeWidth }}
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
