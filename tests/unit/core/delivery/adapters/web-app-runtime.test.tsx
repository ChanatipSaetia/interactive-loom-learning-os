import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebAppRuntimeAdapter } from '../../../../../src/core/delivery/adapters/web-app-runtime'
import type { OKFBundled } from '../../../../../src/core/okf/types'

vi.mock('../../../../../src/core/okf/reader', () => ({
  loadOKFBundle: vi.fn(),
}))

vi.mock('../../../../../src/core/registry', () => ({
  SectionRegistry: {
    get: vi.fn(),
  },
}))

vi.mock('../../../../../src/core/validation/gateway', () => ({
  validateOKFSection: vi.fn(),
}))

import { loadOKFBundle } from '../../../../../src/core/okf/reader'
import { SectionRegistry } from '../../../../../src/core/registry'
import { validateOKFSection } from '../../../../../src/core/validation/gateway'

describe('WebAppRuntimeAdapter', () => {
  let adapter: WebAppRuntimeAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new WebAppRuntimeAdapter()
  })

  describe('loadTopicBundle', () => {
    it('delegates to loadOKFBundle', async () => {
      const mockBundle = [
        {
          meta: { type: 'intro', title: 'Test', resource: '.' },
          data: { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
          sectionFolder: 'intro',
        },
      ]
      vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as unknown as OKFBundled)

      const result = await adapter.loadTopicBundle('demo')

      expect(loadOKFBundle).toHaveBeenCalledWith('demo')
      expect(result).toEqual(mockBundle)
    })
  })

  describe('renderSection', () => {
    it('returns missing section element when type not registered', () => {
      vi.mocked(SectionRegistry.get).mockReturnValue(undefined)

      const result = adapter.renderSection({ type: 'unknown', props: {} })

      expect(result).not.toBe(null)
      // Result is a React element for missing section
    })

    it('returns component when type is registered', () => {
      const MockComponent = vi.fn(() => null)
      vi.mocked(SectionRegistry.get).mockReturnValue(MockComponent as any)

      const result = adapter.renderSection({ type: 'intro', props: { title: 'Test' } })

      expect(result).not.toBe(null)
      // JSX createElement doesn't call the component, so check registry was accessed
      expect(SectionRegistry.get).toHaveBeenCalledWith('intro')
    })
  })

  describe('validatePayload', () => {
    it('delegates to validateOKFSection', () => {
      vi.mocked(validateOKFSection).mockReturnValue({
        status: 'valid',
        payload: { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
        diagnostics: [],
      })

      const result = adapter.validatePayload(
        { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] },
        'intro'
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

      adapter.validatePayload({ some: 'data' }, 'quiz')

      expect(validateOKFSection).toHaveBeenCalledWith(
        expect.any(String),
        'quiz'
      )
    })
  })
})
