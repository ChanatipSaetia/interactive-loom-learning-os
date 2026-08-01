import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/learning-engine/registry'
import ScenarioSection from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/scenario'
import type { OKFScenarioNode } from '../../../../src/core/learning-engine/composition/okf/types'

const mockNodes: Record<string, OKFScenarioNode> = {
  start: {
    id: 'start',
    prompt: 'What is the primary constraint?',
    choices: [
      { id: 'latency', text: 'Low latency is critical', next: 'infra_choice' },
      { id: 'cost', text: 'Budget is tight', next: 'outcome_serverless' },
    ],
  },
  infra_choice: {
    id: 'infra_choice',
    prompt: 'Where should the agent run?',
    choices: [
      { id: 'edge', text: 'Edge deployment closest to users', next: 'outcome_edge' },
      { id: 'regional', text: 'Regional cloud with CDN', next: 'outcome_regional' },
    ],
  },
  outcome_edge: {
    id: 'outcome_edge',
    outcome: {
      verdict: 'Good for ultra-low latency, but higher infrastructure cost.',
      lesson: 'Edge deployment minimizes network hops but multiplies deployment complexity.',
      rating: 'b-plus',
    },
  },
  outcome_regional: {
    id: 'outcome_regional',
    outcome: {
      verdict: 'Balanced approach with acceptable latency for most regions.',
      lesson: 'Regional cloud with CDN gives a good latency/cost trade-off.',
      rating: 'a',
    },
  },
  outcome_serverless: {
    id: 'outcome_serverless',
    outcome: {
      verdict: 'Minimal upfront cost, but cold starts hurt latency.',
      lesson: 'Serverless is cost-efficient for sporadic workloads.',
      rating: 'b-minus',
    },
  },
}

describe('Scenario Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  // --- Intro phase ---

  it('renders the section container', () => {
    render(<ScenarioSection title="Test Scenario" nodes={mockNodes} />)
    expect(screen.getByTestId('scenario-section')).toBeInTheDocument()
  })

  it('renders intro phase by default', () => {
    render(<ScenarioSection title="Test Scenario" intro="Your intro text." nodes={mockNodes} />)
    expect(screen.getByTestId('scenario-intro')).toBeInTheDocument()
  })

  it('renders the title in intro', () => {
    render(<ScenarioSection title="Deployment Strategy" intro="Choose wisely." nodes={mockNodes} />)
    expect(screen.getByTestId('scenario-intro-title')).toHaveTextContent('Deployment Strategy')
  })

  it('renders intro text', () => {
    render(<ScenarioSection title="Test" intro="Your team needs to deploy." nodes={mockNodes} />)
    expect(screen.getByTestId('scenario-intro-text')).toHaveTextContent('Your team needs to deploy.')
  })

  it('renders the section-level title in intro', () => {
    render(<ScenarioSection title="Deployment Strategy" intro="Test" nodes={mockNodes} />)
    expect(screen.getByTestId('scenario-title')).toHaveTextContent('Deployment Strategy')
  })

  it('shows start button in intro', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    expect(screen.getByTestId('scenario-start-btn')).toBeInTheDocument()
  })

  it('transitions to decision when start is clicked', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    const startBtn = screen.getByTestId('scenario-start-btn')
    fireEvent.click(startBtn)
    expect(screen.getByTestId('scenario-decision')).toBeInTheDocument()
    expect(screen.queryByTestId('scenario-intro')).not.toBeInTheDocument()
  })

  // --- Decision phase ---

  it('renders the first decision prompt', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    expect(screen.getByTestId('scenario-decision-prompt')).toHaveTextContent('What is the primary constraint?')
  })

  it('renders all choices for a decision', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    expect(screen.getByTestId('scenario-choice-latency')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-choice-cost')).toBeInTheDocument()
  })

  it('displays step counter', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    expect(screen.getByTestId('scenario-step-counter')).toHaveTextContent('Step 1')
  })

  it('advances to next decision on choice', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    expect(screen.getByTestId('scenario-decision-prompt')).toHaveTextContent('Where should the agent run?')
  })

  it('shows next set of choices after advancing', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    expect(screen.getByTestId('scenario-choice-edge')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-choice-regional')).toBeInTheDocument()
  })

  it('updates step counter when advancing', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    expect(screen.getByTestId('scenario-step-counter')).toHaveTextContent('Step 2')
  })

  it('shows back button when more than one step', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    expect(screen.getByTestId('scenario-back-btn')).toBeInTheDocument()
  })

  it('goes back to previous decision', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    fireEvent.click(screen.getByTestId('scenario-back-btn'))
    expect(screen.getByTestId('scenario-decision-prompt')).toHaveTextContent('What is the primary constraint?')
  })

  // --- Outcome phase ---

  it('transitions to outcome when reaching terminal node', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-cost'))
    expect(screen.getByTestId('scenario-outcome')).toBeInTheDocument()
    expect(screen.queryByTestId('scenario-decision')).not.toBeInTheDocument()
  })

  it('displays outcome verdict', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    fireEvent.click(screen.getByTestId('scenario-choice-edge'))
    expect(screen.getByTestId('scenario-outcome-verdict')).toHaveTextContent(
      'Good for ultra-low latency, but higher infrastructure cost.'
    )
  })

  it('displays outcome lesson', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    fireEvent.click(screen.getByTestId('scenario-choice-edge'))
    expect(screen.getByTestId('scenario-outcome-lesson')).toHaveTextContent(
      'Edge deployment minimizes network hops but multiplies deployment complexity.'
    )
  })

  it('displays rating badge', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    fireEvent.click(screen.getByTestId('scenario-choice-edge'))
    expect(screen.getByTestId('scenario-rating-badge')).toHaveTextContent('Good')
  })

  it('shows "Excellent" for rating a', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    fireEvent.click(screen.getByTestId('scenario-choice-regional'))
    expect(screen.getByTestId('scenario-rating-badge')).toHaveTextContent('Excellent')
  })

  it('shows "Fair" for rating b-minus', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-cost'))
    expect(screen.getByTestId('scenario-rating-badge')).toHaveTextContent('Fair')
  })

  it('shows check icon for good outcomes (a, b-plus)', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-latency'))
    fireEvent.click(screen.getByTestId('scenario-choice-regional'))
    expect(screen.getByTestId('scenario-outcome-icon')).toBeInTheDocument()
  })

  it('shows restart button in outcome', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-cost'))
    expect(screen.getByTestId('scenario-restart-btn')).toBeInTheDocument()
  })

  it('restart resets to intro', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-cost'))
    expect(screen.getByTestId('scenario-outcome')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('scenario-restart-btn'))
    expect(screen.getByTestId('scenario-intro')).toBeInTheDocument()
    expect(screen.queryByTestId('scenario-outcome')).not.toBeInTheDocument()
  })

  it('restart allows playing through again', () => {
    render(<ScenarioSection title="Test" intro="Intro" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    fireEvent.click(screen.getByTestId('scenario-choice-cost'))
    fireEvent.click(screen.getByTestId('scenario-restart-btn'))
    fireEvent.click(screen.getByTestId('scenario-start-btn'))
    expect(screen.getByTestId('scenario-decision')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-decision-prompt')).toHaveTextContent('What is the primary constraint?')
  })

  // --- Edge cases ---

  it('renders empty message when no nodes', () => {
    render(<ScenarioSection title="Empty" nodes={{}} />)
    expect(screen.getByText('No scenario data provided.')).toBeInTheDocument()
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/core/learning-engine/sub-contexts/process-simulation/components/scenario')
    const { SectionRegistry: Registry } = await import('../../../../src/core/learning-engine/registry')
    expect(Registry.get('scenario')).toBeUndefined()
    void mod
  })
})
