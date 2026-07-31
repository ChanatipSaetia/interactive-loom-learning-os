import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScenarioHelpModal } from '../../../../src/core/subdomains/process-simulation/components/scenario/ScenarioHelpModal'

describe('ScenarioHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ScenarioHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('sc-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<ScenarioHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('sc-help-modal')).toBeInTheDocument()
    expect(screen.getAllByText(/Scenario Section/).length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ScenarioHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('sc-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
