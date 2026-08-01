import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import FlashcardDeck from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/flashcards'

describe('FlashcardDeck', () => {
  const mockTerms = [
    {
      id: 'term-1',
      word: 'Visual Balance',
      pronunciation: '/ˈvɪʒ.u.əl ˈbæl.əns/',
      category: 'hierarchy',
      shortDefinition: 'Equal distribution of visual weight.',
      detailedDefinition: 'Visual balance occurs when elements are arranged symmetrically or asymmetrical.',
      whyItMatters: 'Ensures users feel comfortable navigating the interface.',
    },
    {
      id: 'term-2',
      word: 'Typography Scale',
      pronunciation: '/taɪˈpɒɡ.rə.fi skeɪl/',
      category: 'typography',
      shortDefinition: 'Proportional sizes for clear hierarchy.',
      detailedDefinition: 'A typographic scale provides a harmonized set of font sizes.',
      whyItMatters: 'Improves legibility and content structure.',
    },
  ]

  it('renders section title bar and term counter in title bar actions', () => {
    render(
      <FlashcardDeck
        title="Design System Glossary"
        terms={mockTerms}
        sectionIndex={1}
      />
    )

    expect(screen.getByTestId('section-title-1')).toHaveTextContent('Design System Glossary')
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getAllByText('Visual Balance').length).toBeGreaterThan(0)
  })
})
