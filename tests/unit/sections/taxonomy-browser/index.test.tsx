import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import TaxonomyBrowserSection from '../../../../src/sections/taxonomy-browser'

const MockIcon = () => <svg data-testid="mock-icon" />

const mockCategories = [
  {
    icon: MockIcon,
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
    icon: MockIcon,
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
    icon: MockIcon,
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

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/taxonomy-browser')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('taxonomy-browser')).toBeDefined()
    void mod
  })
})
