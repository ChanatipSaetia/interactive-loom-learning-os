import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as registryModule from '../../../../src/core/registry'
import { TopicRegistry } from '../../../../src/core/topic-registry'
import { TopicShell, SectionRenderer } from '../../../../src/components/layout/TopicShell'
import type { SectionConfig } from '../../../../src/core/registry'

const mockSectionComponent = vi.fn(() => <div data-testid="mock-registered-section" />)
const mockTopicComponent = vi.fn(() => <div data-testid="mock-topic-content" />)

function renderTopicShell(path = '/demo/rest-vs-websocket') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:topicId/*" element={<TopicShell />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('US-12: TopicShell lazy loading and Suspense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registryModule.SectionRegistry.clear()
    registryModule.SectionRegistry.register('test-section', mockSectionComponent)
    TopicRegistry.clear()
    TopicRegistry.register('demo', mockTopicComponent)
  })

  afterEach(() => {
    registryModule.SectionRegistry.clear()
    TopicRegistry.clear()
    vi.restoreAllMocks()
  })

  it('TopicShell renders topic page for known route', async () => {
    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const topicPage = document.querySelector('.topic-page')
      expect(topicPage).toBeInTheDocument()
    })

    const topicTitle = screen.getByText('AI Agent Architecture (Demo)')
    expect(topicTitle).toBeInTheDocument()
  })

  it('TopicShell uses Suspense boundary for lazy loading', async () => {
    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const topicPage = document.querySelector('.topic-page')
      expect(topicPage).toBeInTheDocument()
    })

    const topicPage = document.querySelector('.topic-page')
    expect(topicPage).toHaveAttribute('data-topic-id', 'demo')
  })

  it('TopicShell shows not found for unknown topic', () => {
    renderTopicShell('/nonexistent/path')

    const title = screen.getByText('Topic Not Found')
    expect(title).toBeInTheDocument()
  })

  it('SectionRenderer renders registered section type', () => {
    const config: SectionConfig = { type: 'test-section', props: {} }
    render(
      <MemoryRouter>
        <SectionRenderer config={config} />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('mock-registered-section')).toBeInTheDocument()
    expect(mockSectionComponent).toHaveBeenCalled()
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
