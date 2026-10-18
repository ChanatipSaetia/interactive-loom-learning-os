import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ThumbsUp } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { TradeoffMetricDef, TradeoffScenario } from '../../schema'
import { tradeoffPlan, type TradeoffPresentData } from '../../present'
import '../present.css'

const good = (metric: TradeoffMetricDef, delta: number) => ((metric.direction ?? 'higher') === 'higher' ? delta > 0 : delta < 0)

/** The scenario's metrics after the chosen choices (the Read sandbox's sum of deltas on the base values). */
function totals(scenario: TradeoffScenario, chosen: Record<string, string>): Record<string, number> {
  const values = Object.fromEntries(scenario.metrics.map((m) => [m.id, m.baseValue]))
  for (const step of scenario.steps) {
    const choice = step.choices.find((c) => c.id === chosen[step.id])
    for (const [id, delta] of Object.entries(choice?.metrics ?? {})) values[id] = (values[id] ?? 0) + delta
  }
  return values
}

/** The learner's sandbox: pick a choice per step and watch the metrics move. */
function Sandbox({ scenario, live }: { scenario: TradeoffScenario; live: boolean }) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const values = totals(scenario, chosen)
  return (
    <div className="present-sandbox">
      <div className="present-sandbox-meters">
        {scenario.metrics.map((m) => {
          const v = values[m.id] ?? m.baseValue
          const lo = m.min ?? 0
          const hi = m.max ?? 100
          const delta = v - m.baseValue
          return (
            <div key={m.id} className="present-meter" {...pick(m)}>
              <span className="present-meter-head">
                <span {...pick(m, 'label')}>{m.label}</span>
                <span className={`present-meter-value${delta ? (good(m, delta) ? ' is-good' : ' is-bad') : ''}`}>{v}</span>
              </span>
              <span className="present-meter-track">
                <span className={`present-meter-fill${delta ? (good(m, delta) ? ' is-good' : ' is-bad') : ''}`} style={{ width: `${Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100))}%` }} />
              </span>
            </div>
          )
        })}
      </div>
      <div className="present-sandbox-steps">
        {scenario.steps.map((step) => (
          <div key={step.id} className="present-sandbox-step" {...pick(step)}>
            <span className="present-sandbox-step-title" {...pick(step, 'title')}>{step.title}</span>
            <span className="present-sandbox-pills" role="group" aria-label={step.title}>
              {step.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="present-pill"
                  aria-pressed={chosen[step.id] === c.id}
                  disabled={!live}
                  onClick={() => {
                    playSound('click')
                    setChosen((s) => (s[step.id] === c.id ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== step.id)) : { ...s, [step.id]: c.id }))
                  }}
                  {...pick(c)}
                >
                  {c.label}
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Tradeoff sandbox in Present mode (tradeoffBeats): per step, its choices arrive side by side with each
 * effect's bar growing (green where it helps, red where it costs); then the recommended choice comes
 * forward with why it fits while the others step back. The last beat is the sandbox, scenario by scenario.
 */
export default function PresentTradeoff({ data, beat, beats, active }: PresentRendererProps<TradeoffPresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const scenarios = useMemo(() => data.scenarios ?? [], [data.scenarios])
  const plan = useMemo(() => tradeoffPlan(data), [data])
  const exploreBeat = beats.length - 1
  const exploring = plan.length > 0 && beat >= exploreBeat
  const [tab, setTab] = useState(0)

  // The beats of each step: where its choices arrive, and where its recommendation does (if any)
  const steps = plan.flatMap((b, i) => (b.recommended ? [] : [{ ...b, at: i, rec: plan[i + 1]?.recommended ? i + 1 : -1 }]))

  return (
    <div className="present-tradeoff" data-testid="present-tradeoff">
      {steps.map(({ scenario: si, step: ki, at, rec }) => {
        const scenario = scenarios[si]
        const step = scenario.steps[ki]
        const last = Math.max(at, rec)
        const maxDelta = Math.max(1, ...step.choices.flatMap((c) => Object.values(c.metrics).map(Math.abs)))
        const focused = rec >= 0 && beat >= rec
        return (
          <div key={`${si}-${ki}`} className="present-tradeoff-step" {...mark(at, { motion: 'fade', until: last })} {...pick(step)}>
            <p className="present-tradeoff-kicker">{scenarios.length > 1 ? `${scenario.title} · ` : ''}Step {ki + 1} of {scenario.steps.length}</p>
            <p className="present-tradeoff-title" {...mark(at, { motion: 'words' })} {...pick(step, 'title')}><PresentWords text={step.title} /></p>
            {step.description && <p className="present-tradeoff-desc" {...mark(at, { delay: 300 })} {...pick(step, 'description')}>{step.description}</p>}
            <div className="present-tradeoff-choices">
              {step.choices.map((c, j) => {
                const isRec = step.recommended === c.id
                return (
                  <div
                    key={c.id}
                    className={`present-tradeoff-card${focused && isRec ? ' is-rec' : ''}${focused && !isRec ? ' is-back' : ''}`}
                    {...mark(at, { delay: 500 + j * 110 })}
                    {...pick(c)}
                  >
                    <span className="present-tradeoff-card-head">
                      <span className="present-tradeoff-card-label" {...pick(c, 'label')}>{c.label}</span>
                      {isRec && rec >= 0 && <span className="present-rec-badge" {...mark(rec, { motion: 'pop', delay: 250 })}><ThumbsUp size={13} aria-hidden /> Recommended</span>}
                    </span>
                    <span className="present-tradeoff-card-desc" {...pick(c, 'description')}>{c.description}</span>
                    <span className="present-effects">
                      {scenario.metrics.filter((m) => c.metrics[m.id]).map((m, k) => {
                        const d = c.metrics[m.id]
                        return (
                          <span key={m.id} className={`present-effect ${good(m, d) ? 'is-good' : 'is-bad'}`}>
                            <span className="present-effect-label">{m.label} <b>{d > 0 ? '+' : '−'}{Math.abs(d)}</b></span>
                            <span className="present-effect-bar" style={{ width: `${(Math.abs(d) / maxDelta) * 100}%` }} {...mark(at, { motion: 'draw', delay: 800 + j * 110 + k * 70 })} />
                          </span>
                        )
                      })}
                    </span>
                    {isRec && rec >= 0 && (c.whyThisFits || c.whenToUse) && (
                      <span className="present-tradeoff-why" {...mark(rec, { motion: 'words', delay: 450 })} {...pick(c, c.whyThisFits ? 'whyThisFits' : 'whenToUse')}>
                        <PresentWords text={(c.whyThisFits ?? c.whenToUse) as string} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {plan.length > 0 && (
        <div className="present-tradeoff-step" {...mark(exploreBeat, { motion: 'fade' })}>
          {scenarios.length > 1 && (
            <div className="present-tabs" role="tablist">
              {scenarios.map((s, i) => (
                <button key={s.id} type="button" role="tab" aria-selected={tab === i} className="present-pill" disabled={!exploring || !active} onClick={() => setTab(i)} {...pick(s, 'title')}>{s.title}</button>
              ))}
            </div>
          )}
          <p className="present-tradeoff-kicker" {...mark(exploreBeat, { motion: 'fade', delay: 200 })}>Try a combination: pick one choice per step.</p>
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Sandbox scenario={scenarios[tab]} live={exploring && active} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
