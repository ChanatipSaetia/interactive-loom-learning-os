import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PillarLayerHelpModal } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/pillar-layer/PillarLayerHelpModal'

describe('PillarLayerHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<PillarLayerHelpModal isOpen={false} onClose={() => {}} />)
    expect(screen.queryByTestId('pillar-layer-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<PillarLayerHelpModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByTestId('pillar-layer-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Pillar & Layer Section Guide')).toBeInTheDocument()
  })

  it('calls onClose when overlay or close button is clicked', () => {
    const handleClose = vi.fn()
    render(<PillarLayerHelpModal isOpen={true} onClose={handleClose} />)

    fireEvent.click(screen.getByText('Got it'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
