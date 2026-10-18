import { Fragment, useMemo, useRef } from 'react'
import { motion } from 'motion/react'
import { flipId, useFlip } from '../../../../../ui-system'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, type BeatMarkAttributes, type BeatMarkOptions, type PresentRendererProps } from '../../../present-kernel'
import type { ReflectionTemplateChallenge } from '../../schema'
import type { ReflectionAnswered, ReflectionCompleted } from '../../events'
import type { TemplatePresentData } from '../../present'
import { startingOrder, useSlotGate } from '../useSlotGate'
import '../present.css'

type Mark = (at: number, options?: BeatMarkOptions) => BeatMarkAttributes

const ZONE = /(\{[a-zA-Z0-9_-]+\})/g
const isZone = (segment: string) => /^\{[a-zA-Z0-9_-]+\}$/.test(segment)

function Challenge({ challenge, index, total, mark, live, solved, onSolved, onEvent }: {
  challenge: ReflectionTemplateChallenge
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
  const capture = useFlip(rootRef, { arc: 44 })
  const segments = useMemo(() => challenge.template.split(ZONE), [challenge.template])
  const zones = useMemo(() => segments.filter(isZone).map((s) => s.slice(1, -1)), [segments])
  const solution = useMemo(() => zones.map((z) => challenge.solution[z] ?? ''), [zones, challenge.solution])
  const ids = useMemo(() => startingOrder(challenge.chips.map((c) => c.id), solution), [challenge.chips, solution])
  const byId = useMemo(() => new Map(challenge.chips.map((c) => [c.id, c])), [challenge.chips])
  const gate = useSlotGate({
    items: ids,
    solution,
    solved,
    capture,
    onChecked: (correct) => {
      playSound(correct ? 'success' : 'error')
      const event: ReflectionAnswered = { type: 'ReflectionAnswered', challengeId: `challenge-${index}`, challengeIndex: index, stepCount: zones.length, isCorrect: correct, timestamp: Date.now() }
      onEvent?.(event as unknown as { type: string })
      window.setTimeout(() => onSolved(correct), correct ? 300 : 1800)
    },
  })
  const canPlace = live && gate.phase === 'placing' && !gate.done
  const at = 2 * index
  const chip = (id: string, j = 0) => {
    const c = byId.get(id)
    if (!c) return null
    const m = gate.markOf(id)
    const spent = gate.done && !solution.includes(id)
    return (
      <button
        key={id}
        type="button"
        className={`present-chip${m ? ` is-${m}` : ''}${spent ? ' is-spent' : ''}`}
        onClick={() => { playSound('click'); gate.place(id) }}
        disabled={!canPlace}
        {...flipId(id)}
        {...mark(at, { delay: 700 + j * 60 })}
        {...pick(c)}
      >
        {c.text}
      </button>
    )
  }
  const nextEmpty = gate.slots.indexOf(null)
  let zone = -1

  return (
    <div className="present-reflection" ref={rootRef} {...mark(at, { motion: 'fade', ...(index < total - 1 && { until: at + 1 }) })} {...pick(challenge)}>
      <p className="present-reflection-prompt" {...mark(at, { motion: 'words' })} {...pick(challenge, 'prompt')}><PresentWords text={challenge.prompt} /></p>
      <p className="present-template" {...mark(at, { delay: 450 })} {...pick(challenge, 'template')}>
        {segments.map((seg, i) => {
          if (!isZone(seg)) return <Fragment key={i}>{seg}</Fragment>
          zone += 1
          const id = gate.slots[zone]
          return (
            <span key={i} className={`present-blank${canPlace && zone === nextEmpty ? ' present-breathe is-next' : ''}`}>
              {id && chip(id)}
            </span>
          )
        })}
      </p>
      <div className="present-chips">{gate.pool.map((id, j) => chip(id, j))}</div>
      <div className="present-reflection-foot">
        {!gate.done && gate.phase === 'placing' ? (
          <button type="button" className={`present-button present-button--primary${canPlace && gate.full ? ' present-breathe' : ''}`} disabled={!canPlace || !gate.full} onClick={() => gate.check()} {...mark(at, { motion: 'fade', delay: 900 })}>
            Check
          </button>
        ) : gate.done ? (
          // The explanation may hold inline HTML, rendered as the Read view renders it
          <motion.p
            className="present-reflection-result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            {...pick(challenge, 'explanation')}
            dangerouslySetInnerHTML={{ __html: challenge.explanation ?? 'That completes it.' }}
          />
        ) : null}
      </div>
    </div>
  )
}

/**
 * Reflection template in Present mode (templateBeats): per challenge, the prompt and the sentence with
 * blanks arrive, then the learner taps chips into the blanks and checks; wrong chips go back and the
 * right ones glide into place.
 */
export default function PresentTemplate({ data, beat, active, gate, onEvent }: PresentRendererProps<TemplatePresentData>) {
  const challenges = data.challenges ?? []
  const mark = beatMarks(beat)
  const correct = useRef<Record<number, boolean>>({})
  return (
    <div className="present-reflections" data-testid="present-template">
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
                const done: ReflectionCompleted = { type: 'ReflectionCompleted', sectionType: 'reflection-template', totalChallenges: challenges.length, correctCount: Object.values(correct.current).filter(Boolean).length, timestamp: Date.now() }
                onEvent?.(done as unknown as { type: string })
              }
            }}
          />
        )
      })}
    </div>
  )
}
