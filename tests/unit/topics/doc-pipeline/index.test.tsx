import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import DocPipelineTopic from '../../../../src/topics/doc-pipeline/index'
import { routes } from '../../../../src/core/routes'
import { docPipelineSections } from '../../../../src/topics/doc-pipeline/sections'
import { docPipelineSchema } from '../../../../src/topics/doc-pipeline/data/doc-schema'
import { autoDeriveViews } from '../../../../src/sections/flowchart/derivations'

const renderedConfigs: { type?: string }[] = []

const mockSectionRenderer = vi.fn((config: { type?: string }) => {
  renderedConfigs.push(config)
  return <div data-testid="mock-section" data-section-type={config?.type} />
})

vi.mock('../../../../src/components/layout/TopicShell', () => ({
  SectionRenderer: ({ config }: { config: { type?: string } }) => mockSectionRenderer(config),
}))

function renderDocPipelineTopic(path = '/topics/doc-pipeline') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:topicId/*" element={<DocPipelineTopic />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Issue #55: Doc Pipeline Topic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderedConfigs.length = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('doc-pipeline route is available at /topics/doc-pipeline', () => {
    const route = routes.find((r) => r.id === 'doc-pipeline')
    expect(route).toBeDefined()
    expect(route?.path).toBe('/topics/doc-pipeline')
  })

  it('doc-pipeline route has correct category and description', () => {
    const route = routes.find((r) => r.id === 'doc-pipeline')
    expect(route?.category).toBe('Architecture')
    expect(route?.description).toContain('OCR extraction')
    expect(route?.description).toContain('human audit')
  })

  it('doc-pipeline route has all required section types', () => {
    const route = routes.find((r) => r.id === 'doc-pipeline')
    expect(route).toBeDefined()
    const sectionTypes = route?.sections.map((s) => s.type) || []
    expect(sectionTypes).toContain('text')
    expect(sectionTypes).toContain('flowchart')
    expect(sectionTypes).toContain('bullets')
  })

  it('doc-pipeline topic renders all sections from config in order', () => {
    renderDocPipelineTopic()

    const expectedSections = docPipelineSections.length
    const renderedSections = screen.getAllByTestId('mock-section')
    expect(renderedSections.length).toBe(expectedSections)

    expect(mockSectionRenderer).toHaveBeenCalledTimes(expectedSections)
    for (let i = 0; i < expectedSections; i++) {
      expect(renderedConfigs[i]).toEqual(docPipelineSections[i])
    }
  })

  it('doc-pipeline topic renders section types in correct sequence', () => {
    renderDocPipelineTopic()

    const expectedTypes = docPipelineSections.map((s) => s.type)

    const renderedSections = screen.getAllByTestId('mock-section')
    const renderedTypes = renderedSections.map((el) => el.getAttribute('data-section-type'))

    expect(renderedTypes).toEqual(expectedTypes)
  })

  it('doc-pipeline schema has all 5 views', () => {
    const compiledSchema = autoDeriveViews(docPipelineSchema)
    const viewNames = Object.keys(compiledSchema.views!)
    expect(viewNames).toContain('EVENT_STORMING')
    expect(viewNames).toContain('SYS_ARCH')
    expect(viewNames).toContain('DATA_FLOW')
    expect(viewNames).toContain('SWIMLANES')
    expect(viewNames).toContain('SEQUENCE')
  })

  it('doc-pipeline schema has 2 journeys', () => {
    expect(docPipelineSchema.journeys.length).toBe(2)
    expect(docPipelineSchema.journeys[0].id).toBe('happy-path')
    expect(docPipelineSchema.journeys[1].id).toBe('low-confidence-audit')
  })

  it('happy path journey has 4 steps', () => {
    const happyPath = docPipelineSchema.journeys.find((j) => j.id === 'happy-path')
    expect(happyPath).toBeDefined()
    expect(happyPath?.steps.length).toBe(4)
  })

  it('low confidence audit journey has 5 steps', () => {
    const lowConf = docPipelineSchema.journeys.find((j) => j.id === 'low-confidence-audit')
    expect(lowConf).toBeDefined()
    expect(lowConf?.steps.length).toBe(5)
  })

  it('orchestrator aggregate has state machine definition', () => {
    const orchestrator = docPipelineSchema.entities['orchestrator']
    expect(orchestrator.stateMachine).toBeDefined()
    expect(orchestrator.stateMachine?.states.length).toBe(7)
  })

  it('low confidence audit step 4 triggers escalation process group', () => {
    const lowConf = docPipelineSchema.journeys.find((j) => j.id === 'low-confidence-audit')
    const step4 = lowConf?.steps[3]
    expect(step4).toBeDefined()
    expect(step4?.processGroup).toBe('escalation')
    expect(step4?.description).toContain('Risk')
  })

  it('renders topic container with test id', () => {
    renderDocPipelineTopic()
    const container = document.querySelector('.doc-pipeline-topic')
    expect(container).toBeInTheDocument()
    expect(container?.getAttribute('data-testid')).toBe('doc-pipeline-topic')
  })
})
