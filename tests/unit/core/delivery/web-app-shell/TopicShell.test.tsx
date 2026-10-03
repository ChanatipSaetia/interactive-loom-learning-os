import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as registryModule from '../../../../../src/core/learning-engine/registry'
import * as contentModule from '../../../../../src/core/learning-engine/composition/content'
import * as routesModule from '../../../../../src/core/learning-engine/composition/routes'
import { TopicShell, SectionRenderer } from '../../../../../src/core/delivery/web-app-shell/TopicShell'
import type { TopicRoute } from '../../../../../src/core/learning-engine/composition/routes'
import type { SectionConfig } from '../../../../../src/core/learning-engine/registry'

import { SectionTitleBar } from '../../../../../src/core/delivery/web-app-shell/SectionTitleBar'

const MockSectionComponent = vi.fn(({ sectionIndex }: { sectionIndex?: number }) => (
  <div data-testid="mock-registered-section">
    <SectionTitleBar title="Mock Section" sectionIndex={sectionIndex ?? 0} />
  </div>
))
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

describe('TopicShell topic loading', () => {
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
    vi.spyOn(contentModule, 'useTopicBundle').mockReturnValue({
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
    vi.spyOn(contentModule, 'useTopicBundle').mockReturnValue({
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
    vi.spyOn(contentModule, 'useTopicBundle').mockReturnValue({
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
        <SectionRenderer config={config} sectionIndex={0} />
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
        <SectionRenderer config={config} sectionIndex={0} />
      </MemoryRouter>,
    )

    const missing = document.querySelector('.section-missing')
    expect(missing).toBeInTheDocument()
    expect(missing).toHaveTextContent('Section type not registered: unknown-type')
  })
})

describe('TopicShell is read-only', () => {
  beforeEach(() => {
    registryModule.SectionRegistry.clear()
    registryModule.SectionRegistry.register('bullets', mockSectionLoader)
    vi.spyOn(contentModule, 'useTopicBundle').mockReturnValue({
      bundle: [{ meta: { type: 'bullets', title: 'Intro', resource: '.' }, data: { type: 'bullets', items: [{ text: 'Hi' }] } }],
      loading: false,
      error: null,
      reload: vi.fn(),
    })
  })

  afterEach(() => {
    registryModule.SectionRegistry.clear()
    vi.restoreAllMocks()
  })

  it('renders sections without edit toggles', async () => {
    renderTopicShell('/demo')
    await waitFor(() => expect(screen.getByTestId('mock-registered-section')).toBeInTheDocument())
    expect(document.querySelector('[data-testid^="edit-section-toggle"]')).toBeNull()
    expect(screen.getByTestId('section-help-btn-0')).toBeInTheDocument()
  })
})
