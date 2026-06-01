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
    expect(screen.getByTestId('situation-card-content-0-websocket')).toBeInTheDocument()
    expect(screen.queryByTestId('situation-card-content-0-rest')).not.toBeInTheDocument()
  })

  it('clicking a closed card opens it and closes the other (accordion)', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    const restTrigger = screen.getByTestId('situation-card-trigger-0-rest')
    fireEvent.click(restTrigger)
    expect(screen.getByTestId('situation-card-content-0-rest')).toBeInTheDocument()
    expect(screen.queryByTestId('situation-card-content-0-websocket')).not.toBeInTheDocument()
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
    expect(screen.getByTestId('situation-choice-item-1')).toBeInTheDocument()
  })

  it('renders accordion container with data-testid', () => {
    render(<SituationChoiceSection {...defaultProps} />)
    expect(screen.getByTestId('situation-accordion-0')).toBeInTheDocument()
  })
})
