import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  clearContentCache,
  discoverOUITopics,
  getCachedTopicBundle,
  isOUITopic,
  loadTopicBundle,
  mergeTopicRoutes,
} from '../../../../../src/core/learning-engine/composition/content'
import type { TopicRoute } from '../../../../../src/core/learning-engine/composition/routes'

const route = (id: string, label = id): TopicRoute => ({ id, label, path: `/topics/${id}`, category: 'C', description: '' })

const FILES: Record<string, string> = {
  '/content/index.oui': 'root = Catalog([TopicRef("demo")])',
  '/content/demo/topic.oui': 'root = Topic("Demo (OpenUI)", "Architecture", "D", [SectionRef("intro")])',
  '/content/demo/sections/intro.oui': 'root = Text("Intro", ["From OpenUI."])',
  '/okf/legacy/index.md': '# Legacy\n\n* [Intro](sections/intro/section.md)\n',
  '/okf/legacy/sections/intro/section.md': '---\ntype: text\ntitle: Intro\n---\nFrom OKF.\n',
}

describe('content facade', () => {
  beforeEach(() => {
    clearContentCache()
    ;(window as unknown as Record<string, unknown>).__OKF_BASE_OVERRIDE__ = '/okf'
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const body = FILES[url]
      return body === undefined ? new Response('missing', { status: 404 }) : new Response(body)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete (window as unknown as Record<string, unknown>).__OKF_BASE_OVERRIDE__
    clearContentCache()
  })

  it('serves catalogued topics from OpenUI content and others from OKF', async () => {
    expect(await isOUITopic('demo')).toBe(true)
    expect(await isOUITopic('legacy')).toBe(false)

    const demo = await loadTopicBundle('demo')
    expect(demo[0].data).toEqual({ type: 'text', paragraphs: ['From OpenUI.'] })
    expect(getCachedTopicBundle('demo')).toBe(demo)

    const legacy = await loadTopicBundle('legacy')
    expect(legacy[0].data).toEqual({ type: 'text', paragraphs: ['From OKF.'] })
  })

  it('falls back to OKF when there is no OpenUI catalog', async () => {
    delete FILES['/content/index.oui']
    try {
      expect(await isOUITopic('demo')).toBe(false)
      expect(await discoverOUITopics()).toEqual([])
    } finally {
      FILES['/content/index.oui'] = 'root = Catalog([TopicRef("demo")])'
    }
  })

  it('builds catalog routes from topic manifests', async () => {
    expect(await discoverOUITopics()).toEqual([expect.objectContaining({ id: 'demo', label: 'Demo (OpenUI)', category: 'Architecture' })])
  })
})

describe('mergeTopicRoutes', () => {
  it('replaces migrated topics in place and appends OpenUI-only topics', () => {
    const merged = mergeTopicRoutes(
      [route('a'), route('demo', 'Demo (OKF)'), route('b')],
      [route('demo', 'Demo (OpenUI)'), route('new')],
    )
    expect(merged.map((t) => t.label)).toEqual(['a', 'Demo (OpenUI)', 'b', 'new'])
  })
})
