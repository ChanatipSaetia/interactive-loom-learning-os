import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SectionRegistry } from '../../../../src/core/registry'
import DataFlow from '../../../../src/sections/data-flow/index'
import type { DataFlowProps } from '../../../../src/sections/data-flow/index'

vi.mock('../../../../src/core/hooks/useAnimation', () => ({
  useAnimation: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    restart: vi.fn(),
    seek: vi.fn(),
    stepForward: vi.fn(),
    stepBack: vi.fn(),
    status: { playing: false, currentStep: 0, totalSteps: 2 },
  })),
}))

const samplePaths = [
  { id: 'path1', label: 'Flow A', d: 'M 50 100 L 200 100 L 350 50' },
  { id: 'path2', label: 'Flow B', d: 'M 50 100 L 250 150 L 500 180' },
]

const defaultProps: DataFlowProps = {
  title: 'Data Flow Diagram',
  paths: samplePaths,
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
)

describe('DataFlow', () => {
  beforeEach(() => {
    SectionRegistry.clear()
    vi.clearAllMocks()
  })

  it('renders SVG diagram', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('data-flow-svg')).toBeInTheDocument()
  })

  it('renders all paths', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('dataflow-path-path1')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-path-path2')).toBeInTheDocument()
  })

  it('renders particles for each path', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('dataflow-particle-path1')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-particle-path2')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByText('Data Flow Diagram')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(<DataFlow paths={samplePaths} />, { wrapper })
    expect(screen.queryByText('Data Flow Diagram')).not.toBeInTheDocument()
  })

  it('renders path labels', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByText('Flow A')).toBeInTheDocument()
    expect(screen.getByText('Flow B')).toBeInTheDocument()
  })

  it('renders animation controls', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('dataflow-play')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-pause')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-step')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-reset')).toBeInTheDocument()
  })

  it('shows correct progress count initially', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('data-flow-progress')).toHaveTextContent('1 / 2')
  })

  it('renders step back button', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('dataflow-step-back')).toBeInTheDocument()
  })

  it('renders animation controls', () => {
    render(<DataFlow {...defaultProps} />, { wrapper })
    expect(screen.getByTestId('dataflow-play')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-pause')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-step')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-step-back')).toBeInTheDocument()
    expect(screen.getByTestId('dataflow-reset')).toBeInTheDocument()
  })

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/data-flow/index')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('data-flow')).toBeDefined()
    void mod
  })
})
