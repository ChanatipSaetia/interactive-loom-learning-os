import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaxonomyHelpModal } from '../../../../src/core/subdomains/progressive-content/components/taxonomy-browser/TaxonomyHelpModal'

describe('TaxonomyHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<TaxonomyHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('taxonomy-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<TaxonomyHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('taxonomy-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Taxonomy Browser Section Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<TaxonomyHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
