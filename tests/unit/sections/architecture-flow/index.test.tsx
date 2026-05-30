import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SectionRegistry } from '../../../../src/core/registry'
import ArchitectureFlow from '../../../../src/sections/architecture-flow/index'
import type { ArchitectureFlowProps } from '../../../../src/sections/architecture-flow/index'

const mockNodes = [
  { id: 'a', label: 'Node A', x: 80, y: 100 },
  { id: 'b', label: 'Node B', x: 200, y: 100 },
  { id: 'c', label: 'Node C', x: 320, y: 100 },
]

const mockEdges = [
  { from: 'a', to: 'b', label: 'Edge 1' },
  { from: 'b', to: 'c', label: 'Edge 2' },
]

const mockProps: ArchitectureFlowProps = {
  title: 'Test Architecture',
  nodes: mockNodes,
  edges: mockEdges,
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

describe('ArchitectureFlow', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders SVG diagram', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    const svg = screen.getByTestId('architecture-flow-svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders all nodes with labels', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    expect(screen.getByTestId('node-a')).toBeInTheDocument()
    expect(screen.getByTestId('node-b')).toBeInTheDocument()
    expect(screen.getByTestId('node-c')).toBeInTheDocument()
  })

  it('renders all edges', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    expect(screen.getByTestId('edge-0')).toBeInTheDocument()
    expect(screen.getByTestId('edge-1')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    expect(screen.getByText('Test Architecture')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(
      <ArchitectureFlow nodes={mockNodes} edges={mockEdges} />,
      { wrapper }
    )
    expect(screen.queryByText('Test Architecture')).not.toBeInTheDocument()
  })

  it('renders animation controls', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    expect(screen.getByTestId('arch-flow-play')).toBeInTheDocument()
    expect(screen.getByTestId('arch-flow-pause')).toBeInTheDocument()
    expect(screen.getByTestId('arch-flow-step')).toBeInTheDocument()
    expect(screen.getByTestId('arch-flow-reset')).toBeInTheDocument()
  })

  it('shows correct progress count initially', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    expect(screen.getByTestId('arch-flow-progress')).toHaveTextContent('0 / 3')
  })

  it('advances step on Step button click', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    const stepBtn = screen.getByTestId('arch-flow-step')
    fireEvent.click(stepBtn)
    expect(screen.getByTestId('arch-flow-progress')).toHaveTextContent('1 / 3')
  })

  it('disables Step button at last step', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    const stepBtn = screen.getByTestId('arch-flow-step')
    fireEvent.click(stepBtn)
    fireEvent.click(stepBtn)
    fireEvent.click(stepBtn)
    expect(stepBtn).toBeDisabled()
  })

  it('resets progress on Reset button click', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    const stepBtn = screen.getByTestId('arch-flow-step')
    const resetBtn = screen.getByTestId('arch-flow-reset')
    fireEvent.click(stepBtn)
    expect(screen.getByTestId('arch-flow-progress')).toHaveTextContent('1 / 3')
    fireEvent.click(resetBtn)
    expect(screen.getByTestId('arch-flow-progress')).toHaveTextContent('0 / 3')
  })

  it('renders edge labels', () => {
    render(<ArchitectureFlow {...mockProps} />, { wrapper })
    expect(screen.getByText('Edge 1')).toBeInTheDocument()
    expect(screen.getByText('Edge 2')).toBeInTheDocument()
  })

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/architecture-flow/index')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('architecture-flow')).toBeDefined()
    void mod
  })
})
