import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import DragDrop, { type DragItem, type DropZone } from '../../../../src/sections/drag-drop/index'

const mockItems: DragItem[] = [
  { id: 'item1', label: 'REST API Call', correctZone: 'rest' },
  { id: 'item2', label: 'WebSocket Message', correctZone: 'ws' },
  { id: 'item3', label: 'HTTP Request', correctZone: 'rest' },
]

const mockZones: DropZone[] = [
  { id: 'rest', label: 'REST' },
  { id: 'ws', label: 'WebSocket' },
]

function dragToSource(source: HTMLElement, target: HTMLElement) {
  fireEvent.dragStart(source)
  fireEvent.dragOver(target)
  fireEvent.drop(target)
  fireEvent.dragEnd(source)
}

describe('DragDrop Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders all drop zones', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByTestId('zone-rest')).toBeInTheDocument()
    expect(screen.getByTestId('zone-ws')).toBeInTheDocument()
  })

  it('renders zone labels', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByText('REST')).toBeInTheDocument()
    expect(screen.getByText('WebSocket')).toBeInTheDocument()
  })

  it('renders all draggable items in tray', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByTestId('item-item1')).toBeInTheDocument()
    expect(screen.getByTestId('item-item2')).toBeInTheDocument()
    expect(screen.getByTestId('item-item3')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<DragDrop title="Categorize Scenarios" items={mockItems} zones={mockZones} />)
    expect(screen.getByText('Categorize Scenarios')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.queryByText('Categorize Scenarios')).not.toBeInTheDocument()
  })

  it('renders validate and reset buttons', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByTestId('drag-drop-validate')).toBeInTheDocument()
    expect(screen.getByTestId('drag-drop-reset')).toBeInTheDocument()
  })

  it('validate button is disabled when items are unplaced', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByTestId('drag-drop-validate')).toBeDisabled()
  })

  it('dragging item to zone places it in the zone', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)

    const item = screen.getByTestId('item-item1') as HTMLElement
    const zone = screen.getByTestId('zone-rest') as HTMLElement

    dragToSource(item, zone)

    expect(screen.getByTestId('dropped-item1')).toBeInTheDocument()
    expect(screen.queryByTestId('item-item1')).not.toBeInTheDocument()
  })

  it('shows correct feedback when all items placed correctly', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)

    for (const item of mockItems) {
      const el = screen.getByTestId(`item-${item.id}`) as HTMLElement
      const zone = screen.getByTestId(`zone-${item.correctZone}`) as HTMLElement
      dragToSource(el, zone)
    }

    const validateBtn = screen.getByTestId('drag-drop-validate')
    fireEvent.click(validateBtn)

    const feedback = screen.getByTestId('drag-drop-feedback')
    expect(feedback).toHaveTextContent('All correct!')
  })

  it('shows incorrect feedback when items are wrong', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)

    const item1 = screen.getByTestId('item-item1') as HTMLElement
    const wsZone = screen.getByTestId('zone-ws') as HTMLElement
    dragToSource(item1, wsZone)

    const item2 = screen.getByTestId('item-item2') as HTMLElement
    const restZone = screen.getByTestId('zone-rest') as HTMLElement
    dragToSource(item2, restZone)

    const item3 = screen.getByTestId('item-item3') as HTMLElement
    const wsZone2 = screen.getByTestId('zone-ws') as HTMLElement
    dragToSource(item3, wsZone2)

    const validateBtn = screen.getByTestId('drag-drop-validate')
    fireEvent.click(validateBtn)

    const feedback = screen.getByTestId('drag-drop-feedback')
    expect(feedback).toHaveTextContent('Some items are in the wrong zone. Try again.')
  })

  it('reset returns all items to tray', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)

    for (const item of mockItems) {
      const el = screen.getByTestId(`item-${item.id}`) as HTMLElement
      const zone = screen.getByTestId(`zone-${item.correctZone}`) as HTMLElement
      dragToSource(el, zone)
    }

    const resetBtn = screen.getByTestId('drag-drop-reset')
    fireEvent.click(resetBtn)

    expect(screen.getByTestId('item-item1')).toBeInTheDocument()
    expect(screen.getByTestId('item-item2')).toBeInTheDocument()
    expect(screen.getByTestId('item-item3')).toBeInTheDocument()
    expect(screen.queryByTestId('dropped-item1')).not.toBeInTheDocument()
  })

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/drag-drop/index')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('drag-drop')).toBeDefined()
    void mod
  })

  it('renders zone hover state on drag over', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    const zone = screen.getByTestId('zone-rest') as HTMLElement
    fireEvent.dragOver(zone)
    expect(zone).toHaveClass('drag-drop-zone-hovered')
  })

  it('renders controls container with data-testid', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByTestId('drag-drop-controls')).toBeInTheDocument()
  })

  it('renders tray container with data-testid', () => {
    render(<DragDrop items={mockItems} zones={mockZones} />)
    expect(screen.getByTestId('drag-drop-tray')).toBeInTheDocument()
  })
})
