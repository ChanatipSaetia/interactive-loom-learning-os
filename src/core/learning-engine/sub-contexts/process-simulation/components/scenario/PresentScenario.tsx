import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react'
import { Button } from '../../../../../ui-system/motion/button'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { SAY, beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { ScenarioChoice, ScenarioOutcome } from '../../schema'
import type { ScenarioPresentData } from '../../present'
import { RATING_BG, RATING_COLORS, RATING_LABELS } from './index'
import './scenario.css'
import '../present.css'

type ScenarioRating = ScenarioOutcome['rating']

const LETTERS = 'ABCDEFGH'
const GRADES: Record<ScenarioRating, string> = { 'a': 'A', 'b-plus': 'B+', 'b-minus': 'B−', 'c': 'C' }
const EASE = [0.16, 1, 0.3, 1] as const

const nextOf = (c: ScenarioChoice) => c.next ?? c.nextNode ?? ''
const textOf = (c: ScenarioChoice) => c.text ?? c.label ?? ''

/**
 * Scenario in Present mode (scenarioBeats): the setup and the first situation arrive, then the learner
 * chooses. Each choice joins the trail above and the card turns into the next situation, until an
 * outcome lands with its grade. Try another path goes back to the last fork with more than one choice.
 */
export default function PresentScenario({ data, beat, active, gate }: PresentRendererProps<ScenarioPresentData>) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const mark = beatMarks(beat)
  const nodes = data.nodes ?? {}
  const start = data.startNode ?? 'start'
  /** The nodes visited, each with the choice that led there. */
  const [path, setPath] = useState<Array<{ nodeId: string; choice?: ScenarioChoice }>>([{ nodeId: start }])
  const here = path[path.length - 1]
  const node = nodes[here.nodeId]
  const outcome = node?.outcome
  const live = active && beat >= 1

  const choose = (choice: ScenarioChoice) => {
    const next = nodes[nextOf(choice)]
    if (!live || !next) return
    setPath((p) => [...p, { nodeId: nextOf(choice), choice }])
    if (next.outcome) {
      playSound(next.outcome.rating === 'a' || next.outcome.rating === 'b-plus' ? 'success' : 'error')
      gate.solve()
    } else {
      playSound('whoosh')
    }
  }
  const fork = path.slice(0, -1).map((p, i) => ({ i, n: nodes[p.nodeId]?.choices?.length ?? 0 })).filter((f) => f.n > 1).pop()
  const tryAnother = () => {
    if (!fork) return
    playSound('stepPrev')
    setPath((p) => p.slice(0, fork.i + 1))
  }

  return (
    <div className="present-scenario scenario-section" data-testid="present-scenario">
      <AnimatePresence initial={false}>
        {data.intro && path.length === 1 && (
          <motion.div key="intro" className="scenario-intro" exit={{ opacity: 0, height: 0, marginBottom: -16 }} transition={{ duration: 0.35, ease: EASE }}>
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
          </motion.div>
        )}
      </AnimatePresence>
      {path.length > 1 && (
        <ol className="present-trail" aria-label="Your choices">
          {path.slice(1).map((p, i) => (
            <motion.li key={`${i}-${p.nodeId}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: EASE }}>
              <span className="present-trail-dot" aria-hidden />
              <span className="present-trail-text">{p.choice ? textOf(p.choice) : p.nodeId}</span>
            </motion.li>
          ))}
        </ol>
      )}
      <AnimatePresence mode="wait" initial={false}>
        {outcome ? (
          <motion.div
            key={`outcome-${here.nodeId}`}
            className="scenario-outcome"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45, ease: EASE }}
            role="status"
          >
            <div className="scenario-outcome-card" style={{ borderColor: RATING_COLORS[outcome.rating], backgroundColor: RATING_BG[outcome.rating] }} {...pick(outcome)}>
              <div className="scenario-outcome-header">
                {outcome.rating === 'a' || outcome.rating === 'b-plus'
                  ? <CheckCircle2 className="scenario-outcome-icon" style={{ color: RATING_COLORS[outcome.rating] }} />
                  : <AlertCircle className="scenario-outcome-icon" style={{ color: RATING_COLORS[outcome.rating] }} />}
                <h4 className="scenario-outcome-title">Outcome</h4>
                <motion.span
                  className="scenario-rating-badge"
                  style={{ backgroundColor: RATING_COLORS[outcome.rating], color: 'var(--ctp-crust)' }}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 380, damping: 18 }}
                  aria-label={`${RATING_LABELS[outcome.rating]}, grade ${GRADES[outcome.rating]}`}
                >
                  {RATING_LABELS[outcome.rating]} · {GRADES[outcome.rating]}
                </motion.span>
              </div>
              <div className="scenario-outcome-body">
                <div className="scenario-outcome-block">
                  <span className="scenario-outcome-block-label">What Happened</span>
                  <p className="scenario-outcome-block-text" {...SAY} {...pick(outcome, 'verdict')}>{outcome.verdict}</p>
                </div>
                <div className="scenario-outcome-block">
                  <span className="scenario-outcome-block-label">Key Lesson</span>
                  <p className="scenario-outcome-block-text" {...SAY} {...pick(outcome, 'lesson')}>{outcome.lesson}</p>
                </div>
              </div>
              {fork && (
                <div className="scenario-outcome-footer">
                  <Button variant="outline" size="sm" onClick={tryAnother} disabled={!live} data-testid="present-scenario-again">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try another path
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        ) : node ? (
          <motion.div
            key={`node-${here.nodeId}`}
            className="scenario-decision"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.4, ease: EASE }}
            {...mark(0, { motion: 'fade', delay: data.intro ? 400 : 0 })}
            {...pick(node)}
          >
            <div className="scenario-decision-header">
              <span className="scenario-step-counter">Step {path.length}</span>
            </div>
            <h4 className="scenario-decision-prompt" {...mark(0, { motion: 'words', delay: data.intro ? 600 : 0 })} {...pick(node, 'prompt')}>
              <PresentWords text={node.prompt ?? node.text ?? ''} />
            </h4>
            <div className="scenario-choices" role="group" aria-label="What do you do?">
              {(node.choices ?? []).map((c, j) => (
                <button
                  key={c.id ?? j}
                  type="button"
                  className={`scenario-choice${live ? ' present-breathe' : ''}`}
                  onClick={() => choose(c)}
                  disabled={!live}
                  data-testid={`present-scenario-choice-${c.id ?? j}`}
                  {...mark(0, { delay: (data.intro ? 1200 : 600) + j * 70 })}
                  {...pick(c)}
                >
                  <span className="scenario-choice-badge" aria-hidden>{LETTERS[j]}</span>
                  <span className="scenario-choice-text" {...pick(c, 'text')}>{textOf(c)}</span>
                  <ArrowRight className="scenario-choice-arrow" aria-hidden />
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
