import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Lightbulb, X } from 'lucide-react'
import { flipId, useFlip } from '../../../../../ui-system'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { SAY, beatMarks, type PresentRendererProps } from '../../../present-kernel'
import type { QuizOptionSelected, QuizCompleted } from '../../events'
import type { QuizPresentData } from '../../present'
import './quiz.css'
import '../present.css'

const LETTERS = 'ABCDEFGH'
const ANTICIPATION = 120
const FALL = 300

/**
 * Quiz in Present mode (quizBeats), drawn as the Read question card: per question, the card and its
 * choices arrive, then the learner answers. A wrong choice turns red with its explanation and the learner
 * tries again; the right one waits a beat, the others fall away, and it moves up over its explanation.
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
        const lastWrong = !solved ? q.choices.find((c) => c.id === picks[picks.length - 1] && !c.correct) : undefined
        const explained = solved ? correct : lastWrong
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
          <div key={q.id} className="quiz-question-card present-quiz-question" {...mark(2 * i, { motion: 'fade', ...(i < last && { until: answerBeat }) })} {...pick(q)}>
            <div className="quiz-question-header">
              <div className="quiz-question-number">Q{i + 1}</div>
              <div className="quiz-question-counter">{i + 1} / {questions.length}</div>
            </div>
            <h4 className="quiz-question-text" {...mark(2 * i, { motion: 'words', delay: 120 })} {...pick(q, 'question')}><PresentWords text={q.question} /></h4>
            {q.hint && !!lastWrong && (
              <motion.div className="quiz-hint" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} {...pick(q, 'hint')}>
                <span className="quiz-hint-text"><Lightbulb className="quiz-hint-icon present-quiz-hint-icon" aria-hidden /> {q.hint}</span>
              </motion.div>
            )}
            <div className="quiz-choices" role="group" aria-label={`Answers to question ${i + 1}`}>
              {q.choices.map((c, j) => {
                const wrong = picks.includes(c.id) && !c.correct
                const right = solved && c.correct
                const gone = solved && !c.correct
                const cls = [
                  'quiz-choice',
                  'present-quiz-choice',
                  wrong && 'quiz-choice-wrong is-wrong',
                  right && 'quiz-choice-correct',
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
                    <span className="quiz-choice-label" aria-hidden>{LETTERS[j]}</span>
                    <span className="quiz-choice-text" {...pick(c, 'text')}>{c.text}</span>
                    {right && <Check className="quiz-choice-feedback-icon quiz-choice-feedback-correct" aria-label="Correct" />}
                    {wrong && <X className="quiz-choice-feedback-icon quiz-choice-feedback-wrong" aria-label="Wrong" />}
                  </button>
                )
              })}
            </div>
            {explained && (
              <motion.div
                key={explained.id}
                className={`quiz-explanation ${solved ? 'quiz-explanation-correct' : 'quiz-explanation-wrong'}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="quiz-explanation-result">
                  {solved ? <><Check className="quiz-explanation-icon" /><span>Correct</span></> : <><X className="quiz-explanation-icon" /><span>Not quite, try again</span></>}
                </div>
                <p className="quiz-explanation-text" {...(solved ? SAY : {})} {...pick(explained, 'explanation')}>{explained.explanation}</p>
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
