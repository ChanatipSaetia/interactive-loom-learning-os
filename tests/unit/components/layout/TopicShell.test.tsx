import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as registryModule from '../../../../src/core/registry'
import * as okfSections from '../../../../src/core/okf/sections'
import * as routesModule from '../../../../src/core/routes'
import { TopicShell, SectionRenderer } from '../../../../src/components/layout/TopicShell'
import type { TopicRoute } from '../../../../src/core/routes'
import type { SectionConfig } from '../../../../src/core/registry'

const MockSectionComponent = vi.fn(() => <div data-testid="mock-registered-section" />)
const mockSectionLoader = () => Promise.resolve({ default: MockSectionComponent })

const mockTopics: TopicRoute[] = [
  { id: 'demo', label: 'AI Agent Architecture (Demo)', path: '/demo/ai-agent', category: 'Architecture', description: 'Demo topic' },
]

function renderTopicShell(path = '/demo/rest-vs-websocket', topics: TopicRoute[] = mockTopics) {
  vi.spyOn(routesModule, 'useTopics').mockReturnValue({
    topics,
    loading: false,
    error: null,
  })

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:topicId/*" element={<TopicShell />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TopicShell OKF loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registryModule.SectionRegistry.clear()
    registryModule.SectionRegistry.register('test-section', mockSectionLoader)
  })

  afterEach(() => {
    registryModule.SectionRegistry.clear()
    vi.restoreAllMocks()
  })

  it('TopicShell renders topic page for known route', async () => {
    vi.spyOn(okfSections, 'useOKFBundled').mockReturnValue({
      bundle: null,
      loading: false,
      error: null,
      reload: vi.fn(),
    })

    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const topicPage = document.querySelector('.topic-page')
      expect(topicPage).toBeInTheDocument()
    })

    const topicTitle = screen.getByText('AI Agent Architecture (Demo)')
    expect(topicTitle).toBeInTheDocument()
  })

  it('TopicShell shows loading state', async () => {
    vi.spyOn(okfSections, 'useOKFBundled').mockReturnValue({
      bundle: null,
      loading: true,
      error: null,
      reload: vi.fn(),
    })

    renderTopicShell('/demo/rest-vs-websocket')

    const loading = await screen.findByText('Loading topic data...')
    expect(loading).toBeInTheDocument()
  })

  it('TopicShell shows error state', async () => {
    vi.spyOn(okfSections, 'useOKFBundled').mockReturnValue({
      bundle: null,
      loading: false,
      error: new Error('Network error'),
      reload: vi.fn(),
    })

    renderTopicShell('/demo/rest-vs-websocket')

    const error = await screen.findByText(/Failed to load topic/)
    expect(error).toBeInTheDocument()
  })

  it('TopicShell shows not found for unknown topic', () => {
    renderTopicShell('/nonexistent/path', [])

    const title = screen.getByText('Topic Not Found')
    expect(title).toBeInTheDocument()
  })

  it('SectionRenderer renders registered section type', async () => {
    const config: SectionConfig = { type: 'test-section', props: {} }
    render(
      <MemoryRouter>
        <SectionRenderer config={config} />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('mock-registered-section')).toBeInTheDocument()
    })
    expect(MockSectionComponent).toHaveBeenCalled()
  })

  it('SectionRenderer shows missing message for unregistered type', () => {
    const config: SectionConfig = { type: 'unknown-type', props: {} }
    render(
      <MemoryRouter>
        <SectionRenderer config={config} />
      </MemoryRouter>,
    )

    const missing = document.querySelector('.section-missing')
    expect(missing).toBeInTheDocument()
    expect(missing).toHaveTextContent('Section type not registered: unknown-type')
  })
})
