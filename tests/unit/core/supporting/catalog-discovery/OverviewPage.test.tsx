import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, vi, beforeEach, afterEach, test } from 'vitest'
import * as routesModule from '../../../../../src/core/learning-engine/composition/routes'
import { OverviewPage } from '../../../../../src/core/supporting/catalog-discovery'
import type { TopicRoute } from '../../../../../src/core/learning-engine/composition/routes'

const mockTopics: TopicRoute[] = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket', category: 'Architecture', description: 'Compare REST API and WebSocket communication patterns' },
  { id: 'grpc', label: 'gRPC Basics', path: '/demo/grpc-basics', category: 'Networking', description: 'Learn gRPC protocol fundamentals' },
  { id: 'events', label: 'Event-Driven Architecture', path: '/demo/events', category: 'Architecture', description: 'Understanding event-driven systems' },
]

function renderOverview(topics: TopicRoute[] = mockTopics) {
  vi.spyOn(routesModule, 'useTopics').mockReturnValue({
    topics,
    loading: false,
    error: null,
  })

  return render(
    <MemoryRouter>
      <OverviewPage />
    </MemoryRouter>,
  )
}

describe('OverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('renders page title', () => {
    renderOverview()
    expect(screen.getByText('Interactive Learning Platform')).toBeInTheDocument()
  })

  test('renders all topics in table', () => {
    renderOverview()
    expect(screen.getByText('REST API vs WebSocket')).toBeInTheDocument()
    expect(screen.getByText('gRPC Basics')).toBeInTheDocument()
    expect(screen.getByText('Event-Driven Architecture')).toBeInTheDocument()
  })

  test('renders search input', () => {
    renderOverview()
    expect(screen.getByTestId('overview-search')).toBeInTheDocument()
  })

  test('search filters topics by label', () => {
    renderOverview()
    const searchInput = screen.getByTestId('overview-search') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'grpc' } })
    expect(screen.queryByText('REST API vs WebSocket')).not.toBeInTheDocument()
    expect(screen.getByText('gRPC Basics')).toBeInTheDocument()
  })

  test('search filters topics by description', () => {
    renderOverview()
    const searchInput = screen.getByTestId('overview-search') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'event-driven' } })
    expect(screen.queryByText('gRPC Basics')).not.toBeInTheDocument()
    expect(screen.getByText('Event-Driven Architecture')).toBeInTheDocument()
  })

  test('topic links navigate to correct path', () => {
    renderOverview()
    const link = screen.getByTestId('topic-link-demo')
    expect(link).toHaveAttribute('href', '/demo/rest-vs-websocket')
  })

  test('sort by label ascending', () => {
    renderOverview()
    const sortSelect = screen.getByTestId('sort-dropdown')
    fireEvent.change(sortSelect, { target: { value: 'label-asc' } })
    expect(screen.getByText('Event-Driven Architecture')).toBeInTheDocument()
  });

  test('renders pagination controls in grid view', () => {
    renderOverview()
    const gridToggleBtn = screen.getByLabelText('Switch to All Topics Grid View')
    fireEvent.click(gridToggleBtn)
    expect(screen.getByTestId('overview-pagination')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-prev')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-next')).toBeInTheDocument()
  })

  test('rows per page select renders in grid view', () => {
    renderOverview()
    const gridToggleBtn = screen.getByLabelText('Switch to All Topics Grid View')
    fireEvent.click(gridToggleBtn)
    expect(screen.getByTestId('rows-per-page')).toBeInTheDocument()
  })

  test('renders category badges', () => {
    renderOverview()
    expect(screen.getAllByText('Architecture').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Networking').length).toBeGreaterThanOrEqual(1)
  })

  test('renders category shelf headers in shelves view', () => {
    renderOverview()
    expect(screen.getByRole('heading', { name: 'Architecture' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Networking' })).toBeInTheDocument()
  })

  test('toggles between shelves and grid views', () => {
    renderOverview()
    const gridToggleBtn = screen.getByLabelText('Switch to All Topics Grid View')
    const shelvesToggleBtn = screen.getByLabelText('Switch to Category Shelves View')

    fireEvent.click(gridToggleBtn)
    expect(screen.getByTestId('overview-pagination')).toBeInTheDocument()

    fireEvent.click(shelvesToggleBtn)
    expect(screen.queryByTestId('overview-pagination')).not.toBeInTheDocument()
  })

  test('filters topics when clicking category selection card', () => {
    renderOverview()
    const networkingCard = screen.getByTestId('category-card-Networking')
    fireEvent.click(networkingCard)
    expect(screen.queryByText('REST API vs WebSocket')).not.toBeInTheDocument()
    expect(screen.getByText('gRPC Basics')).toBeInTheDocument()
  })

  test('empty state when no topics match search', () => {
    renderOverview()
    const searchInput = screen.getByTestId('overview-search') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })
    expect(screen.getByText('No topics found.')).toBeInTheDocument()
  })

  test('has sort dropdown with correct options', () => {
    renderOverview()
    const sortSelect = screen.getByTestId('sort-dropdown') as HTMLSelectElement
    expect(sortSelect).toBeInTheDocument()
    const values = Array.from(sortSelect.options).map((opt) => opt.value)
    expect(values).toContain('updated-desc')
    expect(values).toContain('label-asc')
    expect(values).toContain('label-desc')
  })
})

