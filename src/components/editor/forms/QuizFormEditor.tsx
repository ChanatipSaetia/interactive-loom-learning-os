import { useState, useCallback } from 'react'
import { HelpCircle, CheckCircle2, CheckSquare, Settings, Plus, Trash2 } from 'lucide-react'
import { QuizHelpModal } from '../../../core/subdomains/practice-assessment/components/quiz/QuizHelpModal'
import '../../../core/subdomains/practice-assessment/components/quiz/quiz.css'
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

  const letter = String.fromCharCode(65 + index)

  return (
    <div className="visual-form-card visual-form-card--sub" data-testid={`quiz-choice-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <span className="card-code-pill">Choice {letter}</span>
          {choice.correct && (
            <span style={{ fontSize: '11px', color: 'var(--ctp-green)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> Correct
            </span>
          )}
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`quiz-choice-remove-${index}`}
            type="button"
            title="Remove choice"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
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
          <div className="visual-form-field visual-form-field--bool" style={{ alignSelf: 'flex-end', marginBottom: '4px' }}>
            <label className="visual-form-label">
              <input
                type="checkbox"
                checked={choice.correct}
                onChange={(e) => handleFieldChange('correct', e.target.checked)}
                data-testid={`quiz-choice-${index}-correct`}
              />
              <span className="visual-form-key" style={{ color: choice.correct ? 'var(--ctp-green)' : undefined }}>
                Correct Choice
              </span>
            </label>
          </div>
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
      </div>
    </div>
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
    <div className="visual-form-card" data-testid={`quiz-question-${index}`}>
      <div className="visual-form-card-header">
        <span className="card-header-title">
          <HelpCircle size={14} /> Question #{index + 1}: <code className="card-code-pill">{question.id}</code>
        </span>
        {canRemove && (
          <button
            className="form-remove-btn"
            onClick={onRemove}
            data-testid={`quiz-question-remove-${index}`}
            type="button"
            title="Remove question"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="visual-form-card-body">
        <div className="visual-form-grid-2">
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
        </div>

        <div className="visual-form-field">
          <label className="visual-form-label">
            <span className="visual-form-key">Question Text</span>
            <textarea
              className="visual-form-textarea"
              value={question.question}
              onChange={(e) => handleFieldChange('question', e.target.value)}
              rows={2}
              data-testid={`quiz-question-${index}-question`}
            />
          </label>
        </div>

        <div className="visual-form-field visual-form-field--array">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Choices ({question.choices.length})</span>
            <button
              className="form-add-btn form-add-btn--sm"
              onClick={handleAddChoice}
              data-testid={`quiz-question-${index}-add-choice`}
              type="button"
            >
              <Plus size={12} /> Add Choice
            </button>
          </div>

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
        </div>
      </div>
    </div>
  )
}

type QuizSubTab = 'questions' | 'settings'

export function QuizFormEditor({ data, onChange }: QuizFormEditorProps) {
  const [activeTab, setActiveTab] = useState<QuizSubTab>('questions')
  const [isHelpOpen, setIsHelpOpen] = useState(false)

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
      {/* Sub-Tabs */}
      <div className="flowchart-sub-tabs" data-testid="quiz-sub-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`flowchart-sub-tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
          data-testid="quiz-tab-questions"
          type="button"
        >
          <CheckSquare size={14} />
          <span>Questions</span>
          <span className="sub-tab-badge">{data.questions.length}</span>
        </button>
        <button
          className={`flowchart-sub-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          data-testid="quiz-tab-settings"
          type="button"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        <button
          className="qz-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="quiz-editor-help-btn"
          type="button"
          style={{ marginLeft: 'auto' }}
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <QuizHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Questions Sub-Tab */}
      {activeTab === 'questions' && (
        <div className="visual-form-field visual-form-field--array" data-testid="quiz-questions-tab-content">
          <div className="visual-form-section-header">
            <span className="visual-form-key">Questions ({data.questions.length})</span>
            <button
              className="form-add-btn"
              onClick={handleAddQuestion}
              data-testid="quiz-add-question"
              type="button"
            >
              <Plus size={13} /> Add Question
            </button>
          </div>

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
        </div>
      )}

      {/* Settings Sub-Tab */}
      {activeTab === 'settings' && (
        <div className="visual-form-card" data-testid="quiz-settings-tab-content">
          <div className="visual-form-card-header">
            <span className="card-header-title">
              <Settings size={14} /> Quiz Settings & Configuration
            </span>
          </div>
          <div className="visual-form-card-body">
            <p className="visual-form-empty" style={{ fontStyle: 'normal' }}>
              Quiz section settings and passing criteria can be configured here. Add questions in the <strong>Questions</strong> sub-tab.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
