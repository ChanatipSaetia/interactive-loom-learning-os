import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import ConceptMapSection from '../../../../src/core/subdomains/practice-assessment/components/concept-map'
import type { ConceptNode, ConceptEdge } from '../../../../src/core/subdomains/practice-assessment/components/concept-map'

const mockNodes: Record<string, ConceptNode> = {
  orchestrator: {
    id: 'orchestrator',
    title: 'Orchestrator',
    category: 'pattern',
  },
  workers: {
    id: 'workers',
    title: 'Workers',
    category: 'pattern',
  },
  react_loop: {
    id: 'react_loop',
    title: 'ReAct Loop',
    category: 'mechanism',
  },
}

const mockEdges: ConceptEdge[] = [
  { from: 'orchestrator', to: 'workers', label: 'delegates to' },
  { from: 'workers', to: 'react_loop', label: 'uses' },
]

const mockDisconnectedNodes: Record<string, ConceptNode> = {
  orchestrator: { id: 'orchestrator', title: 'Orchestrator', category: 'pattern' },
  workers: { id: 'workers', title: 'Workers', category: 'pattern' },
  react_loop: { id: 'react_loop', title: 'ReAct Loop', category: 'mechanism' },
  benchmark: { id: 'benchmark', title: 'Benchmark', category: 'concept' },
  metric: { id: 'metric', title: 'Metric', category: 'data' },
}

const mockDisconnectedEdges: ConceptEdge[] = [
  { from: 'orchestrator', to: 'workers', label: 'delegates to' },
  { from: 'workers', to: 'react_loop', label: 'uses' },
  { from: 'benchmark', to: 'metric', label: 'defines' },
]

describe('ConceptMap Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders the section container', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-section')).toBeInTheDocument()
  })

  it('renders the SVG canvas', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-svg')).toBeInTheDocument()
  })

  it('renders the title when provided', () => {
    render(<ConceptMapSection title="Knowledge Graph" nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-title')).toHaveTextContent('Knowledge Graph')
  })

  it('does not render title when not provided', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.queryByTestId('concept-map-title')).not.toBeInTheDocument()
  })

  it('renders all nodes', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-node-orchestrator')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-node-workers')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-node-react_loop')).toBeInTheDocument()
  })

  it('renders node titles', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-node-title-orchestrator')).toHaveTextContent('Orchestrator')
    expect(screen.getByTestId('concept-map-node-title-workers')).toHaveTextContent('Workers')
  })

  it('renders all edges', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-edge-0')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-edge-1')).toBeInTheDocument()
  })

  it('renders edge labels', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-edge-label-0')).toHaveTextContent('deleg...')
    expect(screen.getByTestId('concept-map-edge-label-1')).toHaveTextContent('uses')
  })

  it('renders toolbar buttons', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-zoom-in')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-zoom-out')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-reset-view')).toBeInTheDocument()
  })

  it('renders legend items for each category', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.getByTestId('concept-map-legend-pattern')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-legend-mechanism')).toBeInTheDocument()
  })

  it('zoom in button adjusts transform', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const zoomInBtn = screen.getByTestId('concept-map-zoom-in')
    fireEvent.click(zoomInBtn)
    expect(screen.getByTestId('concept-map-svg')).toBeInTheDocument()
  })

  it('zoom out button adjusts transform', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const zoomOutBtn = screen.getByTestId('concept-map-zoom-out')
    fireEvent.click(zoomOutBtn)
    expect(screen.getByTestId('concept-map-svg')).toBeInTheDocument()
  })

  it('reset view button resets transform', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const resetBtn = screen.getByTestId('concept-map-reset-view')
    fireEvent.click(resetBtn)
    expect(screen.getByTestId('concept-map-svg')).toBeInTheDocument()
  })

  it('hovering a node applies highlight class', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.mouseEnter(node)
    expect(node).toHaveClass('cm-node-highlight')
  })

  it('hovering a node dims non-connected nodes', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const hoveredNode = screen.getByTestId('concept-map-node-orchestrator')
    const nonConnectedNode = screen.getByTestId('concept-map-node-react_loop')
    fireEvent.mouseEnter(hoveredNode)
    expect(nonConnectedNode).toHaveClass('cm-node-dimmed')
  })

  it('hovering a node highlights connected edges', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const hoveredNode = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.mouseEnter(hoveredNode)
    const connectedEdge = screen.getByTestId('concept-map-edge-line-0')
    expect(connectedEdge).toHaveClass('cm-edge-highlight')
  })

  it('hovering a node dims non-connected edges', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const hoveredNode = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.mouseEnter(hoveredNode)
    const nonConnectedEdge = screen.getByTestId('concept-map-edge-line-1')
    expect(nonConnectedEdge).toHaveClass('cm-edge-dimmed')
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/core/subdomains/practice-assessment/components/concept-map')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('concept-map')).toBeUndefined()
    void mod
  })

  it('renders pulsing glow rect on entry point node', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const entryNode = screen.getByTestId('concept-map-node-orchestrator')
    const pulseRect = entryNode.querySelector('.cm-entry-pulse')
    expect(pulseRect).not.toBeNull()
  })

  it('shows prev/next buttons when multiple disconnected graphs exist', () => {
    render(<ConceptMapSection nodes={mockDisconnectedNodes} edges={mockDisconnectedEdges} />)
    expect(screen.getByTestId('concept-map-graph-prev')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-graph-next')).toBeInTheDocument()
  })

  it('does not show prev/next buttons for single graph', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    expect(screen.queryByTestId('concept-map-graph-prev')).not.toBeInTheDocument()
    expect(screen.queryByTestId('concept-map-graph-next')).not.toBeInTheDocument()
  })

  it('displays graph counter badge when multiple graphs exist', () => {
    render(<ConceptMapSection nodes={mockDisconnectedNodes} edges={mockDisconnectedEdges} />)
    const badge = screen.getByTestId('concept-map-graph-badge')
    expect(badge).toHaveTextContent('1 / 2')
  })

  it('switches graph on next button click', () => {
    render(<ConceptMapSection nodes={mockDisconnectedNodes} edges={mockDisconnectedEdges} />)
    const nextBtn = screen.getByTestId('concept-map-graph-next')
    fireEvent.click(nextBtn)
    const badge = screen.getByTestId('concept-map-graph-badge')
    expect(badge).toHaveTextContent('2 / 2')
  })

  it('switches graph on prev button click', () => {
    render(<ConceptMapSection nodes={mockDisconnectedNodes} edges={mockDisconnectedEdges} />)
    const nextBtn = screen.getByTestId('concept-map-graph-next')
    fireEvent.click(nextBtn)
    const prevBtn = screen.getByTestId('concept-map-graph-prev')
    fireEvent.click(prevBtn)
    const badge = screen.getByTestId('concept-map-graph-badge')
    expect(badge).toHaveTextContent('1 / 2')
  })

  it('larger graph is shown first', () => {
    render(<ConceptMapSection nodes={mockDisconnectedNodes} edges={mockDisconnectedEdges} />)
    expect(screen.getByTestId('concept-map-node-orchestrator')).toBeInTheDocument()
    expect(screen.queryByTestId('concept-map-node-benchmark')).not.toBeInTheDocument()
  })

  it('mindmap layout renders entry node at center', () => {
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect

    try {
      Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 1400,
        height: 900,
        top: 0,
        left: 0,
        bottom: 900,
        right: 1400,
        x: 0,
        y: 0,
        toJSON: () => {},
      })

      render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
      const entryNode = screen.getByTestId('concept-map-node-orchestrator')
      expect(entryNode).toBeInTheDocument()
    } finally {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
    }
  })

  it('calculates dynamic viewBox based on width/height ratio', () => {
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect

    try {
      // Mock wide screen: width 1600, height 800 (ratio = 2.0 >= 1.555...)
      // VIEW_H should be fixed to 900, VIEW_W should be scaled to 900 * 2 = 1800
      Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 1600,
        height: 800,
        top: 0,
        left: 0,
        bottom: 800,
        right: 1600,
        x: 0,
        y: 0,
        toJSON: () => {},
      })

      const { rerender } = render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
      const svg = screen.getByTestId('concept-map-svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 1800 900')

      // Mock tall screen: width 800, height 1600 (ratio = 0.5 < 1.555...)
      // VIEW_H should be clamped to 1400, VIEW_W should scale to 1400 * 0.5 = 700
      Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 800,
        height: 1600,
        top: 0,
        left: 0,
        bottom: 1600,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      })

      // Rerender with new dimensions to trigger useEffect
      rerender(<ConceptMapSection nodes={{ ...mockNodes }} edges={mockEdges} />)
      expect(svg).toHaveAttribute('viewBox', '0 0 700 1400')

      // Mock slightly wide screen: width 1200, height 900 (ratio = 1.333... < 1.555...)
      // VIEW_W should be fixed to 1400, VIEW_H should be scaled to 1400 / 1.333... = 1050
      Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 1200,
        height: 900,
        top: 0,
        left: 0,
        bottom: 900,
        right: 1200,
        x: 0,
        y: 0,
        toJSON: () => {},
      })

      rerender(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
      expect(svg).toHaveAttribute('viewBox', '0 0 1400 1050')
    } finally {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
    }
  })

  it('centers starting node and expands top and down in a planar row layout', () => {
    const crossingNodes: Record<string, ConceptNode> = {
      root: { id: 'root', title: 'Root', category: 'concept' },
      n1_left: { id: 'n1_left', title: 'Level1 Left', category: 'concept' },
      n1_right: { id: 'n1_right', title: 'Level1 Right', category: 'concept' },
      n2_a: { id: 'n2_a', title: 'Level2 A', category: 'concept' },
      n2_b: { id: 'n2_b', title: 'Level2 B', category: 'concept' },
    }

    const crossingEdges: ConceptEdge[] = [
      { from: 'root', to: 'n1_left' },
      { from: 'root', to: 'n1_right' },
      { from: 'n1_left', to: 'n2_b' },
      { from: 'n1_right', to: 'n2_a' },
    ]

    render(<ConceptMapSection nodes={crossingNodes} edges={crossingEdges} />)

    const rootNode = screen.getByTestId('concept-map-node-root')
    const nodeA = screen.getByTestId('concept-map-node-n2_a')
    const nodeB = screen.getByTestId('concept-map-node-n2_b')

    expect(rootNode).toBeInTheDocument()
    expect(nodeA).toBeInTheDocument()
    expect(nodeB).toBeInTheDocument()
  })

  it('truncates edge labels longer than 5 characters before hover and reveals full text on hover', () => {
    const longLabelNodes: Record<string, ConceptNode> = {
      n1: { id: 'n1', title: 'Node 1', category: 'concept' },
      n2: { id: 'n2', title: 'Node 2', category: 'concept' },
    }
    const longLabelEdges: ConceptEdge[] = [
      { from: 'n1', to: 'n2', label: 'orchestrates' },
    ]

    render(<ConceptMapSection nodes={longLabelNodes} edges={longLabelEdges} />)

    const labelEl = screen.getByTestId('concept-map-edge-label-0')
    expect(labelEl).toHaveTextContent('orche...')

    const node1 = screen.getByTestId('concept-map-node-n1')
    fireEvent.mouseEnter(node1)
    expect(labelEl).toHaveTextContent('orchestrates')
  })
})

