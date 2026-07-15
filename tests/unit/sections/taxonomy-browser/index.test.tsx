import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import TaxonomyBrowserSection from '../../../../src/sections/taxonomy-browser'

const mockCategories = [
  {
    icon: "BookOpen",
    title: 'Category One',
    subtitle: 'Subtitle One',
    description: 'Description for the first category.',
    details: 'More details about category one.',
    analogy: 'An analogy for category one.',
    primaryFocus: 'Main focus area.',
    inScope: ['Item A', 'Item B'],
    outOfScope: ['Item C'],
    color: 'blue',
  },
  {
    icon: "BookOpen",
    title: 'Category Two',
    subtitle: 'Subtitle Two',
    description: 'Description for the second category.',
    details: 'More details about category two.',
    analogy: 'An analogy for category two.',
    primaryFocus: 'Another focus area.',
    inScope: ['Item D'],
    outOfScope: [],
    color: 'peach',
  },
  {
    icon: "BookOpen",
    title: 'Category Three',
    subtitle: 'Subtitle Three',
    description: 'Description for the third category.',
    details: 'More details about category three.',
    analogy: 'An analogy for category three.',
    primaryFocus: 'Third focus area.',
    inScope: ['Item E'],
    outOfScope: ['Item F'],
    color: 'pink',
  },
]

describe('TaxonomyBrowser Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders the section container', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-section')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-browser-grid')).toBeInTheDocument()
  })

  it('renders N category cards from props', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-card-0')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-browser-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-browser-card-2')).toBeInTheDocument()
    expect(screen.queryByTestId('taxonomy-browser-card-3')).not.toBeInTheDocument()
  })

  it('renders the section title when provided', () => {
    render(<TaxonomyBrowserSection title="AI Capabilities" categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-title')).toHaveTextContent('AI Capabilities')
  })

  it('does not render the section title when not provided', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.queryByTestId('taxonomy-browser-title')).not.toBeInTheDocument()
  })

  it('renders category icons', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-icon-0')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-browser-icon-1')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-browser-icon-2')).toBeInTheDocument()
  })

  it('renders category subtitles', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-subtitle-0')).toHaveTextContent('Subtitle One')
    expect(screen.getByTestId('taxonomy-browser-subtitle-1')).toHaveTextContent('Subtitle Two')
    expect(screen.getByTestId('taxonomy-browser-subtitle-2')).toHaveTextContent('Subtitle Three')
  })

  it('renders category titles', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-card-title-0')).toHaveTextContent('Category One')
    expect(screen.getByTestId('taxonomy-browser-card-title-1')).toHaveTextContent('Category Two')
    expect(screen.getByTestId('taxonomy-browser-card-title-2')).toHaveTextContent('Category Three')
  })

  it('renders category descriptions', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.getByTestId('taxonomy-browser-description-0')).toHaveTextContent('Description for the first category.')
    expect(screen.getByTestId('taxonomy-browser-description-1')).toHaveTextContent('Description for the second category.')
    expect(screen.getByTestId('taxonomy-browser-description-2')).toHaveTextContent('Description for the third category.')
  })

  it('applies accent color to card border', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    const card0 = screen.getByTestId('taxonomy-browser-card-0')
    expect(card0.style.borderTopColor).toBe('var(--ctp-blue)')
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/taxonomy-browser')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('taxonomy-browser')).toBeUndefined()
    void mod
  })

  it('opens modal on card click', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-overlay')).toBeInTheDocument()
  })

  it('modal shows correct category title', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    const dialog = screen.getByTestId('taxonomy-dialog')
    expect(dialog.querySelector('.taxonomy-modal-title')).toHaveTextContent('Category One')
  })

  it('modal shows correct category subtitle', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    const dialog = screen.getByTestId('taxonomy-dialog')
    expect(dialog.querySelector('.taxonomy-modal-subtitle')).toHaveTextContent('Subtitle One')
  })

  it('modal shows overview section', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    const overview = screen.getByTestId('taxonomy-modal-overview')
    expect(overview).toBeInTheDocument()
    expect(overview).toHaveTextContent('Description for the first category.')
  })

  it('modal shows deep dive section', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    const deepdive = screen.getByTestId('taxonomy-modal-deepdive')
    expect(deepdive).toBeInTheDocument()
    expect(deepdive).toHaveTextContent('More details about category one.')
  })

  it('modal shows scope boundaries section', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    const scope = screen.getByTestId('taxonomy-modal-scope')
    expect(scope).toBeInTheDocument()
    expect(scope).toHaveTextContent('Primary Focus')
    expect(scope).toHaveTextContent('Main focus area.')
  })

  it('modal shows analogy', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-modal-analogy')).toHaveTextContent('An analogy for category one.')
  })

  it('modal shows primary focus', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-modal-primary-focus')).toHaveTextContent('Main focus area.')
  })

  it('modal shows in-scope items', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-modal-in-scope')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-modal-in-scope-0')).toHaveTextContent('Item A')
    expect(screen.getByTestId('taxonomy-modal-in-scope-1')).toHaveTextContent('Item B')
  })

  it('modal shows out-of-scope items', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-modal-out-of-scope')).toBeInTheDocument()
    expect(screen.getByTestId('taxonomy-modal-out-of-scope-0')).toHaveTextContent('Item C')
  })

  it('modal closes on close button click', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('taxonomy-dialog-close'))
    expect(screen.queryByTestId('taxonomy-dialog')).not.toBeInTheDocument()
  })

  it('modal closes on overlay click', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-0'))
    expect(screen.getByTestId('taxonomy-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('taxonomy-overlay'))
    expect(screen.queryByTestId('taxonomy-dialog')).not.toBeInTheDocument()
  })

  it('opens modal on Enter key', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    const card = screen.getByTestId('taxonomy-browser-card-0')
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
    expect(screen.getByTestId('taxonomy-dialog')).toBeInTheDocument()
  })

  it('opens modal on Space key', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    const card = screen.getByTestId('taxonomy-browser-card-0')
    fireEvent.keyDown(card, { key: ' ', code: 'Space' })
    expect(screen.getByTestId('taxonomy-dialog')).toBeInTheDocument()
  })

  it('modal shows second category data when its card is clicked', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    fireEvent.click(screen.getByTestId('taxonomy-browser-card-1'))
    expect(screen.getByTestId('taxonomy-dialog')).toBeInTheDocument()
    const dialog = screen.getByTestId('taxonomy-dialog')
    expect(dialog.querySelector('.taxonomy-modal-title')).toHaveTextContent('Category Two')
    expect(dialog.querySelector('.taxonomy-modal-subtitle')).toHaveTextContent('Subtitle Two')
    const deepdive = screen.getByTestId('taxonomy-modal-deepdive')
    expect(deepdive).toHaveTextContent('More details about category two.')
  })

  it('modal does not show when no card is clicked', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    expect(screen.queryByTestId('taxonomy-dialog')).not.toBeInTheDocument()
  })

  it('cards render within ScrollReveal and TiltCard wrappers', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    const card0 = screen.getByTestId('taxonomy-browser-card-0')
    // ScrollReveal + TiltCard wrap each card in motion.div elements
    // Verify the card is properly nested (2 wrapper levels: TiltCard > ScrollReveal)
    expect(card0.parentElement?.tagName).toBe('DIV')
    expect(card0.parentElement?.parentElement?.tagName).toBe('DIV')
  })

  it('all cards render within motion wrappers', () => {
    render(<TaxonomyBrowserSection categories={mockCategories} />)
    for (let i = 0; i < 3; i++) {
      const card = screen.getByTestId(`taxonomy-browser-card-${i}`)
      expect(card.parentElement?.tagName).toBe('DIV')
      expect(card.parentElement?.parentElement?.tagName).toBe('DIV')
    }
  })
})
