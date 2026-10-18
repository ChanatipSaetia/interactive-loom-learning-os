import { useMemo } from 'react'
import { Check, CheckCircle2 } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { QUIET, beatMarks, focus, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionSequenceChallenge } from '../../schema'
import { startingOrder, type SequencePresentData } from '../../present'
import './reflection-sequence.css'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

function Challenge({ challenge, index, total, beat, mark }: {
  challenge: ReflectionSequenceChallenge
  index: number
  total: number
  beat: number
  mark: Mark
}) {
  const pick = usePickAnchors()
  const ids = useMemo(() => startingOrder(challenge.items.map((i) => i.id), challenge.solution), [challenge])
  const byId = useMemo(() => new Map(challenge.items.map((i) => [i.id, i])), [challenge])
  const at = 2 * index
  const solveAt = at + 1
  const solved = beat >= solveAt
  const textOf = (id: string) => byId.get(id)?.text ?? id

  return (
    <div className="sequence-card present-reflection" {...mark(at, { motion: 'fade', ...(index < total - 1 && { until: solveAt }) })} {...pick(challenge)}>
      <div className="sequence-prompt-banner">
        <span className="sequence-prompt-text present-reflection-prompt" {...mark(at, { motion: 'words' })} {...focus(beat === at)} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></span>
      </div>

      {/* A long sequence puts the pool beside the slots so both fit the region */}
      <div className={`present-seq-body${ids.length > 5 ? ' is-split' : ''}`}>
        {/* The pool keeps every step's place, as in Read: a placed step leaves a faded copy behind */}
        <div className="sequence-pool present-pool" {...QUIET}>
          {ids.map((id, j) => {
            const it = byId.get(id)
            if (!it) return null
            return (
              <div key={id} className={`sequence-drag-item${solved && challenge.solution.includes(id) ? ' placed' : ''}`} {...mark(at, { delay: 400 + j * 50 })} {...pick(it)}>
                <span {...pick(it, 'text')}>{it.text}</span>
              </div>
            )
          })}
        </div>

        <div className="sequence-slots-list present-slots" {...focus(beat === solveAt)}>
          {challenge.solution.map((id, i) => (
            <div key={i} className={`sequence-drop-slot${solved ? ' filled is-ok' : ''}`} {...mark(at, { motion: 'fade', delay: 600 + i * 50 })}>
              <span className="sequence-slot-num" aria-hidden {...QUIET}>{String(i + 1).padStart(2, '0')}</span>
              <div className="sequence-slot-content">
                {solved ? (
                  <span className="sequence-placed-wrapper present-slot-item is-ok" {...mark(solveAt, { delay: 150 + i * 160 })} {...pick(byId.get(id), 'text')}>
                    <span className="sequence-placed-text">{textOf(id)}</span>
                    <Check size={15} className="present-slot-mark" aria-label="Right place" />
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
          <div className="sequence-feedback-msg success present-reflection-result" role="status" {...mark(solveAt, { motion: 'fade', delay: 300 + challenge.solution.length * 160, sound: 'success' })} {...QUIET}>
            <CheckCircle2 size={16} className="feedback-icon" aria-hidden />
            <span>That is the right order.</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Reflection sequence in Present mode (sequenceBeats), solved by the stage (decision 103): per
 * challenge, the prompt and items arrive; then the steps settle into their slots in the right order,
 * one after another, while the narrator reads them.
 */
export default function PresentSequence({ data, beat }: PresentRendererProps<SequencePresentData>) {
  const challenges = data.challenges ?? []
  const mark = beatMarks(beat)
  return (
    <div className="present-reflections" data-testid="present-sequence">
      {challenges.map((c, i) => (
        <Challenge key={i} challenge={c} index={i} total={challenges.length} beat={beat} mark={mark} />
      ))}
    </div>
  )
}
