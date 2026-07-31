import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import DecisionTreeSection from '../../../../src/core/subdomains/tradeoff-sandbox/components/decision-tree'
import type { OKFDecisionTreeNode } from '../../../../src/core/okf/types'

const mockNodes: Record<string, OKFDecisionTreeNode> = {
  scale_question: {
    id: 'scale_question',
    prompt: 'How many concurrent tasks will the agent handle?',
    choices: [
      { id: 'single', text: 'One at a time', next: 'memory_question', rationale: 'Simpler to build and debug.' },
      { id: 'parallel', text: 'Many at once', next: 'leaf_orchestrator', recommended: true, rationale: 'Most production agents need parallel handling.' },
    ],
  },
  memory_question: {
    id: 'memory_question',
    prompt: 'Does the agent need to remember past interactions?',
    choices: [
      { id: 'yes', text: 'Yes, across sessions', next: 'leaf_vector_db' },
      { id: 'no', text: 'No, stateless is fine', next: 'leaf_simple', recommended: true, rationale: 'Easier to scale horizontally.' },
    ],
  },
  leaf_simple: {
    id: 'leaf_simple',
    leaf: {
      recommendation: 'Use a simple single-agent ReAct loop.',
      explanation: 'A basic ReAct loop is sufficient for single-task agents without memory needs.',
      tradeoffs: ['Minimal setup', 'No long-term memory', 'Easy to debug'],
    },
  },
  leaf_vector_db: {
    id: 'leaf_vector_db',
    leaf: {
      recommendation: 'Use a single-agent ReAct loop with vector store memory.',
      explanation: 'Add a vector store for RAG to enable persistent memory.',
      tradeoffs: ['Adds database dependency', 'Enables long-term learning'],
    },
  },
  leaf_orchestrator: {
    id: 'leaf_orchestrator',
    leaf: {
      recommendation: 'Use an Orchestrator-Workers pattern.',
      explanation: 'A central orchestrator delegates to specialized workers.',
      tradeoffs: ['Orchestrator is single point of failure', 'Handles complex workflows'],
    },
  },
}

describe('DecisionTree Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  // --- Rendering ---

  it('renders the section container', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    expect(screen.getByTestId('dt-section')).toBeInTheDocument()
  })

  it('renders the title in intro phase', () => {
    render(<DecisionTreeSection title="Agent Architecture Guide" root="scale_question" nodes={mockNodes} />)
    expect(screen.getByTestId('dt-title')).toHaveTextContent('Agent Architecture Guide')
  })

  it('renders empty message when no nodes', () => {
    render(<DecisionTreeSection title="Empty" nodes={{}} />)
    expect(screen.getByText('No decision tree data provided.')).toBeInTheDocument()
  })

  // --- Intro phase ---

  it('renders intro phase by default', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    expect(screen.getByTestId('dt-intro')).toBeInTheDocument()
  })

  it('renders intro text', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    expect(screen.getByTestId('dt-intro-text')).toBeInTheDocument()
  })

  it('shows start button in intro', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    expect(screen.getByTestId('dt-start-btn')).toBeInTheDocument()
  })

  it('transitions to decision when start is clicked', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-decision')).toBeInTheDocument()
    expect(screen.queryByTestId('dt-intro')).not.toBeInTheDocument()
  })

  // --- Decision phase ---

  it('renders the first decision prompt', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-decision-prompt')).toHaveTextContent('How many concurrent tasks will the agent handle?')
  })

  it('renders all choices for a decision node', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-choice-single')).toBeInTheDocument()
    expect(screen.getByTestId('dt-choice-parallel')).toBeInTheDocument()
  })

  it('displays step counter', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-step-counter')).toHaveTextContent('Step 1')
  })

  it('shows recommended badge on recommended choices', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-recommended-parallel')).toBeInTheDocument()
    expect(screen.queryByTestId('dt-recommended-single')).not.toBeInTheDocument()
  })

  it('renders rationale for choices', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-rationale-single')).toHaveTextContent('Simpler to build and debug.')
    expect(screen.getByTestId('dt-rationale-parallel')).toHaveTextContent('Most production agents need parallel handling.')
  })

  it('highlights recommended choice with CSS class', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    const recChoice = screen.getByTestId('dt-choice-parallel')
    expect(recChoice).toHaveClass('dt-choice-recommended')
  })

  // --- Traversal ---

  it('advances to next decision on choice', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-single'))
    expect(screen.getByTestId('dt-decision-prompt')).toHaveTextContent('Does the agent need to remember past interactions?')
  })

  it('updates step counter when advancing', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-single'))
    expect(screen.getByTestId('dt-step-counter')).toHaveTextContent('Step 2')
  })

  it('shows breadcrumb trail after first choice', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-single'))
    expect(screen.getByTestId('dt-breadcrumb')).toBeInTheDocument()
  })

  it('breadcrumb shows multiple steps', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-single'))
    expect(screen.getByTestId('dt-breadcrumb-step-0')).toBeInTheDocument()
    expect(screen.getByTestId('dt-breadcrumb-step-1')).toBeInTheDocument()
  })

  // --- Leaf node ---

  it('transitions to leaf when reaching terminal node', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    expect(screen.getByTestId('dt-leaf')).toBeInTheDocument()
    expect(screen.queryByTestId('dt-decision')).not.toBeInTheDocument()
  })

  it('displays leaf recommendation', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    expect(screen.getByTestId('dt-leaf-recommendation')).toHaveTextContent('Use an Orchestrator-Workers pattern.')
  })

  it('displays leaf explanation', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    expect(screen.getByTestId('dt-leaf-explanation')).toHaveTextContent('A central orchestrator delegates to specialized workers.')
  })

  it('displays leaf trade-offs', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    expect(screen.getByTestId('dt-leaf-tradeoff-0')).toHaveTextContent('Orchestrator is single point of failure')
    expect(screen.getByTestId('dt-leaf-tradeoff-1')).toHaveTextContent('Handles complex workflows')
  })

  it('shows reset button in leaf node', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    expect(screen.getByTestId('dt-reset-btn')).toBeInTheDocument()
  })

  it('reset returns to intro', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    expect(screen.getByTestId('dt-leaf')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dt-reset-btn'))
    expect(screen.getByTestId('dt-intro')).toBeInTheDocument()
    expect(screen.queryByTestId('dt-leaf')).not.toBeInTheDocument()
  })

  it('reset allows playing through again', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-parallel'))
    fireEvent.click(screen.getByTestId('dt-reset-btn'))
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    expect(screen.getByTestId('dt-decision')).toBeInTheDocument()
    expect(screen.getByTestId('dt-decision-prompt')).toHaveTextContent('How many concurrent tasks will the agent handle?')
  })

  // --- Multi-step traversal to leaf ---

  it('traverses multiple decisions to reach a leaf', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-single'))
    fireEvent.click(screen.getByTestId('dt-choice-no'))
    expect(screen.getByTestId('dt-leaf')).toBeInTheDocument()
    expect(screen.getByTestId('dt-leaf-recommendation')).toHaveTextContent('Use a simple single-agent ReAct loop.')
  })

  it('shows all trade-offs for leaf_simple', () => {
    render(<DecisionTreeSection title="Test" root="scale_question" nodes={mockNodes} />)
    fireEvent.click(screen.getByTestId('dt-start-btn'))
    fireEvent.click(screen.getByTestId('dt-choice-single'))
    fireEvent.click(screen.getByTestId('dt-choice-no'))
    expect(screen.getByTestId('dt-leaf-tradeoff-0')).toHaveTextContent('Minimal setup')
    expect(screen.getByTestId('dt-leaf-tradeoff-1')).toHaveTextContent('No long-term memory')
    expect(screen.getByTestId('dt-leaf-tradeoff-2')).toHaveTextContent('Easy to debug')
  })

  // --- Self-registration ---

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/core/subdomains/tradeoff-sandbox/components/decision-tree')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('decision-tree')).toBeUndefined()
    void mod
  })
})
