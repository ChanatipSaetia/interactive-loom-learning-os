import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as registryModule from '../../../../../src/core/learning-engine/registry'
import * as okfSections from '../../../../../src/core/learning-engine/composition/okf/sections'
import * as routesModule from '../../../../../src/core/learning-engine/composition/routes'
import { TopicShell, SectionRenderer } from '../../../../../src/core/delivery/web-app-shell/TopicShell'
import type { TopicRoute } from '../../../../../src/core/learning-engine/composition/routes'
import type { SectionConfig } from '../../../../../src/core/learning-engine/registry'
import type { OKFBundledSection } from '../../../../../src/core/learning-engine/composition/okf/types'

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

describe('TopicShell Editor Mode', () => {
  const mockBundle: OKFBundledSection[] = [
    {
      meta: { type: 'text', title: 'Test Section', resource: 'test.md' },
      data: { type: 'text', paragraphs: ['Hello world'] },
    },
    {
      meta: { type: 'bullets', title: 'Test Bullets', resource: 'test.md' },
      data: { type: 'bullets', items: [{ text: 'Item 1' }] },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    registryModule.SectionRegistry.clear()
    registryModule.SectionRegistry.register('text', mockSectionLoader)
    registryModule.SectionRegistry.register('bullets', mockSectionLoader)
    vi.spyOn(okfSections, 'useOKFBundled').mockReturnValue({
      bundle: mockBundle,
      loading: false,
      error: null,
      reload: vi.fn(),
    })
    vi.spyOn(okfSections, 'bundleToSections').mockReturnValue([
      { type: 'text', props: { title: 'Test Section', paragraphs: ['Hello world'] } },
      { type: 'bullets', props: { title: 'Test Bullets', items: [{ text: 'Item 1' }] } },
    ])
  })

  afterEach(() => {
    registryModule.SectionRegistry.clear()
    vi.restoreAllMocks()
  })

  it('renders edit section toggle buttons for each section', async () => {
    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const editButtons = document.querySelectorAll('[data-testid^="edit-section-toggle-"]')
      expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('editor panel shows Visual Form tab active by default in edit mode', async () => {
    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const editButtons = document.querySelectorAll('[data-testid^="edit-section-toggle-"]')
      expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })

    const firstEditBtn = screen.getByTestId('edit-section-toggle-0')
    fireEvent.click(firstEditBtn)

    await waitFor(() => {
      const visualForm = document.querySelector('[data-testid="visual-form-editor"]')
      expect(visualForm).toBeInTheDocument()
    })
  })

  it('entering edit mode shows split-pane layout with editor panel', async () => {
    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const editButtons = document.querySelectorAll('[data-testid^="edit-section-toggle-"]')
      expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })

    const firstEditBtn = screen.getByTestId('edit-section-toggle-0')
    fireEvent.click(firstEditBtn)

    await waitFor(() => {
      const splitPane = document.querySelector('[data-testid="split-pane-layout"]')
      expect(splitPane).toBeInTheDocument()
      const editorPanel = document.querySelector('[data-testid="editor-panel"]')
      expect(editorPanel).toBeInTheDocument()
      const visualForm = document.querySelector('[data-testid="visual-form-editor"]')
      expect(visualForm).toBeInTheDocument()
      const previewWrapper = document.querySelector('[data-testid="editor-preview-wrapper"]')
      expect(previewWrapper).toBeInTheDocument()
    })
  })

  it('exiting edit mode restores full-screen view', async () => {
    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const editButtons = document.querySelectorAll('[data-testid^="edit-section-toggle-"]')
      expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })

    const firstEditBtn = screen.getByTestId('edit-section-toggle-0')
    fireEvent.click(firstEditBtn)

    await waitFor(() => {
      expect(document.querySelector('[data-testid="split-pane-layout"]')).toBeInTheDocument()
    })

    const doneBtn = screen.getByTestId('edit-section-toggle-default')
    fireEvent.click(doneBtn)

    await waitFor(() => {
      const splitPane = document.querySelector('[data-testid="split-pane-layout"]')
      expect(splitPane).not.toBeInTheDocument()
      const sectionWrappers = document.querySelectorAll('.section-wrapper')
      expect(sectionWrappers.length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('EditSectionToggle', () => {
  it('shows Edit label when not in edit mode', async () => {
    registryModule.SectionRegistry.clear()
    registryModule.SectionRegistry.register('text', mockSectionLoader)
    vi.spyOn(okfSections, 'useOKFBundled').mockReturnValue({
      bundle: [
        {
          meta: { type: 'text', title: 'Test', resource: 'test.md' },
          data: { type: 'text', paragraphs: ['Hello'] },
        },
      ],
      loading: false,
      error: null,
      reload: vi.fn(),
    })
    vi.spyOn(okfSections, 'bundleToSections').mockReturnValue([
      { type: 'text', props: { title: 'Test', paragraphs: ['Hello'] } },
    ])

    renderTopicShell('/demo/rest-vs-websocket')

    await waitFor(() => {
      const editBtn = document.querySelector('[data-testid="edit-section-toggle-0"]')
      expect(editBtn).not.toBeNull()
      expect(editBtn?.getAttribute('aria-label')).toContain('Edit section')
      expect(editBtn?.classList.contains('active')).toBe(false)
    })
  })
})

describe('SplitPaneLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders left and right panels', async () => {
    const { SplitPaneLayout } = await import(
      '../../../../../src/core/delivery/web-app-shell/SplitPaneLayout'
    )

    render(
      <MemoryRouter>
        <SplitPaneLayout
          leftPanel={<div data-testid="left-content">Left</div>}
          rightPanel={<div data-testid="right-content">Right</div>}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const container = document.querySelector('[data-testid="split-pane-layout"]')
      expect(container).toBeInTheDocument()
      expect(screen.getByTestId('left-content')).toBeInTheDocument()
      expect(screen.getByTestId('right-content')).toBeInTheDocument()
    })
  })

  it('renders the divider separator', async () => {
    const { SplitPaneLayout } = await import(
      '../../../../../src/core/delivery/web-app-shell/SplitPaneLayout'
    )

    render(
      <MemoryRouter>
        <SplitPaneLayout
          leftPanel={<div>Left</div>}
          rightPanel={<div>Right</div>}
        />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const divider = document.querySelector('[data-testid="split-pane-divider"]')
      expect(divider).toBeInTheDocument()
    })
  })
})
