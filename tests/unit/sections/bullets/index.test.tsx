import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import BulletsSection, { type BulletItem } from '../../../../src/sections/bullets'

const mockItems: BulletItem[] = [
  { text: 'First item' },
  { text: 'Second item' },
  { text: 'Third item' },
]

describe('Bullets Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders unordered list items', () => {
    render(<BulletsSection items={mockItems} animate={false} />)
    expect(screen.getByTestId('bullet-text-0')).toHaveTextContent('First item')
    expect(screen.getByTestId('bullet-text-1')).toHaveTextContent('Second item')
    expect(screen.getByTestId('bullet-text-2')).toHaveTextContent('Third item')
  })

  it('renders ordered list with numbered markers', () => {
    render(<BulletsSection items={mockItems} ordered animate={false} />)
    expect(screen.getByTestId('bullet-number-0')).toBeInTheDocument()
    expect(screen.getByTestId('bullet-number-1')).toBeInTheDocument()
    expect(screen.getByTestId('bullet-number-2')).toBeInTheDocument()
    expect(screen.getByTestId('bullets-list')).toHaveClass('bullets-list-ordered')
  })

  it('renders unordered bullet markers', () => {
    render(<BulletsSection items={mockItems} animate={false} />)
    expect(screen.getByTestId('bullet-marker-0')).toBeInTheDocument()
    expect(screen.getByTestId('bullet-marker-1')).toBeInTheDocument()
    expect(screen.getByTestId('bullets-list')).toHaveClass('bullets-list-unordered')
  })

  it('renders the section title when provided', () => {
    render(<BulletsSection title="Key Points" items={mockItems} animate={false} />)
    expect(screen.getByTestId('bullets-title')).toHaveTextContent('Key Points')
  })

  it('does not render title when not provided', () => {
    render(<BulletsSection items={mockItems} animate={false} />)
    expect(screen.queryByTestId('bullets-title')).not.toBeInTheDocument()
  })

  it('renders nested children items', () => {
    const nestedItems: BulletItem[] = [
      {
        text: 'Parent item',
        children: [
          { text: 'Child one' },
          { text: 'Child two' },
        ],
      },
    ]
    render(<BulletsSection items={nestedItems} animate={false} />)
    expect(screen.getByTestId('bullet-text-0')).toHaveTextContent('Parent item')
    const children = screen.getByTestId('bullet-children-0')
    expect(children).toBeInTheDocument()
    expect(screen.getByTestId('bullet-text-0-0')).toHaveTextContent('Child one')
    expect(screen.getByTestId('bullet-text-0-1')).toHaveTextContent('Child two')
  })

  it('renders checkable items with checkbox', () => {
    const checkableItems: BulletItem[] = [
      { text: 'Task one', checkable: true },
      { text: 'Task two', checkable: true },
    ]
    render(<BulletsSection items={checkableItems} animate={false} />)
    expect(screen.getByTestId('bullet-checkbox-0')).toBeInTheDocument()
    expect(screen.getByTestId('bullet-icon-unchecked-0')).toBeInTheDocument()
  })

  it('toggles checkable item on click', async () => {
    const checkableItems: BulletItem[] = [
      { text: 'Task one', checkable: true },
    ]
    render(<BulletsSection items={checkableItems} animate={false} />)
    const checkbox = screen.getByTestId('bullet-checkbox-0')
    expect(screen.getByTestId('bullet-icon-unchecked-0')).toBeInTheDocument()

    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.getByTestId('bullet-icon-checked-0')).toBeInTheDocument()
    })
    expect(screen.getByTestId('bullet-text-0')).toHaveClass('bullet-text-checked')
  })

  it('toggles off when clicking checked item', async () => {
    const checkableItems: BulletItem[] = [
      { text: 'Task one', checkable: true },
    ]
    render(<BulletsSection items={checkableItems} animate={false} />)
    const checkbox = screen.getByTestId('bullet-checkbox-0')

    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.getByTestId('bullet-icon-checked-0')).toBeInTheDocument()
    })

    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.getByTestId('bullet-icon-unchecked-0')).toBeInTheDocument()
    })
  })

  it('stagger animation applies opacity and transform on mount', () => {
    const { container } = render(<BulletsSection items={mockItems} />)
    const firstItem = container.querySelector('[data-testid="bullet-item-0"]')
    expect(firstItem).toHaveStyle({ opacity: '0' })
  })

  it('renders container with data-testid', () => {
    render(<BulletsSection items={mockItems} animate={false} />)
    expect(screen.getByTestId('bullets-section')).toBeInTheDocument()
    expect(screen.getByTestId('bullets-list')).toBeInTheDocument()
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/bullets')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('bullets')).toBeUndefined()
    void mod
  })

  it('pre-initialized items show as checked', () => {
    const preCheckedItems: BulletItem[] = [
      { text: 'Done task', checkable: true, checked: true },
    ]
    render(<BulletsSection items={preCheckedItems} animate={false} />)
    expect(screen.getByTestId('bullet-icon-checked-0')).toBeInTheDocument()
    expect(screen.getByTestId('bullet-text-0')).toHaveClass('bullet-text-checked')
  })
})
