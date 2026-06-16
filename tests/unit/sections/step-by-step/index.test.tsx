import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import StepByStep, { type StepContent } from '../../../../src/sections/step-by-step'

const mockSteps: StepContent[] = [
  { title: 'First Step', body: 'First step content.' },
  { title: 'Second Step', body: 'Second step content.' },
  { title: 'Third Step', body: 'Third step content.' },
]

describe('StepByStep Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders the first step content by default', () => {
    render(<StepByStep steps={mockSteps} />)
    expect(screen.getByTestId('step-title')).toHaveTextContent('First Step')
    expect(screen.getByTestId('step-body')).toHaveTextContent('First step content.')
  })

  it('renders the section title when provided', () => {
    render(<StepByStep title="REST Lifecycle" steps={mockSteps} />)
    expect(screen.getByTestId('step-by-step')).toHaveTextContent('REST Lifecycle')
  })

  it('shows correct progress indicator', () => {
    render(<StepByStep steps={mockSteps} />)
    expect(screen.getByTestId('step-progress')).toHaveTextContent('1 / 3')
  })

  it('Next button advances to the next step', () => {
    render(<StepByStep steps={mockSteps} />)
    const nextBtn = screen.getByTestId('step-next')
    fireEvent.click(nextBtn)
    expect(screen.getByTestId('step-title')).toHaveTextContent('Second Step')
    expect(screen.getByTestId('step-body')).toHaveTextContent('Second step content.')
    expect(screen.getByTestId('step-progress')).toHaveTextContent('2 / 3')
  })

  it('Prev button goes back to the previous step', () => {
    render(<StepByStep steps={mockSteps} />)
    const nextBtn = screen.getByTestId('step-next')
    const prevBtn = screen.getByTestId('step-prev')
    fireEvent.click(nextBtn)
    fireEvent.click(prevBtn)
    expect(screen.getByTestId('step-title')).toHaveTextContent('First Step')
    expect(screen.getByTestId('step-progress')).toHaveTextContent('1 / 3')
  })

  it('Prev button is disabled at the first step', () => {
    render(<StepByStep steps={mockSteps} />)
    const prevBtn = screen.getByTestId('step-prev')
    expect(prevBtn).toBeDisabled()
  })

  it('Next button is disabled at the last step', () => {
    render(<StepByStep steps={mockSteps} />)
    const nextBtn = screen.getByTestId('step-next')
    fireEvent.click(nextBtn)
    fireEvent.click(nextBtn)
    expect(nextBtn).toBeDisabled()
  })

  it('clicking Next at last step stays on last step', () => {
    render(<StepByStep steps={mockSteps} />)
    const nextBtn = screen.getByTestId('step-next')
    fireEvent.click(nextBtn)
    fireEvent.click(nextBtn)
    fireEvent.click(nextBtn)
    expect(screen.getByTestId('step-title')).toHaveTextContent('Third Step')
    expect(screen.getByTestId('step-progress')).toHaveTextContent('3 / 3')
  })

  it('clicking Prev at first step stays on first step', () => {
    render(<StepByStep steps={mockSteps} />)
    const prevBtn = screen.getByTestId('step-prev')
    fireEvent.click(prevBtn)
    expect(screen.getByTestId('step-title')).toHaveTextContent('First Step')
    expect(screen.getByTestId('step-progress')).toHaveTextContent('1 / 3')
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/step-by-step')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('step-by-step')).toBeUndefined()
    void mod
  })

  it('renders content container with data-testid', () => {
    render(<StepByStep steps={mockSteps} />)
    expect(screen.getByTestId('step-content')).toBeInTheDocument()
  })

  it('renders controls container with data-testid', () => {
    render(<StepByStep steps={mockSteps} />)
    expect(screen.getByTestId('step-controls')).toBeInTheDocument()
  })
})
