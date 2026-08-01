import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { IntroHelpModal } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/intro/IntroHelpModal'

describe('IntroHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<IntroHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('intro-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<IntroHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('intro-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Topic Intro & Overview Guide')).toBeInTheDocument()
    expect(screen.getByText('The Intro Section Structure')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<IntroHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('intro-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn()
    render(<IntroHelpModal isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('intro-help-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<IntroHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
