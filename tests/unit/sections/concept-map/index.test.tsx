import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import ConceptMapSection from '../../../../src/sections/concept-map'
import type { ConceptNode, ConceptEdge } from '../../../../src/sections/concept-map'

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
    expect(screen.getByTestId('concept-map-edge-label-0')).toHaveTextContent('delegates to')
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
    const mod = await import('../../../../src/sections/concept-map')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('concept-map')).toBeUndefined()
    void mod
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
})

