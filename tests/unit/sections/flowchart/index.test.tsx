import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SectionRegistry } from '../../../../src/core/registry'
import Flowchart, { computeLayout, computeLayoutWithBarycenter } from '../../../../src/sections/flowchart/index'
import type { FlowchartNode, FlowchartEdge } from '../../../../src/sections/flowchart/index'

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
})
