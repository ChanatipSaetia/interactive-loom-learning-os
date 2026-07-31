import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReflectionTemplateHelpModal } from '../../../../src/core/subdomains/reflection-synthesis/components/reflection-template/ReflectionTemplateHelpModal'

describe('ReflectionTemplateHelpModal', () => {
  it('does not render when isOpen is false', () => {
    render(<ReflectionTemplateHelpModal isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId('reflection-template-help-modal')).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(<ReflectionTemplateHelpModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId('reflection-template-help-modal')).toBeInTheDocument()
    expect(screen.getByText('Reflection Template Fill-In-Blank Guide')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ReflectionTemplateHelpModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
