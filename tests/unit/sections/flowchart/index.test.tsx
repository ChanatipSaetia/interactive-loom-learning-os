import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SectionRegistry } from '../../../../src/core/registry'
import Flowchart, { computeLayout, computeLayoutWithBarycenter } from '../../../../src/sections/flowchart/index'
import type { FlowchartNode, FlowchartEdge, Journey } from '../../../../src/sections/flowchart/index'

const mockNodes: FlowchartNode[] = [
  { id: 'user', label: 'User', stereotype: 'actor', icon: 'User', layer: 0 },
  { id: 'agent', label: 'Agent', stereotype: 'agent', icon: 'Bot', layer: 1 },
  { id: 'llm', label: 'LLM', stereotype: 'model', icon: 'Brain', layer: 2 },
]

const mockEdges: FlowchartEdge[] = [
  { from: 'user', to: 'agent' },
  { from: 'agent', to: 'llm' },
]

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

describe('Flowchart auto-layout', () => {
  it('computes layout with basic top-to-bottom positioning', () => {
    const result = computeLayout(mockNodes)
    expect(result).toHaveLength(3)

    const user = result.find((n) => n.id === 'user')
    const agent = result.find((n) => n.id === 'agent')
    const llm = result.find((n) => n.id === 'llm')

    expect(user!.y).toBeLessThan(agent!.y)
    expect(agent!.y).toBeLessThan(llm!.y)
  })

  it('respects explicit layer assignments', () => {
    const customNodes: FlowchartNode[] = [
      { id: 'a', label: 'A', stereotype: 'x', icon: 'User', layer: 0 },
      { id: 'b', label: 'B', stereotype: 'x', icon: 'Bot', layer: 2 },
      { id: 'c', label: 'C', stereotype: 'x', icon: 'Brain', layer: 1 },
    ]
    const result = computeLayout(customNodes)
    const a = result.find((n) => n.id === 'a')!
    const b = result.find((n) => n.id === 'b')!
    const c = result.find((n) => n.id === 'c')!

    expect(a.y).toBeLessThan(c.y)
    expect(c.y).toBeLessThan(b.y)
  })

  it('places nodes in the same layer horizontally', () => {
    const sameLayerNodes: FlowchartNode[] = [
      { id: 'a', label: 'A', stereotype: 'x', icon: 'User', layer: 0 },
      { id: 'b', label: 'B', stereotype: 'x', icon: 'Bot', layer: 0 },
      { id: 'c', label: 'C', stereotype: 'x', icon: 'Brain', layer: 0 },
    ]
    const result = computeLayout(sameLayerNodes)
    const yValues = result.map((n) => n.y)
    expect(yValues[0]).toBe(yValues[1])
    expect(yValues[1]).toBe(yValues[2])

    const xValues = result.map((n) => n.x)
    expect(xValues[0]).toBeLessThan(xValues[1])
    expect(xValues[1]).toBeLessThan(xValues[2])
  })

  it('defaults to layer 0 when layer is not specified', () => {
    const noLayerNodes: FlowchartNode[] = [
      { id: 'a', label: 'A', stereotype: 'x', icon: 'User' },
      { id: 'b', label: 'B', stereotype: 'x', icon: 'Bot' },
    ]
    const result = computeLayout(noLayerNodes)
    expect(result[0].y).toBe(result[1].y)
  })

  it('barycenter layout reorders nodes based on incoming edges', () => {
    const baryNodes: FlowchartNode[] = [
      { id: 'top-left', label: 'TL', stereotype: 'x', icon: 'User', layer: 0 },
      { id: 'top-right', label: 'TR', stereotype: 'x', icon: 'Bot', layer: 0 },
      { id: 'bot-left', label: 'BL', stereotype: 'x', icon: 'Brain', layer: 1 },
      { id: 'bot-right', label: 'BR', stereotype: 'x', icon: 'Search', layer: 1 },
    ]
    const baryEdges: FlowchartEdge[] = [
      { from: 'top-left', to: 'bot-left' },
      { from: 'top-right', to: 'bot-right' },
    ]
    const result = computeLayoutWithBarycenter(baryNodes, baryEdges)
    const botLeft = result.find((n) => n.id === 'bot-left')!
    const botRight = result.find((n) => n.id === 'bot-right')!

    expect(botLeft.x).toBeLessThan(botRight.x)
  })

  it('barycenter handles cross edges', () => {
    const crossNodes: FlowchartNode[] = [
      { id: 'top-left', label: 'TL', stereotype: 'x', icon: 'User', layer: 0 },
      { id: 'top-right', label: 'TR', stereotype: 'x', icon: 'Bot', layer: 0 },
      { id: 'bottom', label: 'B', stereotype: 'x', icon: 'Brain', layer: 1 },
    ]
    const crossEdges: FlowchartEdge[] = [
      { from: 'top-left', to: 'bottom' },
      { from: 'top-right', to: 'bottom' },
    ]
    const result = computeLayoutWithBarycenter(crossNodes, crossEdges)
    const bottom = result.find((n) => n.id === 'bottom')!
    expect(bottom.x).toBeCloseTo(0, 0)
  })
})

describe('Flowchart component', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders SVG flowchart', () => {
    render(<Flowchart title="Test Flowchart" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const svg = screen.getByTestId('flowchart-svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders all nodes with data-testid', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.getByTestId('flowchart-node-user')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-node-agent')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-node-llm')).toBeInTheDocument()
  })

  it('renders all edges', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.getByTestId('flowchart-edge-0')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-edge-1')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Flowchart title="AI Architecture" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.getByTestId('flowchart-title')).toHaveTextContent('AI Architecture')
  })

  it('does not render title when not provided', () => {
    render(<Flowchart nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.queryByTestId('flowchart-title')).not.toBeInTheDocument()
  })

  it('renders node labels', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Agent')).toBeInTheDocument()
    expect(screen.getByText('LLM')).toBeInTheDocument()
  })

  it('renders node stereotypes', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.getByText('<<actor>>')).toBeInTheDocument()
    expect(screen.getByText('<<agent>>')).toBeInTheDocument()
    expect(screen.getByText('<<model>>')).toBeInTheDocument()
  })

  it('renders container with data-testid', () => {
    render(<Flowchart nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.getByTestId('flowchart-section')).toBeInTheDocument()
  })

  it('renders nodes with rectangles', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const rects = screen.getByTestId('flowchart-svg').querySelectorAll('rect')
    expect(rects.length).toBeGreaterThanOrEqual(3)
  })

  it('renders edges with lines and arrowheads', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const svg = screen.getByTestId('flowchart-svg')
    const lines = svg.querySelectorAll('line')
    expect(lines.length).toBeGreaterThanOrEqual(2)
    const marker = svg.querySelector('marker')
    expect(marker).toBeInTheDocument()
  })

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/flowchart/index')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('flowchart')).toBeDefined()
    void mod
  })

  it('renders transformable canvas group', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const canvas = screen.getByTestId('flowchart-canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('transform')
  })

  it('node groups have drag mouse handlers', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const svg = screen.getByTestId('flowchart-svg')
    const nodeGroup = svg.querySelector('[data-testid="flowchart-node-user"]')
    expect(nodeGroup).toHaveProperty('onmousedown')
    expect(nodeGroup).toHaveProperty('onmousemove')
    expect(nodeGroup).toHaveProperty('onmouseup')
  })

  it('node groups have touch handlers', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const svg = screen.getByTestId('flowchart-svg')
    const nodeGroup = svg.querySelector('[data-testid="flowchart-node-user"]')
    expect(nodeGroup).toHaveProperty('ontouchstart')
    expect(nodeGroup).toHaveProperty('ontouchmove')
    expect(nodeGroup).toHaveProperty('ontouchend')
  })

  it('SVG has pan and zoom handlers', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    const svg = screen.getByTestId('flowchart-svg')
    expect(svg).toHaveProperty('onmousedown')
    expect(svg).toHaveProperty('ontouchstart')
    expect(svg).toHaveProperty('ontouchmove')
    expect(svg).toHaveProperty('onwheel')
  })
})

const mockJourneys: Journey[] = [
  {
    id: 'journey-a',
    label: 'Journey A',
    steps: [
      { nodeId: 'user', description: 'Step 1' },
      { nodeId: 'agent', description: 'Step 2' },
      { nodeId: 'llm', description: 'Step 3' },
    ],
  },
  {
    id: 'journey-b',
    label: 'Journey B',
    steps: [
      { nodeId: 'llm', description: 'Step 1' },
      { nodeId: 'agent', description: 'Step 2' },
    ],
  },
]

describe('Flowchart journey controls', () => {
  beforeEach(() => {
    SectionRegistry.clear()
    vi.useFakeTimers()
  })

  it('renders journey selector when journeys provided', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-journey-select')).toBeInTheDocument()
  })

  it('does not render controls when journeys not provided', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.queryByTestId('flowchart-journey-select')).not.toBeInTheDocument()
    expect(screen.queryByTestId('flowchart-controls')).not.toBeInTheDocument()
  })

  it('renders all journey options', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const select = screen.getByTestId('flowchart-journey-select') as HTMLSelectElement
    expect(select.options.length).toBe(2)
    expect(select.options[0].text).toBe('Journey A')
    expect(select.options[1].text).toBe('Journey B')
  })

  it('defaults to first journey', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const select = screen.getByTestId('flowchart-journey-select') as HTMLSelectElement
    expect(select.value).toBe('journey-a')
  })

  it('switching journeys resets to step 0', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const select = screen.getByTestId('flowchart-journey-select') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'journey-b' } })
    const progress = screen.getByTestId('flowchart-progress')
    expect(progress.textContent).toBe('1 / 2')
  })

  it('renders playback controls', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-btn-play')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-btn-pause')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-btn-next')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-btn-prev')).toBeInTheDocument()
    expect(screen.getByTestId('flowchart-btn-reset')).toBeInTheDocument()
  })

  it('renders progress indicator', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const progress = screen.getByTestId('flowchart-progress')
    expect(progress.textContent).toBe('1 / 3')
  })

  it('prev button is disabled at first step', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-btn-prev')).toBeDisabled()
  })

  it('next button is disabled at last step', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    for (let i = 0; i < 2; i++) {
      fireEvent.click(nextBtn)
    }
    expect(nextBtn).toBeDisabled()
    const progress = screen.getByTestId('flowchart-progress')
    expect(progress.textContent).toBe('3 / 3')
  })

  it('next button advances step', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    const progress = screen.getByTestId('flowchart-progress')
    expect(progress.textContent).toBe('1 / 3')
    fireEvent.click(nextBtn)
    expect(progress.textContent).toBe('2 / 3')
  })

  it('prev button goes back one step', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    const prevBtn = screen.getByTestId('flowchart-btn-prev')
    const progress = screen.getByTestId('flowchart-progress')
    fireEvent.click(nextBtn)
    expect(progress.textContent).toBe('2 / 3')
    fireEvent.click(prevBtn)
    expect(progress.textContent).toBe('1 / 3')
  })

  it('reset button returns to step 0', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    const resetBtn = screen.getByTestId('flowchart-btn-reset')
    const progress = screen.getByTestId('flowchart-progress')
    fireEvent.click(nextBtn)
    fireEvent.click(nextBtn)
    expect(progress.textContent).toBe('3 / 3')
    fireEvent.click(resetBtn)
    expect(progress.textContent).toBe('1 / 3')
  })

  it('play auto-advances through steps', async () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const playBtn = screen.getByTestId('flowchart-btn-play')
    const progress = screen.getByTestId('flowchart-progress')
    expect(progress.textContent).toBe('1 / 3')
    await act(async () => {
      fireEvent.click(playBtn)
    })
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })
    expect(progress.textContent).toBe('2 / 3')
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })
    expect(progress.textContent).toBe('3 / 3')
  })

  it('pause stops auto-advance', async () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const playBtn = screen.getByTestId('flowchart-btn-play')
    const pauseBtn = screen.getByTestId('flowchart-btn-pause')
    const progress = screen.getByTestId('flowchart-progress')
    await act(async () => {
      fireEvent.click(playBtn)
      fireEvent.click(pauseBtn)
      vi.advanceTimersByTime(1200)
    })
    expect(progress.textContent).toBe('1 / 3')
  })

  it('highlights current step node', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const svg = screen.getByTestId('flowchart-svg')
    const userRect = svg.querySelector('[data-testid="flowchart-node-user"] .flowchart-node-highlighted')
    expect(userRect).toBeInTheDocument()
  })

  it('update highlight when step advances', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    const svg = screen.getByTestId('flowchart-svg')
    fireEvent.click(nextBtn)
    const agentRect = svg.querySelector('[data-testid="flowchart-node-agent"] .flowchart-node-highlighted')
    expect(agentRect).toBeInTheDocument()
  })

  it('play disabled at last step', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    const playBtn = screen.getByTestId('flowchart-btn-play')
    fireEvent.click(nextBtn)
    fireEvent.click(nextBtn)
    expect(playBtn).toBeDisabled()
  })

  it('pause disabled when not playing', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-btn-pause')).toBeDisabled()
  })

  it('reset disabled at step 0', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-btn-reset')).toBeDisabled()
  })
})

describe('Flowchart particle animation', () => {
  beforeEach(() => {
    SectionRegistry.clear()
    vi.useFakeTimers()
  })

  it('renders particle circle when journeys provided', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-particle')).toBeInTheDocument()
  })

  it('does not render particle when no journeys', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.queryByTestId('flowchart-particle')).not.toBeInTheDocument()
  })

  it('particle is invisible at step 0', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const particle = screen.getByTestId('flowchart-particle')
    expect(particle.getAttribute('opacity')).toBe('0')
  })

  it('particle is present when advancing step', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    fireEvent.click(nextBtn)
    const particle = screen.getByTestId('flowchart-particle')
    expect(particle).toBeInTheDocument()
  })
})

describe('Flowchart description panel', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders description panel when step has description', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByTestId('flowchart-desc-panel')).toBeInTheDocument()
  })

  it('description panel shows step description text', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    expect(screen.getByText('Step 1')).toBeInTheDocument()
  })

  it('description panel updates when step advances', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} journeys={mockJourneys} />, { wrapper })
    const nextBtn = screen.getByTestId('flowchart-btn-next')
    fireEvent.click(nextBtn)
    expect(screen.getByText('Step 2')).toBeInTheDocument()
  })

  it('description panel does not render when no journeys', () => {
    render(<Flowchart title="Test" nodes={mockNodes} edges={mockEdges} />, { wrapper })
    expect(screen.queryByTestId('flowchart-desc-panel')).not.toBeInTheDocument()
  })
})
