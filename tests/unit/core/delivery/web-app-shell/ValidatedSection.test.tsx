import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ValidatedSection } from '../../../../../src/core/delivery/web-app-shell/ValidatedSection'
import { SectionErrorPlaceholder } from '../../../../../src/core/ui-system/primitives/SectionErrorPlaceholder'

const diagnostic = {
  tier: 1 as const,
  file: 'demo/sections/quiz/questions.yaml',
  line: 4,
  column: 2,
  message: 'YAML Syntax Error in questions.yaml',
  fixHint: 'Fix the indentation.',
}

describe('ValidatedSection', () => {
  it('replaces a failed section with a placeholder listing diagnostics', () => {
    render(
      <ValidatedSection config={{ type: 'quiz', props: {}, validation: { status: 'error', diagnostics: [diagnostic] } }}>
        <div>section content</div>
      </ValidatedSection>,
    )

    expect(screen.getByTestId('section-error-placeholder')).toHaveTextContent('demo/sections/quiz/questions.yaml:4:2')
    expect(screen.getByText('Fix: Fix the indentation.')).toBeInTheDocument()
    expect(screen.queryByText('section content')).not.toBeInTheDocument()
  })

  it('renders a section with warnings under a diagnostics badge', () => {
    render(
      <ValidatedSection config={{ type: 'quiz', props: {}, validation: { status: 'warning', diagnostics: [{ tier: 3, message: 'dangling ref' }] } }}>
        <div>section content</div>
      </ValidatedSection>,
    )

    expect(screen.getByText('section content')).toBeInTheDocument()
    expect(screen.getByTestId('section-validation-badge')).toHaveTextContent('1 validation warning')
  })

  it('renders valid sections untouched', () => {
    render(
      <ValidatedSection config={{ type: 'quiz', props: {} }}>
        <div>section content</div>
      </ValidatedSection>,
    )

    expect(screen.getByText('section content')).toBeInTheDocument()
    expect(screen.queryByTestId('section-validation-badge')).not.toBeInTheDocument()
  })
})

describe('SectionErrorPlaceholder', () => {
  it('shows learners a short notice instead of diagnostics', () => {
    render(<SectionErrorPlaceholder diagnostics={[diagnostic]} showDiagnostics={false} />)

    expect(screen.getByText('This section couldn’t be loaded')).toBeInTheDocument()
    expect(screen.queryByText(/questions\.yaml/)).not.toBeInTheDocument()
  })
})
