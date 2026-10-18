import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Pointer } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { FormulaMetric, FormulaVariable } from '../../schema'
import type { FormulaPresentData } from '../../present'
import { evaluateFormula, getMetricUnitAndFormat, humanizeFormula } from './index'
import '../present.css'

const SWEEP_MS = 2600
const snap = (v: number, min: number, step: number) => (step > 0 ? min + Math.round((v - min) / step) * step : v)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Metrics in order, so a later formula can use an earlier metric (as the Read sandbox does). */
function compute(metrics: FormulaMetric[], values: Record<string, number>): Record<string, number> {
  const scope = { ...values }
  const out: Record<string, number> = {}
  for (const m of metrics) {
    out[m.id] = evaluateFormula(m.formula, scope)
    scope[m.id] = out[m.id]
  }
  return out
}

/**
 * Each metric's range as the sliders move one at a time from the defaults (what a learner sees), metrics
 * evaluated in order so derived ones work.
 */
function rangesOf(metrics: FormulaMetric[], variables: FormulaVariable[]): Record<string, { min: number; max: number }> {
  const defaults = Object.fromEntries(variables.map((v) => [v.id, v.defaultValue]))
  const samples = [defaults, ...variables.flatMap((v) => Array.from({ length: 9 }, (_, i) => ({ ...defaults, [v.id]: v.min + ((v.max - v.min) * i) / 8 })))]
  const out: Record<string, { min: number; max: number }> = Object.fromEntries(metrics.map((m) => [m.id, { min: Infinity, max: -Infinity }]))
  for (const sample of samples) {
    const values = compute(metrics, sample)
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

/**
 * Formula sandbox in Present mode (formulaBeats): the formulas, sliders and metric gauges arrive; then a
 * ghost hand sweeps the first variable from its default to its max while every metric recomputes and
 * its gauge follows; the last beat hands the sliders to the learner.
 */
export default function PresentFormula({ data, beat, beats, active }: PresentRendererProps<FormulaPresentData>) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const reduced = useReducedMotion()
  const mark = beatMarks(beat)
  const variables = useMemo(() => data.variables ?? [], [data.variables])
  const metrics = useMemo(() => data.metrics ?? [], [data.metrics])
  const ranges = useMemo(() => rangesOf(metrics, variables), [metrics, variables])
  const defaults = useMemo(() => Object.fromEntries(variables.map((v) => [v.id, v.defaultValue])), [variables])
  const first = variables[0]
  const sweepBeat = beats.length === 3 ? 1 : -1
  const exploreBeat = beats.length - 1
  const exploring = beats[exploreBeat]?.kind === 'explore' && beat >= exploreBeat
  const [values, setValues] = useState(defaults)
  const [sweeping, setSweeping] = useState(false)
  const computed = useMemo(() => compute(metrics, values), [metrics, values])

  // Before the sweep the sliders sit at their defaults; on its beat the sweep plays (or lands at once when
  // the section is not live or motion is reduced); after it the values are the learner's
  useEffect(() => {
    if (!first || sweepBeat < 0 || beat > sweepBeat) return
    const swept = { ...defaults, [first.id]: first.max }
    if (beat < sweepBeat) return setValues(defaults)
    if (!active || reduced) return setValues(swept)
    setValues(defaults)
    let frame = 0
    let start = 0
    const tick = (now: number) => {
      start ||= now
      const t = Math.min(1, (now - start) / SWEEP_MS)
      const v = snap(first.defaultValue + (first.max - first.defaultValue) * easeInOut(t), first.min, first.step)
      setValues((s) => (s[first.id] === v ? s : { ...s, [first.id]: v }))
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
  }, [beat, active, reduced, sweepBeat, first, defaults, playSound])

  if (!variables.length || !metrics.length) return null
  const pct = (v: number, min: number, max: number) => (max > min ? Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100)) : 0)

  return (
    <div className={`present-formula${exploring && active ? ' is-exploring' : ''}`} data-testid="present-formula">
      <div className="present-formula-left">
        <ul className="present-formulas">
          {metrics.map((m, i) => (
            <li key={m.id} {...mark(0, { delay: 150 + i * 90 })} {...pick(m, 'formula')}>
              <span className="present-formula-name">{m.label.replace(/\s*\([^)]*\)\s*$/, '')}</span> = <code>{humanizeFormula(m.formula, variables)}</code>
            </li>
          ))}
        </ul>
        <div className="present-sliders">
          {variables.map((v, i) => {
            const swept = sweeping && v.id === first.id
            return (
              <label key={v.id} className={`present-slider${swept ? ' is-swept' : ''}`} {...mark(0, { delay: 500 + i * 90 })} {...pick(v)}>
                <span className="present-slider-head">
                  <span {...pick(v, 'label')}>{v.label}</span>
                  <output>{values[v.id]}</output>
                </span>
                <span className="present-slider-track">
                  <input
                    type="range"
                    min={v.min}
                    max={v.max}
                    step={v.step}
                    value={values[v.id] ?? v.defaultValue}
                    disabled={!exploring || !active}
                    onChange={(e) => setValues((s) => ({ ...s, [v.id]: parseFloat(e.target.value) }))}
                    data-testid={`present-formula-slider-${v.id}`}
                  />
                  {swept && (
                    <span className="present-ghost" style={{ left: `${pct(values[v.id], v.min, v.max)}%` }} aria-hidden>
                      <Pointer size={26} />
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      </div>
      <div className="present-formula-metrics">
        {metrics.map((m, i) => {
          const val = computed[m.id] ?? 0
          const range = ranges[m.id] ?? { min: 0, max: 100 }
          return (
            <div key={m.id} className="present-gauge" {...mark(0, { delay: 800 + i * 110 })} {...pick(m)}>
              <span className="present-gauge-head">
                <span {...pick(m, 'label')}>{m.label}</span>
                <span className="present-gauge-value">{getMetricUnitAndFormat(m, val).display}</span>
              </span>
              <span className="present-gauge-track"><span className="present-gauge-fill" style={{ width: `${pct(val, range.min, range.max)}%` }} /></span>
              <span className="present-gauge-desc" {...pick(m, 'description')}>{m.description}</span>
            </div>
          )
        })}
        <p className="present-formula-caption" {...mark(sweepBeat >= 0 ? sweepBeat : exploreBeat, { motion: 'fade' })}>
          {exploring || sweepBeat < 0 ? 'Drag the sliders to see how each metric responds.' : `Watch what happens as ${first.label} goes from ${first.defaultValue} to ${first.max}.`}
        </p>
      </div>
    </div>
  )
}
