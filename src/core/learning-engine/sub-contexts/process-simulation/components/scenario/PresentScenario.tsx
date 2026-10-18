import { useMemo } from 'react'
import { AlertCircle, ArrowRight, Check, CheckCircle2, X } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import type { ScenarioOutcome } from '../../schema'
import { scenarioPlan, scenarioText, type ScenarioPresentData } from '../../present'
import { RATING_BG, RATING_COLORS, RATING_LABELS } from './index'
import './scenario.css'
import '../present.css'

type ScenarioRating = ScenarioOutcome['rating']

const LETTERS = 'ABCDEFGH'
const GRADES: Record<ScenarioRating, string> = { 'a': 'A', 'b-plus': 'B+', 'b-minus': 'B−', 'c': 'C' }
const good = (rating: ScenarioRating) => rating === 'a' || rating === 'b-plus'

/**
 * Scenario in Present mode (scenarioPlan), walked by the stage (decisions 103 and 110): the setup and
 * the first situation arrive; then a weaker path is taken choice by choice, each choice lighting up on
 * the card it is asked on while the others step back, then joining the trail above as the card turns
 * into the next situation, until its outcome lands with its grade; then the walk goes back to the fork,
 * where the choice tried is struck through, and follows the best path to its outcome.
 */
export default function PresentScenario({ data, beat }: PresentRendererProps<ScenarioPresentData>) {
  const pick = usePickAnchors()
  const mark = beatMarks(beat)
  const nodes = data.nodes ?? {}
  const plan = useMemo(() => scenarioPlan(data), [data])
  const at = Math.min(Math.max(0, beat), Math.max(0, plan.length - 1))
  const step = plan[at]
  const path = step?.path ?? [{ nodeId: data.startNode ?? 'start' }]
  const here = path[path.length - 1]
  const node = nodes[here.nodeId]
  const outcome = node?.outcome
  // The beat the card on stage arrived on: it stays while its choice is picked on the next beat
  const sameCard = (k: number) => plan[k]?.path.length === path.length && plan[k]?.path[path.length - 1]?.nodeId === here.nodeId
  let askAt = at
  while (askAt > 0 && sameCard(askAt - 1)) askAt--
  const pickAt = step?.picked ? at : -1

  return (
    <div className="present-scenario scenario-section" data-testid="present-scenario">
      {data.intro && path.length === 1 && (
        <div className="scenario-intro">
          <div className="scenario-intro-card present-scenario-intro" {...mark(0, { motion: 'fade' })}>
            <div className="scenario-intro-header">
              <div className="scenario-intro-icon" aria-hidden>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="scenario-intro-text" {...mark(0, { motion: 'words' })} {...(data.id ? pick.byId('Scenario', data.id, 'intro') : {})}>
                <PresentWords text={data.intro} />
              </p>
            </div>
          </div>
        </div>
      )}
      {path.length > 1 && (
        <ol className="present-trail" aria-label="Choices made">
          {path.slice(1).map((p, i) => {
            const newest = i === path.length - 2
            return (
              <li key={`${i}-${p.nodeId}`} {...(newest && mark(askAt, { motion: 'unfold' }))}>
                <span className="present-trail-dot" aria-hidden />
                <span className="present-trail-text">{p.choice ? scenarioText(p.choice) : p.nodeId}</span>
              </li>
            )
          })}
        </ol>
      )}
      {outcome ? (
        <div key={`outcome-${at}`} className="scenario-outcome" role="status" {...mark(askAt, { motion: 'zoom', delay: 250, sound: good(outcome.rating) ? 'success' : 'error' })}>
          <div className="scenario-outcome-card" style={{ borderColor: RATING_COLORS[outcome.rating], backgroundColor: RATING_BG[outcome.rating] }} {...focus(beat === askAt)} {...pick(outcome)}>
            <div className="scenario-outcome-header">
              {good(outcome.rating)
                ? <CheckCircle2 className="scenario-outcome-icon" style={{ color: RATING_COLORS[outcome.rating] }} />
                : <AlertCircle className="scenario-outcome-icon" style={{ color: RATING_COLORS[outcome.rating] }} />}
              <h4 className="scenario-outcome-title">Outcome</h4>
              <span
                className="scenario-rating-badge"
                style={{ backgroundColor: RATING_COLORS[outcome.rating], color: 'var(--ctp-crust)' }}
                aria-label={`${RATING_LABELS[outcome.rating]}, grade ${GRADES[outcome.rating]}`}
              >
                {RATING_LABELS[outcome.rating]} · {GRADES[outcome.rating]}
              </span>
            </div>
            <div className="scenario-outcome-body">
              <div className="scenario-outcome-block">
                <span className="scenario-outcome-block-label">What Happened</span>
                <p className="scenario-outcome-block-text" {...pick(outcome, 'verdict')}>{outcome.verdict}</p>
              </div>
              <div className="scenario-outcome-block">
                <span className="scenario-outcome-block-label">Key Lesson</span>
                <p className="scenario-outcome-block-text" {...pick(outcome, 'lesson')}>{outcome.lesson}</p>
              </div>
            </div>
          </div>
        </div>
      ) : node ? (
        <div
          key={`node-${path.length}-${here.nodeId}`}
          className={`scenario-decision${step?.picked ? ' is-answered' : ''}`}
          {...mark(askAt, { motion: 'fade', delay: askAt === 0 && data.intro ? 400 : 250 })}
          {...pick(node)}
        >
          <div className="scenario-decision-header">
            <span className="scenario-step-counter">Step {path.length}</span>
          </div>
          <h4 className="scenario-decision-prompt" {...mark(askAt, { motion: 'words', delay: askAt === 0 && data.intro ? 600 : 350 })} {...focus(beat === askAt)} {...pick(node, 'prompt')}>
            <PresentWords text={node.prompt ?? node.text ?? ''} />
          </h4>
          <div className="scenario-choices" role="list" aria-label="Choices">
            {(node.choices ?? []).map((c, j) => {
              const isPicked = !!step?.picked && c === step.picked
              const isTried = !!step?.tried && c === step.tried
              const cls = ['scenario-choice', isPicked && 'is-picked', isTried && 'is-tried', step?.picked && !isPicked && 'is-dim'].filter(Boolean).join(' ')
              return (
                <div
                  key={c.id ?? j}
                  role="listitem"
                  className={cls}
                  data-testid={`present-scenario-choice-${c.id ?? j}`}
                  {...mark(askAt, { delay: (askAt === 0 && data.intro ? 1200 : 700) + j * 70 })}
                  {...focus(isPicked && beat === pickAt)}
                  {...pick(c)}
                >
                  <span className="scenario-choice-badge" aria-hidden>{LETTERS[j]}</span>
                  <span className="scenario-choice-text" {...pick(c, 'text')}>{scenarioText(c)}</span>
                  {isTried && <X className="present-scenario-tried" aria-label="Tried before" />}
                  {isPicked
                    ? <Check className="present-scenario-picked" aria-label="Chosen" {...mark(pickAt, { motion: 'pop', delay: 250, sound: 'click' })} />
                    : <ArrowRight className="scenario-choice-arrow" aria-hidden />}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
