import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReflectionSequenceHelpModal } from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence/ReflectionSequenceHelpModal'

describe('ReflectionSequenceHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ReflectionSequenceHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('reflection-sequence-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<ReflectionSequenceHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('reflection-sequence-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Reflection Sequence Challenge Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ReflectionSequenceHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
