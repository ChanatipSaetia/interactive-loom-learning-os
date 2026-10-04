import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import IntroSection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/intro'

describe('IntroSection', () => {
  it('renders hero title and subtitle', () => {
    render(
      <IntroSection
        title="Autonomous AI Agent Architecture"
        subtitle="Mastering goal-directed loops and state transitions."
        estimatedTime="5 min read"
        moduleCount={4}
      />
    )

    expect(screen.getByTestId('intro-title')).toHaveTextContent('Autonomous AI Agent Architecture')
    expect(screen.getByTestId('intro-subtitle')).toHaveTextContent('Mastering goal-directed loops and state transitions.')
    expect(screen.getByText('5 min read')).toBeInTheDocument()
    expect(screen.getByText('4 Modules')).toBeInTheDocument()
  })

  it('shows the title once, with the help button still available', () => {
    render(<IntroSection title="Autonomous AI Agent Architecture" sectionIndex={0} />)
    expect(screen.getAllByText('Autonomous AI Agent Architecture')).toHaveLength(1)
    expect(screen.getByTestId('section-help-btn-0')).toBeInTheDocument()
  })

  it('renders What and Why pillar cards', () => {
    render(
      <IntroSection
        what={{
          definition: 'An AI Agent is an autonomous software loop.',
          summary: 'Core concept breakdown of agent loops.',
          bullets: ['Event-driven execution', 'Knowledge graph'],
          tags: ['Event Storming', 'Architecture'],
        }}
        why={{
          summary: 'Single prompts break on complex stateful flows.',
          impact: 'Agents enable resilience and self-correction.',
        }}
      />
    )

    expect(screen.getByTestId('intro-what-card')).toBeInTheDocument()
    expect(screen.getByTestId('intro-definition')).toHaveTextContent('An AI Agent is an autonomous software loop.')
    expect(screen.getByText('Core concept breakdown of agent loops.')).toBeInTheDocument()
    expect(screen.getByText('Event-driven execution')).toBeInTheDocument()
    expect(screen.getByText('Event Storming')).toBeInTheDocument()

    expect(screen.getByTestId('intro-why-card')).toBeInTheDocument()
    expect(screen.getByText('Single prompts break on complex stateful flows.')).toBeInTheDocument()
    expect(screen.getByText('Agents enable resilience and self-correction.')).toBeInTheDocument()
  })

  it('renders learning roadmap preview steps', () => {
    render(
      <IntroSection
        roadmap={[
          {
            sectionId: 'concept-map',
            title: 'Knowledge Graph',
            type: 'concept-map',
            description: 'Map spatial relationships.',
          },
          {
            sectionId: 'flowchart',
            title: 'Event Storming',
            type: 'flowchart',
            description: 'Trace dynamic execution loops.',
          },
        ]}
      />
    )

    expect(screen.getByTestId('intro-roadmap')).toBeInTheDocument()
    expect(screen.getByText('Knowledge Graph')).toBeInTheDocument()
    expect(screen.getByText('Event Storming')).toBeInTheDocument()
    expect(screen.getByText('Map spatial relationships.')).toBeInTheDocument()
  })
})
