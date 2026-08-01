import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConceptMapHelpModal } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map/ConceptMapHelpModal'

describe('ConceptMapHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ConceptMapHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('cm-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<ConceptMapHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('cm-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Concept Map Guide & Concepts')).toBeInTheDocument()
    expect(screen.getByText('What is a Concept Map?')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ConceptMapHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('cm-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn()
    render(<ConceptMapHelpModal isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('cm-help-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<ConceptMapHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
