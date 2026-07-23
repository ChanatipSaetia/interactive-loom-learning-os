import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildSectionSaveFiles, buildDownloadFiles, triggerDownload } from '../../../../src/core/util/okfSave'
import type { OKFSectionMeta } from '../../../../src/core/okf/types'

describe('buildSectionSaveFiles', () => {
  const mockMeta: OKFSectionMeta = {
    type: 'quiz',
    title: 'Test Quiz',
    resource: 'questions.yaml',
  }

  const mockYamlData = 'type: quiz\nquestions:\n  - id: q1\n    question: What is X?\n    choices:\n      - id: a\n        text: Option A\n        correct: true\n        explanation: Correct'

  const mockSectionBody = '# Test Quiz\n\nA quiz section for testing.'

  it('produces valid section.md with frontmatter', () => {
    const result = buildSectionSaveFiles(mockMeta, mockYamlData, mockSectionBody)

    expect(result.sectionMd).toContain('---')
    expect(result.sectionMd).toContain('type: quiz')
    expect(result.sectionMd).toContain('title: Test Quiz')
    expect(result.sectionMd).toContain('resource: data.yaml')
    expect(result.sectionMd).toContain(mockSectionBody)
  })

  it('produces trimmed data.yaml content', () => {
    const result = buildSectionSaveFiles(mockMeta, mockYamlData, mockSectionBody)

    expect(result.dataYaml).toBe(mockYamlData.trim())
  })

  it('always sets resource to data.yaml', () => {
    const result = buildSectionSaveFiles(mockMeta, mockYamlData, mockSectionBody)

    expect(result.sectionMd).toContain('resource: data.yaml')
    expect(result.sectionMd).not.toContain('questions.yaml')
  })

  it('omits optional meta fields when not present', () => {
    const minimalMeta: OKFSectionMeta = {
      type: 'text',
      resource: '.',
    }
    const result = buildSectionSaveFiles(minimalMeta, 'type: text\nparagraphs: []', 'Some body')

    expect(result.sectionMd).toContain('type: text')
    expect(result.sectionMd).toContain('resource: data.yaml')
    expect(result.sectionMd).not.toContain('title:')
    expect(result.sectionMd).not.toContain('heading:')
  })

  it('includes ordered field when present', () => {
    const metaWithOrdered: OKFSectionMeta = {
      type: 'text',
      resource: '.',
      ordered: true,
    }
    const result = buildSectionSaveFiles(metaWithOrdered, 'type: text\nparagraphs: []', 'Body')

    expect(result.sectionMd).toContain('ordered: true')
  })

  it('includes heading field when present', () => {
    const metaWithHeading: OKFSectionMeta = {
      type: 'text',
      title: 'My Section',
      heading: 'Custom Heading',
      resource: '.',
    }
    const result = buildSectionSaveFiles(metaWithHeading, 'data', 'Body')

    expect(result.sectionMd).toContain('heading: Custom Heading')
  })
})

describe('buildDownloadFiles', () => {
  it('returns correctly typed download files', () => {
    const meta: OKFSectionMeta = {
      type: 'quiz',
      title: 'Quiz',
      resource: '.',
    }
    const result = buildDownloadFiles(meta, 'questions: []', 'Body')

    expect(result.sectionMd.filename).toBe('section.md')
    expect(result.sectionMd.mimeType).toBe('text/markdown;charset=utf-8')
    expect(result.dataYaml.filename).toBe('data.yaml')
    expect(result.dataYaml.mimeType).toBe('text/yaml;charset=utf-8')
  })
})

describe('triggerDownload', () => {
  let mockA: HTMLAnchorElement
  let createObjectURLFn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockA = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockA
      return document.createElement(tag)
    })
    vi.spyOn(document.body, 'appendChild').mockReturnValue(null as unknown as Node)
    vi.spyOn(document.body, 'removeChild').mockReturnValue(null as unknown as Node)
    createObjectURLFn = vi.fn().mockReturnValue('blob:test')
    ;(globalThis.URL as any).createObjectURL = createObjectURLFn
    ;(globalThis.URL as any).revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a download link and triggers click', () => {
    const file = {
      filename: 'test.yaml',
      content: 'test: data',
      mimeType: 'text/yaml',
    }

    triggerDownload(file)

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(createObjectURLFn).toHaveBeenCalledWith(expect.any(Blob))
  })
})
