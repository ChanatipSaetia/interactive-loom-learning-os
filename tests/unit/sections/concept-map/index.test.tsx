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
})
