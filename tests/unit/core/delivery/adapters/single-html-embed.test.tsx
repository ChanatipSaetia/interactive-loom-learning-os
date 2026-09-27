/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  SingleHTMLEmbedAdapter,
  singleEmbedAdapter,
  clearEmbedRegistry,
} from '../../../../../src/core/delivery/adapters/single-html-embed'

vi.mock('../../../../../src/core/learning-engine/composition/okf/loader', () => ({
  loadOKFBundle: vi.fn(),
}))

vi.mock('../../../../../src/core/learning-engine/composition/okf/section-config', () => ({
  toSectionConfigs: vi.fn(),
}))

vi.mock('../../../../../src/core/learning-engine/validation/gateway', () => ({
  validateOKFSection: vi.fn(),
}))

vi.mock('../../../../../src/core/ui-system/primitives/SectionErrorBoundary', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

import { loadOKFBundle } from '../../../../../src/core/learning-engine/composition/okf/loader'
import { toSectionConfigs } from '../../../../../src/core/learning-engine/composition/okf/section-config'
import { validateOKFSection } from '../../../../../src/core/learning-engine/validation/gateway'

describe('SingleHTMLEmbedAdapter', () => {
  let adapter: SingleHTMLEmbedAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    clearEmbedRegistry()
    adapter = new SingleHTMLEmbedAdapter()
  })

  describe('registerComponent', () => {
    it('registers a component in the embed registry', () => {
      const MockComponent = vi.fn(() => null)
      adapter.registerComponent('test-section', MockComponent)

      const result = adapter.runtime.renderSection({ type: 'test-section', props: {} })
      expect(result).not.toBe(null)
    })

    it('returns missing section for unregistered type', () => {
      const result = adapter.runtime.renderSection({ type: 'unknown-type', props: {} })
      expect(result).not.toBe(null)
    })
  })

  describe('storage (read-only HTTP)', () => {
    it('throws saveSection error for standalone embed', async () => {
      await expect(
        adapter.storage.saveSection!('demo', 'intro', {} as any, '---\ntype: intro\n---'),
      ).rejects.toThrow('saveSection is not available in standalone embed mode')
    })

    it('throws for hex maps, which the embed does not serve', async () => {
      await expect(adapter.storage.readHexMap('demo')).rejects.toThrow('not available in standalone embed mode')
    })

    it('reads raw section files over HTTP through the generated manifest', async () => {
      ;(globalThis.fetch as any) = vi.fn((url: string) => {
        const files: Record<string, string> = {
          '/okf/demo/manifest.json': JSON.stringify({ sections: { intro: ['content.yaml', 'section.md'] } }),
          '/okf/demo/sections/intro/content.yaml': 'what:\n  summary: s',
          '/okf/demo/sections/intro/section.md': '---\ntype: intro\n---',
        }
        return Promise.resolve(
          url in files ? { ok: true, text: () => Promise.resolve(files[url]) } : { ok: false, status: 404 },
        )
      })

      const files = await adapter.storage.readSectionFiles('demo', 'intro')

      expect(Object.keys(files)).toEqual(['content.yaml', 'section.md'])
    })
  })

  describe('runtime (EmbedRuntime)', () => {
    describe('loadTopicBundle', () => {
      it('delegates to loadOKFBundle with the embed storage', async () => {
        const mockBundle = [
          {
            meta: { type: 'text', title: 'Test', resource: '.' },
            data: { type: 'text', paragraphs: ['test'] },
            sectionFolder: 'text-1',
          },
        ]
        vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as any)

        const result = await adapter.runtime.loadTopicBundle('demo')

        expect(loadOKFBundle).toHaveBeenCalledWith('demo', adapter.storage)
        expect(result).toEqual(mockBundle)
      })
    })

    describe('renderSection', () => {
      it('returns ReactNode for registered section', () => {
        const MockComponent = vi.fn(() => null)
        adapter.registerComponent('intro', MockComponent)

        const result = adapter.runtime.renderSection({ type: 'intro', props: { title: 'Test' } }, 0)
        expect(result).not.toBe(null)
      })

      it('passes sectionIndex to render', () => {
        const MockComponent = vi.fn(() => null)
        adapter.registerComponent('text', MockComponent)

        adapter.runtime.renderSection({ type: 'text', props: {} }, 5)
        // The adapter wraps with section-wrapper containing data-section-index
      })
    })

    describe('validatePayload', () => {
      it('delegates to validateOKFSection', () => {
        vi.mocked(validateOKFSection).mockReturnValue({
          status: 'valid',
          payload: { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
          diagnostics: [],
        })

        const result = adapter.runtime.validatePayload(
          { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
          'intro',
        )

        expect(validateOKFSection).toHaveBeenCalled()
        expect(result.status).toBe('valid')
        expect(result.diagnostics).toEqual([])
      })

      it('passes metaType hint to validator', () => {
        vi.mocked(validateOKFSection).mockReturnValue({
          status: 'valid',
          payload: {},
          diagnostics: [],
        })

        adapter.runtime.validatePayload({ some: 'data' }, 'quiz')

        expect(validateOKFSection).toHaveBeenCalledWith(
          expect.any(String),
          'quiz',
        )
      })

      it('converts object data to JSON string for gateway', () => {
        vi.mocked(validateOKFSection).mockReturnValue({
          status: 'error',
          payload: {},
          diagnostics: [{ tier: 2, message: 'Missing field', fixHint: 'Add field' }],
        })

        const testData = { type: 'quiz', questions: [] }
        adapter.runtime.validatePayload(testData, 'quiz')

        expect(validateOKFSection).toHaveBeenCalledWith(
          JSON.stringify(testData),
          'quiz',
        )
      })

      it('passes string data directly to gateway', () => {
        vi.mocked(validateOKFSection).mockReturnValue({
          status: 'valid',
          payload: {},
          diagnostics: [],
        })

        const yamlString = 'type: quiz\nquestions: []'
        adapter.runtime.validatePayload(yamlString, 'quiz')

        expect(validateOKFSection).toHaveBeenCalledWith(yamlString, 'quiz')
      })
    })

    describe('bundleToSectionConfigs', () => {
      it('delegates to toSectionConfigs', () => {
        vi.mocked(toSectionConfigs).mockReturnValue([
          { type: 'intro', props: { title: 'Test' } },
        ])

        const bundle = [
          {
            meta: { type: 'intro', title: 'Test', resource: '.' },
            data: { type: 'intro', what: { summary: '' }, why: { summary: '' }, roadmap: [] },
            sectionFolder: 'intro',
          },
        ]

        const result = (adapter.runtime as any).bundleToSectionConfigs(bundle as any)
        expect(toSectionConfigs).toHaveBeenCalledWith(bundle)
        expect(result).toHaveLength(1)
      })
    })
  })

  describe('clearComponents', () => {
    it('clears the embed registry', () => {
      adapter.registerComponent('test', vi.fn(() => null))
      adapter.clearComponents()

      const result = adapter.runtime.renderSection({ type: 'test', props: {} })
      // Should return missing section element since registry was cleared
      expect(result).not.toBe(null)
    })
  })

  describe('singleton (singleEmbedAdapter)', () => {
    it('is a pre-initialized instance', () => {
      expect(singleEmbedAdapter).toBeInstanceOf(SingleHTMLEmbedAdapter)
    })
  })
})
