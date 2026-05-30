import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../../../../src/components/layout/Sidebar'
import type { TopicRoute } from '../../../../src/core/routes'

const mockTopics: TopicRoute[] = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket', category: 'Architecture', description: 'Compare patterns', sections: [] }
]

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar topics={mockTopics} />
    </MemoryRouter>
  )
}

describe('Sidebar', () => {
  test('renders Overview link', () => {
    renderSidebar()
    expect(screen.getByText('Overview')).toBeInTheDocument()
  })

  test('renders topic links', () => {
    renderSidebar()
    expect(screen.getByText('REST API vs WebSocket')).toBeInTheDocument()
  })

  test('Overview link points to /', () => {
    renderSidebar()
    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/')
  })

  test('topic link has correct href', () => {
    renderSidebar()
    expect(screen.getByText('REST API vs WebSocket').closest('a')).toHaveAttribute('href', '/demo/rest-vs-websocket')
  })
})
