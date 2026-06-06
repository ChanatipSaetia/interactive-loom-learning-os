import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import DemoTopic from '../../../../src/topics/demo/index'
import { routes } from '../../../../src/core/routes'
import { demoSections } from '../../../../src/topics/demo/sections'

const renderedConfigs: { type?: string }[] = []

const mockSectionRenderer = vi.fn((config: { type?: string }) => {
  renderedConfigs.push(config)
  return <div data-testid="mock-section" data-section-type={config?.type} />
})

vi.mock('../../../../src/components/layout/TopicShell', () => ({
  SectionRenderer: ({ config }: { config: { type?: string } }) => mockSectionRenderer(config),
}))

function renderDemoTopic(path = '/demo/ai-agent') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:topicId/*" element={<DemoTopic />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('US-12: Demo Topic Shell & Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedConfigs.length = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('demo route is available at /demo/ai-agent', () => {
    const demoRoute = routes.find((r) => r.id === 'demo')
    expect(demoRoute).toBeDefined()
    expect(demoRoute?.path).toBe('/demo/ai-agent')
  })

  it('demo route has all required section types', () => {
    const demoRoute = routes.find((r) => r.id === 'demo')
    expect(demoRoute).toBeDefined()
    const sectionTypes = demoRoute?.sections.map((s) => s.type) || []
    expect(sectionTypes).toContain('text')
    expect(sectionTypes).toContain('flowchart')
    expect(sectionTypes).toContain('bullets')
    expect(sectionTypes).toContain('tradeoff-sandbox')
  })

  it('demo topic renders all sections from config in order', () => {
    renderDemoTopic()

    const expectedSections = demoSections.length
    const renderedSections = screen.getAllByTestId('mock-section')
    expect(renderedSections.length).toBe(expectedSections)

    expect(mockSectionRenderer).toHaveBeenCalledTimes(expectedSections)
    for (let i = 0; i < expectedSections; i++) {
      expect(renderedConfigs[i]).toEqual(demoSections[i])
    }
  })

  it('demo topic renders section types in correct sequence', () => {
    renderDemoTopic()

    const expectedTypes = demoSections.map((s) => s.type)

    const renderedSections = screen.getAllByTestId('mock-section')
    const renderedTypes = renderedSections.map((el) => el.getAttribute('data-section-type'))

    expect(renderedTypes).toEqual(expectedTypes)
  })

  it('renders empty div for unknown topic', () => {
    render(
      <MemoryRouter initialEntries={['/unknown/path']}>
        <Routes>
          <Route path="/:topicId/*" element={<DemoTopic />} />
        </Routes>
      </MemoryRouter>,
    )
    const container = document.querySelector('.demo-topic')
    expect(container).toBeInTheDocument()
  })
})
