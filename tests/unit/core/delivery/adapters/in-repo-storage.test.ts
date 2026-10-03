/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InRepoStorageAdapter } from '../../../../../src/core/delivery/adapters/in-repo-storage'
import type { OKFIntroSectionData } from '../../../../../src/core/learning-engine/composition/okf/types'

vi.mock('../../../../../src/core/learning-engine/composition/okf/reader', () => ({
  loadOKFBundle: vi.fn(),
  clearOKFCache: vi.fn(),
}))

import { loadOKFBundle } from '../../../../../src/core/learning-engine/composition/okf/reader'

describe('InRepoStorageAdapter', () => {
  let adapter: InRepoStorageAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new InRepoStorageAdapter()
    ;(globalThis.fetch as any) = vi.fn()
  })

  describe('readSection', () => {
    it('returns section data from cached bundle', async () => {
      const mockBundle = [
        {
          meta: { type: 'intro', title: 'Test Intro', resource: '.' },
          data: { type: 'intro', what: { summary: 'test' }, why: { summary: 'test' }, roadmap: [] } as OKFIntroSectionData,
          sectionBody: 'Test body content',
          sectionFolder: 'intro',
        },
      ]
      vi.mocked(loadOKFBundle).mockResolvedValue(mockBundle as any)

      const result = await adapter.readSection('demo', 'intro')

      expect(loadOKFBundle).toHaveBeenCalledWith('demo')
      expect(result.meta).toEqual(mockBundle[0].meta)
      expect(result.data).toEqual(mockBundle[0].data)
      expect(result.body).toEqual(mockBundle[0].sectionBody)
    })

    it('throws when section folder not found in bundle', async () => {
      vi.mocked(loadOKFBundle).mockResolvedValue([
        {
          meta: { type: 'intro', title: 'Test', resource: '.' },
          data: { type: 'intro', what: { summary: '' }, why: { summary: '' }, roadmap: [] } as OKFIntroSectionData,
          sectionFolder: 'other',
        },
      ] as any)

      await expect(adapter.readSection('demo', 'missing')).rejects.toThrow(
        'Section "missing" not found in topic "demo"'
      )
    })
  })

  describe('saveSection', () => {
    it('is read-only and points to Loom Studio', async () => {
      await expect(adapter.saveSection()).rejects.toThrow(/Loom Studio/)
    })
  })

  describe('listTopics', () => {
    it('returns topic IDs from index.md', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '---\nokf_version: "0.1"\n---\n## Category\n* [Demo Topic](demo/index.md) — Test\n* [Motorcycle](motorcycle/index.md) — Vehicles'
          ),
      })
      ;(globalThis.fetch as any) = mockFetch

      const topics = await adapter.listTopics()

      expect(topics).toContain('demo')
      expect(topics).toContain('motorcycle')
      expect(topics).toHaveLength(2)
    })

    it('returns empty array when fetch fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false })
      ;(globalThis.fetch as any) = mockFetch

      const topics = await adapter.listTopics()
      expect(topics).toEqual([])
    })

    it('deduplicates topic IDs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '---\nokf_version: "0.1"\n---\n## Cat\n* [Demo](demo/index.md)\n## Other\n* [Demo Again](demo/index.md)'
          ),
      })
      ;(globalThis.fetch as any) = mockFetch

      const topics = await adapter.listTopics()
      expect(topics).toEqual(['demo'])
    })
  })
})
