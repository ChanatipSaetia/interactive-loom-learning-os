import { useMemo, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { Check, Star, X } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { TradeoffMetricDef, TradeoffScenario } from '../../schema'
import { tradeoffPlan, type TradeoffPresentData } from '../../present'
import { MetricBar } from './index'
import './tradeoff-sandbox.css'
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

/** The learner's sandbox, as Read's "Try it" tab: the metric dashboard, and one card per step to pick a choice in. */
function Sandbox({ scenario, live }: { scenario: TradeoffScenario; live: boolean }) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const values = totals(scenario, chosen)
  return (
    <div className="tradeoff-layout present-sandbox">
      <div className="metric-dashboard">
        <div className="dashboard-header">
          <h4 className="dashboard-title">Metric Dashboard</h4>
          <span className="progress-indicator">{Object.keys(chosen).length} / {scenario.steps.length}</span>
        </div>
        <div className="metric-bars">
          {scenario.metrics.map((m) => (
            <MetricBar key={m.id} metric={m} value={values[m.id] ?? m.baseValue} max={m.max ?? 100} />
          ))}
        </div>
      </div>
      <div className="steps-panel present-sandbox-steps">
        {scenario.steps.map((step) => (
          <div key={step.id} className={`step-section${chosen[step.id] ? '' : ' step-section-unselected'}`} {...pick(step)}>
            <div className="step-header">
              <h4 className="step-title" {...pick(step, 'title')}>{step.title}</h4>
            </div>
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
                  {step.recommended === c.id && <Star size={11} className="present-pill-star" aria-label="Recommended" />}
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
 * Tradeoff sandbox in Present mode (tradeoffBeats), on Read's compare cards: per step, its choices arrive
 * side by side, each effect chip popping in (green where it helps, red where it costs) above its gains
 * and costs; then the recommended choice comes forward with its star and why it fits while the others
 * dim. The last beat is Read's "Try it" sandbox, scenario by scenario.
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
    <div className="present-tradeoff compare-scenarios" data-testid="present-tradeoff">
      {steps.map(({ scenario: si, step: ki, at, rec }) => {
        const scenario = scenarios[si]
        const step = scenario.steps[ki]
        const last = Math.max(at, rec)
        const focused = rec >= 0 && beat >= rec
        const columns = step.choices.length === 4 ? 2 : Math.min(step.choices.length, 3)
        return (
          <section key={`${si}-${ki}`} className="compare-step present-tradeoff-step" {...mark(at, { motion: 'fade', until: last })} {...pick(step)}>
            <header className="compare-step-header">
              <span className="compare-step-eyebrow">{scenarios.length > 1 ? `${scenario.title} · ` : ''}Question {ki + 1} of {scenario.steps.length}</span>
              <h5 className="compare-step-title" {...mark(at, { motion: 'words' })} {...pick(step, 'title')}><PresentWords text={step.title} /></h5>
              {step.description && <p className="compare-step-desc" {...mark(at, { delay: 300 })} {...pick(step, 'description')}>{step.description}</p>}
            </header>
            <div className="compare-grid" style={{ '--compare-cols': columns } as CSSProperties}>
              {step.choices.map((c, j) => {
                const isRec = step.recommended === c.id
                const effects = scenario.metrics.filter((m) => c.metrics[m.id])
                const cls = [
                  'compare-card',
                  focused && isRec && 'compare-card-recommended compare-card-focused present-tradeoff-rec',
                  focused && !isRec && 'compare-card-dimmed',
                ].filter(Boolean).join(' ')
                return (
                  <div key={c.id} className={cls} {...mark(at, { delay: 500 + j * 110 })} {...pick(c)}>
                    <div className="compare-card-header">
                      <span className="compare-card-label" {...pick(c, 'label')}>{c.label}</span>
                      {isRec && rec >= 0 && (
                        <span className="compare-recommended-badge" title="Recommended" aria-label="Recommended" {...mark(rec, { motion: 'pop', delay: 250 })}>
                          <Star size={14} style={{ fill: 'currentColor' }} />
                        </span>
                      )}
                    </div>
                    {c.description && <p className="compare-card-summary" {...pick(c, 'description')}>{c.description}</p>}
                    {effects.length > 0 && (
                      <ul className="compare-effects" aria-label="Effects">
                        {effects.map((m, k) => {
                          const d = c.metrics[m.id]
                          return (
                            <li key={m.id} className={`compare-effect ${good(m, d) ? 'compare-effect-good' : 'compare-effect-bad'}`} {...mark(at, { motion: 'pop', delay: 800 + j * 110 + k * 70 })} {...pick(m, 'label')}>
                              {m.label} {d > 0 ? '+' : '−'}{Math.abs(d)}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {(c.pros.length > 0 || c.cons.length > 0) && (
                      <div className="present-procons">
                        {c.pros.length > 0 && (
                          <div className="compare-block compare-block-gains">
                            <span className="compare-block-title">Gains</span>
                            <ul className="compare-pros">
                              {c.pros.map((pro, p) => (
                                <li key={p} className="compare-pro" {...pick(pro)}>
                                  <Check className="compare-icon compare-icon-pro" strokeWidth={3} />
                                  <div className="compare-procon-content">
                                    <span className="compare-procon-title" {...pick(pro, 'title')}>{pro.title}</span>
                                    {pro.description && <span className="compare-procon-desc" {...pick(pro, 'description')}>{pro.description}</span>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {c.cons.length > 0 && (
                          <div className="compare-block compare-block-costs">
                            <span className="compare-block-title">Costs</span>
                            <ul className="compare-cons">
                              {c.cons.map((con, p) => (
                                <li key={p} className="compare-con" {...pick(con)}>
                                  <X className="compare-icon compare-icon-con" strokeWidth={3} />
                                  <div className="compare-procon-content">
                                    <span className="compare-procon-title" {...pick(con, 'title')}>{con.title}</span>
                                    {con.description && <span className="compare-procon-desc" {...pick(con, 'description')}>{con.description}</span>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {isRec && rec >= 0 && (c.whyThisFits || c.whenToUse) && (
                      <div className="compare-card-details" {...mark(rec, { delay: 350 })}>
                        <p {...pick(c, c.whyThisFits ? 'whyThisFits' : 'whenToUse')}>
                          <span className="compare-block-title">{c.whyThisFits ? 'Why it fits' : 'When to use'}</span>
                          <PresentWords text={(c.whyThisFits ?? c.whenToUse) as string} />
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
      {plan.length > 0 && (
        <div className="present-tradeoff-step present-tradeoff-try" {...mark(exploreBeat, { motion: 'fade' })}>
          {scenarios.length > 1 && (
            <div className="present-tabs" role="tablist">
              {scenarios.map((s, i) => (
                <button key={s.id} type="button" role="tab" aria-selected={tab === i} className="present-pill" disabled={!exploring || !active} onClick={() => setTab(i)} {...pick(s, 'title')}>{s.title}</button>
              ))}
            </div>
          )}
          <p className="compare-step-hint" {...mark(exploreBeat, { motion: 'fade', delay: 200 })}>Try a combination: pick one choice per step.</p>
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Sandbox scenario={scenarios[tab]} live={exploring && active} />
          </motion.div>
        </div>
      )}
    </div>
  )
}
