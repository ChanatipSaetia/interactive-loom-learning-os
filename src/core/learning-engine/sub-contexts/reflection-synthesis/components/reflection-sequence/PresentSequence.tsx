import { useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { Check, CheckCircle2, X } from 'lucide-react'
import { flipId, useFlip } from '../../../../../ui-system'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { SAY, beatMarks, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionSequenceChallenge } from '../../schema'
import type { ReflectionAnswered, ReflectionCompleted } from '../../events'
import type { SequencePresentData } from '../../present'
import { startingOrder, useSlotGate } from '../useSlotGate'
import './reflection-sequence.css'
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
  const nextEmpty = gate.slots.indexOf(null)
  const textOf = (id: string) => byId.get(id)?.text ?? id

  return (
    <div className="sequence-card present-reflection" ref={rootRef} {...mark(at, { motion: 'fade', ...(index < total - 1 && { until: at + 1 }) })} {...pick(challenge)}>
      <div className="sequence-prompt-banner">
        <span className="sequence-prompt-text present-reflection-prompt" {...mark(at, { motion: 'words' })} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></span>
      </div>

      {/* A long sequence puts the pool beside the slots so both fit the region */}
      <div className={`present-seq-body${ids.length > 5 ? ' is-split' : ''}`}>
        {/* The pool keeps every step's place, as in Read: a placed step leaves a faded copy behind */}
        <div className="sequence-pool present-pool">
          {ids.map((id, j) => {
            const it = byId.get(id)
            if (!it) return null
            if (!gate.pool.includes(id)) {
              return <div key={id} className="sequence-drag-item placed" aria-hidden {...mark(at, { delay: 400 + j * 50 })}>{it.text}</div>
            }
            return (
              <button
                key={id}
                type="button"
                className="sequence-drag-item present-slot-item"
                onClick={() => { playSound('click'); gate.place(id) }}
                disabled={!canPlace}
                {...flipId(id)}
                {...mark(at, { delay: 400 + j * 50 })}
                {...pick(it)}
              >
                <span {...pick(it, 'text')}>{it.text}</span>
              </button>
            )
          })}
        </div>

        <div className="sequence-slots-list present-slots">
          {gate.slots.map((id, i) => {
            const m = id ? gate.markOf(id) : undefined
            const next = canPlace && i === nextEmpty
            return (
              <div
                key={i}
                className={`sequence-drop-slot${id ? ' filled' : ''}${next ? ' highlight-target present-breathe' : ''}${m ? ` is-${m}` : ''}`}
                {...mark(at, { motion: 'fade', delay: 600 + i * 50 })}
              >
                <span className="sequence-slot-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="sequence-slot-content">
                  {id ? (
                    <button
                      type="button"
                      className={`sequence-placed-wrapper present-slot-item${m ? ` is-${m}` : ''}`}
                      onClick={() => { playSound('click'); gate.place(id) }}
                      disabled={!canPlace}
                      aria-label={canPlace ? `Take back: ${textOf(id)}` : undefined}
                      {...flipId(id)}
                      {...pick(byId.get(id), 'text')}
                    >
                      <span className="sequence-placed-text">{textOf(id)}</span>
                      {m === 'ok' ? <Check size={15} className="present-slot-mark" aria-label="Right place" />
                        : m === 'off' ? <X size={15} className="present-slot-mark" aria-label="Wrong place" />
                        : canPlace ? <X size={14} className="present-slot-remove" aria-hidden /> : null}
                    </button>
                  ) : (
                    <span className="sequence-slot-placeholder">{next ? 'Tap a step to place it here' : 'Drop step card here'}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="sequence-footer present-reflection-foot">
        {!gate.done && gate.phase === 'placing' ? (
          <button type="button" className={`sequence-verify-btn${canPlace && gate.full ? ' present-breathe' : ''}`} disabled={!canPlace || !gate.full} onClick={() => gate.check()} {...mark(at, { motion: 'fade', delay: 800 })}>
            Verify Sequence Model
          </button>
        ) : gate.done ? (
          <motion.div className="sequence-feedback-msg success present-reflection-result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
            <CheckCircle2 size={16} className="feedback-icon" aria-hidden />
            <span {...SAY}>That is the right order.</span>
          </motion.div>
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
