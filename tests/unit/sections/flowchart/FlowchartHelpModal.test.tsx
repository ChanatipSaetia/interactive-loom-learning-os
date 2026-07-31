import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FlowchartHelpModal } from '../../../../src/core/subdomains/process-simulation/components/flowchart/FlowchartHelpModal'

describe('FlowchartHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<FlowchartHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('flowchart-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<FlowchartHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('flowchart-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Flowchart & Event Storming Concepts Guide')).toBeInTheDocument()
    expect(screen.getByText('The Event Storming Cycle')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<FlowchartHelpModal isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('flowchart-help-close')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop overlay is clicked', () => {
    const onClose = vi.fn()
    render(<FlowchartHelpModal isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('flowchart-help-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<FlowchartHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
