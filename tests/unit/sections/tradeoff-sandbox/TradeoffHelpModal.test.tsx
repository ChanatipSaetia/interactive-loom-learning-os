import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TradeoffHelpModal } from '../../../../src/core/subdomains/tradeoff-sandbox/components/tradeoff-sandbox/TradeoffHelpModal'

describe('TradeoffHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<TradeoffHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('to-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<TradeoffHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('to-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Trade-off Sandbox Concepts & Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<TradeoffHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('to-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
