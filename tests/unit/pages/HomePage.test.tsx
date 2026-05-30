import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '../../../src/pages/HomePage'
import type { TopicRoute } from '../../../src/core/routes'

const mockTopics: TopicRoute[] = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket', category: 'Architecture', description: 'Compare REST API and WebSocket communication patterns', sections: [] }
]

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage topics={mockTopics} />
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  test('renders page title', () => {
    renderHomePage()
    expect(screen.getByText('Interactive Learning Platform')).toBeInTheDocument()
  })

  test('renders topic in table', () => {
    renderHomePage()
    expect(screen.getByText('REST API vs WebSocket')).toBeInTheDocument()
  })

  test('topic link has correct href', () => {
    renderHomePage()
    expect(screen.getByText('REST API vs WebSocket').closest('a')).toHaveAttribute('href', '/demo/rest-vs-websocket')
  })
})
