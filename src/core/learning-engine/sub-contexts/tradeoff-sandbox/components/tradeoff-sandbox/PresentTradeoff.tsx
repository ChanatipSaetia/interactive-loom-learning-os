import { useMemo } from 'react'
import { Check, Star, X } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, lead, type PresentRendererProps } from '../../../present-kernel'
import type { TradeoffMetricDef } from '../../schema'
import { tradeoffPlan, tradeoffSummaries, type TradeoffPresentData } from '../../present'
import { TradeoffConclusion } from './TradeoffConclusion'
import './tradeoff-sandbox.css'
import '../present.css'

const good = (metric: TradeoffMetricDef, delta: number) => ((metric.direction ?? 'higher') === 'higher' ? delta > 0 : delta < 0)

/**
 * Tradeoff sandbox in Present mode (tradeoffBeats), on Read's compare cards: per step, its choices arrive
 * in a shared metric comparison table (signs only; green where it helps, red where it costs); then each
 * choice column is highlighted while the panel below lists its gains and costs (decision 112).
 * The recommended column takes its star and the panel says why it fits; other options stay readable.
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
    while (plan[end + 1] && !['choices', 'situation'].includes(plan[end + 1].show)) end++
    const own = plan.slice(at + 1, end + 1).map((x, k) => ({ ...x, at: at + 1 + k }))
    const rec = own.find((x) => x.show === 'recommended')?.at ?? -1
    return [{ ...b, at, end: rec >= 0 ? rec - 1 : end, weighed: own.filter((x) => x.show === 'choice'), rec }]
  })

  return (
    <div className="present-tradeoff compare-scenarios" data-testid="present-tradeoff">
      {plan.map((item, at) => {
        const scenario = scenarios[item.scenario]
        if (item.show === 'situation') return <section key={`situation-${at}`} className="present-tradeoff-context" {...mark(at, { motion: 'fade', until: at })} {...pick(scenario)}>
          <p className="compare-step-eyebrow">Situation</p>
          <h3 {...focus(beat === at)} {...pick(scenario, 'title')}>{scenario.title}</h3>
          {scenario.description && <p {...pick(scenario, 'description')}>{scenario.description}</p>}
        </section>
        if (item.show !== 'recommended') return null
        const step = scenario.steps[item.step]
        const choice = step.choices.find((c) => c.id === step.recommended)
        if (!choice) return null
        const why = choice.whyThisFits ?? choice.whenToUse
        return <section key={`recommendation-${at}`} className="present-tradeoff-context" {...mark(at, { motion: 'fade', until: at })} {...pick(choice)}>
          <p className="compare-step-eyebrow">Recommended · {step.title}</p>
          <h3 {...focus(beat === at)} {...pick(choice, 'label')}>{choice.label}</h3>
          {choice.description && <p {...pick(choice, 'description')}>{choice.description}</p>}
          {why && <div className="present-tradeoff-context-why"><h4>{choice.whyThisFits ? 'Why this fits' : 'When to use'}</h4><p {...pick(choice, choice.whyThisFits ? 'whyThisFits' : 'whenToUse')}>{why}</p></div>}
        </section>
      })}
      {steps.map(({ scenario: si, step: ki, at, end, weighed, rec }) => {
        const scenario = scenarios[si]
        const step = scenario.steps[ki]
        const focused = rec >= 0 && beat >= rec
        const weighing = weighed.find((w) => w.at === beat)?.choice
        const activeChoice = focused ? step.choices.findIndex((c) => c.id === step.recommended) : weighing
        const metrics = scenario.metrics.filter((m) => step.choices.some((c) => c.metrics[m.id]))
        return (
          <section key={`${si}-${ki}`} className="compare-step present-tradeoff-step" {...mark(at, { motion: 'fade', until: end })} {...pick(step)}>
            <header className="compare-step-header">
              <span className="compare-step-eyebrow">Question {ki + 1} of {scenario.steps.length}</span>
              <h5 className="compare-step-title" {...mark(at, { motion: 'words' })} {...focus(beat === at)} {...pick(step, 'title')}><PresentWords text={step.title} /></h5>
              {step.description && <p className="compare-step-desc" {...mark(at, { delay: 300 })} {...pick(step, 'description')}>{lead(step.description)}</p>}
            </header>
            <div className="present-tradeoff-table-wrap" {...mark(at, { motion: 'fade', delay: 350 })}>
              <table className="present-tradeoff-table" aria-label={`${step.title} metric comparison`}>
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    {step.choices.map((c, j) => <th key={c.id} scope="col" className={activeChoice === j ? 'is-active' : ''} {...focus(activeChoice === j)} {...pick(c)}>
                      <span {...pick(c, 'label')}>{c.label}</span>
                      {activeChoice === j && <span className="present-tradeoff-column-status" {...QUIET}>{focused ? <><Star size={12} aria-hidden /> Recommended</> : 'Exploring'}</span>}
                    </th>)}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => <tr key={m.id}>
                    <th scope="row" {...pick(m, 'label')}>{m.label}</th>
                    {step.choices.map((c, j) => {
                      const delta = c.metrics[m.id] ?? 0
                      return <td key={c.id} className={`${activeChoice === j ? 'is-active ' : ''}${delta ? good(m, delta) ? 'is-benefit' : 'is-cost' : 'is-neutral'}`} aria-label={`${c.label}: ${m.label} ${delta > 0 ? 'increases' : delta < 0 ? 'decreases' : 'unchanged'}`}>
                        <span aria-hidden="true">{delta > 0 ? '↑ Higher' : delta < 0 ? '↓ Lower' : '— Unchanged'}</span>
                      </td>
                    })}
                  </tr>)}
                </tbody>
              </table>
              <p className="present-tradeoff-table-key" {...QUIET}>↑ Higher · ↓ Lower · — Unchanged <span>Green: benefit · Red: cost</span></p>
            </div>
            {weighed.length > 0 && (
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
            <div>
              <TradeoffConclusion scenario={scenario} compact rowMarks={(index) => mark(at, { motion: 'fade', delay: 200 + index * 400 })} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
