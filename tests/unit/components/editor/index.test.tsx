import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VisualFormEditor } from '../../../../src/components/editor/VisualFormEditor'
import { RawYAMLEditor } from '../../../../src/components/editor/RawYAMLEditor'
import { EditorPanel } from '../../../../src/components/editor/EditorPanel'
import type { OKFSectionData } from '../../../../src/core/okf/types'

describe('VisualFormEditor', () => {
  it('renders dynamic schema form for text type (fallback)', () => {
    const mockData: OKFSectionData = {
      type: 'text',
      paragraphs: ['Hello world', 'Second paragraph'],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('dynamic-schema-form')).toBeInTheDocument()
    expect(screen.getByTestId('form-field-type')).toBeInTheDocument()
    const paragraphInputs = screen.getAllByTestId(/form-field-paragraphs-/g)
    expect(paragraphInputs.length).toBe(2)
  })

  it('calls onChange with updated data when field is edited (fallback form)', () => {
    const mockData: OKFSectionData = {
      type: 'text',
      paragraphs: ['Hello world', 'Second paragraph'],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    const typeInput = screen.getByTestId('form-field-type')
    fireEvent.change(typeInput, { target: { value: 'bullets' } })

    expect(onChange).toHaveBeenCalled()
  })

  it('renders quiz form editor for quiz type', () => {
    const quizData: OKFSectionData = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is X?',
          choices: [
            { id: 'a', text: 'Option A', correct: true, explanation: 'Correct' },
          ],
        },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={quizData} onChange={onChange} />)

    expect(screen.getByTestId('quiz-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-question-0')).toBeInTheDocument()
    expect(screen.getByTestId('quiz-add-question')).toBeInTheDocument()
  })

  it('renders quiz question fields correctly', () => {
    const quizData: OKFSectionData = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is X?',
          choices: [
            { id: 'a', text: 'Option A', correct: true, explanation: 'Correct' },
            { id: 'b', text: 'Option B', correct: false, explanation: 'Wrong' },
          ],
        },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={quizData} onChange={onChange} />)

    expect(screen.getByTestId('quiz-question-0-id')).toHaveValue('q1')
    expect(screen.getByTestId('quiz-question-0-question')).toHaveValue('What is X?')
    expect(screen.getByTestId('quiz-choice-0-id')).toHaveValue('a')
    expect(screen.getByTestId('quiz-choice-0-text')).toHaveValue('Option A')
    expect(screen.getByTestId('quiz-choice-0-correct')).toBeChecked()
  })

  it('calls onChange when quiz question is edited', () => {
    const quizData: OKFSectionData = {
      type: 'quiz',
      questions: [
        {
          id: 'q1',
          question: 'What is X?',
          choices: [
            { id: 'a', text: 'Option A', correct: true, explanation: 'Correct' },
          ],
        },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={quizData} onChange={onChange} />)

    const questionInput = screen.getByTestId('quiz-question-0-question')
    fireEvent.change(questionInput, { target: { value: 'New question?' } })

    expect(onChange).toHaveBeenCalled()
    const callArg = onChange.mock.calls[0][0] as OKFSectionData
    expect((callArg as { questions: { question: string }[] }).questions[0].question).toBe('New question?')
  })

  it('renders flashcards form editor for flashcards type', () => {
    const flashcardData: OKFSectionData = {
      type: 'flashcards',
      terms: [
        {
          id: 't1',
          word: 'Hello',
          pronunciation: 'həˈloʊ',
          category: 'greeting',
          shortDefinition: 'A greeting',
          detailedDefinition: 'A common greeting',
          whyItMatters: 'Essential for communication',
        },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={flashcardData} onChange={onChange} />)

    expect(screen.getByTestId('flashcards-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('flashcard-0')).toBeInTheDocument()
    expect(screen.getByTestId('flashcards-add-term')).toBeInTheDocument()
  })

  it('renders concept map form editor for concept-map type', () => {
    const cmData: OKFSectionData = {
      type: 'concept-map',
      nodes: {
        node1: { id: 'node1', title: 'Node 1', category: 'A' },
        node2: { id: 'node2', title: 'Node 2', category: 'B' },
      },
      edges: [
        { from: 'node1', to: 'node2', label: 'relates to' },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={cmData} onChange={onChange} />)

    expect(screen.getByTestId('concept-map-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('cm-node-node1')).toBeInTheDocument()
    expect(screen.getByTestId('cm-edge-0')).toBeInTheDocument()
    expect(screen.getByTestId('cm-add-node')).toBeInTheDocument()
    expect(screen.getByTestId('cm-add-edge')).toBeInTheDocument()
  })

  it('renders tradeoff sandbox form editor for tradeoff-sandbox type', () => {
    const tsData: OKFSectionData = {
      type: 'tradeoff-sandbox',
      scenarios: [
        {
          id: 's1',
          title: 'Scenario 1',
          description: 'A test scenario',
          metrics: [
            { id: 'm1', label: 'Metric 1', baseValue: 10 },
          ],
          steps: [
            {
              id: 'step1',
              title: 'Step 1',
              description: 'First step',
              choices: [
                {
                  id: 'c1',
                  label: 'Choice A',
                  description: 'Description A',
                  metrics: { m1: 5 },
                  pros: [],
                  cons: [],
                },
              ],
            },
          ],
        },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={tsData} onChange={onChange} />)

    expect(screen.getByTestId('tradeoff-sandbox-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('tc-scenario-0')).toBeInTheDocument()
    expect(screen.getByTestId('tradeoff-add-scenario')).toBeInTheDocument()
  })

  it('renders scenario form editor for scenario type', () => {
    const scenarioData: OKFSectionData = {
      type: 'scenario',
      id: 'sc1',
      title: 'Test Scenario',
      intro: 'Introduction',
      nodes: {
        start: {
          id: 'start',
          prompt: 'What do you do?',
          choices: [
            { id: 'c1', text: 'Option A', next: 'end' },
          ],
        },
        end: {
          id: 'end',
          outcome: { verdict: 'Good', lesson: 'Learned', rating: 'a' },
        },
      },
      startNode: 'start',
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={scenarioData} onChange={onChange} />)

    expect(screen.getByTestId('scenario-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-title')).toHaveValue('Test Scenario')
    expect(screen.getByTestId('sc-node-start')).toBeInTheDocument()
  })

  it('renders decision tree form editor for decision-tree type', () => {
    const dtData: OKFSectionData = {
      type: 'decision-tree',
      id: 'dt1',
      title: 'Test DT',
      root: 'root',
      nodes: {
        root: {
          id: 'root',
          prompt: 'What to choose?',
          choices: [
            { id: 'c1', text: 'A', next: 'leaf1', rationale: 'Good' },
          ],
        },
        leaf1: {
          id: 'leaf1',
          leaf: { recommendation: 'Go A', explanation: 'Because' },
        },
      },
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={dtData} onChange={onChange} />)

    expect(screen.getByTestId('decision-tree-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('dt-title')).toHaveValue('Test DT')
    expect(screen.getByTestId('dt-node-root')).toBeInTheDocument()
    expect(screen.getByTestId('dt-choice-0')).toBeInTheDocument()
  })

  it('renders formula sandbox form editor for formula-sandbox type', () => {
    const fsData: OKFSectionData = {
      type: 'formula-sandbox',
      variables: [
        { id: 'v1', label: 'Speed', min: 0, max: 100, step: 1, defaultValue: 50 },
      ],
      metrics: [
        { id: 'm1', label: 'Distance', formula: 'speed * time', description: 'How far' },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={fsData} onChange={onChange} />)

    expect(screen.getByTestId('formula-sandbox-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('fs-var-0')).toBeInTheDocument()
    expect(screen.getByTestId('fs-metric-0')).toBeInTheDocument()
    expect(screen.getByTestId('fs-add-variable')).toBeInTheDocument()
    expect(screen.getByTestId('fs-add-metric')).toBeInTheDocument()
  })

  it('renders string array items as individual inputs (fallback form)', () => {
    const mockData: OKFSectionData = {
      type: 'text',
      paragraphs: ['Hello world', 'Second paragraph'],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    const paragraphInputs = screen.getAllByTestId('form-field-paragraphs-0')
    expect(paragraphInputs.length).toBe(1)
  })
})

describe('RawYAMLEditor', () => {
  it('renders textarea with initial text', () => {
    const onChange = vi.fn()
    const initialText = 'type: text\nparagraphs:\n  - Hello'

    render(
      <RawYAMLEditor text={initialText} error={null} onChange={onChange} />
    )

    expect(screen.getByTestId('raw-yaml-editor')).toBeInTheDocument()
    const textarea = screen.getByTestId('raw-yaml-textarea')
    expect(textarea).toHaveValue(initialText)
  })

  it('calls onChange when text is edited', () => {
    const onChange = vi.fn()
    render(
      <RawYAMLEditor text="type: text" error={null} onChange={onChange} />
    )

    const textarea = screen.getByTestId('raw-yaml-textarea')
    fireEvent.change(textarea, { target: { value: 'type: bullets' } })

    expect(onChange).toHaveBeenCalledWith('type: bullets')
  })

  it('displays parse error banner', () => {
    const onChange = vi.fn()
    render(
      <RawYAMLEditor
        text="invalid: ["
        error="Unexpected token x in JSON at position 0"
        onChange={onChange}
      />
    )

    const errorEl = screen.getByTestId('raw-yaml-error')
    expect(errorEl).toBeInTheDocument()
    expect(errorEl).toHaveTextContent('Unexpected token')
  })

  it('does not show error banner when error is null', () => {
    const onChange = vi.fn()
    render(
      <RawYAMLEditor text="type: text" error={null} onChange={onChange} />
    )

    expect(screen.queryByTestId('raw-yaml-error')).not.toBeInTheDocument()
  })
})

describe('EditorPanel', () => {
  const mockProps = {
    sectionData: { type: 'text', paragraphs: ['Hello'] } as OKFSectionData,
    parseError: null as string | null,
    onVisualFormChange: vi.fn(),
    onRawTextChange: vi.fn(),
    rawText: 'type: text\nparagraphs:\n  - Hello',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with Visual Form tab active by default', () => {
    render(<EditorPanel {...mockProps} />)

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument()
    expect(screen.getByTestId('editor-tab-form')).toBeInTheDocument()
    expect(screen.getByTestId('editor-tab-raw')).toBeInTheDocument()
    expect(screen.getByTestId('dynamic-schema-form')).toBeInTheDocument()
    expect(screen.queryByTestId('raw-yaml-editor')).not.toBeInTheDocument()
  })

  it('switches to Raw YAML tab on click', () => {
    render(<EditorPanel {...mockProps} />)

    const rawTab = screen.getByTestId('editor-tab-raw')
    fireEvent.click(rawTab)

    expect(screen.queryByTestId('dynamic-schema-form')).not.toBeInTheDocument()
    expect(screen.getByTestId('raw-yaml-editor')).toBeInTheDocument()
    expect(rawTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches back to Visual Form tab on click', () => {
    render(<EditorPanel {...mockProps} />)

    const rawTab = screen.getByTestId('editor-tab-raw')
    fireEvent.click(rawTab)
    expect(screen.getByTestId('raw-yaml-editor')).toBeInTheDocument()

    const formTab = screen.getByTestId('editor-tab-form')
    fireEvent.click(formTab)

    expect(screen.getByTestId('dynamic-schema-form')).toBeInTheDocument()
    expect(screen.queryByTestId('raw-yaml-editor')).not.toBeInTheDocument()
    expect(formTab).toHaveAttribute('aria-selected', 'true')
  })

  it('shows parse error in raw YAML tab', () => {
    const propsWithErrors = {
      ...mockProps,
      parseError: 'Bad YAML syntax',
    }

    render(<EditorPanel {...propsWithErrors} />)

    fireEvent.click(screen.getByTestId('editor-tab-raw'))
    expect(screen.getByTestId('raw-yaml-error')).toBeInTheDocument()
    expect(screen.getByTestId('raw-yaml-error')).toHaveTextContent('Bad YAML syntax')
  })
})
