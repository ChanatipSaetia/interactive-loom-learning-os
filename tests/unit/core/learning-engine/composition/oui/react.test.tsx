import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OUISectionRenderer } from '../../../../../../src/core/learning-engine/composition/oui/react'
import type { SectionConfig } from '../../../../../../src/core/learning-engine/registry'

describe('OUISectionRenderer (react-lang bridge)', () => {
  it('updates supporting content through page-local input bindings without another model call', () => {
    const renderSection = vi.fn(() => null)
    render(<OUISectionRenderer source={'$name = "Loom"\nroot = Page("Binding", Stack([field, greeting]))\nfield = Input("name", "Name", "text", null, $name)\ngreeting = TextContent("Hello " + $name)'} renderSection={renderSection} />)
    expect(screen.getByText('Hello Loom')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Reader' } })
    expect(screen.getByText('Hello Reader')).toBeInTheDocument()
    expect(renderSection).not.toHaveBeenCalled()
  })
  it('renders a section through renderSection with compiled props', () => {
    const renderSection = vi.fn((config: SectionConfig) => (
      <div data-testid="section">{config.type}:{(config.props.paragraphs as string[]).join('|')}</div>
    ))
    render(
      <OUISectionRenderer
        source={"$name = \"Loom\"\nroot = Page(\"Hello\", Stack([TextContent(\"Hi \" + $name), TextContent(\"Bye\")]))"}
        renderSection={renderSection}
      />,
    )
    expect(screen.getByText('Hi Loom')).toBeInTheDocument()
    expect(screen.getByText('Bye')).toBeInTheDocument()
    expect(renderSection).not.toHaveBeenCalled()
  })

  it('compiles nested data components for the section', () => {
    const renderSection = vi.fn((config: SectionConfig) => <div data-testid="section">{JSON.stringify(config.props.questions)}</div>)
    render(
      <OUISectionRenderer
        source={"root = Page(\"Q\", Quiz(\"Q\", [q1]))\nq1 = QuizQuestion(\"q1\", \"Why?\", [QuizChoice(\"a\", \"A\", true, \"Yes\")])"}
        renderSection={renderSection}
      />,
    )
    expect(JSON.parse(screen.getByTestId('section').textContent ?? '')).toEqual([
      { id: 'q1', question: 'Why?', choices: [{ id: 'a', text: 'A', correct: true, explanation: 'Yes' }] },
    ])
  })
})
