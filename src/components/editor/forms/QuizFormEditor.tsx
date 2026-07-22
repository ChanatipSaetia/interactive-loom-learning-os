import { useCallback } from 'react'
import type { OKFQuizSectionData, OKFQuizQuestion, OKFQuizChoice } from '../../../core/okf/types'

interface QuizFormEditorProps {
  data: OKFQuizSectionData
  onChange: (data: OKFQuizSectionData) => void
}

function QuizChoiceEditor({
  choice,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  choice: OKFQuizChoice
  index: number
  onChange: (choice: OKFQuizChoice) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof OKFQuizChoice, value: string | boolean) => {
      onChange({ ...choice, [field]: value })
    },
    [choice, onChange]
  )

  return (
    <fieldset className="visual-form-nested" data-testid={`quiz-choice-${index}`}>
      <legend>Choice {String.fromCharCode(65 + index)} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`quiz-choice-remove-${index}`}>×</button> : null}</legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={choice.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            data-testid={`quiz-choice-${index}-id`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Text</span>
          <input
            className="visual-form-input"
            value={choice.text}
            onChange={(e) => handleFieldChange('text', e.target.value)}
            data-testid={`quiz-choice-${index}-text`}
          />
        </label>
      </div>
      <div className="visual-form-field visual-form-field--bool">
        <label className="visual-form-label">
          <input
            type="checkbox"
            checked={choice.correct}
            onChange={(e) => handleFieldChange('correct', e.target.checked)}
            data-testid={`quiz-choice-${index}-correct`}
          />
          <span className="visual-form-key">Correct</span>
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Explanation</span>
          <textarea
            className="visual-form-textarea"
            value={choice.explanation}
            onChange={(e) => handleFieldChange('explanation', e.target.value)}
            rows={2}
            data-testid={`quiz-choice-${index}-explanation`}
          />
        </label>
      </div>
    </fieldset>
  )
}

function QuizQuestionEditor({
  question,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  question: OKFQuizQuestion
  index: number
  onChange: (question: OKFQuizQuestion) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const handleFieldChange = useCallback(
    (field: keyof OKFQuizQuestion, value: string | OKFQuizChoice[]) => {
      onChange({ ...question, [field]: value })
    },
    [question, onChange]
  )

  const handleChoiceChange = useCallback(
    (choiceIndex: number, updatedChoice: OKFQuizChoice) => {
      const updatedChoices = [...question.choices]
      updatedChoices[choiceIndex] = updatedChoice
      handleFieldChange('choices', updatedChoices)
    },
    [question, handleFieldChange]
  )

  const handleRemoveChoice = useCallback(
    (choiceIndex: number) => {
      const updatedChoices = question.choices.filter((_, i) => i !== choiceIndex)
      handleFieldChange('choices', updatedChoices)
    },
    [question, handleFieldChange]
  )

  const handleAddChoice = useCallback(() => {
    const newChoice: OKFQuizChoice = {
      id: `c${question.choices.length}`,
      text: '',
      correct: false,
      explanation: '',
    }
    handleFieldChange('choices', [...question.choices, newChoice])
  }, [question, handleFieldChange])

  return (
    <fieldset className="visual-form-nested" data-testid={`quiz-question-${index}`}>
      <legend>
        Question {index + 1} {canRemove ? <button className="form-remove-btn" onClick={onRemove} data-testid={`quiz-question-remove-${index}`}>×</button> : null}
      </legend>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">ID</span>
          <input
            className="visual-form-input"
            value={question.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            data-testid={`quiz-question-${index}-id`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Question</span>
          <textarea
            className="visual-form-textarea"
            value={question.question}
            onChange={(e) => handleFieldChange('question', e.target.value)}
            rows={2}
            data-testid={`quiz-question-${index}-question`}
          />
        </label>
      </div>
      <div className="visual-form-field">
        <label className="visual-form-label">
          <span className="visual-form-key">Hint</span>
          <input
            className="visual-form-input"
            value={question.hint ?? ''}
            onChange={(e) => handleFieldChange('hint', e.target.value)}
            placeholder="(optional)"
            data-testid={`quiz-question-${index}-hint`}
          />
        </label>
      </div>
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Choices</span>
        <div className="visual-form-object-list">
          {question.choices.map((choice, i) => (
            <QuizChoiceEditor
              key={choice.id || i}
              choice={choice}
              index={i}
              onChange={(updated) => handleChoiceChange(i, updated)}
              onRemove={() => handleRemoveChoice(i)}
              canRemove={question.choices.length > 1}
            />
          ))}
        </div>
        <button
          className="form-add-btn"
          onClick={handleAddChoice}
          data-testid={`quiz-question-${index}-add-choice`}
        >
          + Add Choice
        </button>
      </div>
    </fieldset>
  )
}

export function QuizFormEditor({ data, onChange }: QuizFormEditorProps) {
  const handleQuestionChange = useCallback(
    (questionIndex: number, updatedQuestion: OKFQuizQuestion) => {
      const updated = [...data.questions]
      updated[questionIndex] = updatedQuestion
      onChange({ ...data, questions: updated })
    },
    [data, onChange]
  )

  const handleRemoveQuestion = useCallback(
    (questionIndex: number) => {
      const updated = data.questions.filter((_, i) => i !== questionIndex)
      onChange({ ...data, questions: updated })
    },
    [data, onChange]
  )

  const handleAddQuestion = useCallback(() => {
    const newQ: OKFQuizQuestion = {
      id: `q${data.questions.length + 1}`,
      question: '',
      choices: [
        { id: 'a', text: '', correct: false, explanation: '' },
        { id: 'b', text: '', correct: false, explanation: '' },
      ],
    }
    onChange({ ...data, questions: [...data.questions, newQ] })
  }, [data, onChange])

  return (
    <div className="visual-form" data-testid="quiz-form-editor">
      <div className="visual-form-field visual-form-field--array">
        <span className="visual-form-key">Questions ({data.questions.length})</span>
        <div className="visual-form-object-list">
          {data.questions.map((q, i) => (
            <QuizQuestionEditor
              key={q.id || i}
              question={q}
              index={i}
              onChange={(updated) => handleQuestionChange(i, updated)}
              onRemove={() => handleRemoveQuestion(i)}
              canRemove={data.questions.length > 1}
            />
          ))}
        </div>
        <button
          className="form-add-btn"
          onClick={handleAddQuestion}
          data-testid="quiz-add-question"
        >
          + Add Question
        </button>
      </div>
    </div>
  )
}
