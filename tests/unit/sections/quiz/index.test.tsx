import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/learning-engine/registry'
import QuizSection from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz'
import type { OKFQuizQuestion } from '../../../../src/core/learning-engine/composition/okf/types'

const mockQuestions: OKFQuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is 2 + 2?',
    choices: [
      { id: 'a', text: '3', correct: false, explanation: 'That is too low.' },
      { id: 'b', text: '4', correct: true, explanation: 'Correct! 2 + 2 = 4.' },
      { id: 'c', text: '5', correct: false, explanation: 'That is too high.' },
    ],
    hint: 'Count on your fingers.',
  },
  {
    id: 'q2',
    question: 'What color is the sky?',
    choices: [
      { id: 'a', text: 'Blue', correct: true, explanation: 'The sky appears blue due to Rayleigh scattering.' },
      { id: 'b', text: 'Green', correct: false, explanation: 'Green is not the typical sky color.' },
      { id: 'c', text: 'Red', correct: false, explanation: 'The sky can appear red at sunset, but blue is the daytime color.' },
    ],
  },
]

describe('Quiz Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders the section container', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-section')).toBeInTheDocument()
  })

  it('renders the title when provided', () => {
    render(<QuizSection title="Knowledge Check" questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-title')).toHaveTextContent('Knowledge Check')
  })

  it('does not render title when not provided', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.queryByTestId('quiz-title')).not.toBeInTheDocument()
  })

  it('renders current question in the list', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-question-q1')).toBeInTheDocument()
    expect(screen.queryByTestId('quiz-question-q2')).not.toBeInTheDocument()
  })

  it('navigates to second question', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-question-text-0')).toHaveTextContent('What is 2 + 2?')
    const nextBtn = screen.getByTestId('quiz-next-btn')
    fireEvent.click(nextBtn)
    expect(screen.getByTestId('quiz-question-q2')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-question-text-1')).toHaveTextContent('What color is the sky?')
  })

  it('renders hint when present', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-hint-0')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Toggle hint'))
    expect(screen.getByTestId('quiz-hint-0')).toHaveTextContent('Count on your fingers.')
  })

  it('does not render hint when not present', () => {
    render(<QuizSection questions={mockQuestions} />)
    const nextBtn = screen.getByTestId('quiz-next-btn')
    fireEvent.click(nextBtn)
    expect(screen.queryByTestId('quiz-hint-0')).not.toBeInTheDocument()
  })

  it('renders all choices for a question', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-choice-0-a')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-choice-0-b')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-choice-0-c')).toBeInTheDocument()
  })

  it('selecting the correct answer shows correct feedback', () => {
    render(<QuizSection questions={mockQuestions} />)
    const correctChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(correctChoice)
    expect(screen.getByTestId('quiz-feedback-correct-0-b')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-explanation-0')).toBeInTheDocument()
  })

  it('selecting the wrong answer shows wrong feedback', () => {
    render(<QuizSection questions={mockQuestions} />)
    const wrongChoice = screen.getByTestId('quiz-choice-0-a')
    fireEvent.click(wrongChoice)
    expect(screen.getByTestId('quiz-feedback-wrong-0-a')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-explanation-0')).toBeInTheDocument()
  })

  it('shows explanation text after selecting an answer', () => {
    render(<QuizSection questions={mockQuestions} />)
    const correctChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(correctChoice)
    const explanation = screen.getByTestId('quiz-explanation-0')
    expect(explanation).toHaveTextContent('Correct! 2 + 2 = 4.')
  })

  it('shows correct indicator in explanation for correct answer', () => {
    render(<QuizSection questions={mockQuestions} />)
    const correctChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(correctChoice)
    const explanation = screen.getByTestId('quiz-explanation-0')
    expect(explanation).toHaveTextContent('Correct')
    expect(explanation).toHaveClass('quiz-explanation-correct')
  })

  it('shows incorrect indicator in explanation for wrong answer', () => {
    render(<QuizSection questions={mockQuestions} />)
    const wrongChoice = screen.getByTestId('quiz-choice-0-a')
    fireEvent.click(wrongChoice)
    const explanation = screen.getByTestId('quiz-explanation-0')
    expect(explanation).toHaveTextContent('Incorrect')
    expect(explanation).toHaveClass('quiz-explanation-wrong')
  })

  it('prevents re-selecting after an answer is revealed', () => {
    render(<QuizSection questions={mockQuestions} />)
    const firstChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(firstChoice)
    const secondChoice = screen.getByTestId('quiz-choice-0-a') as HTMLButtonElement
    expect(secondChoice.disabled).toBe(true)
  })

  it('renders score bar with initial 0 score', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-score-bar')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-score-text')).toHaveTextContent('0/2 correct')
  })

  it('updates score when correct answer is selected', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-score-text')).toHaveTextContent('0/2 correct')
    const correctChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(correctChoice)
    expect(screen.getByTestId('quiz-score-text')).toHaveTextContent('1/2 correct')
  })

  it('updates score when wrong answer is selected', () => {
    render(<QuizSection questions={mockQuestions} />)
    const wrongChoice = screen.getByTestId('quiz-choice-0-a')
    fireEvent.click(wrongChoice)
    expect(screen.getByTestId('quiz-score-text')).toHaveTextContent('0/2 correct')
  })

  it('tracks score across multiple questions', () => {
    render(<QuizSection questions={mockQuestions} />)
    const correctChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(correctChoice)
    expect(screen.getByTestId('quiz-score-text')).toHaveTextContent('1/2 correct')
    const nextBtn = screen.getByTestId('quiz-next-btn')
    fireEvent.click(nextBtn)
    const correctChoice2 = screen.getByTestId('quiz-choice-1-a')
    fireEvent.click(correctChoice2)
    expect(screen.getByTestId('quiz-score-text')).toHaveTextContent('2/2 correct')
  })

  it('renders navigation buttons when multiple questions exist', () => {
    render(<QuizSection questions={mockQuestions} />)
    expect(screen.getByTestId('quiz-prev-btn')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-next-btn')).toBeInTheDocument()
  })

  it('prev button is disabled on first question', () => {
    render(<QuizSection questions={mockQuestions} />)
    const prevBtn = screen.getByTestId('quiz-prev-btn') as HTMLButtonElement
    expect(prevBtn.disabled).toBe(true)
  })

  it('next button is not disabled on first question', () => {
    render(<QuizSection questions={mockQuestions} />)
    const nextBtn = screen.getByTestId('quiz-next-btn') as HTMLButtonElement
    expect(nextBtn.disabled).toBe(false)
  })

  it('navigates to next question and disables next on last', () => {
    render(<QuizSection questions={mockQuestions} />)
    const nextBtn = screen.getByTestId('quiz-next-btn')
    fireEvent.click(nextBtn)
    const prevBtn = screen.getByTestId('quiz-prev-btn') as HTMLButtonElement
    expect(prevBtn.disabled).toBe(false)
    const nextBtnAfter = screen.getByTestId('quiz-next-btn') as HTMLButtonElement
    expect(nextBtnAfter.disabled).toBe(true)
  })

  it('navigates to previous question on click', () => {
    render(<QuizSection questions={mockQuestions} />)
    const nextBtn = screen.getByTestId('quiz-next-btn')
    fireEvent.click(nextBtn)
    const prevBtn = screen.getByTestId('quiz-prev-btn')
    fireEvent.click(prevBtn)
    const prevBtnAfter = screen.getByTestId('quiz-prev-btn') as HTMLButtonElement
    expect(prevBtnAfter.disabled).toBe(true)
  })

  it('does not render navigation when only one question', () => {
    render(<QuizSection questions={[mockQuestions[0]]} />)
    expect(screen.queryByTestId('quiz-nav')).not.toBeInTheDocument()
  })

  it('renders empty message when no questions', () => {
    render(<QuizSection questions={[]} />)
    expect(screen.getByText('No quiz questions provided.')).toBeInTheDocument()
  })

  it('preserves answers when navigating between questions', () => {
    render(<QuizSection questions={mockQuestions} />)
    const correctChoice = screen.getByTestId('quiz-choice-0-b')
    fireEvent.click(correctChoice)
    expect(screen.getByTestId('quiz-explanation-0')).toHaveClass('quiz-explanation-correct')
    const nextBtn = screen.getByTestId('quiz-next-btn')
    fireEvent.click(nextBtn)
    const wrongChoice = screen.getByTestId('quiz-choice-1-c')
    fireEvent.click(wrongChoice)
    expect(screen.getByTestId('quiz-explanation-1')).toHaveClass('quiz-explanation-wrong')
    const prevBtn = screen.getByTestId('quiz-prev-btn')
    fireEvent.click(prevBtn)
    expect(screen.getByTestId('quiz-explanation-0')).toHaveClass('quiz-explanation-correct')
  })

  it('dims non-selected choices after answering', () => {
    render(<QuizSection questions={mockQuestions} />)
    const chosenChoice = screen.getByTestId('quiz-choice-0-a')
    fireEvent.click(chosenChoice)
    const dimmedChoice = screen.getByTestId('quiz-choice-0-c')
    expect(dimmedChoice).toHaveClass('quiz-choice-dimmed')
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz')
    const { SectionRegistry: Registry } = await import('../../../../src/core/learning-engine/registry')
    expect(Registry.get('quiz')).toBeUndefined()
    void mod
  })
})
