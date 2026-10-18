import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Check, X } from 'lucide-react'
import { flipId, useFlip } from '../../../../../ui-system'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { SAY, beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { QuizOptionSelected, QuizCompleted } from '../../events'
import type { QuizPresentData } from '../../present'
import '../present.css'

const LETTERS = 'ABCDEFGH'
const ANTICIPATION = 120
const FALL = 300

/**
 * Quiz in Present mode (quizBeats): per question, the question and choices arrive, then the learner
 * answers. A wrong choice shows its explanation and stays open; the right one waits a beat, the others
 * fall away, and it moves up and grows into its explanation.
 */
export default function PresentQuiz({ data, beat, active, gate, onEvent }: PresentRendererProps<QuizPresentData>) {
  const questions = data.questions ?? []
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const { playSound } = useSound()
  const rootRef = useRef<HTMLDivElement>(null)
  const capture = useFlip(rootRef, { feel: 'spring' })
  /** Choices tried per question, in order. */
  const [tried, setTried] = useState<Record<string, string[]>>({})
  const [falling, setFalling] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const last = questions.length - 1
  const firstTryCorrect = () => questions.filter((q) => {
    const first = tried[q.id]?.[0]
    return first !== undefined && q.choices.find((c) => c.id === first)?.correct
  }).length

  return (
    <div className="present-quiz" ref={rootRef} data-testid="present-quiz">
      {questions.map((q, i) => {
        const answerBeat = 2 * i + 1
        const picks = tried[q.id] ?? []
        const correct = q.choices.find((c) => c.correct)
        const solved = beat > answerBeat || (beat === answerBeat && gate.solved) || (!!correct && picks.includes(correct.id))
        const live = active && beat === answerBeat && !solved && !busy
        const choose = (choiceId: string) => {
          if (!live || picks.includes(choiceId)) return
          const choice = q.choices.find((c) => c.id === choiceId)
          if (!choice) return
          playSound('click')
          setBusy(true)
          const event: QuizOptionSelected = { type: 'QuizOptionSelected', questionId: q.id, choiceId, isCorrect: choice.correct, timestamp: Date.now() }
          // A beat of anticipation before the verdict
          later(() => {
            onEvent?.(event as unknown as { type: string })
            if (!choice.correct) {
              playSound('error')
              setTried((t) => ({ ...t, [q.id]: [...picks, choiceId] }))
              setBusy(false)
              return
            }
            playSound('success')
            setFalling(q.id)
            later(() => {
              capture()
              setFalling(null)
              setTried((t) => ({ ...t, [q.id]: [...picks, choiceId] }))
              setBusy(false)
              gate.solve()
              if (i === last) {
                const correctCount = firstTryCorrect() + (picks.length === 0 ? 1 : 0)
                const done: QuizCompleted = { type: 'QuizCompleted', totalQuestions: questions.length, correctCount, score: Math.round((correctCount / questions.length) * 100), timestamp: Date.now() }
                onEvent?.(done as unknown as { type: string })
              }
            }, FALL)
          }, ANTICIPATION)
        }

        return (
          <div key={q.id} className="present-quiz-question" {...mark(2 * i, { motion: 'fade', ...(i < last && { until: answerBeat }) })} {...pick(q)}>
            <p className="present-quiz-counter">Question {i + 1} of {questions.length}</p>
            <p className="present-quiz-prompt" {...mark(2 * i, { motion: 'words', delay: 120 })} {...pick(q, 'question')}><PresentWords text={q.question} /></p>
            <div className="present-quiz-choices" role="group" aria-label={`Answers to question ${i + 1}`}>
              {q.choices.map((c, j) => {
                const wrong = picks.includes(c.id) && !c.correct
                const right = solved && c.correct
                const gone = solved && !c.correct
                const cls = [
                  'present-choice',
                  wrong && 'is-wrong',
                  right && 'is-right',
                  gone && 'is-gone',
                  falling === q.id && !c.correct && 'is-falling',
                  live && !wrong && 'present-breathe',
                ].filter(Boolean).join(' ')
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={cls}
                    onClick={() => choose(c.id)}
                    disabled={!live || wrong}
                    aria-pressed={right || wrong}
                    {...flipId(`${q.id}:${c.id}`)}
                    {...mark(2 * i, { delay: 500 + j * 60 })}
                    {...pick(c)}
                  >
                    <span className="present-choice-row">
                      <span className="present-choice-letter" aria-hidden>{LETTERS[j]}</span>
                      <span className="present-choice-text">{c.text}</span>
                      {right && <Check className="present-choice-mark" size={18} aria-label="Correct" />}
                      {wrong && <X className="present-choice-mark" size={18} aria-label="Wrong" />}
                    </span>
                    {(wrong || right) && (
                      <motion.span className="present-choice-why" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }} {...(right ? SAY : {})} {...pick(c, 'explanation')}>
                        {c.explanation}
                      </motion.span>
                    )}
                  </button>
                )
              })}
            </div>
            {q.hint && picks.some((id) => !q.choices.find((c) => c.id === id)?.correct) && !solved && (
              <motion.p className="present-quiz-hint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} {...pick(q, 'hint')}>Hint: {q.hint}</motion.p>
            )}
          </div>
        )
      })}
    </div>
  )
}
