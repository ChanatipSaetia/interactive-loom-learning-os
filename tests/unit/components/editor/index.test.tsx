import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VisualFormEditor } from '../../../../src/components/editor/VisualFormEditor'
import { RawYAMLEditor } from '../../../../src/components/editor/RawYAMLEditor'
import { EditorPanel } from '../../../../src/components/editor/EditorPanel'
import type { OKFSectionData } from '../../../../src/core/okf/types'

describe('VisualFormEditor', () => {
  const mockData: OKFSectionData = {
    type: 'text',
    paragraphs: ['Hello world', 'Second paragraph'],
  }

  it('renders fields for each data property', () => {
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    expect(screen.getByTestId('visual-form-editor')).toBeInTheDocument()
    expect(screen.getByTestId('form-field-type')).toBeInTheDocument()
    const paragraphInputs = screen.getAllByTestId(/form-field-paragraphs-/g)
    expect(paragraphInputs.length).toBe(2)
  })

  it('calls onChange with updated data when field is edited', () => {
    const onChange = vi.fn()
    render(<VisualFormEditor data={mockData} onChange={onChange} />)

    const typeInput = screen.getByTestId('form-field-type')
    fireEvent.change(typeInput, { target: { value: 'bullets' } })

    expect(onChange).toHaveBeenCalledWith({
      type: 'bullets',
      paragraphs: ['Hello world', 'Second paragraph'],
    })
  })

  it('renders nested object fields', () => {
    const nestedData: OKFSectionData = {
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
    render(<VisualFormEditor data={nestedData} onChange={onChange} />)

    expect(screen.getByTestId('form-field-type')).toBeInTheDocument()
    const questionsField = document.querySelector('.visual-form-object-list')
    expect(questionsField).toBeInTheDocument()
  })

  it('renders string array items as individual inputs', () => {
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
    expect(screen.getByTestId('visual-form-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('raw-yaml-editor')).not.toBeInTheDocument()
  })

  it('switches to Raw YAML tab on click', () => {
    render(<EditorPanel {...mockProps} />)

    const rawTab = screen.getByTestId('editor-tab-raw')
    fireEvent.click(rawTab)

    expect(screen.queryByTestId('visual-form-editor')).not.toBeInTheDocument()
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

    expect(screen.getByTestId('visual-form-editor')).toBeInTheDocument()
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
