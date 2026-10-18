import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Pointer, TrendingDown, TrendingUp } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { QUIET, beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import type { FormulaMetric, FormulaVariable } from '../../schema'
import { computeFormulas, formulaTrends, sweptVariables, type FormulaPresentData, type FormulaTrend } from '../../present'
import { getMetricUnitAndFormat, humanizeFormula } from './index'
import './formula-sandbox.css'
import '../present.css'

const SWEEP_MS = 2600
const snap = (v: number, min: number, step: number) => (step > 0 ? min + Math.round((v - min) / step) * step : v)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Each metric's range as the sliders move one at a time from the defaults (what a learner sees), metrics
 * evaluated in order so derived ones work.
 */
function rangesOf(metrics: FormulaMetric[], variables: FormulaVariable[]): Record<string, { min: number; max: number }> {
  const defaults = Object.fromEntries(variables.map((v) => [v.id, v.defaultValue]))
  const samples = [defaults, ...variables.flatMap((v) => Array.from({ length: 9 }, (_, i) => ({ ...defaults, [v.id]: v.min + ((v.max - v.min) * i) / 8 })))]
  const out: Record<string, { min: number; max: number }> = Object.fromEntries(metrics.map((m) => [m.id, { min: Infinity, max: -Infinity }]))
  for (const sample of samples) {
    const values = computeFormulas(metrics, sample)
    for (const m of metrics) {
      if (Number.isFinite(values[m.id])) out[m.id] = { min: Math.min(out[m.id].min, values[m.id]), max: Math.max(out[m.id].max, values[m.id]) }
    }
  }
  // Gauges start at zero for positive metrics, so the fill reads as an amount
  for (const m of metrics) {
    const r = out[m.id]
    out[m.id] = r.max > r.min ? { min: Math.min(0, r.min), max: r.max } : { min: 0, max: Math.max(100, r.max) }
  }
  return out
}

const TREND_VERB: Record<FormulaTrend['shape'], string> = { rises: 'rises', falls: 'falls', peak: 'peaks at', dip: 'dips to' }

/**
 * Formula sandbox in Present mode (formulaBeats): the formulas, sliders and metric gauges arrive; then, one
 * beat per variable, a ghost hand sweeps it from its min to its max while every metric recomputes and its
 * gauge follows, and the trend of each metric that moves is stated as the sweep plays (decision 112).
 */
export default function PresentFormula({ data, beat, active }: PresentRendererProps<FormulaPresentData>) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const reduced = useReducedMotion()
  const mark = beatMarks(beat)
  const variables = useMemo(() => data.variables ?? [], [data.variables])
  const metrics = useMemo(() => data.metrics ?? [], [data.metrics])
  const ranges = useMemo(() => rangesOf(metrics, variables), [metrics, variables])
  const defaults = useMemo(() => Object.fromEntries(variables.map((v) => [v.id, v.defaultValue])), [variables])
  const swept = useMemo(() => sweptVariables(data), [data])
  const trends = useMemo(() => swept.map((v) => formulaTrends(data, v)), [data, swept])
  // The variable this beat sweeps (beat 1 sweeps the first one)
  const moving = beat >= 1 ? swept[beat - 1] : undefined
  const [values, setValues] = useState(defaults)
  const [sweeping, setSweeping] = useState(false)
  const computed = useMemo(() => computeFormulas(metrics, values), [metrics, values])

  // Before the sweeps the sliders sit at their defaults; on a sweep's beat its variable plays from min to
  // max (or lands at max at once when the section is not live or motion is reduced), the others at defaults
  useEffect(() => {
    if (!moving) return setValues(defaults)
    const landed = { ...defaults, [moving.id]: moving.max }
    if (!active || reduced) return setValues(landed)
    setValues({ ...defaults, [moving.id]: moving.min })
    let frame = 0
    let start = 0
    const tick = (now: number) => {
      start ||= now
      const t = Math.min(1, (now - start) / SWEEP_MS)
      const v = snap(moving.min + (moving.max - moving.min) * easeInOut(t), moving.min, moving.step)
      setValues((s) => (s[moving.id] === v ? s : { ...s, [moving.id]: v }))
      if (t < 1) frame = requestAnimationFrame(tick)
      else setSweeping(false)
    }
    const delay = window.setTimeout(() => {
      setSweeping(true)
      playSound('whoosh')
      frame = requestAnimationFrame(tick)
    }, 500)
    return () => {
      window.clearTimeout(delay)
      cancelAnimationFrame(frame)
      setSweeping(false)
    }
  }, [active, reduced, moving, defaults, playSound])

  if (!variables.length || !metrics.length) return null
  const pct = (v: number, min: number, max: number) => (max > min ? Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100)) : 0)

  return (
    <div className="present-formula sandbox-layout" data-testid="present-formula">
      <div className="controls-panel">
        <div className="formula-explanation" {...focus(beat === 0)}>
          <span className="present-formula-heading">System Formulas:</span>
          {metrics.map((m, i) => (
            <span key={m.id} className="present-formula-line" {...mark(0, { delay: 150 + i * 90 })} {...pick(m, 'formula')}>
              • {m.label.replace(/\s*\([^)]*\)\s*$/, '')} = <code>{humanizeFormula(m.formula, variables)}</code>
            </span>
          ))}
        </div>
        <div className="present-sliders" {...QUIET}>
          {variables.map((v, i) => {
            const isSwept = sweeping && v.id === moving?.id
            return (
              <label key={v.id} className={`slider-group${v.id === moving?.id ? ' is-swept' : ''}`} {...mark(0, { delay: 500 + i * 90 })} {...pick(v)}>
                <span className="slider-header">
                  <span className="slider-label" {...pick(v, 'label')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                    {v.label}
                  </span>
                  <output className="slider-value">{values[v.id]}</output>
                </span>
                <span className="present-slider-track">
                  <input
                    type="range"
                    className="range-input"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={values[v.id] ?? v.defaultValue}
                    readOnly
                    tabIndex={-1}
                    data-testid={`present-formula-slider-${v.id}`}
                  />
                  {isSwept && (
                    <span className="present-ghost" style={{ left: `${pct(values[v.id], v.min, v.max)}%` }} aria-hidden>
                      <Pointer size={26} />
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
        {swept.length > 0 && (
          <div className="present-scenes present-formula-trends" {...mark(1, { motion: 'fade' })}>
            {swept.map((v, k) => (
              <div key={v.id} className="present-formula-trend" {...mark(k + 1, { motion: 'fade', ...(k < swept.length - 1 && { until: k + 1 }) })} {...focus(beat === k + 1)}>
                <p className="present-formula-trend-lead" {...pick(v, 'label')}>As {v.label} goes {v.min} → {v.max}:</p>
                {trends[k].length ? (
                  <ul>
                    {trends[k].map((t, i) => {
                      const fmt = (n: number) => getMetricUnitAndFormat(t.metric, n).display
                      const up = t.shape === 'rises' || t.shape === 'peak'
                      return (
                        <li key={t.metric.id} {...mark(k + 1, { motion: 'unfold', delay: 900 + i * 450 })} {...pick(t.metric)}>
                          {up ? <TrendingUp className="present-trend-icon is-up" aria-hidden /> : <TrendingDown className="present-trend-icon is-down" aria-hidden />}
                          <span>
                            {t.metric.label} <span className={`present-trend-verb ${up ? 'is-up' : 'is-down'}`}>{TREND_VERB[t.shape]}</span>{' '}
                            {t.turn !== undefined ? `${fmt(t.turn)} (${fmt(t.from)} → ${fmt(t.to)})` : `${fmt(t.from)} → ${fmt(t.to)}`}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="present-formula-trend-none">No metric changes.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="sandbox-metrics" {...QUIET}>
        <h4 className="present-formula-metrics-title" {...mark(0, { motion: 'fade', delay: 700 })}>Computed Metrics</h4>
        {metrics.map((m, i) => {
          const val = computed[m.id] ?? 0
          const range = ranges[m.id] ?? { min: 0, max: 100 }
          return (
            <div key={m.id} className="sim-metric-row" {...mark(0, { delay: 800 + i * 110 })} {...pick(m)}>
              <div className="sim-metric-meta">
                <span className="sim-metric-name" {...pick(m, 'label')}>{m.label}</span>
                <span className="sim-metric-val sky present-gauge-value">{getMetricUnitAndFormat(m, val).display}</span>
              </div>
              <div className="gauge-bg"><div className="gauge-fill sky" style={{ width: `${pct(val, range.min, range.max)}%` }} /></div>
              <span className="present-gauge-desc" {...pick(m, 'description')}>{m.description}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
