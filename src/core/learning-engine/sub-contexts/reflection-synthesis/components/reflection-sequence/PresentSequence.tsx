import { useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { flipId, useFlip } from '../../../../../ui-system'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionSequenceChallenge } from '../../schema'
import type { ReflectionAnswered, ReflectionCompleted } from '../../events'
import type { SequencePresentData } from '../../present'
import { startingOrder, useSlotGate } from '../useSlotGate'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

function Challenge({ challenge, index, total, mark, live, solved, onSolved, onEvent }: {
  challenge: ReflectionSequenceChallenge
  index: number
  total: number
  mark: Mark
  live: boolean
  solved: boolean
  onSolved: (correct: boolean) => void
  onEvent?: PresentRendererProps['onEvent']
}) {
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const rootRef = useRef<HTMLDivElement>(null)
  const capture = useFlip(rootRef, { arc: 36 })
  const ids = useMemo(() => startingOrder(challenge.items.map((i) => i.id), challenge.solution), [challenge])
  const byId = useMemo(() => new Map(challenge.items.map((i) => [i.id, i])), [challenge])
  const gate = useSlotGate({
    items: ids,
    solution: challenge.solution,
    solved,
    capture,
    onChecked: (correct) => {
      playSound(correct ? 'success' : 'error')
      const event: ReflectionAnswered = { type: 'ReflectionAnswered', challengeId: `challenge-${index}`, challengeIndex: index, stepCount: challenge.solution.length, isCorrect: correct, timestamp: Date.now() }
      onEvent?.(event as unknown as { type: string })
      window.setTimeout(() => onSolved(correct), correct ? 300 : 1800)
    },
  })
  const canPlace = live && gate.phase === 'placing' && !gate.done
  const at = 2 * index
  const item = (id: string, j: number) => {
    const it = byId.get(id)
    if (!it) return null
    const m = gate.markOf(id)
    return (
      <button
        key={id}
        type="button"
        className={`present-slot-item${m ? ` is-${m}` : ''}`}
        onClick={() => { playSound('click'); gate.place(id) }}
        disabled={!canPlace}
        {...flipId(id)}
        {...mark(at, { delay: 400 + j * 50 })}
        {...pick(it)}
      >
        {it.text}
      </button>
    )
  }
  const nextEmpty = gate.slots.indexOf(null)

  return (
    <div className="present-reflection" ref={rootRef} {...mark(at, { motion: 'fade', ...(index < total - 1 && { until: at + 1 }) })} {...pick(challenge)}>
      <p className="present-reflection-prompt" {...mark(at, { motion: 'words' })} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></p>
      <div className="present-sequence">
        <div>
          <p className="present-col-label" {...mark(at, { motion: 'fade', delay: 300 })}>Steps</p>
          <div className="present-pool">{gate.pool.map(item)}</div>
        </div>
        <div>
          <p className="present-col-label" {...mark(at, { motion: 'fade', delay: 300 })}>Order</p>
          <ol className="present-slots">
            {gate.slots.map((id, i) => (
              <li key={i} className="present-slot" {...mark(at, { motion: 'fade', delay: 600 + i * 50 })}>
                <span className="present-slot-num">{i + 1}</span>
                <div className={`present-drop${canPlace && i === nextEmpty ? ' present-breathe is-next' : ''}`}>{id && item(id, i)}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="present-reflection-foot">
        {!gate.done && gate.phase === 'placing' ? (
          <button type="button" className={`present-button present-button--primary${canPlace && gate.full ? ' present-breathe' : ''}`} disabled={!canPlace || !gate.full} onClick={() => gate.check()} {...mark(at, { motion: 'fade', delay: 800 })}>
            Check order
          </button>
        ) : gate.done ? (
          <motion.p className="present-reflection-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">That is the right order.</motion.p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Reflection sequence in Present mode (sequenceBeats): per challenge, the prompt and items arrive, then
 * the learner taps them into order and checks; wrong items glide to their slots along an arc.
 */
export default function PresentSequence({ data, beat, active, gate, onEvent }: PresentRendererProps<SequencePresentData>) {
  const challenges = data.challenges ?? []
  const mark = beatMarks(beat)
  const correct = useRef<Record<number, boolean>>({})
  return (
    <div className="present-reflections" data-testid="present-sequence">
      {challenges.map((c, i) => {
        const gateBeat = 2 * i + 1
        return (
          <Challenge
            key={i}
            challenge={c}
            index={i}
            total={challenges.length}
            mark={mark}
            live={active && beat === gateBeat && !gate.solved}
            solved={beat > gateBeat || (beat === gateBeat && gate.solved)}
            onEvent={onEvent}
            onSolved={(ok) => {
              correct.current[i] = ok
              gate.solve()
              if (i === challenges.length - 1) {
                const done: ReflectionCompleted = { type: 'ReflectionCompleted', sectionType: 'reflection-sequence', totalChallenges: challenges.length, correctCount: Object.values(correct.current).filter(Boolean).length, timestamp: Date.now() }
                onEvent?.(done as unknown as { type: string })
              }
            }}
          />
        )
      })}
    </div>
  )
}
