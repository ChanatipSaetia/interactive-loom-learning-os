import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { SAY, beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { ScenarioChoice, ScenarioOutcome } from '../../schema'
import type { ScenarioPresentData } from '../../present'
import '../present.css'

type ScenarioRating = ScenarioOutcome['rating']

const LETTERS = 'ABCDEFGH'
const GRADES: Record<ScenarioRating, string> = { 'a': 'A', 'b-plus': 'B+', 'b-minus': 'B−', 'c': 'C' }
const GRADE_COLORS: Record<ScenarioRating, string> = { 'a': 'var(--ctp-green)', 'b-plus': 'var(--ctp-teal)', 'b-minus': 'var(--ctp-yellow)', 'c': 'var(--ctp-red)' }
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
    <div className="present-scenario" data-testid="present-scenario">
      <AnimatePresence initial={false}>
        {data.intro && path.length === 1 && (
          <motion.p
            key="intro"
            className="present-scenario-intro"
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            {...mark(0, { motion: 'words' })}
            {...(data.id ? pick.byId('Scenario', data.id, 'intro') : {})}
          >
            <PresentWords text={data.intro} />
          </motion.p>
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
            className="present-scenario-card present-outcome"
            style={{ ['--grade' as string]: GRADE_COLORS[outcome.rating] }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45, ease: EASE }}
            role="status"
            {...pick(outcome)}
          >
            <motion.span className="present-grade" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: 'spring', stiffness: 380, damping: 18 }} aria-label={`Grade ${GRADES[outcome.rating]}`}>
              {GRADES[outcome.rating]}
            </motion.span>
            <div className="present-outcome-body">
              <p className="present-outcome-verdict" {...SAY} {...pick(outcome, 'verdict')}>{outcome.verdict}</p>
              <p className="present-outcome-lesson" {...SAY} {...pick(outcome, 'lesson')}>{outcome.lesson}</p>
              {fork && (
                <button type="button" className="present-button" onClick={tryAnother} disabled={!live} data-testid="present-scenario-again">
                  <RotateCcw size={16} aria-hidden /> Try another path
                </button>
              )}
            </div>
          </motion.div>
        ) : node ? (
          <motion.div
            key={`node-${here.nodeId}`}
            className="present-scenario-card"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.4, ease: EASE }}
            {...pick(node)}
          >
            <p className="present-scenario-prompt" {...mark(0, { motion: 'words', delay: data.intro ? 600 : 0 })} {...pick(node, 'prompt')}>
              <PresentWords text={node.prompt ?? node.text ?? ''} />
            </p>
            <div className="present-scenario-choices" role="group" aria-label="What do you do?">
              {(node.choices ?? []).map((c, j) => (
                <button
                  key={c.id ?? j}
                  type="button"
                  className={`present-choice${live ? ' present-breathe' : ''}`}
                  onClick={() => choose(c)}
                  disabled={!live}
                  data-testid={`present-scenario-choice-${c.id ?? j}`}
                  {...mark(0, { delay: (data.intro ? 1200 : 600) + j * 70 })}
                  {...pick(c)}
                >
                  <span className="present-choice-row">
                    <span className="present-choice-letter" aria-hidden>{LETTERS[j]}</span>
                    <span className="present-choice-text" {...pick(c, 'text')}>{textOf(c)}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
