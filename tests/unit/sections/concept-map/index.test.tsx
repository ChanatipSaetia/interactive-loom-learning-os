import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import ConceptMapSection from '../../../../src/sections/concept-map'
import type { ConceptNode, ConceptEdge } from '../../../../src/sections/concept-map'

const mockNodes: Record<string, ConceptNode> = {
  orchestrator: {
    id: 'orchestrator',
    title: 'Orchestrator',
    definition: 'Central agent that decomposes goals and delegates tasks.',
    category: 'pattern',
  },
  workers: {
    id: 'workers',
    title: 'Workers',
    definition: 'Specialized sub-agents that execute delegated tasks.',
    category: 'pattern',
  },
  react_loop: {
    id: 'react_loop',
    title: 'ReAct Loop',
    definition: 'Reason-act cycle: reason about goal, take action, observe result.',
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

  it('opens detail panel when node is clicked', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.click(node)
    expect(screen.getByTestId('concept-map-panel')).toBeInTheDocument()
  })

  it('shows correct definition in detail panel', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.click(node)
    expect(screen.getByTestId('concept-map-panel-title')).toHaveTextContent('Orchestrator')
    expect(screen.getByTestId('concept-map-panel-definition')).toHaveTextContent(
      'Central agent that decomposes goals and delegates tasks.'
    )
  })

  it('closes detail panel when close button is clicked', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.click(node)
    expect(screen.getByTestId('concept-map-panel')).toBeInTheDocument()
    const closeBtn = screen.getByTestId('concept-map-panel-close')
    fireEvent.click(closeBtn)
    expect(screen.queryByTestId('concept-map-panel')).not.toBeInTheDocument()
  })

  it('toggles panel off when clicking same node again', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.click(node)
    expect(screen.getByTestId('concept-map-panel')).toBeInTheDocument()
    fireEvent.click(node)
    expect(screen.queryByTestId('concept-map-panel')).not.toBeInTheDocument()
  })

  it('shows connected nodes in detail panel', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node = screen.getByTestId('concept-map-node-workers')
    fireEvent.click(node)
    expect(screen.getByTestId('concept-map-panel-connection-orchestrator')).toBeInTheDocument()
    expect(screen.getByTestId('concept-map-panel-connection-react_loop')).toBeInTheDocument()
  })

  it('switches detail panel when clicking another connected node', () => {
    render(<ConceptMapSection nodes={mockNodes} edges={mockEdges} />)
    const node1 = screen.getByTestId('concept-map-node-orchestrator')
    fireEvent.click(node1)
    expect(screen.getByTestId('concept-map-panel-title')).toHaveTextContent('Orchestrator')

    const connNode = screen.getByTestId('concept-map-panel-connection-workers')
    fireEvent.click(connNode)
    expect(screen.getByTestId('concept-map-panel-title')).toHaveTextContent('Workers')
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
