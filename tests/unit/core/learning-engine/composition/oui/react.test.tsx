import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OUISectionRenderer } from '../../../../../../src/core/learning-engine/composition/oui/react'
import type { SectionConfig } from '../../../../../../src/core/learning-engine/registry'

describe('OUISectionRenderer (react-lang bridge)', () => {
  it('renders a section through renderSection with compiled props', () => {
    const renderSection = vi.fn((config: SectionConfig) => (
      <div data-testid="section">{config.type}:{(config.props.paragraphs as string[]).join('|')}</div>
    ))
    render(
      <OUISectionRenderer
        source={'$name = "Loom"\nroot = Text("Hello", ["Hi " + $name, "Bye"])'}
        renderSection={renderSection}
      />,
    )
    expect(screen.getByTestId('section').textContent).toBe('text:Hi Loom|Bye')
    expect(renderSection).toHaveBeenLastCalledWith(expect.objectContaining({
      type: 'text',
      props: expect.objectContaining({ title: 'Hello', paragraphs: ['Hi Loom', 'Bye'] }),
    }))
  })

  it('compiles nested data components for the section', () => {
    const renderSection = vi.fn((config: SectionConfig) => <div data-testid="section">{JSON.stringify(config.props.questions)}</div>)
    render(
      <OUISectionRenderer
        source={'root = Quiz("Q", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "A", true, "Yes")])'}
        renderSection={renderSection}
      />,
    )
    expect(JSON.parse(screen.getByTestId('section').textContent ?? '')).toEqual([
      { id: 'q1', question: 'Why?', choices: [{ id: 'a', text: 'A', correct: true, explanation: 'Yes' }] },
    ])
  })
})
