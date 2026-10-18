import { useMemo } from 'react'
import { Check, Lightbulb, X } from 'lucide-react'
import { usePickAnchors } from '../../../../../ui-system/pick-anchor'
import { PresentWords } from '../../../PresentWords'
import { beatMarks, focus, type PresentRendererProps } from '../../../present-kernel'
import { quizPlan, type QuizPresentData } from '../../present'
import './quiz.css'
import '../present.css'

const LETTERS = 'ABCDEFGH'

/**
 * Quiz in Present mode (quizBeats), drawn as the Read question card and answered by the stage
 * (decision 103): per question, the card and its choices arrive; then a wrong choice turns red with
 * the hint and why it is wrong; then the right one turns green over its explanation while the others
 * step back.
 */
export default function PresentQuiz({ data, beat }: PresentRendererProps<QuizPresentData>) {
  const questions = useMemo(() => data.questions ?? [], [data.questions])
  const plan = useMemo(() => quizPlan(data), [data])
  const mark = beatMarks(beat)
  const pick = usePickAnchors()
  const last = questions.length - 1

  return (
    <div className="present-quiz" data-testid="present-quiz">
      {questions.map((q, i) => {
        const at = (step: 'ask' | 'wrong' | 'right') => plan.findIndex((s) => s.question === i && s.step === step)
        const askAt = at('ask')
        const wrongAt = at('wrong')
        const rightAt = at('right')
        const end = Math.max(askAt, wrongAt, rightAt)
        const phase = rightAt >= 0 && beat >= rightAt ? 'right' : wrongAt >= 0 && beat >= wrongAt ? 'wrong' : 'ask'
        const wrong = wrongAt >= 0 ? plan[wrongAt].choice : undefined
        const right = rightAt >= 0 ? plan[rightAt].choice : undefined
        const explained = phase === 'right' ? right : phase === 'wrong' ? wrong : undefined

        return (
          <div key={q.id} className="quiz-question-card present-quiz-question" {...mark(askAt, { motion: 'fade', ...(i < last && { until: end }) })} {...pick(q)}>
            <div className="quiz-question-header">
              <div className="quiz-question-number">Q{i + 1}</div>
              <div className="quiz-question-counter">{i + 1} / {questions.length}</div>
            </div>
            <h4 className="quiz-question-text" {...mark(askAt, { motion: 'words', delay: 120 })} {...focus(beat === askAt)} {...pick(q, 'question')}><PresentWords text={q.question} /></h4>
            {q.hint && phase === 'wrong' && (
              <div className="quiz-hint" {...mark(wrongAt, { motion: 'fade', delay: 700 })} {...pick(q, 'hint')}>
                <span className="quiz-hint-text"><Lightbulb className="quiz-hint-icon present-quiz-hint-icon" aria-hidden /> {q.hint}</span>
              </div>
            )}
            <div className="quiz-choices" role="list" aria-label={`Answers to question ${i + 1}`}>
              {q.choices.map((c, j) => {
                const isWrong = phase !== 'ask' && c.id === wrong?.id
                const isRight = phase === 'right' && c.id === right?.id
                const cls = [
                  'quiz-choice',
                  'present-quiz-choice',
                  isWrong && 'quiz-choice-wrong is-wrong',
                  isRight && 'quiz-choice-correct',
                  phase === 'right' && !isRight && 'is-dim',
                ].filter(Boolean).join(' ')
                return (
                  <div
                    key={c.id}
                    role="listitem"
                    className={cls}
                    {...mark(askAt, { delay: 500 + j * 60 })}
                    {...focus((beat === wrongAt && isWrong) || (beat === rightAt && isRight))}
                    {...pick(c)}
                  >
                    <span className="quiz-choice-label" aria-hidden>{LETTERS[j]}</span>
                    <span className="quiz-choice-text" {...pick(c, 'text')}>{c.text}</span>
                    {isRight && <Check className="quiz-choice-feedback-icon quiz-choice-feedback-correct" aria-label="Correct" />}
                    {isWrong && <X className="quiz-choice-feedback-icon quiz-choice-feedback-wrong" aria-label="Wrong" />}
                  </div>
                )
              })}
            </div>
            {explained && (
              <div
                key={explained.id}
                className={`quiz-explanation ${phase === 'right' ? 'quiz-explanation-correct' : 'quiz-explanation-wrong'}`}
                {...mark(phase === 'right' ? rightAt : wrongAt, { delay: 150, sound: phase === 'right' ? 'success' : 'error' })}
              >
                <div className="quiz-explanation-result">
                  {phase === 'right' ? <><Check className="quiz-explanation-icon" /><span>Correct</span></> : <><X className="quiz-explanation-icon" /><span>Not quite</span></>}
                </div>
                <p className="quiz-explanation-text" {...pick(explained, 'explanation')}>{explained.explanation}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
