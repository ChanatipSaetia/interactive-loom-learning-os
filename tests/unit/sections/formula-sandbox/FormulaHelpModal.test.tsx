import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FormulaHelpModal } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox/FormulaHelpModal'

describe('FormulaHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<FormulaHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('fm-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<FormulaHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('fm-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Formula Sandbox Concepts & Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<FormulaHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('fm-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
