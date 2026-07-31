import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FlashcardsHelpModal } from '../../../../src/core/subdomains/practice-assessment/components/flashcards/FlashcardsHelpModal'

describe('FlashcardsHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<FlashcardsHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('fc-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<FlashcardsHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('fc-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Flashcard Deck Concepts & Authoring Guide')).toBeInTheDocument()
    expect(screen.getByText('Dual-Faced Card Anatomy')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<FlashcardsHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('fc-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn()
    render(<FlashcardsHelpModal isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('fc-help-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<FlashcardsHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
