import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VisualFormEditor } from '../../../../src/components/editor/VisualFormEditor'
import { RawYAMLEditor } from '../../../../src/components/editor/RawYAMLEditor'
import { EditorPanel } from '../../../../src/components/editor/EditorPanel'
import type { OKFSectionData } from '../../../../src/core/okf/types'
import type { ValidationError } from '../../../../src/core/okf/validate'

describe('VisualFormEditor', () => {
  it('renders text form editor for text type', () => {
    const mockData: OKFSectionData = {
      type: 'text',
      paragraphs: ['Hello world', 'Second paragraph'],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('text-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('text-paragraph-input-0')).toBeInTheDocument()
    expect(screen.getByTestId('text-add-paragraph')).toBeInTheDocument()

    // Test guide modal
    fireEvent.click(screen.getByTestId('text-editor-help-btn'))
    expect(screen.getByTestId('text-help-modal')).toBeInTheDocument()
  })

  it('renders bullets form editor for bullets type', () => {
    const mockData: OKFSectionData = {
      type: 'bullets',
      items: [{ text: 'Bullet Item 1' }],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('bullets-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('bullet-item-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('bullets-add-item')).toBeInTheDocument()

    // Test guide modal
    fireEvent.click(screen.getByTestId('bullets-editor-help-btn'))
    expect(screen.getByTestId('bullets-help-modal')).toBeInTheDocument()
  })

  it('renders taxonomy browser form editor for taxonomy-browser type', () => {
    const mockData: OKFSectionData = {
      type: 'taxonomy-browser',
      categories: [
        {
          icon: 'Layers',
          title: 'Presentation Layer',
          subtitle: 'UI/UX',
          description: 'Desc',
          details: 'Details',
          analogy: 'Analogy',
          primaryFocus: 'Focus',
          inScope: ['Scope 1'],
          outOfScope: ['Out 1'],
          color: 'blue',
        },
      ],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('taxonomy-browser-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-category-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-add-category')).toBeInTheDocument()

    // Test sub-tabs (Identity, Content, Scope)
    fireEvent.click(screen.getByTestId('taxonomy-tab-content-0'))
    expect(screen.getByTestId('taxonomy-0-description')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('taxonomy-tab-scope-0'))
    expect(screen.getByTestId('taxonomy-0-inscope-0')).toBeInTheDocument()

    // Test guide modal
    fireEvent.click(screen.getByTestId('taxonomy-editor-help-btn'))
    expect(screen.getByTestId('taxonomy-help-modal')).toBeInTheDocument()
  })

  it('renders reflection sequence form editor for reflection-sequence type', () => {
    const mockData: OKFSectionData = {
      type: 'reflection-sequence',
      challenges: [
        {
          prompt: 'Order steps:',
          items: [{ id: 's1', text: 'Step 1' }],
          solution: ['s1'],
        },
      ],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('reflection-sequence-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('sequence-challenge-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('reflection-sequence-add-challenge')).toBeInTheDocument()

    // Test guide modal
    fireEvent.click(screen.getByTestId('reflection-sequence-editor-help-btn'))
    expect(screen.getByTestId('reflection-sequence-help-modal')).toBeInTheDocument()
  })

  it('renders reflection template form editor for reflection-template type', () => {
    const mockData: OKFSectionData = {
      type: 'reflection-template',
      challenges: [
        {
          prompt: 'Fill blanks:',
          template: 'Uses {zone-1}',
          chips: [{ id: 'c1', text: 'Chip 1' }],
          solution: { 'zone-1': 'c1' },
        },
      ],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('reflection-template-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('template-challenge-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('reflection-template-add-challenge')).toBeInTheDocument()

    // Test guide modal
    fireEvent.click(screen.getByTestId('reflection-template-editor-help-btn'))
    expect(screen.getByTestId('reflection-template-help-modal')).toBeInTheDocument()
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

    // Test dialogue toggle
    fireEvent.click(screen.getByTestId('flashcard-0-toggle-dialogue'))
    expect(screen.getByTestId('flashcard-0-dialogue-user')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('flashcards-editor-help-btn'))
    expect(screen.getByTestId('fc-help-modal')).toBeInTheDocument()
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
    expect(screen.getByTestId('cm-sub-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('cm-node-node1')).toBeInTheDocument()
    expect(screen.getByTestId('cm-add-node')).toBeInTheDocument()

    // Switch to Edges tab
    fireEvent.click(screen.getByTestId('cm-tab-edges'))
    expect(screen.getByTestId('cm-edge-0')).toBeInTheDocument()
    expect(screen.getByTestId('cm-add-edge')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('cm-editor-help-btn'))
    expect(screen.getByTestId('cm-help-modal')).toBeInTheDocument()
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
    expect(screen.getByTestId('to-sub-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('to-scenario-0')).toBeInTheDocument()
    expect(screen.getByTestId('tradeoff-add-scenario')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('tradeoff-editor-help-btn'))
    expect(screen.getByTestId('to-help-modal')).toBeInTheDocument()
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
    expect(screen.getByTestId('sc-node-list')).toBeInTheDocument()
    expect(screen.getByTestId('sc-node-item-start')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('scenario-editor-help-btn'))
    expect(screen.getByTestId('sc-help-modal')).toBeInTheDocument()
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
    expect(screen.getByTestId('dt-node-list')).toBeInTheDocument()
    expect(screen.getByTestId('dt-node-item-root')).toBeInTheDocument()
    expect(screen.getByTestId('dt-choice-0')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('dt-editor-help-btn'))
    expect(screen.getByTestId('dt-help-modal')).toBeInTheDocument()
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
    expect(screen.getByTestId('fs-sub-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('fs-var-0')).toBeInTheDocument()
    expect(screen.getByTestId('fs-add-variable')).toBeInTheDocument()

    // Switch to Metrics tab
    fireEvent.click(screen.getByTestId('fs-tab-metrics'))
    expect(screen.getByTestId('fs-metric-0')).toBeInTheDocument()
    expect(screen.getByTestId('fs-add-metric')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('formula-editor-help-btn'))
    expect(screen.getByTestId('fm-help-modal')).toBeInTheDocument()
  })

  it('renders flowchart form editor with sub-tabs for flowchart type', () => {
    const flowchartData: OKFSectionData = {
      type: 'flowchart',
      flow: {
        actors: {
          user: { title: 'User', desc: 'Main user' },
        },
        systems: {
          engine: { title: 'Engine', desc: 'Core system', type: 'aggregate' },
        },
        steps: [
          {
            id: 'step_1',
            type: 'linear',
            policy: 'Start policy',
            command: 'Run command',
            handledBy: { _tag: 'ref', id: 'engine' },
            resultEvents: [{ id: 'evt_1', title: 'Started' }],
          },
        ],
        journeys: [
          {
            id: 'j1',
            label: 'Main Journey',
            description: 'Main path',
            steps: [{ stepId: 'step_1', name: 'Step 1', description: 'Start' }],
          },
        ],
      },
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={flowchartData} onChange={onChange} />)

    expect(screen.getByTestId('flowchart-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-sub-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-content-steps')).toBeInTheDocument()

    // Switch sub-tabs
    fireEvent.click(screen.getByTestId('flowchart-tab-actors'))
    expect(screen.getByTestId('flowchart-content-actors')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-actor-user')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('flowchart-tab-systems'))
    expect(screen.getByTestId('flowchart-content-systems')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-system-engine')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('flowchart-tab-journeys'))
    expect(screen.getByTestId('flowchart-content-journeys')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-journey-0')).toBeInTheDocument()
  })

  it('supports branch step rendering, branch options editing, and type toggling in flowchart editor', () => {
    const flowchartData: OKFSectionData = {
      type: 'flowchart',
      flow: {
        actors: {},
        systems: { engine: { title: 'Engine', desc: 'Core', type: 'aggregate' } },
        steps: [
          {
            id: 'branch_step_1',
            type: 'branch',
            event: 'reasoned',
            branches: [
              {
                id: 'exec_tool',
                label: 'Execute Tool',
                policy: 'Tool Policy',
                command: 'Tool Command',
                handledBy: { _tag: 'ref', id: 'engine' },
                resultEvents: [{ id: 'evt_exec', title: 'Executed' }],
              },
            ],
          },
        ],
        journeys: [
          {
            id: 'j1',
            label: 'Journey 1',
            description: 'Test',
            steps: [{ stepId: 'exec_tool', name: 'Tool Step', description: 'Executes tool' }],
          },
        ],
      },
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={flowchartData} onChange={onChange} />)

    // Check branch step element rendering
    expect(screen.getByTestId('flowchart-step-0')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-step-0-event')).toHaveValue('reasoned')
    expect(screen.getByTestId('flowchart-step-0-branch-0')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-step-0-branch-0-id')).toHaveValue('exec_tool')
    expect(screen.getByTestId('flowchart-step-0-branch-0-label')).toHaveValue('Execute Tool')

    // Add branch path
    fireEvent.click(screen.getByTestId('flowchart-step-0-add-branch-opt'))
    expect(onChange).toHaveBeenCalled()

    // Test Journey dropdown option for branch path ID
    fireEvent.click(screen.getByTestId('flowchart-tab-journeys'))
    const stepIdSelect = screen.getByTestId('flowchart-journey-0-step-0-stepId')
    expect(stepIdSelect).toHaveValue('exec_tool')
  })

  it('supports system state machine toggling and editing in flowchart editor', () => {
    const flowchartData: OKFSectionData = {
      type: 'flowchart',
      flow: {
        actors: {},
        systems: {
          sys1: { title: 'System 1', desc: 'Desc', type: 'aggregate' },
        },
        steps: [],
        journeys: [],
      },
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={flowchartData} onChange={onChange} />)

    fireEvent.click(screen.getByTestId('flowchart-tab-systems'))
    expect(screen.getByTestId('flowchart-system-sys1')).toBeInTheDocument()

    // Toggle state machine
    fireEvent.click(screen.getByTestId('flowchart-system-sys1-toggle-sm'))
    expect(onChange).toHaveBeenCalled()
  })

  it('renders intro form editor for intro section type', () => {
    const introData: OKFSectionData = {
      type: 'intro',
      title: 'Test Topic',
      subtitle: 'Subtitle',
      estimatedTime: '15 mins',
      moduleCount: 4,
      what: {
        definition: 'Core definition',
        summary: 'What summary',
        bullets: ['Bullet 1'],
        tags: ['tag1'],
      },
      why: {
        summary: 'Why summary',
        impact: 'Key takeaway',
      },
      roadmap: [
        { sectionId: 'flowchart', title: 'Flowchart', type: 'flowchart', description: 'Flowchart step' },
      ],
    }

    const onChange = vi.fn()
    render(<VisualFormEditor data={introData} onChange={onChange} />)

    expect(screen.getByTestId('intro-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('intro-field-title')).toHaveValue('Test Topic')
    expect(screen.getByTestId('intro-field-definition')).toHaveValue('Core definition')
    expect(screen.getByTestId('intro-add-bullet')).toBeInTheDocument()

    // Test guide button
    fireEvent.click(screen.getByTestId('intro-editor-help-btn'))
    expect(screen.getByTestId('intro-help-modal')).toBeInTheDocument()
  })

  it('renders string array items as individual inputs (fallback form)', () => {
    const mockData = {
      type: 'custom-fallback',
      paragraphs: ['Hello world', 'Second paragraph'],
    }
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData as unknown as OKFSectionData} onChange={onChange} />)

    const paragraphInputs = screen.getAllByTestId('form-field-paragraphs-0')
    expect(paragraphInputs.length).toBe(1)
  })
})


describe('RawYAMLEditor', () => {
  it('renders textarea with initial text', () => {
    const onChange = vi.fn()
    const initialText = 'type: text\nparagraphs:\n  - Hello'

    render(
      <RawYAMLEditor text={initialText} errors={[]} onChange={onChange} />
    )

    expect(screen.getByTestId('raw-yaml-editor')).toBeInTheDocument()
    const textarea = screen.getByTestId('raw-yaml-textarea')
    expect(textarea).toHaveValue(initialText)
  })

  it('calls onChange when text is edited', () => {
    const onChange = vi.fn()
    render(
      <RawYAMLEditor text="type: text" errors={[]} onChange={onChange} />
    )

    const textarea = screen.getByTestId('raw-yaml-textarea')
    fireEvent.change(textarea, { target: { value: 'type: bullets' } })

    expect(onChange).toHaveBeenCalledWith('type: bullets')
  })

  it('displays syntax error banner', () => {
    const onChange = vi.fn()
    const errors: ValidationError[] = [
      {
        kind: 'syntax',
        message: 'unexpected end of the stream',
        line: 3,
      },
    ]

    render(
      <RawYAMLEditor text="invalid: [" errors={errors} onChange={onChange} />
    )

    const banner = screen.getByTestId('yaml-validation-banner')
    expect(banner).toBeInTheDocument()
    const syntaxGroup = screen.getByTestId('yaml-syntax-error-group')
    expect(syntaxGroup).toBeInTheDocument()
    expect(syntaxGroup).toHaveTextContent('YAML Syntax Error')
    expect(syntaxGroup).toHaveTextContent('unexpected end of the stream')
  })

  it('displays schema error banner with field context', () => {
    const onChange = vi.fn()
    const errors: ValidationError[] = [
      {
        kind: 'schema',
        field: 'paragraphs',
        message: 'Missing required field: "paragraphs"',
      },
    ]

    render(
      <RawYAMLEditor text="type: text" errors={errors} onChange={onChange} />
    )

    const banner = screen.getByTestId('yaml-validation-banner')
    expect(banner).toBeInTheDocument()
    const schemaGroup = screen.getByTestId('yaml-schema-error-group')
    expect(schemaGroup).toBeInTheDocument()
    expect(schemaGroup).toHaveTextContent('Schema Validation Error')
    const fieldEl = screen.getByTestId('yaml-error-field')
    expect(fieldEl).toHaveTextContent('paragraphs')
  })

  it('displays line number for syntax errors', () => {
    const onChange = vi.fn()
    const errors: ValidationError[] = [
      {
        kind: 'syntax',
        message: 'bad indentation',
        line: 5,
      },
    ]

    render(
      <RawYAMLEditor text="some yaml" errors={errors} onChange={onChange} />
    )

    const lineEl = screen.getByTestId('yaml-error-line')
    expect(lineEl).toHaveTextContent('Line 5')
  })

  it('does not show error banner when errors array is empty', () => {
    const onChange = vi.fn()
    render(
      <RawYAMLEditor text="type: text" errors={[]} onChange={onChange} />
    )

    expect(screen.queryByTestId('yaml-validation-banner')).not.toBeInTheDocument()
  })

  it('displays both syntax and schema errors together', () => {
    const onChange = vi.fn()
    const errors: ValidationError[] = [
      {
        kind: 'syntax',
        message: 'syntax error',
        line: 1,
      },
      {
        kind: 'schema',
        field: 'type',
        message: 'Missing required field: "type"',
      },
    ]

    render(
      <RawYAMLEditor text="invalid" errors={errors} onChange={onChange} />
    )

    expect(screen.getByTestId('yaml-syntax-error-group')).toBeInTheDocument()
    expect(screen.getByTestId('yaml-schema-error-group')).toBeInTheDocument()
    const items = screen.getAllByTestId('yaml-syntax-error-item')
    expect(items.length).toBe(1)
    const schemaItems = screen.getAllByTestId('yaml-schema-error-item')
    expect(schemaItems.length).toBe(1)
  })

  it('displays semantic error group with fixHint', () => {
    const onChange = vi.fn()
    const errors: ValidationError[] = [
      {
        kind: 'semantic',
        field: 'nodes.start.choices[0].next',
        message: 'Choice targets non-existent node "missing".',
        fixHint: 'Update next to point to a valid node.',
      },
    ]

    render(
      <RawYAMLEditor text="type: scenario" errors={errors} onChange={onChange} />
    )

    const semanticGroup = screen.getByTestId('yaml-semantic-error-group')
    expect(semanticGroup).toBeInTheDocument()
    expect(semanticGroup).toHaveTextContent('Semantic Reference Error')
    const hint = screen.getByTestId('yaml-error-hint')
    expect(hint).toHaveTextContent('Update next to point to a valid node.')
  })

  it('displays schema error with fixHint', () => {
    const onChange = vi.fn()
    const errors: ValidationError[] = [
      {
        kind: 'schema',
        field: 'paragraphs',
        message: 'Missing required field',
        fixHint: 'Add the paragraphs field.',
      },
    ]

    render(
      <RawYAMLEditor text="type: text" errors={errors} onChange={onChange} />
    )

    const hint = screen.getByTestId('yaml-error-hint')
    expect(hint).toBeInTheDocument()
    expect(hint).toHaveTextContent('Add the paragraphs field.')
  })
})

describe('EditorPanel', () => {
  const mockProps = {
    sectionData: { type: 'text', paragraphs: ['Hello'] } as OKFSectionData,
    validationErrors: [] as ValidationError[],
    onVisualFormChange: vi.fn(),
    onRawTextChange: vi.fn(),
    rawText: 'type: text\nparagraphs:\n  - Hello',
    isDirty: false,
    isSaving: false,
    onSave: vi.fn(),
    onDownload: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with Visual Form tab active by default', () => {
    render(<EditorPanel {...mockProps} />)

    expect(screen.getByTestId('editor-panel')).toBeInTheDocument()
    expect(screen.getByTestId('editor-tab-form')).toBeInTheDocument()
    expect(screen.getByTestId('editor-tab-raw')).toBeInTheDocument()
    expect(screen.getByTestId('text-form-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('raw-yaml-editor')).not.toBeInTheDocument()
  })

  it('switches to Raw YAML tab on click', () => {
    render(<EditorPanel {...mockProps} />)

    const rawTab = screen.getByTestId('editor-tab-raw')
    fireEvent.click(rawTab)

    expect(screen.queryByTestId('text-form-editor')).not.toBeInTheDocument()
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

    expect(screen.getByTestId('text-form-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('raw-yaml-editor')).not.toBeInTheDocument()
    expect(formTab).toHaveAttribute('aria-selected', 'true')
  })

  it('shows validation errors in raw YAML tab', () => {
    const propsWithErrors = {
      ...mockProps,
      validationErrors: [
        {
          kind: 'syntax' as const,
          message: 'Bad YAML syntax',
          line: 2,
        },
      ],
    }

    render(<EditorPanel {...propsWithErrors} />)

    fireEvent.click(screen.getByTestId('editor-tab-raw'))
    expect(screen.getByTestId('yaml-validation-banner')).toBeInTheDocument()
    expect(screen.getByTestId('yaml-syntax-error-group')).toBeInTheDocument()
  })

  it('shows save and download buttons', () => {
    render(<EditorPanel {...mockProps} />)

    expect(screen.getByTestId('editor-save-btn')).toBeInTheDocument()
    expect(screen.getByTestId('editor-download-btn')).toBeInTheDocument()
  })

  it('disables save button when not dirty', () => {
    render(<EditorPanel {...mockProps} />)

    const saveBtn = screen.getByTestId('editor-save-btn')
    expect(saveBtn).toBeDisabled()
  })

  it('enables save button when dirty', () => {
    render(<EditorPanel {...mockProps} isDirty={true} />)

    const saveBtn = screen.getByTestId('editor-save-btn')
    expect(saveBtn).not.toBeDisabled()
  })

  it('disables save button when saving', () => {
    render(<EditorPanel {...mockProps} isDirty={true} isSaving={true} />)

    const saveBtn = screen.getByTestId('editor-save-btn')
    expect(saveBtn).toBeDisabled()
  })

  it('calls onSave when save button is clicked', () => {
    render(<EditorPanel {...mockProps} isDirty={true} />)

    const saveBtn = screen.getByTestId('editor-save-btn')
    fireEvent.click(saveBtn)

    expect(mockProps.onSave).toHaveBeenCalled()
  })

  it('calls onDownload when download button is clicked', () => {
    render(<EditorPanel {...mockProps} />)

    const downloadBtn = screen.getByTestId('editor-download-btn')
    fireEvent.click(downloadBtn)

    expect(mockProps.onDownload).toHaveBeenCalled()
  })

  it('renders section type selector dropdown and converts section type on change', () => {
    render(<EditorPanel {...mockProps} />)

    const typeSelect = screen.getByTestId('editor-type-select') as HTMLSelectElement
    expect(typeSelect).toBeInTheDocument()
    expect(typeSelect.value).toBe('text')

    fireEvent.change(typeSelect, { target: { value: 'flashcards' } })

    expect(mockProps.onVisualFormChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'flashcards' })
    )
  })

  it('shows saving text when isSaving is true', () => {
    render(<EditorPanel {...mockProps} isDirty={true} isSaving={true} />)

    const saveBtn = screen.getByTestId('editor-save-btn')
    expect(saveBtn).toHaveTextContent('Saving...')
  })

  it('does not show diagnostic banner when no diagnostics', () => {
    render(<EditorPanel {...mockProps} />)

    expect(screen.queryByTestId('editor-diagnostic-banner')).not.toBeInTheDocument()
  })

  it('shows diagnostic banner with error diagnostics', () => {
    const propsWithDiagnostics = {
      ...mockProps,
      validationDiagnostics: [
        {
          tier: 2 as const,
          field: 'paragraphs',
          message: 'Missing required field "paragraphs"',
          fixHint: 'Add the paragraphs field with an array of strings.',
        },
      ],
    }

    render(<EditorPanel {...propsWithDiagnostics} />)

    const banner = screen.getByTestId('editor-diagnostic-banner')
    expect(banner).toBeInTheDocument()

    const errorGroup = screen.getByTestId('editor-diagnostic-error-group')
    expect(errorGroup).toBeInTheDocument()
    expect(errorGroup).toHaveTextContent('Validation Errors')
    expect(errorGroup).toHaveTextContent('Missing required field')
  })

  it('shows fixHint in diagnostic banner', () => {
    const propsWithDiagnostics = {
      ...mockProps,
      validationDiagnostics: [
        {
          tier: 2 as const,
          field: 'paragraphs',
          message: 'Missing required field',
          fixHint: 'Add the paragraphs field.',
        },
      ],
    }

    render(<EditorPanel {...propsWithDiagnostics} />)

    const hint = screen.getByTestId('editor-diagnostic-fix-hint')
    expect(hint).toBeInTheDocument()
    expect(hint).toHaveTextContent('Add the paragraphs field.')
  })

  it('shows warning diagnostics separately from errors', () => {
    const propsWithWarnings = {
      ...mockProps,
      validationDiagnostics: [
        {
          tier: 3 as const,
          field: 'nodes.start.choices[0].next',
          message: 'Choice targets unknown node "nonexistent".',
          fixHint: 'Set "next" to a valid node ID.',
        },
      ],
    }

    render(<EditorPanel {...propsWithWarnings} />)

    const banner = screen.getByTestId('editor-diagnostic-banner')
    expect(banner).toBeInTheDocument()

    const warningGroup = screen.getByTestId('editor-diagnostic-warning-group')
    expect(warningGroup).toBeInTheDocument()
    expect(warningGroup).toHaveTextContent('Validation Warnings')
  })

  it('shows both error and warning diagnostic groups together', () => {
    const propsWithMixed = {
      ...mockProps,
      validationDiagnostics: [
        {
          tier: 2 as const,
          field: 'paragraphs',
          message: 'Expected array',
          fixHint: 'Use array format.',
        },
        {
          tier: 3 as const,
          field: 'nodes.a.next',
          message: 'Unknown node ref',
          fixHint: 'Use valid node ID.',
        },
      ],
    }

    render(<EditorPanel {...propsWithMixed} />)

    expect(screen.getByTestId('editor-diagnostic-error-group')).toBeInTheDocument()
    expect(screen.getByTestId('editor-diagnostic-warning-group')).toBeInTheDocument()
  })
})
