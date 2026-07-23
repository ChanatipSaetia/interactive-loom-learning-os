import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DecisionTreeHelpModal } from '../../../../src/sections/decision-tree/DecisionTreeHelpModal'

describe('DecisionTreeHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<DecisionTreeHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('dt-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<DecisionTreeHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('dt-help-modal')).toBeInTheDocument()
    expect(screen.getAllByText(/Decision Tree/).length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<DecisionTreeHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('dt-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
