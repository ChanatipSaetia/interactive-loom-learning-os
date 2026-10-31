import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { QUIET, focus, lead, type BeatMarkAttributes } from '../../../present-kernel'
import type { TradeoffScenario } from '../../schema'
import { MetricBar } from './index'

type Props = {
  scenario: TradeoffScenario
  compact?: boolean
  rowMarks?: (index: number) => BeatMarkAttributes
}

/** The recommended configuration and its authored reasoning, kept together on one page. */
export function TradeoffConclusion({ scenario, compact = false, rowMarks }: Props) {
  const pick = usePickAnchors()
  const decisions = scenario.steps.map((step) => ({ step, choice: step.choices.find((c) => c.id === step.recommended) }))
  const values = Object.fromEntries(scenario.metrics.map((metric) => [metric.id, metric.baseValue]))
  for (const { choice } of decisions) {
    for (const [id, delta] of Object.entries(choice?.metrics ?? {})) values[id] = (values[id] ?? 0) + delta
  }
  const text = (value: string) => compact ? lead(value, 2) : value
  return <section className={`tradeoff-conclusion${compact ? ' is-compact' : ''}`} aria-label="Recommended options" data-testid="tradeoff-conclusion">
    <header className="tradeoff-conclusion-heading">
      <span className="compare-step-eyebrow">Conclusion</span>
      <h3 {...focus(compact)}>Recommended approach</h3>
    </header>
    <ol className="tradeoff-conclusion-decisions">
      {decisions.map(({ step, choice }, index) => {
        const reason = choice?.whyThisFits ?? choice?.whenToUse
        const compromise = choice?.cons[0]
        return <li key={step.id} className="tradeoff-conclusion-row" {...rowMarks?.(index)} {...pick(step)}>
          <div className="tradeoff-conclusion-decision"><span {...QUIET}>{index + 1}</span><h4 {...pick(step, 'title')}>{step.title}</h4></div>
          <div className="tradeoff-conclusion-explanation">
            {choice ? <>
              <h4 {...pick(choice, 'label')}>{choice.label}</h4>
              {!compact && choice.description && <p {...pick(choice, 'description')}>{choice.description}</p>}
              <div className="tradeoff-conclusion-reasoning">
                <div><span className="tradeoff-conclusion-label">Why this fits</span><p {...pick(choice, reason === choice.whyThisFits ? 'whyThisFits' : reason ? 'whenToUse' : 'description')}>{reason ? text(reason) : choice.description ? text(choice.description) : 'No rationale provided.'}</p></div>
                <div><span className="tradeoff-conclusion-label is-cost">Main compromise</span>{compromise ? <p {...pick(compromise, 'title')}>{compromise.title}{!compact && compromise.description && <span {...pick(compromise, 'description')}> — {compromise.description}</span>}</p> : <p>No compromise specified.</p>}</div>
              </div>
            </> : <p className="tradeoff-conclusion-missing">No recommendation provided.</p>}
          </div>
        </li>
      })}
    </ol>
    <footer className="tradeoff-conclusion-overall" {...QUIET}>
      <h4>Overall result <span>{decisions.filter((d) => d.choice).length} / {decisions.length} decisions recommended</span></h4>
      <div className="tradeoff-conclusion-metrics">{scenario.metrics.map((metric) => <MetricBar key={metric.id} instanceId={`conclusion-${scenario.id}`} metric={metric} value={values[metric.id] ?? metric.baseValue} max={metric.max ?? 100} />)}</div>
    </footer>
  </section>
}
