import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import Choice, { type ChoiceOption } from '../../../../src/sections/choice'

const mockOptions: ChoiceOption[] = [
  {
    id: 'rest',
    label: 'REST API',
    description: 'Request-response pattern using HTTP.',
    pros: ['Simple', 'Cacheable'],
    cons: ['Higher latency'],
  },
  {
    id: 'websocket',
    label: 'WebSocket',
    description: 'Full-duplex persistent connection.',
    pros: ['Real-time', 'Low latency'],
    cons: ['More complex'],
  },
]

describe('Choice Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders option cards', () => {
    render(<Choice options={mockOptions} />)
    expect(screen.getByTestId('choice-card-rest')).toBeInTheDocument()
    expect(screen.getByTestId('choice-card-websocket')).toBeInTheDocument()
  })

  it('renders the section title when provided', () => {
    render(<Choice title="Compare Options" options={mockOptions} />)
    expect(screen.getByTestId('choice')).toHaveTextContent('Compare Options')
  })

  it('renders option labels', () => {
    render(<Choice options={mockOptions} />)
    expect(screen.getByText('REST API')).toBeInTheDocument()
    expect(screen.getByText('WebSocket')).toBeInTheDocument()
  })

  it('renders pros with icons', () => {
    render(<Choice options={mockOptions} />)
    expect(screen.getByTestId('choice-pros-rest')).toBeInTheDocument()
    expect(screen.getByText('Simple')).toBeInTheDocument()
    expect(screen.getByTestId('choice-bullet-pro-rest-0')).toBeInTheDocument()
  })

  it('renders cons with icons', () => {
    render(<Choice options={mockOptions} />)
    expect(screen.getByTestId('choice-cons-rest')).toBeInTheDocument()
    expect(screen.getByText('Higher latency')).toBeInTheDocument()
    expect(screen.getByTestId('choice-bullet-con-rest-0')).toBeInTheDocument()
  })

  it('clicking an option selects it', () => {
    render(<Choice options={mockOptions} />)
    const selectBtn = screen.getByTestId('choice-select-rest')
    fireEvent.click(selectBtn)
    expect(screen.getByTestId('choice-card-rest')).toHaveClass('choice-card-selected')
    expect(screen.getByTestId('choice-checked-rest')).toBeInTheDocument()
  })

  it('selecting one option deselects the other (single mode)', () => {
    render(<Choice options={mockOptions} />)
    const restBtn = screen.getByTestId('choice-select-rest')
    const wsBtn = screen.getByTestId('choice-select-websocket')
    fireEvent.click(restBtn)
    expect(screen.getByTestId('choice-card-rest')).toHaveClass('choice-card-selected')
    expect(screen.getByTestId('choice-card-websocket')).not.toHaveClass('choice-card-selected')
    fireEvent.click(wsBtn)
    expect(screen.getByTestId('choice-card-rest')).not.toHaveClass('choice-card-selected')
    expect(screen.getByTestId('choice-card-websocket')).toHaveClass('choice-card-selected')
  })

  it('clicking selected option deselects it', () => {
    render(<Choice options={mockOptions} />)
    const selectBtn = screen.getByTestId('choice-select-rest')
    fireEvent.click(selectBtn)
    expect(screen.getByTestId('choice-card-rest')).toHaveClass('choice-card-selected')
    fireEvent.click(selectBtn)
    expect(screen.getByTestId('choice-card-rest')).not.toHaveClass('choice-card-selected')
    expect(screen.getByTestId('choice-unchecked-rest')).toBeInTheDocument()
  })

  it('selected option shows expanded details', () => {
    render(<Choice options={mockOptions} />)
    const selectBtn = screen.getByTestId('choice-select-rest')
    fireEvent.click(selectBtn)
    expect(screen.getByTestId('choice-selected-details-rest')).toBeInTheDocument()
  })

  it('renders option description', () => {
    render(<Choice options={mockOptions} />)
    expect(screen.getByText('Request-response pattern using HTTP.')).toBeInTheDocument()
  })

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/choice')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('choice')).toBeDefined()
    void mod
  })

  it('renders options container with data-testid', () => {
    render(<Choice options={mockOptions} />)
    expect(screen.getByTestId('choice-options')).toBeInTheDocument()
  })

  it('keyboard Enter selects option', () => {
    render(<Choice options={mockOptions} />)
    const selectBtn = screen.getByTestId('choice-select-rest')
    fireEvent.keyDown(selectBtn, { key: 'Enter', code: 'Enter' })
    expect(screen.getByTestId('choice-card-rest')).toHaveClass('choice-card-selected')
  })

  it('keyboard Space selects option', () => {
    render(<Choice options={mockOptions} />)
    const selectBtn = screen.getByTestId('choice-select-rest')
    fireEvent.keyDown(selectBtn, { key: 'Space', code: 'Space' })
    expect(screen.getByTestId('choice-card-rest')).toHaveClass('choice-card-selected')
  })

  it('selection state persists during topic session', () => {
    render(<Choice options={mockOptions} />)
    const selectBtn = screen.getByTestId('choice-select-rest')
    fireEvent.click(selectBtn)
    expect(screen.getByTestId('choice-card-rest')).toHaveClass('choice-card-selected')
    expect(screen.queryByTestId('choice-unchecked-rest')).not.toBeInTheDocument()
  })
})
