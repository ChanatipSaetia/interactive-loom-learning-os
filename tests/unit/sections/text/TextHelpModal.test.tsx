import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TextHelpModal } from '../../../../src/sections/text/TextHelpModal'

describe('TextHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<TextHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('text-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<TextHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('text-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Rich Text Section Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<TextHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
