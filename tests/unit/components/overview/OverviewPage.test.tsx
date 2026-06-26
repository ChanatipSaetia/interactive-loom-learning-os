import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OverviewPage } from '../../../../src/components/overview/OverviewPage'
import type { TopicRoute } from '../../../../src/core/routes'

const mockTopics: TopicRoute[] = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket', category: 'Architecture', description: 'Compare REST API and WebSocket communication patterns', sections: [] },
  { id: 'grpc', label: 'gRPC Basics', path: '/demo/grpc-basics', category: 'Networking', description: 'Learn gRPC protocol fundamentals', sections: [] },
  { id: 'events', label: 'Event-Driven Architecture', path: '/demo/events', category: 'Architecture', description: 'Understanding event-driven systems', sections: [] },
]

function renderOverview() {
  return render(
    <MemoryRouter>
      <OverviewPage topics={mockTopics} />
    </MemoryRouter>
  )
}

describe('OverviewPage', () => {
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

  test('renders filter chips', () => {
    renderOverview()
    expect(screen.getByTestId('filter-chip-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-chip-Architecture')).toBeInTheDocument()
    expect(screen.getByTestId('filter-chip-Networking')).toBeInTheDocument()
  })

  test('filter chip "All" is active by default', () => {
    renderOverview()
    const allChip = screen.getByTestId('filter-chip-all')
    expect(allChip).toHaveClass('bg-primary')
  })

  test('clicking category filter narrows results', () => {
    renderOverview()
    const archChip = screen.getByTestId('filter-chip-Architecture')
    fireEvent.click(archChip)
    expect(screen.queryByText('gRPC Basics')).not.toBeInTheDocument()
    expect(screen.getByText('REST API vs WebSocket')).toBeInTheDocument()
    expect(screen.getByText('Event-Driven Architecture')).toBeInTheDocument()
  })

  test('topic links navigate to correct path', () => {
    renderOverview()
    const link = screen.getByTestId('topic-link-demo')
    expect(link).toHaveAttribute('href', '/demo/rest-vs-websocket')
  })

  test('sort by label ascending', () => {
    renderOverview()
    const sortBtn = screen.getByTestId('sort-label')
    fireEvent.click(sortBtn)
    expect(screen.getByText('Event-Driven Architecture')).toBeInTheDocument()
  })

  test('renders pagination controls', () => {
    renderOverview()
    expect(screen.getByTestId('overview-pagination')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-prev')).toBeInTheDocument()
    expect(screen.getByTestId('pagination-next')).toBeInTheDocument()
  })

  test('rows per page select renders', () => {
    renderOverview()
    expect(screen.getByTestId('rows-per-page')).toBeInTheDocument()
  })

  test('renders category badges', () => {
    renderOverview()
    expect(screen.getAllByText('Architecture').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Networking').length).toBeGreaterThanOrEqual(1)
  })

  test('empty state when no topics match search', () => {
    renderOverview()
    const searchInput = screen.getByTestId('overview-search') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })
    expect(screen.getByText('No topics found.')).toBeInTheDocument()
  })

  test('table has sortable column headers', () => {
    renderOverview()
    expect(screen.getByTestId('sort-label')).toBeInTheDocument()
    expect(screen.getByTestId('sort-category')).toBeInTheDocument()
    expect(screen.getByTestId('sort-description')).toBeInTheDocument()
  })
})
