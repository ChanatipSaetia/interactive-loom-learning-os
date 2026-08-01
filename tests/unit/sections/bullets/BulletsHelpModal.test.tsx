import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BulletsHelpModal } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/bullets/BulletsHelpModal'

describe('BulletsHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<BulletsHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('bullets-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<BulletsHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('bullets-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Bullet Points Section Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<BulletsHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
