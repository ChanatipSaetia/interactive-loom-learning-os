import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import TextSection from '../../../../src/sections/text'

describe('Text Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders paragraph content', () => {
    render(<TextSection paragraphs={['This is a paragraph.']} />)
    expect(screen.getByTestId('text-paragraph-0')).toHaveTextContent('This is a paragraph.')
  })

  it('renders multiple paragraphs', () => {
    render(<TextSection paragraphs={['First paragraph.', 'Second paragraph.']} />)
    expect(screen.getByTestId('text-paragraph-0')).toHaveTextContent('First paragraph.')
    expect(screen.getByTestId('text-paragraph-1')).toHaveTextContent('Second paragraph.')
  })

  it('renders the section title when provided', () => {
    render(<TextSection title="Introduction" paragraphs={['Content.']} />)
    expect(screen.getByTestId('text-title')).toHaveTextContent('Introduction')
  })

  it('renders the heading when provided', () => {
    render(<TextSection heading="What is REST?" paragraphs={['Content.']} />)
    expect(screen.getByTestId('text-heading')).toHaveTextContent('What is REST?')
  })

  it('renders inline code with monospace styling', () => {
    render(<TextSection paragraphs={['Use the <code>fetch()</code> API for requests.']} />)
    const code = screen.getByTestId('text-inline-code')
    expect(code).toBeInTheDocument()
    expect(code).toHaveTextContent('fetch()')
    expect(code).toHaveClass('text-inline-code')
  })

  it('renders links with action-blue styling', () => {
    render(<TextSection paragraphs={['See <a href="https://example.com">Example</a> for more.']} />)
    const link = screen.getByTestId('text-link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent('Example')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveClass('text-link')
  })

  it('renders mixed content with code and links', () => {
    render(<TextSection paragraphs={['Use <code>axios</code> or <a href="https://axios.js.org">Axios docs</a> for HTTP.']} />)
    const code = screen.getByTestId('text-inline-code')
    expect(code).toHaveTextContent('axios')
    const link = screen.getByTestId('text-link')
    expect(link).toHaveTextContent('Axios docs')
    expect(link).toHaveAttribute('href', 'https://axios.js.org')
  })

  it('renders container with data-testid', () => {
    render(<TextSection paragraphs={['Content.']} />)
    expect(screen.getByTestId('text-section')).toBeInTheDocument()
    expect(screen.getByTestId('text-content')).toBeInTheDocument()
  })

  it('does not render title or heading when not provided', () => {
    render(<TextSection paragraphs={['Content.']} />)
    expect(screen.queryByTestId('text-title')).not.toBeInTheDocument()
    expect(screen.queryByTestId('text-heading')).not.toBeInTheDocument()
  })

  it('does not self-register with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/text')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('text')).toBeUndefined()
    void mod
  })
})
