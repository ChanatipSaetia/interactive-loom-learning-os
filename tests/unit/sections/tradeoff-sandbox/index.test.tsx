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
    recommended: 'ssr',
    choices: [
      {
        id: 'spa',
        label: 'SPA',
        description: 'Single page application.',
        metrics: { performance: 10, cost: 5 },
        pros: [{ title: 'Fast navigation', description: 'Smooth client transitions' }],
        cons: [{ title: 'SEO issues', description: 'Requires SSR for search indexing' }],
        whenToUse: 'Internal tools where SEO does not matter.',
      },
      {
        id: 'ssr',
        label: 'SSR',
        description: 'Server-side rendered.',
        metrics: { performance: 15, cost: -5 },
        pros: [{ title: 'Better SEO', description: 'Server-rendered HTML' }],
        cons: [{ title: 'Server cost', description: 'Needs Node.js runtime' }],
        whyThisFits: 'Enterprise apps benefit from SSR for SEO and faster first paint.',
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

// Helper to select a choice via dropdown
function selectChoice(scenarioIdx: number, stepIdx: number, choiceId: string) {
  fireEvent.click(screen.getByTestId(`step-dropdown-trigger-${scenarioIdx}-${stepIdx}`))
  fireEvent.click(screen.getByTestId(`dropdown-option-${scenarioIdx}-${stepIdx}-${choiceId}`))
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
    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('metric-bars')).toBeInTheDocument()
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

  it('renders floating dropdown trigger', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('step-dropdown-trigger-0-0')).toBeInTheDocument()
  })

  it('renders drop zone with placeholder', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('drop-zone-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('drop-zone-placeholder-0-0')).toHaveTextContent('Select a choice from the dropdown')
  })

  // ─── Floating Dropdown ────────────────────────────────

  it('clicking dropdown trigger opens menu', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.queryByTestId('step-dropdown-menu-0-0')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('step-dropdown-trigger-0-0'))
    expect(screen.getByTestId('step-dropdown-menu-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('dropdown-option-0-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('dropdown-option-0-0-ssr')).toBeInTheDocument()
  })

  it('selecting dropdown option fills drop zone', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
    expect(screen.getByTestId('drop-zone-label-0-0')).toHaveTextContent('SPA')
  })

  it('dropdown menu closes after selection', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('step-dropdown-trigger-0-0'))
    expect(screen.getByTestId('step-dropdown-menu-0-0')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dropdown-option-0-0-spa'))
    expect(screen.queryByTestId('step-dropdown-menu-0-0')).not.toBeInTheDocument()
  })

  it('selecting different option replaces previous selection', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('drop-zone-content-0-0')).toHaveTextContent('SPA')
    selectChoice(0, 0, 'ssr')
    expect(screen.getByTestId('drop-zone-content-0-0')).toHaveTextContent('SSR')
  })

  it('drop zone shows remove button when filled', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('drop-zone-remove-0-0')).toBeInTheDocument()
  })

  it('clicking remove button clears drop zone', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('drop-zone-remove-0-0'))
    expect(screen.queryByTestId('drop-zone-content-0-0')).not.toBeInTheDocument()
  })

  // ─── Drop Zone State ──────────────────────────────────

  it('drop zone has filled class when choice placed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('drop-zone-0-0')).not.toHaveClass('drop-zone-filled')
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('drop-zone-0-0')).toHaveClass('drop-zone-filled')
  })

  // ─── Recommended Badge ────────────────────────────────

  it('recommended option shows badge in dropdown', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('step-dropdown-trigger-0-0'))
    expect(screen.getByTestId('recommended-badge-0-0-ssr')).toBeInTheDocument()
    expect(screen.getByTestId('recommended-badge-0-0-ssr')).toHaveTextContent('Recommended')
  })

  it('non-recommended option does not show badge', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('step-dropdown-trigger-0-0'))
    expect(screen.queryByTestId('recommended-badge-0-0-spa')).not.toBeInTheDocument()
  })

  it('recommended choice shows badge in drop zone', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'ssr')
    expect(screen.getByTestId('drop-zone-recommended-badge-0-0')).toBeInTheDocument()
  })

  it('non-recommended choice does not show badge in drop zone', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.queryByTestId('drop-zone-recommended-badge-0-0')).not.toBeInTheDocument()
  })

  // ─── Info Icon & Details Modal ────────────────────────

  it('placed step cards render info icon', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('drop-zone-info-0-0')).toBeInTheDocument()
  })

  it('clicking info icon opens details modal', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('details-overlay')).toBeInTheDocument()
  })

  it('details modal shows choice label and description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-choice-label')).toHaveTextContent('SPA')
    expect(screen.getByTestId('details-description')).toHaveTextContent('Single page application.')
  })

  it('details modal shows recommended badge for recommended choice', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'ssr')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-recommended-badge')).toBeInTheDocument()
    expect(screen.getByTestId('details-recommendation-box')).toBeInTheDocument()
  })

  it('details modal shows alternative box for non-recommended choice', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-alternative-box')).toBeInTheDocument()
    expect(screen.getByTestId('details-alt-text')).toHaveTextContent('Internal tools where SEO does not matter.')
  })

  it('details modal shows detailed pros with title and description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-pros')).toBeInTheDocument()
    const pro = screen.getByTestId('details-pro-0')
    expect(pro).toHaveTextContent('Fast navigation')
    expect(pro).toHaveTextContent('Smooth client transitions')
  })

  it('details modal shows detailed cons with title and description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-cons')).toBeInTheDocument()
    const con = screen.getByTestId('details-con-0')
    expect(con).toHaveTextContent('SEO issues')
    expect(con).toHaveTextContent('Requires SSR for search indexing')
  })

  it('details modal dismissible with close button', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('drop-zone-info-0-0'))
    expect(screen.getByTestId('details-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('details-dialog-close'))
    expect(screen.queryByTestId('details-dialog')).not.toBeInTheDocument()
  })

  // ─── Metric Updates ───────────────────────────────────

  it('metrics update when choice is selected', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('50')
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
  })

  it('metrics update when choice changes', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    selectChoice(0, 0, 'ssr')
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('65')
  })

  it('metrics reset when choice is removed', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    fireEvent.click(screen.getByTestId('drop-zone-remove-0-0'))
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('50')
  })

  // ─── Progress Updates ─────────────────────────────────

  it('progress indicator updates when choice selected', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('0 / 1')
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('progress-indicator')).toHaveTextContent('1 / 1')
  })

  // ─── Keyboard Accessibility ───────────────────────────

  it('dropdown trigger is focusable', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    const trigger = screen.getByTestId('step-dropdown-trigger-0-0')
    expect(trigger).toHaveAttribute('type', 'button')
  })

  it('Enter key opens dropdown', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('step-dropdown-trigger-0-0'))
    expect(screen.getByTestId('step-dropdown-menu-0-0')).toBeInTheDocument()
  })

  it('Enter key selects dropdown option', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('step-dropdown-trigger-0-0'))
    fireEvent.click(screen.getByTestId('dropdown-option-0-0-spa'))
    expect(screen.getByTestId('drop-zone-content-0-0')).toBeInTheDocument()
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

  it('modal shows pros with title and description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-pros-0-spa')).toBeInTheDocument()
    const pro = screen.getByTestId('compare-pro-0-spa-0')
    expect(pro).toHaveTextContent('Fast navigation')
    expect(pro).toHaveTextContent('Smooth client transitions')
  })

  it('modal shows cons with title and description', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-cons-0-spa')).toBeInTheDocument()
    const con = screen.getByTestId('compare-con-0-spa-0')
    expect(con).toHaveTextContent('SEO issues')
    expect(con).toHaveTextContent('Requires SSR for search indexing')
  })

  it('modal shows recommended badge for recommended choice', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-recommended-badge-0-ssr')).toBeInTheDocument()
    expect(screen.getByTestId('compare-recommended-badge-0-ssr')).toHaveTextContent('Recommended')
  })

  it('chosen choice has Selected badge in modal', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    fireEvent.click(screen.getByTestId('compare-all-button'))
    expect(screen.getByTestId('compare-badge-0-spa')).toBeInTheDocument()
    expect(screen.getByTestId('compare-badge-0-spa')).toHaveTextContent('Selected')
    expect(screen.queryByTestId('compare-badge-0-ssr')).not.toBeInTheDocument()
  })

  it('chosen choice card has chosen class in modal', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
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
    selectChoice(0, 0, 'spa')
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
    selectChoice(0, 0, 'spa')
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
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('metric-value-performance')).toHaveTextContent('60')
    selectChoice(0, 1, 'monolith')
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
    selectChoice(0, 0, 'spa')
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
    selectChoice(0, 0, 'neg')
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
    selectChoice(0, 0, 'reduce')
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
    selectChoice(0, 0, 'increase')
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
    selectChoice(0, 0, 'faster')
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
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('1 of 2 decisions made')
    const banner = screen.getByTestId('feedback-banner')
    expect(banner.classList.contains('feedback-banner-partial')).toBe(true)
  })

  it('feedback shows complete state when all choices made', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
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
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('1 of 2 decisions made')
    selectChoice(0, 1, 'mono')
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('All decisions made')
  })

  it('feedback updates from complete to partial on remove', () => {
    render(<TradeoffSandboxSection {...defaultProps} />)
    selectChoice(0, 0, 'spa')
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('All decisions made')
    fireEvent.click(screen.getByTestId('drop-zone-remove-0-0'))
    expect(screen.getByTestId('feedback-text')).toHaveTextContent('Make your first choice')
  })
})
