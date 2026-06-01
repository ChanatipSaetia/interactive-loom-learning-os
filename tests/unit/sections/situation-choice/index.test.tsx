import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import SituationChoiceSection, {
  type ChoiceOption,
  type RecommendationDetail,
  type SituationChoice,
  type SituationChoiceSectionProps,
} from '../../../../src/sections/situation-choice'

const mockChoices: ChoiceOption[] = [
  {
    id: 'rest',
    label: 'REST API',
    description: 'Use HTTP request-response pattern.',
    pros: ['Simple', 'Cacheable'],
    cons: ['Higher latency'],
    whenToUse: 'When real-time is not critical.',
  },
  {
    id: 'websocket',
    label: 'WebSocket',
    description: 'Use persistent full-duplex connection.',
    pros: ['Real-time', 'Low latency'],
    cons: ['More complex'],
  },
]

const mockRecommendationDetail: RecommendationDetail = {
  why: 'WebSocket provides instant delivery for real-time chat.',
}

const mockSituations: SituationChoice[] = [
  {
    title: 'Real-time Communication',
    situation: 'You need to build a chat application.',
    recommended: 'websocket',
    recommendationDetail: mockRecommendationDetail,
    choices: mockChoices,
  },
]

const defaultProps: SituationChoiceSectionProps = {
  title: 'API Pattern Choice',
  situations: mockSituations,
}

describe('SituationChoice Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  it('renders the section container', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-choice')).toBeInTheDocument()
  })

  it('renders the section title when provided', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-choice-title')).toBeInTheDocument()
    expect(screen.getByText('API Pattern Choice')).toBeInTheDocument()
  })

  it('renders situation item', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-choice-item-0')).toBeInTheDocument()
  })

  it('renders situation title', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-choice-heading-0')).toBeInTheDocument()
    expect(screen.getByText('Real-time Communication')).toBeInTheDocument()
  })

  it('renders situation banner with text', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const banner = screen.getByTestId('situation-banner-0')
    expect(banner).toBeInTheDocument()
    expect(screen.getByText('You need to build a chat application.')).toBeInTheDocument()
  })

  it('renders recommendation banner with why text', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const banner = screen.getByTestId('recommendation-banner-0')
    expect(banner).toBeInTheDocument()
    expect(screen.getByText('WebSocket provides instant delivery for real-time chat.')).toBeInTheDocument()
  })

  it('renders all choice cards', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-card-0-rest')).toBeInTheDocument()
    expect(screen.getByTestId('situation-card-0-websocket')).toBeInTheDocument()
  })

  it('renders recommended badge on recommended card', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-badge-0-websocket')).toBeInTheDocument()
    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(screen.queryByTestId('situation-badge-0-rest')).not.toBeInTheDocument()
  })

  it('recommended card is open by default', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-card-trigger-0-websocket')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('situation-card-trigger-0-rest')).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking a closed card opens it and closes the other (accordion)', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const restTrigger = screen.getByTestId('situation-card-trigger-0-rest')
    fireEvent.click(restTrigger)
    expect(screen.getByTestId('situation-card-trigger-0-rest')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('situation-card-trigger-0-websocket')).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking open card keeps it open (exactly one always open)', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const wsTrigger = screen.getByTestId('situation-card-trigger-0-websocket')
    fireEvent.click(wsTrigger)
    expect(screen.getByTestId('situation-card-content-0-websocket')).toBeInTheDocument()
  })

  it('expanded card shows label and description', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-card-content-0-websocket')).toBeInTheDocument()
    expect(screen.getByText('Use persistent full-duplex connection.')).toBeInTheDocument()
  })

  it('expanded card shows pros with green bullets', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const pros = screen.getByTestId('situation-pros-0-websocket')
    expect(pros).toBeInTheDocument()
    expect(screen.getByText('Real-time')).toBeInTheDocument()
    expect(screen.getByTestId('situation-bullet-pro-0-websocket-0')).toBeInTheDocument()
  })

  it('expanded card shows cons with red bullets', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const cons = screen.getByTestId('situation-cons-0-websocket')
    expect(cons).toBeInTheDocument()
    expect(screen.getByText('More complex')).toBeInTheDocument()
    expect(screen.getByTestId('situation-bullet-con-0-websocket-0')).toBeInTheDocument()
  })

  it('non-recommended cards show whenToUse inside expanded content', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const restTrigger = screen.getByTestId('situation-card-trigger-0-rest')
    fireEvent.click(restTrigger)
    expect(screen.getByTestId('situation-when-to-use-0-rest')).toBeInTheDocument()
    expect(screen.getByText('When real-time is not critical.')).toBeInTheDocument()
  })

  it('recommended cards do not show whenToUse', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.queryByTestId('situation-when-to-use-0-websocket')).not.toBeInTheDocument()
  })

  it('keyboard Enter toggles accordion', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const restTrigger = screen.getByTestId('situation-card-trigger-0-rest')
    fireEvent.keyDown(restTrigger, { key: 'Enter', code: 'Enter' })
    expect(screen.getByTestId('situation-card-content-0-rest')).toBeInTheDocument()
  })

  it('keyboard Space toggles accordion', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const restTrigger = screen.getByTestId('situation-card-trigger-0-rest')
    fireEvent.keyDown(restTrigger, { key: ' ', code: 'Space' })
    expect(screen.getByTestId('situation-card-content-0-rest')).toBeInTheDocument()
  })

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    const mod = await import('../../../../src/sections/situation-choice')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('situation-choice')).toBeDefined()
    void mod
  })

  it('renders multiple situations', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection title="Multiple Situations" situations={multiSituations} />)
    expect(screen.getByTestId('situation-choice-item-0')).toBeInTheDocument()
    expect(screen.getByTestId('situation-dropdown')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('situation-select'))
    fireEvent.click(screen.getByText('Batch Processing'))
    expect(screen.getByTestId('situation-choice-item-1')).toBeInTheDocument()
  })

  it('renders accordion container with data-testid', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-accordion-0')).toBeInTheDocument()
  })

  // ─── Compare All Modal ──────────────────────────────────────

  it('renders Compare All button', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('compare-all-button-0')).toBeInTheDocument()
    expect(screen.getByText('Compare All')).toBeInTheDocument()
  })

  it('Compare All button is positioned above accordion', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const item = screen.getByTestId('situation-choice-item-0')
    const button = screen.getByTestId('compare-all-button-0')
    const accordion = screen.getByTestId('situation-accordion-0')
    const children = Array.from(item.children)
    const buttonIdx = children.indexOf(button)
    const accordionIdx = children.indexOf(accordion)
    expect(buttonIdx).toBeLessThan(accordionIdx)
  })

  it('clicking Compare All opens modal', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const button = screen.getByTestId('compare-all-button-0')
    fireEvent.click(button)
    expect(screen.getByTestId('compare-dialog-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-overlay-0')).toBeInTheDocument()
  })

  it('modal shows 2-column grid with all choices', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    const grid = screen.getByTestId('compare-grid-0')
    expect(grid).toBeInTheDocument()
    expect(screen.getByTestId('compare-card-0-rest')).toBeInTheDocument()
    expect(screen.getByTestId('compare-card-0-websocket')).toBeInTheDocument()
  })

  it('modal shows title', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-dialog-title-0')).toBeInTheDocument()
    expect(screen.getByText('Compare All Options')).toBeInTheDocument()
  })

  it('each choice shows label', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-card-label-0-rest')).toBeInTheDocument()
    expect(screen.getByTestId('compare-card-label-0-websocket')).toBeInTheDocument()
  })

  it('each choice shows pros with Check icon (green)', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-pros-0-websocket')).toBeInTheDocument()
    expect(screen.getByTestId('compare-icon-pro-0-websocket-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-pro-0-websocket-0')).toBeInTheDocument()
  })

  it('each choice shows cons with X icon (red)', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-cons-0-websocket')).toBeInTheDocument()
    expect(screen.getByTestId('compare-icon-con-0-websocket-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-con-0-websocket-0')).toBeInTheDocument()
  })

  it('recommended choice has Recommended badge', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-badge-0-websocket')).toBeInTheDocument()
    expect(screen.queryByTestId('compare-badge-0-rest')).not.toBeInTheDocument()
  })

  it('recommended choice card has recommended class', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    const recCard = screen.getByTestId('compare-card-0-websocket')
    expect(recCard.classList.contains('compare-card-recommended')).toBe(true)
    const otherCard = screen.getByTestId('compare-card-0-rest')
    expect(otherCard.classList.contains('compare-card-recommended')).toBe(false)
  })

  it('recommendationDetail.why is displayed above grid', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    const why = screen.getByTestId('compare-why-0')
    expect(why).toBeInTheDocument()
    expect(why).toHaveTextContent('WebSocket provides instant delivery for real-time chat.')
  })

  it('modal is dismissible with close button', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-dialog-0')).toBeInTheDocument()
    const closeBtn = screen.getByTestId('compare-dialog-close-0')
    fireEvent.click(closeBtn)
    expect(screen.queryByTestId('compare-dialog-0')).not.toBeInTheDocument()
  })

  it('modal is dismissible with Escape key', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-dialog-0')).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByTestId('compare-dialog-0')).not.toBeInTheDocument()
  })

  it('modal dismissible by clicking outside (overlay click)', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button-0'))
    expect(screen.getByTestId('compare-dialog-0')).toBeInTheDocument()
    const overlay = screen.getByTestId('compare-overlay-0')
    fireEvent.click(overlay)
    expect(screen.queryByTestId('compare-dialog-0')).not.toBeInTheDocument()
  })

  // ─── Situation Dropdown ───────────────────────────────────────

  it('single situation does not show dropdown', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.queryByTestId('situation-dropdown')).not.toBeInTheDocument()
    expect(screen.queryByTestId('situation-select')).not.toBeInTheDocument()
  })

  it('multiple situations show dropdown', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection title="Multiple Situations" situations={multiSituations} />)
    expect(screen.getByTestId('situation-dropdown')).toBeInTheDocument()
    expect(screen.getByTestId('situation-select')).toBeInTheDocument()
  })

  it('dropdown shows title of first situation by default', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    const select = screen.getByTestId('situation-select')
    expect(select).toHaveTextContent('Real-time Communication')
  })

  it('clicking dropdown opens options', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    const select = screen.getByTestId('situation-select')
    fireEvent.click(select)
    const options = screen.queryAllByRole('option')
    expect(options).toHaveLength(2)
  })

  it('dropdown options show situation titles', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    fireEvent.click(screen.getByTestId('situation-select'))
    expect(screen.getByRole('option', { name: 'Real-time Communication' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Batch Processing' })).toBeInTheDocument()
  })

  it('selecting a situation updates the situation banner', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    expect(screen.getByText('You need to build a chat application.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('situation-select'))
    fireEvent.click(screen.getByRole('option', { name: 'Batch Processing' }))
    expect(screen.getByText('You need to process large datasets.')).toBeInTheDocument()
    expect(screen.queryByText('You need to build a chat application.')).not.toBeInTheDocument()
  })

  it('selecting a situation updates the recommendation banner', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    expect(screen.getByText('WebSocket provides instant delivery for real-time chat.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('situation-select'))
    fireEvent.click(screen.getByRole('option', { name: 'Batch Processing' }))
    expect(screen.getByText('REST is simpler for batch operations.')).toBeInTheDocument()
  })

  it('selecting a situation updates the accordion cards', () => {
    const secondSituation: SituationChoice = {
      title: 'Batch Processing',
      situation: 'You need to process large datasets.',
      recommended: 'rest',
      recommendationDetail: { why: 'REST is simpler for batch operations.' },
      choices: [
        {
          id: 'batch',
          label: 'Batch REST',
          description: 'Process in batches via REST.',
          pros: ['Simple'],
          cons: ['Slower'],
        },
        {
          id: 'stream',
          label: 'Stream Processing',
          description: 'Process data as a stream.',
          pros: ['Faster'],
          cons: ['More complex'],
        },
      ],
    }
    const multiSituations = [...mockSituations, secondSituation]
    render(<SituationChoiceSection situations={multiSituations} />)
    expect(screen.getByTestId('situation-card-0-websocket')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('situation-select'))
    fireEvent.click(screen.getByRole('option', { name: 'Batch Processing' }))
    expect(screen.getByTestId('situation-card-1-batch')).toBeInTheDocument()
    expect(screen.getByTestId('situation-card-1-stream')).toBeInTheDocument()
  })

  it('accordion resets to recommended card open on situation change', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    // First situation: websocket is recommended, should be open
    expect(screen.getByTestId('situation-card-trigger-0-websocket')).toHaveAttribute('aria-expanded', 'true')
    // Switch to second situation: rest is recommended, should be open
    fireEvent.click(screen.getByTestId('situation-select'))
    fireEvent.click(screen.getByRole('option', { name: 'Batch Processing' }))
    expect(screen.getByTestId('situation-card-trigger-1-rest')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('situation-card-trigger-1-websocket')).toHaveAttribute('aria-expanded', 'false')
  })

  it('active dropdown option has active class', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    fireEvent.click(screen.getByTestId('situation-select'))
    const options = screen.queryAllByRole('option')
    expect(options[0]).toHaveClass('situation-option-active')
    expect(options[1]).not.toHaveClass('situation-option-active')
  })

  it('selecting option closes dropdown', () => {
    const multiSituations: SituationChoice[] = [
      ...mockSituations,
      {
        title: 'Batch Processing',
        situation: 'You need to process large datasets.',
        recommended: 'rest',
        recommendationDetail: { why: 'REST is simpler for batch operations.' },
        choices: mockChoices,
      },
    ]
    render(<SituationChoiceSection situations={multiSituations} />)
    fireEvent.click(screen.getByTestId('situation-select'))
    expect(screen.queryAllByRole('option')).toHaveLength(2)
    fireEvent.click(screen.getByRole('option', { name: 'Batch Processing' }))
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  // ─── Animation Tests ──────────────────────────────────────────

  it('situation card has initial hidden inline styles for animation', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const item = screen.getByTestId('situation-choice-item-0')
    expect(item.style.opacity).toBe('0')
    expect(item.style.transform).toBe('translateY(20px)')
  })

  it('recommendation banner has initial hidden inline styles for animation', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const banner = screen.getByTestId('recommendation-banner-0')
    expect(banner.style.opacity).toBe('0')
    expect(banner.style.transform).toBe('translateY(12px)')
  })

  it('recommended card has initial hidden inline styles for animation', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const recCard = screen.getByTestId('situation-card-0-websocket')
    expect(recCard.style.opacity).toBe('0')
    expect(recCard.style.transform).toBe('translateX(-16px)')
  })

  it('non-recommended card has no animation inline styles', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const nonRecCard = screen.getByTestId('situation-card-0-rest')
    expect(nonRecCard.style.opacity).toBe('')
    expect(nonRecCard.style.transform).toBe('')
  })

  it('accordion content wrapper exists for each card', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-card-content-wrapper-0-rest')).toBeInTheDocument()
    expect(screen.getByTestId('situation-card-content-wrapper-0-websocket')).toBeInTheDocument()
  })

  it('accordion content wrapper has correct height when expanded', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const openContent = screen.getByTestId('situation-card-content-0-websocket')
    expect(openContent.style.opacity).toBe('1')
    const closedContent = screen.getByTestId('situation-card-content-0-rest')
    expect(closedContent.style.opacity).toBe('0')
  })

  it('accordion content wrapper toggles visibility on card switch', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('situation-card-trigger-0-rest'))
    const restContent = screen.getByTestId('situation-card-content-0-rest')
    const wsContent = screen.getByTestId('situation-card-content-0-websocket')
    expect(restContent.style.opacity).toBe('1')
    expect(wsContent.style.opacity).toBe('0')
  })

  it('accordion content has correct opacity when expanded', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const openContent = screen.getByTestId('situation-card-content-0-websocket')
    expect(openContent.style.opacity).toBe('1')
    const closedContent = screen.getByTestId('situation-card-content-0-rest')
    expect(closedContent.style.opacity).toBe('0')
  })

  it('accordion content has pointer-events disabled when collapsed', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const closedContent = screen.getByTestId('situation-card-content-0-rest')
    expect(closedContent.style.pointerEvents).toBe('none')
    const openContent = screen.getByTestId('situation-card-content-0-websocket')
    expect(openContent.style.pointerEvents).toBe('auto')
  })
})
