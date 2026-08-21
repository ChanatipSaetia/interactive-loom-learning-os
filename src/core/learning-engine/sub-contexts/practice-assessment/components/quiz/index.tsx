import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, X, Lightbulb, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react'
import type { OKFQuizQuestion } from '../../../../composition/okf/types'
import { Button } from '../../../../../ui-system/motion/button'
import { useSound } from '../../../../../ui-system/sensory/SoundContext'
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar'
import { QuizHelpModal } from './QuizHelpModal'
import './quiz.css'

import type { SectionResultProps, SectionResultContract } from '../../../types'
import type { PracticeAssessmentEvents, QuizOptionSelected, QuizCompleted } from '../../events'

export interface QuizSectionProps extends SectionResultProps<QuizCompleted | QuizOptionSelected, PracticeAssessmentEvents> {
  title?: string
  questions?: OKFQuizQuestion[]
  sectionIndex?: number
  sectionId?: string
  intelligenceChance?: number
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

type AnswersMap = Record<number, string>
type HintsOpenMap = Record<number, boolean>

function QuestionCard({
  question,
  index,
  total,
  selectedChoice,
  hintOpen,
  showIntelligenceHint,
  onAnswer,
  onToggleHint,
}: {
  question: OKFQuizQuestion
  index: number
  total: number
  selectedChoice: string | null
  hintOpen: boolean
  showIntelligenceHint?: boolean
  onAnswer: (questionIndex: number, choiceId: string) => void
  onToggleHint: (questionIndex: number) => void
}) {
  const revealed = selectedChoice !== null

  const handleSelect = useCallback(
    (choiceId: string) => {
      if (revealed) return
      onAnswer(index, choiceId)
    },
    [revealed, onAnswer, index],
  )

  const chosen = question.choices.find((c) => c.id === selectedChoice)
  const isCorrect = chosen?.correct ?? false

  return (
    <div className="quiz-question-card" data-testid={`quiz-question-${question.id}`}>
      <div className="quiz-question-header">
        <div className="quiz-question-number" data-testid={`quiz-question-number-${index}`}>
          Q{index + 1}
        </div>
        <div className="quiz-question-counter">
          {index + 1} / {total}
        </div>
      </div>

      <h4 className="quiz-question-text" data-testid={`quiz-question-text-${index}`}>
        {question.question}
      </h4>

      {question.hint && !revealed && (
        <div className="quiz-hint" data-testid={`quiz-hint-${index}`}>
          <button
            className="quiz-hint-toggle"
            onClick={() => onToggleHint(index)}
            aria-label="Toggle hint"
          >
            <Lightbulb className="quiz-hint-icon" />
            <ChevronDown className={`quiz-hint-chevron ${hintOpen ? 'quiz-hint-chevron-open' : ''}`} />
          </button>
          <AnimatePresence>
            {hintOpen && (
              <motion.span
                className="quiz-hint-text"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              >
                {question.hint}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="quiz-choices" data-testid={`quiz-choices-${index}`}>
        {question.choices.map((choice, ci) => {
          const isSelected = choice.id === selectedChoice
          const label = CHOICE_LABELS[ci] ?? String(ci + 1)
          
          // Arcane Insight: After giving a wrong answer, Intelligence provides a chance to reveal the correct answer
          const isWrongSelection = revealed && selectedChoice !== null && !isCorrect
          const isRevealedCorrectByIntelligence = isWrongSelection && choice.correct && Boolean(showIntelligenceHint)
          const isRevealedCorrectNormally = revealed && isCorrect && choice.correct

          let stateClass = ''
          if (revealed) {
            if (isRevealedCorrectNormally || isRevealedCorrectByIntelligence) {
              stateClass = 'quiz-choice-correct'
            } else if (isSelected && !choice.correct) {
              stateClass = 'quiz-choice-wrong'
            } else {
              stateClass = 'quiz-choice-dimmed'
            }
          }

          return (
            <motion.button
              key={choice.id}
              data-testid={`quiz-choice-${index}-${choice.id}`}
              className={`quiz-choice ${stateClass}`}
              onClick={() => handleSelect(choice.id)}
              disabled={revealed}
              initial={revealed ? false : { opacity: 0, y: 8 }}
              animate={revealed ? false : { opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: ci * 0.06, ease: [0.25, 1, 0.5, 1] }}
            >
              <span className="quiz-choice-label">{label}</span>
              <span className="quiz-choice-text">{choice.text}</span>
              {isRevealedCorrectByIntelligence && (
                <span className="quiz-choice-intelligence-badge">
                  <span>💡 Arcane Insight</span>
                </span>
              )}
              {revealed && (isRevealedCorrectNormally || isRevealedCorrectByIntelligence) && (
                <Check className="quiz-choice-feedback-icon quiz-choice-feedback-correct" data-testid={`quiz-feedback-correct-${index}-${choice.id}`} />
              )}
              {revealed && isSelected && !choice.correct && (
                <X className="quiz-choice-feedback-icon quiz-choice-feedback-wrong" data-testid={`quiz-feedback-wrong-${index}-${choice.id}`} />
              )}
            </motion.button>
          )
        })}
      </div>

      <AnimatePresence>
        {revealed && chosen && (
          <motion.div
            className={`quiz-explanation ${isCorrect ? 'quiz-explanation-correct' : 'quiz-explanation-wrong'}`}
            data-testid={`quiz-explanation-${index}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="quiz-explanation-result">
              {isCorrect ? (
                <>
                  <Check className="quiz-explanation-icon" />
                  <span>Correct</span>
                </>
              ) : (
                <>
                  <X className="quiz-explanation-icon" />
                  <span>Incorrect</span>
                </>
              )}
            </div>
            <p className="quiz-explanation-text">{chosen.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function QuizSection({
  title,
  questions = [],
  sectionIndex = 0,
  sectionId = 'quiz',
  intelligenceChance,
  onResultChange,
  onEvent,
}: QuizSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswersMap>({})
  const [hintsOpen, setHintsOpen] = useState<HintsOpenMap>({})
  const { playSound } = useSound()

  const handleAnswer = useCallback(
    (questionIndex: number, choiceId: string) => {
      const newAnswers = { ...answers, [questionIndex]: choiceId }
      setAnswers(newAnswers)
      const q = questions[questionIndex]
      const choice = q?.choices.find((c) => c.id === choiceId)
      const isCorrect = choice?.correct ?? false

      if (isCorrect) {
        playSound('success')
      } else {
        playSound('error')
      }

      // 1. Emit single question option event
      const optionEvent: QuizOptionSelected = {
        type: 'QuizOptionSelected',
        questionId: q?.id ?? `q_${questionIndex}`,
        choiceId,
        isCorrect,
        timestamp: Date.now(),
      }
      onEvent?.(optionEvent)

      // 2. Compute aggregate progress and emit Result Contract
      let correctCount = 0
      let answeredCount = 0
      for (let i = 0; i < questions.length; i++) {
        const cId = newAnswers[i]
        if (cId) {
          answeredCount++
          const c = questions[i].choices.find((item) => item.id === cId)
          if (c?.correct) correctCount++
        }
      }

      const isAllAnswered = questions.length > 0 && answeredCount === questions.length
      const normalizedScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
      const accuracy = questions.length > 0 ? correctCount / questions.length : 0

      const completedPayload: QuizCompleted = {
        type: 'QuizCompleted',
        totalQuestions: questions.length,
        correctCount,
        score: normalizedScore,
        timestamp: Date.now(),
      }

      if (isAllAnswered) {
        onEvent?.(completedPayload)
      }

      const resultContract: SectionResultContract<QuizCompleted | QuizOptionSelected> = {
        sectionId,
        sectionType: 'quiz',
        status: isAllAnswered ? (accuracy >= 0.5 ? 'completed' : 'failed') : 'in_progress',
        score: normalizedScore,
        accuracy,
        completedAt: isAllAnswered ? Date.now() : undefined,
        payload: isAllAnswered ? completedPayload : optionEvent,
      }

      onResultChange?.(resultContract)
    },
    [questions, answers, playSound, onEvent, onResultChange, sectionId],
  )

  const handleToggleHint = useCallback((questionIndex: number) => {
    playSound('click')
    setHintsOpen((prev) => ({ ...prev, [questionIndex]: !prev[questionIndex] }))
  }, [playSound])

  const score = useMemo(() => {
    let correct = 0
    for (let i = 0; i < questions.length; i++) {
      const chosenId = answers[i]
      if (!chosenId) continue
      const chosen = questions[i].choices.find((c) => c.id === chosenId)
      if (chosen?.correct) correct++
    }
    return correct
  }, [questions, answers])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }, [questions.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  if (questions.length === 0) {
    return <div className="p-8 text-center text-muted-foreground font-mono text-sm">No quiz questions provided.</div>
  }

  const currentQuestion = questions[currentIndex]
  const showIntelligenceHint = useMemo(() => {
    if (!intelligenceChance || intelligenceChance <= 0) return false
    return Math.random() * 100 < intelligenceChance
  }, [currentIndex, intelligenceChance])

  return (
    <div className="quiz-section" data-testid="quiz-section">
      <SectionTitleBar
        title={title}
        sectionIndex={sectionIndex}
        HelpModal={QuizHelpModal}
        titleTestId="quiz-title"
      />

      <div className="quiz-score-bar" data-testid="quiz-score-bar">
        <span className="quiz-score-label">Score</span>
        <div className="quiz-score-track" data-testid="quiz-score-track">
          <div
            className="quiz-score-fill"
            style={{ width: `${questions.length > 0 ? (score / questions.length) * 100 : 0}%` }}
            data-testid="quiz-score-fill"
          />
        </div>
        <span className="quiz-score-text" data-testid="quiz-score-text">
          {score}/{questions.length} correct
        </span>
      </div>

      <div className="quiz-questions-list" data-testid="quiz-questions-list">
        <QuestionCard
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          selectedChoice={answers[currentIndex] ?? null}
          hintOpen={!!hintsOpen[currentIndex]}
          showIntelligenceHint={showIntelligenceHint}
          onAnswer={handleAnswer}
          onToggleHint={handleToggleHint}
        />
      </div>

      {questions.length > 1 && (
        <div className="quiz-nav" data-testid="quiz-nav">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="quiz-nav-btn"
            data-testid="quiz-prev-btn"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="quiz-nav-btn"
            data-testid="quiz-next-btn"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
