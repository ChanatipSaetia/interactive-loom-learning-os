/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InRepoStorageAdapter } from '../../../../../src/core/delivery/adapters/in-repo-storage'
import type { OKFIntroSectionData } from '../../../../../src/core/learning-engine/composition/okf/types'

/** fetch stub serving a fixed path → body map under the adapter's base URL. */
function serve(files: Record<string, string>) {
  return vi.fn((url: string) => {
    const path = url.replace(/^\/okf\//, '')
    return Promise.resolve(
      path in files
        ? { ok: true, status: 200, text: () => Promise.resolve(files[path]) }
        : { ok: false, status: 404, text: () => Promise.resolve('Not Found') },
    )
  })
}

describe('InRepoStorageAdapter', () => {
  let adapter: InRepoStorageAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new InRepoStorageAdapter()
    ;(globalThis.fetch as any) = vi.fn()
  })

  describe('listSections', () => {
    it('returns section folders in index.md link order', async () => {
      ;(globalThis.fetch as any) = serve({
        'demo/index.md': '# Demo\n\n* [Intro](sections/intro/section.md)\n* [Quiz](sections/quiz/section.md) — 🗝️ Key\n* [Other topic](../other/index.md)',
      })

      expect(await adapter.listSections('demo')).toEqual(['intro', 'quiz'])
    })
  })

  describe('readSectionFiles', () => {
    it('reads every file listed for the section in the generated manifest', async () => {
      const mockFetch = serve({
        'demo/manifest.json': JSON.stringify({ sections: { quiz: ['questions.yaml', 'section.md'] } }),
        'demo/sections/quiz/questions.yaml': '- id: q1',
        'demo/sections/quiz/section.md': '---\ntype: quiz\nresource: questions.yaml\n---',
      })
      ;(globalThis.fetch as any) = mockFetch

      const files = await adapter.readSectionFiles('demo', 'quiz')

      expect(files).toEqual({
        'questions.yaml': '- id: q1',
        'section.md': '---\ntype: quiz\nresource: questions.yaml\n---',
      })
      expect(mockFetch).toHaveBeenCalledWith('/okf/demo/manifest.json')
    })

    it('throws when the section is not in the manifest', async () => {
      ;(globalThis.fetch as any) = serve({ 'demo/manifest.json': JSON.stringify({ sections: {} }) })

      await expect(adapter.readSectionFiles('demo', 'missing')).rejects.toThrow(
        'Section "missing" not found in topic "demo"'
      )
    })

    it('explains a missing manifest, including an SPA fallback page in its place', async () => {
      ;(globalThis.fetch as any) = serve({ 'demo/manifest.json': '<!doctype html><html></html>' })
      await expect(adapter.readSectionFiles('demo', 'quiz')).rejects.toThrow('OKF manifest not found for topic "demo"')

      adapter = new InRepoStorageAdapter()
      ;(globalThis.fetch as any) = serve({})
      await expect(adapter.readSectionFiles('demo', 'quiz')).rejects.toThrow('OKF manifest not found for topic "demo"')
    })

    it('reads from an explicit base URL', async () => {
      const mockFetch = serve({})
      ;(globalThis.fetch as any) = mockFetch
      adapter = new InRepoStorageAdapter('https://cdn.example.com/okf/')

      await adapter.readSectionFiles('demo', 'quiz').catch(() => {})

      expect(mockFetch).toHaveBeenCalledWith('https://cdn.example.com/okf/demo/manifest.json')
    })
  })

  describe('saveSection', () => {
    it('sends POST request to save endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('{}') })
      ;(globalThis.fetch as any) = mockFetch

      const testData: OKFIntroSectionData = {
        type: 'intro',
        what: { summary: 'test' },
        why: { summary: 'test' },
        roadmap: [],
      }
      await adapter.saveSection('demo', 'intro', testData, '---\ntype: intro\n---\n\nbody')

      expect(mockFetch).toHaveBeenCalledWith('/api/okf/save-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.topicId).toBe('demo')
      expect(body.sectionName).toBe('intro')
    })

    it('throws when save endpoint returns error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Validation failed'),
      })
      ;(globalThis.fetch as any) = mockFetch

      const testData: OKFIntroSectionData = {
        type: 'intro',
        what: { summary: 'test' },
        why: { summary: 'test' },
        roadmap: [],
      }
      await expect(
        adapter.saveSection('demo', 'intro', testData, '---\ntype: intro\n---')
      ).rejects.toThrow('Failed to save section')
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
