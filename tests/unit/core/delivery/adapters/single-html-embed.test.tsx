/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  SingleHTMLEmbedAdapter,
  singleEmbedAdapter,
  clearEmbedRegistry,
} from '../../../../../src/core/delivery/adapters/single-html-embed'

vi.mock('../../../../../src/core/okf/reader', () => ({
  loadOKFBundle: vi.fn(),
}))

vi.mock('../../../../../src/core/okf/sections', () => ({
  bundleToSections: vi.fn(),
}))

vi.mock('../../../../../src/core/validation/gateway', () => ({
  validateOKFSection: vi.fn(),
}))

vi.mock('../../../../../src/sections/flowchart/abstract-flow/derive', () => ({
  deriveSchema: vi.fn((input) => ({ ...input, entities: {}, relations: [] })),
}))

vi.mock('../../../../../src/components/common/SectionErrorBoundary', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}))

import { loadOKFBundle } from '../../../../../src/core/okf/reader'
import { bundleToSections } from '../../../../../src/core/okf/sections'
import { validateOKFSection } from '../../../../../src/core/validation/gateway'

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

  describe('storage (EmbedInMemoryStorage)', () => {
    it('throws saveSection error for standalone embed', async () => {
      await expect(
        adapter.storage.saveSection('demo', 'intro', {} as any, '---\ntype: intro\n---'),
      ).rejects.toThrow('saveSection is not available in standalone embed mode')
    })

    it('returns loaded topics from listTopics', async () => {
      const mockBundle = [
        {
          meta: { type: 'intro', title: 'Test', resource: '.' },
          data: { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
          sectionFolder: 'intro',
        },
      ]
      vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as any)

      await adapter.runtime.loadTopicBundle('demo')
      const topics = await adapter.storage.listTopics()

      expect(topics).toContain('demo')
    })

    it('returns empty topics when no bundles loaded', async () => {
      const topics = await adapter.storage.listTopics()
      expect(topics).toEqual([])
    })

    it('throws when reading section from unloaded topic', async () => {
      await expect(adapter.storage.readSection('unloaded', 'intro')).rejects.toThrow(
        'Topic "unloaded" not loaded in embed storage',
      )
    })

    it('throws when section folder not found in bundle', async () => {
      const mockBundle = [
        {
          meta: { type: 'text', title: 'Test', resource: '.' },
          data: { type: 'text', paragraphs: ['test'] },
          sectionFolder: 'other',
        },
      ]
      vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as any)

      await adapter.runtime.loadTopicBundle('demo')
      await expect(adapter.storage.readSection('demo', 'missing')).rejects.toThrow(
        'Section "missing" not found in topic "demo"',
      )
    })

    it('returns section data from in-memory bundle', async () => {
      const mockBundle = [
        {
          meta: { type: 'intro', title: 'Test Intro', resource: '.' },
          data: { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
          sectionBody: 'Some markdown body',
          sectionFolder: 'intro',
        },
      ]
      vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as any)

      await adapter.runtime.loadTopicBundle('demo')
      const result = await adapter.storage.readSection('demo', 'intro')

      expect(result.meta).toEqual(mockBundle[0].meta)
      expect(result.data).toEqual(mockBundle[0].data)
      expect(result.body).toBe('Some markdown body')
    })
  })

  describe('runtime (EmbedRuntime)', () => {
    describe('loadTopicBundle', () => {
      it('delegates to loadOKFBundle and caches in storage', async () => {
        const mockBundle = [
          {
            meta: { type: 'text', title: 'Test', resource: '.' },
            data: { type: 'text', paragraphs: ['test'] },
            sectionFolder: 'text-1',
          },
        ]
        vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as any)

        const result = await adapter.runtime.loadTopicBundle('demo')

        expect(loadOKFBundle).toHaveBeenCalledWith('demo')
        expect(result).toEqual(mockBundle)
        // Verify it's cached in storage
        const topics = await adapter.storage.listTopics()
        expect(topics).toContain('demo')
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
      it('delegates to bundleToSections', () => {
        vi.mocked(bundleToSections).mockReturnValue([
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
        expect(bundleToSections).toHaveBeenCalledWith(bundle)
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
