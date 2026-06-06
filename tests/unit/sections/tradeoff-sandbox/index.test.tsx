import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionRegistry } from '../../../../src/core/registry'
import TradeoffSandboxSection, {
  type TradeoffScenario,
  type TradeoffStep,
  type MetricDef,
  type TradeoffSandboxSectionProps,
} from '../../../../src/sections/tradeoff-sandbox'

const mockMetrics: MetricDef[] = [
  { id: 'performance', label: 'Performance', baseValue: 50, min: 0, max: 100 },
  { id: 'cost', label: 'Cost', baseValue: 60, min: 0, max: 100 },
]

const mockSteps: TradeoffStep[] = [
  {
    id: 'step-frontend',
    title: 'Frontend Choice',
    description: 'Choose the frontend approach.',
    choices: [
      {
        id: 'spa',
        label: 'SPA',
        description: 'Single page application.',
        metrics: { performance: 10, cost: 5 },
        pros: [{ title: 'Fast navigation', description: '' }],
        cons: [{ title: 'SEO issues', description: '' }],
      },
      {
        id: 'ssr',
        label: 'SSR',
        description: 'Server-side rendered.',
        metrics: { performance: 15, cost: -5 },
        pros: [{ title: 'Better SEO', description: '' }],
        cons: [{ title: 'Server cost', description: '' }],
      },
    ],
  },
]

const mockScenarios: TradeoffScenario[] = [
  {
    id: 'scenario-1',
    title: 'Enterprise App',
    description: 'Build an enterprise web application.',
    metrics: mockMetrics,
    steps: mockSteps,
  },
]

const defaultProps: TradeoffSandboxSectionProps = {
  title: 'Trade-off Sandbox',
  scenarios: mockScenarios,
}

describe('TradeoffSandbox Section', () => {
  beforeEach(() => {
    SectionRegistry.clear()
  })

  // ─── Rendering ────────────────────────────────────────

  it('renders the section container', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('tradeoff-sandbox')).toBeInTheDocument()
  })

  it('renders the section title when provided', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('tradeoff-sandbox-title')).toBeInTheDocument()
    expect(screen.getByText('Trade-off Sandbox')).toBeInTheDocument()
  })

  it('renders scenario banner with description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('scenario-banner')).toBeInTheDocument()
    expect(screen.getByText('Build an enterprise web application.')).toBeInTheDocument()
  })

  // ─── Metric Dashboard ─────────────────────────────────

  it('renders metric dashboard', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-dashboard')).toBeInTheDocument()
    expect(screen.getByText('Metric Dashboard')).toBeInTheDocument()
  })

  it('renders all metric bars', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-bar-performance')).toBeInTheDocument()
    expect(screen.getByTestId('metric-bar-cost')).toBeInTheDocument()
  })

  it('shows base metric values', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('50')
    expect(screen.getByTestId('metric-value-cost')).toHaveTextContent('60')
  })

  it('shows metric labels', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-label-performance')).toHaveTextContent('Performance')
    expect(screen.getByTestId('metric-label-cost')).toHaveTextContent('Cost')
  })

  it('renders metric tracks and fills', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-track-performance')).toBeInTheDocument()
    expect(screen.getByTestId('metric-fill-performance')).toBeInTheDocument()
  })

  // ─── Progress Indicator ───────────────────────────────

  it('shows progress indicator with 0 placed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('0 / 1')
  })

  // ─── Steps Panel ──────────────────────────────────────

  it('renders steps panel', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('steps-panel')).toBeInTheDocument()
  })

  it('renders step sections', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('step-section-0-0')).toBeInTheDocument()
  })

  it('renders step title and description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('step-title-0-0')).toHaveTextContent('Frontend Choice')
    expect(screen.getByTestId('step-description-0-0')).toHaveTextContent('Choose the frontend approach.')
  })

  it('renders choice cards in tray', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('choice-card-0-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('choice-card-0-0-ssr')).toBeInTheDocument()
  })

  it('renders choice card labels', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('choice-card-label-0-0-spa')).toHaveTextContent('SPA')
    expect(screen.getByTestId('choice-card-label-0-0-ssr')).toHaveTextContent('SSR')
  })

  it('renders drop zone with placeholder', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('drop-zone-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('drop-zone-placeholder-0-0')).toHaveTextContent('Drag or click a choice here')
  })

  // ─── Click-to-Drop (Accessibility) ────────────────────

  it('clicking a choice card selects it in drop zone', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('drop-zone-content-0-0')).toHaveTextContent('SPA')
  })

  it('selected choice card shows placed badge', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('choice-placed-badge-0-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('choice-placed-badge-0-0-spa')).toHaveTextContent('Placed')
  })

  it('selected choice card has placed class', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    const card = screen.getByTestId('choice-card-0-0-spa')
    expect(card.classList.contains('choice-card-placed')).toBe(true)
  })

  it('placed card is disabled and not clickable', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
    const placedCard = screen.getByTestId('choice-card-0-0-spa')
    expect(placedCard).toHaveAttribute('aria-disabled', 'true')
  })

  it('selecting different choice replaces previous selection', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('drop-zone-content-0-0')).toHaveTextContent('SPA')
    fireEvent.click(screen.getByTestId('choice-card-0-0-ssr'))
    expect(screen.getByTestId('drop-zone-content-0-0')).toHaveTextContent('SSR')
  })

  it('drop zone shows remove button when filled', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('drop-zone-remove-0-0')).toBeInTheDocument()
  })

  it('clicking remove button clears drop zone', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('drop-zone-remove-0-0'))
    expect(screen.queryByTestId('drop-zone-content-0-0')).not.toBeInTheDocument()
  })

  // ─── Drop Zone State ──────────────────────────────────

  it('drop zone has filled class when choice placed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('drop-zone-0-0')).not.toHaveClass('drop-zone-filled')
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('drop-zone-0-0')).toHaveClass('drop-zone-filled')
  })

  // ─── Metric Updates ───────────────────────────────────

  it('metrics update when choice is placed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('50')
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
  })

  it('metrics update when choice changes', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    fireEvent.click(screen.getByTestId('choice-card-0-0-ssr'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('65')
  })

  it('metrics reset when choice is removed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    fireEvent.click(screen.getByTestId('drop-zone-remove-0-0'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('50')
  })

  // ─── Progress Updates ─────────────────────────────────

  it('progress indicator updates when choice placed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('0 / 1')
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('1 / 1')
  })

  // ─── Keyboard Accessibility ───────────────────────────

  it('choice card is focusable', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const card = screen.getByTestId('choice-card-0-0-spa')
    expect(card).toHaveAttribute('tabIndex', '0')
  })

  it('choice card has role button', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const card = screen.getByTestId('choice-card-0-0-spa')
    expect(card).toHaveAttribute('role', 'button')
  })

  it('Enter key selects choice', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const card = screen.getByTestId('choice-card-0-0-spa')
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
  })

  it('Space key selects choice', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const card = screen.getByTestId('choice-card-0-0-spa')
    fireEvent.keyDown(card, { key: ' ', code: 'Space' })
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
  })

  it('placed card is not keyboard focusable', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    const card = screen.getByTestId('choice-card-0-0-spa')
    expect(card).toHaveAttribute('tabIndex', '-1')
    expect(card).toHaveAttribute('aria-disabled', 'true')
  })

  // ─── HTML5 Drag and Drop ──────────────────────────────

  it('choice card is draggable', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const card = screen.getByTestId('choice-card-0-0-spa')
    expect(card).toHaveAttribute('draggable', 'true')
  })

  it('dragging choice to drop zone selects it', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const card = screen.getByTestId('choice-card-0-0-spa')
    const dropZone = screen.getByTestId('drop-zone-0-0')
    fireEvent.dragStart(card)
    fireEvent.dragOver(dropZone)
    const dataTransfer = { getData: () => 'spa', effectAllowed: 'move', dropEffect: 'move', types: ['text/plain'] } as unknown as DataTransfer
    fireEvent.drop(dropZone, { dataTransfer })
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('drop-zone-content-0-0')).toHaveTextContent('SPA')
  })

  // ─── Compare All Modal ────────────────────────────────

  it('renders Compare All button', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('compare-all-button')).toBeInTheDocument()
    expect(screen.getByText('Compare All')).toBeInTheDocument()
  })

  it('clicking Compare All opens modal', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('compare-overlay')).toBeInTheDocument()
  })

  it('modal shows step sections', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-step-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-step-title-0')).toHaveTextContent('Frontend Choice')
  })

  it('modal shows 2-column grid with all choices', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-grid-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-card-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('compare-card-0-ssr')).toBeInTheDocument()
  })

  it('modal shows choice labels', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-card-label-0-spa')).toHaveTextContent('SPA')
    expect(screen.getByTestId('compare-card-label-0-ssr')).toHaveTextContent('SSR')
  })

  it('modal shows pros with Check icon', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-pros-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('compare-pro-0-spa-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-pro-0-spa-0')).toHaveTextContent('Fast navigation')
  })

  it('modal shows cons with X icon', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-cons-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('compare-con-0-spa-0')).toBeInTheDocument()
    expect(screen.getByTestId('compare-con-0-spa-0')).toHaveTextContent('SEO issues')
  })

  it('chosen choice has Selected badge in modal', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-badge-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('compare-badge-0-spa')).toHaveTextContent('Selected')
    expect(screen.queryByTestId('compare-badge-0-ssr')).not.toBeInTheDocument()
  })

  it('chosen choice card has chosen class in modal', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    fireEvent.click(screen.getByTestId('compare-all-button'))
    const chosenCard = screen.getByTestId('compare-card-0-spa')
    expect(chosenCard.classList.contains('compare-card-chosen')).toBe(true)
    const otherCard = screen.getByTestId('compare-card-0-ssr')
    expect(otherCard.classList.contains('compare-card-chosen')).toBe(false)
  })

  it('modal dismissible with close button', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('compare-dialog-close'))
    expect(screen.queryByTestId('compare-dialog')).not.toBeInTheDocument()
  })

  it('modal dismissible with Escape key', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-dialog')).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByTestId('compare-dialog')).not.toBeInTheDocument()
  })

  it('modal dismissible by clicking overlay', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('compare-overlay'))
    expect(screen.queryByTestId('compare-dialog')).not.toBeInTheDocument()
  })

  // ─── Scenario Selector ────────────────────────────────

  it('single scenario does not show dropdown', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.queryByTestId('scenario-dropdown')).not.toBeInTheDocument()
  })

  it('multiple scenarios show dropdown', () => {
    const multiScenarios: TradeoffScenario[] = [
      ...mockScenarios,
      {
        id: 'scenario-2',
        title: 'Chat System',
        description: 'Build a real-time chat system.',
        metrics: mockMetrics,
        steps: mockSteps,
      },
    ]
    render(<TradeoffSandboxSection scenarios={multiScenarios} />)
    expect(screen.getByTestId('scenario-dropdown')).toBeInTheDocument()
    expect(screen.getByTestId('scenario-select')).toBeInTheDocument()
  })

  it('dropdown shows first scenario title by default', () => {
    const multiScenarios: TradeoffScenario[] = [
      ...mockScenarios,
      {
        id: 'scenario-2',
        title: 'Chat System',
        description: 'Build a real-time chat system.',
        metrics: mockMetrics,
        steps: mockSteps,
      },
    ]
    render(<TradeoffSandboxSection scenarios={multiScenarios} />)
    expect(screen.getByTestId('scenario-select')).toHaveTextContent('Enterprise App')
  })

  it('clicking dropdown opens options', () => {
    const multiScenarios: TradeoffScenario[] = [
      ...mockScenarios,
      {
        id: 'scenario-2',
        title: 'Chat System',
        description: 'Build a real-time chat system.',
        metrics: mockMetrics,
        steps: mockSteps,
      },
    ]
    render(<TradeoffSandboxSection scenarios={multiScenarios} />)
    fireEvent.click(screen.getByTestId('scenario-select'))
    expect(screen.getByRole('option', { name: 'Enterprise App' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Chat System' })).toBeInTheDocument()
  })

  it('selecting scenario updates banner', () => {
    const multiScenarios: TradeoffScenario[] = [
      ...mockScenarios,
      {
        id: 'scenario-2',
        title: 'Chat System',
        description: 'Build a real-time chat system.',
        metrics: mockMetrics,
        steps: mockSteps,
      },
    ]
    render(<TradeoffSandboxSection scenarios={multiScenarios} />)
    expect(screen.getByText('Build an enterprise web application.')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('scenario-select'))
    fireEvent.click(screen.getByRole('option', { name: 'Chat System' }))
    expect(screen.getByText('Build a real-time chat system.')).toBeInTheDocument()
  })

  it('selecting scenario resets choices and metrics', () => {
    const multiScenarios: TradeoffScenario[] = [
      ...mockScenarios,
      {
        id: 'scenario-2',
        title: 'Chat System',
        description: 'Build a real-time chat system.',
        metrics: mockMetrics,
        steps: mockSteps,
      },
    ]
    render(<TradeoffSandboxSection scenarios={multiScenarios} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    fireEvent.click(screen.getByTestId('scenario-select'))
    fireEvent.click(screen.getByRole('option', { name: 'Chat System' }))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('50')
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('0 / 1')
  })

  it('selecting option closes dropdown', () => {
    const multiScenarios: TradeoffScenario[] = [
      ...mockScenarios,
      {
        id: 'scenario-2',
        title: 'Chat System',
        description: 'Build a real-time chat system.',
        metrics: mockMetrics,
        steps: mockSteps,
      },
    ]
    render(<TradeoffSandboxSection scenarios={multiScenarios} />)
    fireEvent.click(screen.getByTestId('scenario-select'))
    expect(screen.getByRole('option', { name: 'Enterprise App' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Chat System' }))
    expect(screen.queryByRole('option', { name: 'Enterprise App' })).not.toBeInTheDocument()
  })

  // ─── Multiple Steps ───────────────────────────────────

  it('renders multiple step sections', () => {
    const multiSteps: TradeoffStep[] = [
      ...mockSteps,
      {
        id: 'step-backend',
        title: 'Backend Choice',
        description: 'Choose the backend approach.',
        choices: [
          {
            id: 'monolith',
            label: 'Monolith',
            description: 'Single service.',
            metrics: { performance: -5, cost: 10 },
            pros: [{ title: 'Simple', description: '' }],
            cons: [{ title: 'Hard to scale', description: '' }],
          },
        ],
      },
    ]
    const scenario: TradeoffScenario = {
      ...mockScenarios[0],
      steps: multiSteps,
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    expect(screen.getByTestId('step-section-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('step-section-0-1')).toBeInTheDocument()
    expect(screen.getByTestId('step-title-0-1')).toHaveTextContent('Backend Choice')
  })

  it('progress shows multiple steps total', () => {
    const multiSteps: TradeoffStep[] = [
      ...mockSteps,
      {
        id: 'step-backend',
        title: 'Backend Choice',
        description: 'Choose the backend approach.',
        choices: [
          {
            id: 'monolith',
            label: 'Monolith',
            description: 'Single service.',
            metrics: { performance: -5, cost: 10 },
            pros: [{ title: 'Simple', description: '' }],
            cons: [{ title: 'Hard to scale', description: '' }],
          },
        ],
      },
    ]
    const scenario: TradeoffScenario = {
      ...mockScenarios[0],
      steps: multiSteps,
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('0 / 2')
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('1 / 2')
  })

  it('metrics accumulate across multiple steps', () => {
    const multiSteps: TradeoffStep[] = [
      ...mockSteps,
      {
        id: 'step-backend',
        title: 'Backend Choice',
        description: 'Choose the backend approach.',
        choices: [
          {
            id: 'monolith',
            label: 'Monolith',
            description: 'Single service.',
            metrics: { performance: -5, cost: 10 },
            pros: [{ title: 'Simple', description: '' }],
            cons: [{ title: 'Hard to scale', description: '' }],
          },
        ],
      },
    ]
    const scenario: TradeoffScenario = {
      ...mockScenarios[0],
      steps: multiSteps,
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    fireEvent.click(screen.getByTestId('choice-card-0-1-monolith'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('55')
  })

  // ─── Registry ─────────────────────────────────────────

  it('registers with SectionRegistry', async () => {
    vi.resetModules()
    await import('../../../../src/sections/tradeoff-sandbox')
    const { SectionRegistry: Registry } = await import('../../../../src/core/registry')
    expect(Registry.get('tradeoff-sandbox')).toBeDefined()
  })

  // ─── Metric Bar Color Coding ──────────────────────────

  it('metric fill is neutral blue at base value', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const fill = screen.getByTestId('metric-fill-performance')
    const bg = fill.style.backgroundColor
    expect(bg).toBe('var(--ctp-blue)')
  })

  it('metric fill turns green when value improves for higher direction', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    const fill = screen.getByTestId('metric-fill-performance')
    const bg = fill.style.backgroundColor
    expect(bg).toBe('var(--ctp-green)')
  })

  it('metric fill turns red when value worsens for higher direction', () => {
    const stepsWithNegative: TradeoffStep[] = [
      {
        id: 'step-1',
        title: 'Step',
        description: 'Choose.',
        choices: [
          {
            id: 'neg',
            label: 'Negative',
            description: 'Reduces performance.',
            metrics: { performance: -20, cost: 10 },
            pros: [{ title: 'Cheap', description: '' }],
            cons: [{ title: 'Slow', description: '' }],
          },
        ],
      },
    ]
    const scenario: TradeoffScenario = {
      id: 'test',
      title: 'Test',
      description: 'Test scenario.',
      metrics: [
        { id: 'performance', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' },
      ],
      steps: stepsWithNegative,
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-neg'))
    const fill = screen.getByTestId('metric-fill-performance')
    const bg = fill.style.backgroundColor
    expect(bg).toBe('var(--ctp-red)')
  })

  it('metric fill turns green when value decreases for lower direction', () => {
    const scenario: TradeoffScenario = {
      id: 'test',
      title: 'Test',
      description: 'Test scenario.',
      metrics: [
        { id: 'complexity', label: 'Complexity', baseValue: 50, min: 0, max: 100, direction: 'lower' },
      ],
      steps: [
        {
          id: 'step-1',
          title: 'Step',
          description: 'Choose.',
          choices: [
            {
              id: 'reduce',
              label: 'Reduce',
              description: 'Reduces complexity.',
              metrics: { complexity: -15 },
              pros: [{ title: 'Simpler', description: '' }],
              cons: [{ title: 'Less feature-rich', description: '' }],
            },
          ],
        },
      ],
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-reduce'))
    const fill = screen.getByTestId('metric-fill-complexity')
    const bg = fill.style.backgroundColor
    expect(bg).toBe('var(--ctp-green)')
  })

  it('metric fill turns red when value increases for lower direction', () => {
    const scenario: TradeoffScenario = {
      id: 'test',
      title: 'Test',
      description: 'Test scenario.',
      metrics: [
        { id: 'complexity', label: 'Complexity', baseValue: 50, min: 0, max: 100, direction: 'lower' },
      ],
      steps: [
        {
          id: 'step-1',
          title: 'Step',
          description: 'Choose.',
          choices: [
            {
              id: 'increase',
              label: 'Increase',
              description: 'Increases complexity.',
              metrics: { complexity: 20 },
              pros: [{ title: 'More features', description: '' }],
              cons: [{ title: 'Harder to maintain', description: '' }],
            },
          ],
        },
      ],
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-increase'))
    const fill = screen.getByTestId('metric-fill-complexity')
    const bg = fill.style.backgroundColor
    expect(bg).toBe('var(--ctp-red)')
  })

  it('metric without direction defaults to higher', () => {
    const scenario: TradeoffScenario = {
      id: 'test',
      title: 'Test',
      description: 'Test scenario.',
      metrics: [
        { id: 'speed', label: 'Speed', baseValue: 50, min: 0, max: 100 },
      ],
      steps: [
        {
          id: 'step-1',
          title: 'Step',
          description: 'Choose.',
          choices: [
            {
              id: 'faster',
              label: 'Faster',
              description: 'Increases speed.',
              metrics: { speed: 15 },
              pros: [{ title: 'Faster', description: '' }],
              cons: [],
            },
          ],
        },
      ],
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-faster'))
    const fill = screen.getByTestId('metric-fill-speed')
    const bg = fill.style.backgroundColor
    expect(bg).toBe('var(--ctp-green)')
  })

  // ─── Feedback Banner ──────────────────────────────────

  it('feedback banner renders', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('feedback-banner')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-text')).toBeInTheDocument()
  })

  it('feedback shows empty state with no choices', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('Make your first choice')
    const banner = screen.getByTestId('feedback-banner')
    expect(banner.classList.contains('feedback-banner-empty')).toBe(true)
  })

  it('feedback shows partial state when some choices made', () => {
    const multiSteps: TradeoffStep[] = [
      ...mockSteps,
      {
        id: 'step-backend',
        title: 'Backend',
        description: 'Choose backend.',
        choices: [
          {
            id: 'mono',
            label: 'Monolith',
            description: 'One service.',
            metrics: { performance: 5, cost: 10 },
            pros: [{ title: 'Simple', description: '' }],
            cons: [],
          },
        ],
      },
    ]
    const scenario: TradeoffScenario = {
      ...mockScenarios[0],
      steps: multiSteps,
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('1 of 2 decisions made')
    const banner = screen.getByTestId('feedback-banner')
    expect(banner.classList.contains('feedback-banner-partial')).toBe(true)
  })

  it('feedback shows complete state when all choices made', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('All decisions made')
    const banner = screen.getByTestId('feedback-banner')
    expect(banner.classList.contains('feedback-banner-complete')).toBe(true)
  })

  it('feedback updates from partial to complete', () => {
    const multiSteps: TradeoffStep[] = [
      ...mockSteps,
      {
        id: 'step-backend',
        title: 'Backend',
        description: 'Choose backend.',
        choices: [
          {
            id: 'mono',
            label: 'Monolith',
            description: 'One service.',
            metrics: { performance: 5, cost: 10 },
            pros: [{ title: 'Simple', description: '' }],
            cons: [],
          },
        ],
      },
    ]
    const scenario: TradeoffScenario = {
      ...mockScenarios[0],
      steps: multiSteps,
    }
    render(<TradeoffSandboxSection scenarios={[scenario]} />)
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('Make your first choice')
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('1 of 2 decisions made')
    fireEvent.click(screen.getByTestId('choice-card-0-1-mono'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('All decisions made')
  })

  it('feedback updates from complete to partial on remove', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('choice-card-0-0-spa'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('All decisions made')
    fireEvent.click(screen.getByTestId('drop-zone-remove-0-0'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('Make your first choice')
  })
})
