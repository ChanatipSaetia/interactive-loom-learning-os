import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OUIStorageAdapter, OUI_SAVE_ENDPOINT } from '../../../../../src/core/delivery/adapters/oui-storage'
import {
  clearOUICache,
  loadOUICatalog,
  loadOUITopic,
  OUILoadError,
} from '../../../../../src/core/learning-engine/composition/oui/reader'

const FILES: Record<string, string> = {
  '/content/index.oui': 'root = Catalog([TopicRef("demo")])',
  '/content/demo/topic.oui': 'root = Topic("Demo", "Architecture", "A demo topic", [SectionRef("intro"), SectionRef("quiz")], ["ai"])',
  '/content/demo/sections/intro.oui': 'root = Text("Intro", ["Hello."])',
  '/content/demo/sections/quiz.oui': [
    'root = Quiz("Check", [q1])',
    'q1 = QuizQuestion("q1", "Q?", [QuizChoice("a", "A", true, "Yes")])',
    'unused = Text("x", [])',
  ].join('\n'),
  '/content/broken/topic.oui': 'root = Topic("Broken", "X", "Y", [SectionRef("bad")])',
  '/content/broken/sections/bad.oui': 'root = Nope("x")',
}

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') return new Response('{"ok":true}', { status: 200 })
    const body = FILES[url]
    return body === undefined ? new Response('missing', { status: 404 }) : new Response(body, { status: 200 })
  })
}

describe('OpenUI content reader & OUIStorageAdapter', () => {
  let fetchMock: ReturnType<typeof mockFetch>

  beforeEach(() => {
    clearOUICache()
    fetchMock = mockFetch()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads a topic bundle with compiled sections and diagnostics', async () => {
    const bundle = await loadOUITopic('demo')
    expect(bundle.manifest.title).toBe('Demo')
    expect(bundle.sections.map((s) => [s.sectionFolder, s.meta.type])).toEqual([['intro', 'text'], ['quiz', 'quiz']])
    expect(bundle.sections[0].diagnostics).toEqual([])
    expect(bundle.sections[1].diagnostics).toEqual([expect.objectContaining({ tier: 3, line: 3 })])
    expect(bundle.sections[1].source).toBe(FILES['/content/demo/sections/quiz.oui'])
  })

  it('caches topic bundles', async () => {
    const first = await loadOUITopic('demo')
    const calls = fetchMock.mock.calls.length
    expect(await loadOUITopic('demo')).toBe(first)
    expect(fetchMock.mock.calls.length).toBe(calls)
  })

  it('rejects with OUILoadError when a section cannot compile', async () => {
    await expect(loadOUITopic('broken')).rejects.toBeInstanceOf(OUILoadError)
    await expect(loadOUITopic('broken')).rejects.toThrow(/broken\/sections\/bad\.oui[\s\S]*line 1/)
  })

  it('builds catalog routes from topic manifests', async () => {
    expect(await loadOUICatalog()).toEqual([{
      id: 'demo',
      label: 'Demo',
      path: '/topics/demo',
      category: 'Architecture',
      description: 'A demo topic',
      tags: ['ai'],
    }])
  })

  it('implements the storage port', async () => {
    const adapter = new OUIStorageAdapter()
    expect(await adapter.listTopics()).toEqual(['demo'])

    const section = await adapter.readSection('demo', 'intro')
    expect(section).toEqual({
      meta: { type: 'text', title: 'Intro', resource: '.' },
      data: { type: 'text', paragraphs: ['Hello.'] },
      body: 'root = Text("Intro", ["Hello."])',
    })

    await adapter.saveSection('demo', 'intro', section.data, 'root = Text("Intro", ["Bye."])')
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
    expect(url).toBe(OUI_SAVE_ENDPOINT)
    expect(JSON.parse(init!.body as string)).toEqual({ topicId: 'demo', sectionName: 'intro', source: 'root = Text("Intro", ["Bye."])' })
  })
})
