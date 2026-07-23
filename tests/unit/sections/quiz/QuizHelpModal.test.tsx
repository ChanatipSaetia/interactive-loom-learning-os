import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuizHelpModal } from '../../../../src/sections/quiz/QuizHelpModal'

describe('QuizHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<QuizHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('qz-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<QuizHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('qz-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Quiz Section Concepts & Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<QuizHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('qz-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
