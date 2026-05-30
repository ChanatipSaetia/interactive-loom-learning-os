import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '../../../src/pages/HomePage'

const mockTopics = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket' }
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

  test('renders topic cards', () => {
    renderHomePage()
    expect(screen.getByText('REST API vs WebSocket')).toBeInTheDocument()
  })

  test('topic card links to correct path', () => {
    renderHomePage()
    expect(screen.getByText('REST API vs WebSocket').closest('a')).toHaveAttribute('href', '/demo/rest-vs-websocket')
  })
})
