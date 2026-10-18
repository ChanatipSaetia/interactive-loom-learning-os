import { useMemo, type CSSProperties } from 'react'
import { Check, Star, X } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, lead, type PresentRendererProps } from '../../../present-kernel'
import type { TradeoffMetricDef, TradeoffScenario } from '../../schema'
import { tradeoffPlan, tradeoffSummaries, type TradeoffPresentData } from '../../present'
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

/** Read's "Try it" tab with the recommended choice picked at every step: the metric dashboard and one card per step. */
function Summary({ scenario }: { scenario: TradeoffScenario }) {
  const pick = usePickAnchors()
  const chosen = Object.fromEntries(scenario.steps.flatMap((st) => (st.recommended ? [[st.id, st.recommended]] : [])))
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
      <div className="steps-panel present-sandbox-steps" {...QUIET}>
        {scenario.steps.map((step) => (
          <div key={step.id} className={`step-section${chosen[step.id] ? '' : ' step-section-unselected'}`} {...pick(step)}>
            <div className="step-header">
              <h4 className="step-title" {...pick(step, 'title')}>{step.title}</h4>
            </div>
            <span className="present-sandbox-pills" role="list" aria-label={step.title}>
              {step.choices.filter((c) => chosen[step.id] === c.id).map((c) => (
                <span key={c.id} role="listitem" className="present-pill is-on" {...pick(c)}>
                  <Star size={11} className="present-pill-star" aria-label="Recommended" />
                  {c.label}
                </span>
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
 * side by side by name, each effect chip popping in (green where it helps, red where it costs); then each
 * choice in turn comes forward while the panel under the cards lists its gains and costs (decision 112);
 * then the recommended choice takes its star and the panel says why it fits while the others dim.
 * Descriptions stay in Read (decision 109). Last, each scenario shows Read's "Try it" metrics with the
 * recommended choices picked.
 */
export default function PresentTradeoff({ data, beat }: PresentRendererProps<TradeoffPresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const scenarios = useMemo(() => data.scenarios ?? [], [data.scenarios])
  const plan = useMemo(() => tradeoffPlan(data), [data])
  const summaries = useMemo(() => tradeoffSummaries(data), [data])

  // The beats of each step: where its choices arrive, where each choice is weighed, where its recommendation lands
  const steps = plan.flatMap((b, at) => {
    if (b.show !== 'choices') return []
    let end = at
    while (plan[end + 1] && plan[end + 1].show !== 'choices') end++
    const own = plan.slice(at + 1, end + 1).map((x, k) => ({ ...x, at: at + 1 + k }))
    return [{ ...b, at, end, weighed: own.filter((x) => x.show === 'choice'), rec: own.find((x) => x.show === 'recommended')?.at ?? -1 }]
  })

  return (
    <div className="present-tradeoff compare-scenarios" data-testid="present-tradeoff">
      {steps.map(({ scenario: si, step: ki, at, end, weighed, rec }) => {
        const scenario = scenarios[si]
        const step = scenario.steps[ki]
        const focused = rec >= 0 && beat >= rec
        const weighing = weighed.find((w) => w.at === beat)?.choice
        const columns = step.choices.length === 4 ? 2 : Math.min(step.choices.length, 3)
        const recChoice = step.choices.find((c) => c.id === step.recommended)
        const why = recChoice?.whyThisFits ?? recChoice?.whenToUse
        return (
          <section key={`${si}-${ki}`} className="compare-step present-tradeoff-step" {...mark(at, { motion: 'fade', until: end })} {...pick(step)}>
            <header className="compare-step-header">
              <span className="compare-step-eyebrow">{scenarios.length > 1 ? `${scenario.title} · ` : ''}Question {ki + 1} of {scenario.steps.length}</span>
              <h5 className="compare-step-title" {...mark(at, { motion: 'words' })} {...focus(beat === at)} {...pick(step, 'title')}><PresentWords text={step.title} /></h5>
              {step.description && <p className="compare-step-desc" {...mark(at, { delay: 300 })} {...pick(step, 'description')}>{lead(step.description)}</p>}
            </header>
            <div className="compare-grid" style={{ '--compare-cols': columns } as CSSProperties}>
              {step.choices.map((c, j) => {
                const isRec = step.recommended === c.id
                const effects = scenario.metrics.filter((m) => c.metrics[m.id])
                const cls = [
                  'compare-card',
                  weighing === j && 'present-tradeoff-weighing',
                  weighing !== undefined && weighing !== j && 'compare-card-dimmed',
                  focused && isRec && 'compare-card-recommended compare-card-focused present-tradeoff-rec',
                  focused && !isRec && 'compare-card-dimmed',
                ].filter(Boolean).join(' ')
                return (
                  <div key={c.id} className={cls} {...mark(at, { delay: 500 + j * 110 })} {...focus((isRec && beat === rec) || weighing === j)} {...pick(c)}>
                    <div className="compare-card-header">
                      <span className="compare-card-label" {...pick(c, 'label')}>{c.label}</span>
                      {isRec && rec >= 0 && (
                        <span className="compare-recommended-badge" title="Recommended" aria-label="Recommended" {...mark(rec, { motion: 'pop', delay: 250 })}>
                          <Star size={14} style={{ fill: 'currentColor' }} />
                        </span>
                      )}
                    </div>
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
                  </div>
                )
              })}
            </div>
            {(weighed.length > 0 || (rec >= 0 && why)) && (
              <div className="present-scenes present-tradeoff-panel">
                {weighed.map((w, n) => {
                  const c = step.choices[w.choice ?? 0]
                  return (
                    <div key={c.id} className="present-tradeoff-procons" {...mark(w.at, { motion: 'fade', ...((n < weighed.length - 1 || rec >= 0) && { until: w.at }) })}>
                      <p className="present-tradeoff-panel-title" {...mark(w.at, { motion: 'fade' })}>{c.label}</p>
                      {c.pros.length > 0 && (
                        <div className="compare-block compare-block-gains">
                          <span className="compare-block-title">Gains</span>
                          <ul className="compare-pros">
                            {c.pros.map((pro, p) => (
                              <li key={p} className="compare-pro" {...mark(w.at, { motion: 'unfold', delay: 250 + p * 140 })} {...pick(pro)}>
                                <Check className="compare-icon compare-icon-pro" strokeWidth={3} />
                                <span className="compare-procon-title" {...pick(pro, 'title')}>{pro.title}</span>
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
                              <li key={p} className="compare-con" {...mark(w.at, { motion: 'unfold', delay: 250 + (c.pros.length + p) * 140 })} {...pick(con)}>
                                <X className="compare-icon compare-icon-con" strokeWidth={3} />
                                <span className="compare-procon-title" {...pick(con, 'title')}>{con.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
                {rec >= 0 && recChoice && why && (
                  <div className="present-tradeoff-why compare-card-details" {...mark(rec, { motion: 'fade', delay: 350 })} {...pick(recChoice, recChoice.whyThisFits ? 'whyThisFits' : 'whenToUse')}>
                    <p className="present-tradeoff-panel-title"><Star size={14} className="present-pill-star" aria-hidden /> {recChoice.label} · {recChoice.whyThisFits ? 'Why it fits' : 'When to use'}</p>
                    <p><PresentWords text={lead(why, 2)} /></p>
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}
      {summaries.map((si, k) => {
        const at = plan.length + k
        const scenario = scenarios[si]
        return (
          <div key={scenario.id} className="present-tradeoff-step present-tradeoff-try" {...mark(at, { motion: 'fade', ...(k < summaries.length - 1 && { until: at }) })}>
            {scenarios.length > 1 && <p className="compare-step-eyebrow" {...pick(scenario, 'title')}>{scenario.title}</p>}
            <p className="compare-step-hint">The recommended choice at every step</p>
            <div {...focus(beat === at)}>
              <Summary scenario={scenario} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
