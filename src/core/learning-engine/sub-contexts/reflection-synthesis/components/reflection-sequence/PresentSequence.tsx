import { useMemo } from 'react'
import { Check, CheckCircle2 } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionSequenceChallenge } from '../../schema'
import { challengeStarts, startingOrder, type SequencePresentData } from '../../present'
import './reflection-sequence.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

function Challenge({ challenge, at, last, beat, mark }: {
  challenge: ReflectionSequenceChallenge
  /** The challenge's first beat (its prompt). */
  at: number
  last: boolean
  beat: number
  mark: Mark
}) {
  const pick = usePickAnchors()
  const ids = useMemo(() => startingOrder(challenge.items.map((i) => i.id), challenge.solution), [challenge])
  const byId = useMemo(() => new Map(challenge.items.map((i) => [i.id, i])), [challenge])
  // Slot i is filled on beat at + i + 1 (`cn.step{i+1}`), then the order is confirmed (decision 115)
  const placeAt = (i: number) => at + i + 1
  const solveAt = at + challenge.solution.length + 1
  const solved = beat >= solveAt
  const slotOf = useMemo(() => new Map(challenge.solution.map((id, i) => [id, i])), [challenge.solution])
  const isPlaced = (id: string) => slotOf.has(id) && beat >= placeAt(slotOf.get(id)!)
  const textOf = (id: string) => byId.get(id)?.text ?? id

  return (
    <div className="sequence-card present-reflection" {...mark(at, { motion: 'fade', ...(!last && { until: solveAt }) })} {...pick(challenge)}>
      <div className="sequence-prompt-banner">
        <span className="sequence-prompt-text present-reflection-prompt" {...mark(at, { motion: 'words' })} {...focus(beat === at)} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></span>
      </div>

      {/* A long sequence puts the pool beside the slots so both fit the region */}
      <div className={`present-seq-body${ids.length > 5 ? ' is-split' : ''}`}>
        {/* The pool keeps every step's place, as in Read: a placed step leaves a faded copy behind, its Pick anchor moving to the slot so narration targets light the placed step */}
        <div className="sequence-pool present-pool" {...QUIET}>
          {ids.map((id, j) => {
            const it = byId.get(id)
            if (!it) return null
            return (
              <div key={id} className={`sequence-drag-item${isPlaced(id) ? ' placed' : ''}`} {...mark(at, { delay: 400 + j * 50 })} {...(!isPlaced(id) && pick(it))}>
                <span {...(!isPlaced(id) && pick(it, 'text'))}>{it.text}</span>
              </div>
            )
          })}
        </div>

        <div className="sequence-slots-list present-slots" {...focus(beat === solveAt)}>
          {challenge.solution.map((id, i) => (
            <div key={i} className={`sequence-drop-slot${beat >= placeAt(i) ? ' filled' : ''}${solved ? ' is-ok' : ''}`} {...mark(at, { motion: 'fade', delay: 600 + i * 50 })} {...focus(beat === placeAt(i))}>
              <span className="sequence-slot-num" aria-hidden {...QUIET}>{String(i + 1).padStart(2, '0')}</span>
              <div className="sequence-slot-content">
                {beat >= placeAt(i) ? (
                  <span className={`sequence-placed-wrapper present-slot-item${solved ? ' is-ok' : ''}`} {...mark(placeAt(i), { delay: 150 })} {...pick(byId.get(id), 'text')}>
                    <span className="sequence-placed-text">{textOf(id)}</span>
                    {solved && <span className="present-slot-mark" {...mark(solveAt, { motion: 'pop', delay: 150 + i * 120 })}><Check size={15} aria-label="Right place" /></span>}
                  </span>
                ) : (
                  <span className="sequence-slot-placeholder" {...QUIET}>Step {i + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {solved && (
        <div className="sequence-footer present-reflection-foot">
          <div className="sequence-feedback-msg success present-reflection-result" role="status" {...mark(solveAt, { motion: 'fade', delay: 300 + challenge.solution.length * 120, sound: 'success' })}>
            <CheckCircle2 size={16} className="feedback-icon" aria-hidden />
            <span>That is the right order.</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Reflection sequence in Present mode (sequenceBeats), solved by the stage (decisions 103 and 115):
 * per challenge, the prompt and items arrive; then each step settles into its slot in its own beat,
 * so the narration can say why it comes there; then the slots turn green as the right order.
 */
export default function PresentSequence({ data, beat }: PresentRendererProps<SequencePresentData>) {
  const challenges = useMemo(() => data.challenges ?? [], [data.challenges])
  const starts = useMemo(() => challengeStarts(challenges.map((c) => c.solution.length)), [challenges])
  const mark = beatMarks(beat)
  return (
    <div className="present-reflections" data-testid="present-sequence">
      {challenges.map((c, i) => (
        <Challenge key={i} challenge={c} at={starts[i]} last={i === challenges.length - 1} beat={beat} mark={mark} />
      ))}
    </div>
  )
}
