import { describe, it, expect } from 'vitest'
import {
  TopicArchiveError,
  TopicWorkspace,
  WorkspaceError,
  createTopicBundle,
  createTopicZip,
  groupTopicFiles,
  memoryFolder,
  parseTopicBundle,
  readTopicArchive,
  readTopicFolderFiles,
  readZipEntries,
  type TopicFiles,
} from '../../../../../../src/core/supporting/authoring-editor/workspace'
import { compileViewerTopic } from '../../../../../../src/viewer/compileTopic'

const TOPIC = 'root = Topic("Demo", "Architecture", "A demo", [SectionRef("intro"), SectionRef("quiz")])\n'
const INTRO = 'root = Text("Intro", ["Héllo ✨"])\n'
const QUIZ = 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "A", true, "Yes")])\n'

const demo = (): TopicFiles => ({
  topicId: 'demo',
  files: { 'sections/quiz.oui': QUIZ, 'topic.oui': TOPIC, 'sections/intro.oui': INTRO },
})

async function deflateRaw(text: string): Promise<Uint8Array> {
  const stream = new Response(text).body!.pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** A minimal zip with one deflated entry, as written by common zip tools. */
async function deflatedZip(name: string, text: string): Promise<Uint8Array> {
  const nameBytes = new TextEncoder().encode(name)
  const data = await deflateRaw(text)
  const localSize = 30 + nameBytes.length + data.length
  const out = new Uint8Array(localSize + 46 + nameBytes.length + 22)
  const v = new DataView(out.buffer)
  v.setUint32(0, 0x04034b50, true)
  v.setUint16(8, 8, true)
  v.setUint32(18, data.length, true)
  v.setUint16(26, nameBytes.length, true)
  out.set(nameBytes, 30)
  out.set(data, 30 + nameBytes.length)
  const c = localSize
  v.setUint32(c, 0x02014b50, true)
  v.setUint16(c + 10, 8, true)
  v.setUint32(c + 20, data.length, true)
  v.setUint16(c + 28, nameBytes.length, true)
  out.set(nameBytes, c + 46)
  const e = c + 46 + nameBytes.length
  v.setUint32(e, 0x06054b50, true)
  v.setUint16(e + 8, 1, true)
  v.setUint16(e + 10, 1, true)
  v.setUint32(e + 12, 46 + nameBytes.length, true)
  v.setUint32(e + 16, localSize, true)
  return out
}

/** jsdom's File lacks text()/arrayBuffer(), so fake the parts the readers use. */
function pickedFile(name: string, content: string | Uint8Array, webkitRelativePath = ''): File {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  return {
    name,
    webkitRelativePath,
    arrayBuffer: async () => bytes.slice().buffer,
    text: async () => new TextDecoder().decode(bytes),
  } as unknown as File
}

describe('single-file bundle', () => {
  it('round-trips topics with topic.oui first', () => {
    const text = createTopicBundle([demo()], '2026-01-01T00:00:00.000Z')
    expect(Object.keys(JSON.parse(text).topics[0].files)).toEqual(['topic.oui', 'sections/intro.oui', 'sections/quiz.oui'])
    expect(parseTopicBundle(text)).toEqual([{ topicId: 'demo', files: demo().files }])
  })

  it('ignores files that do not belong to a topic', () => {
    const text = JSON.stringify({
      format: 'loom-topic-bundle',
      version: 1,
      topics: [{ id: 'demo', files: { 'topic.oui': TOPIC, '../evil.oui': 'x', 'notes.txt': 'x', 'sections/Bad Name.oui': 'x' } }],
    })
    expect(parseTopicBundle(text)[0].files).toEqual({ 'topic.oui': TOPIC })
  })

  it('rejects files that are not bundles', () => {
    expect(() => parseTopicBundle('nope')).toThrow(TopicArchiveError)
    expect(() => parseTopicBundle('{"format":"other"}')).toThrow(/not a Loom topic bundle/)
    expect(() => parseTopicBundle(JSON.stringify({ format: 'loom-topic-bundle', version: 1, topics: [{ id: 'x', files: {} }] }))).toThrow(/no topic.oui/)
    expect(() => parseTopicBundle(JSON.stringify({ format: 'loom-topic-bundle', version: 99, topics: [] }))).toThrow(/Unsupported/)
  })
})

describe('zip', () => {
  it('stores the topic as a folder, including folder entries', async () => {
    const zip = createTopicZip([demo()])
    const text = new TextDecoder().decode(zip)
    expect(text).toContain('demo/sections/')
    expect(await readZipEntries(zip)).toEqual({
      'demo/topic.oui': TOPIC,
      'demo/sections/intro.oui': INTRO,
      'demo/sections/quiz.oui': QUIZ,
    })
  })

  it('reads deflated entries', async () => {
    expect(await readZipEntries(await deflatedZip('demo/topic.oui', TOPIC))).toEqual({ 'demo/topic.oui': TOPIC })
  })

  it('rejects files that are not zips', async () => {
    await expect(readZipEntries(new Uint8Array(40))).rejects.toThrow(/not a valid zip/)
  })
})

describe('grouping files into topics', () => {
  it('finds every folder with a topic.oui', () => {
    const topics = groupTopicFiles({
      'content/demo/topic.oui': TOPIC,
      'content/demo/sections/intro.oui': INTRO,
      'content/other/topic.oui': TOPIC,
      'content/README.md': 'x',
    })
    expect(topics).toEqual([
      { topicId: 'demo', files: { 'topic.oui': TOPIC, 'sections/intro.oui': INTRO } },
      { topicId: 'other', files: { 'topic.oui': TOPIC } },
    ])
  })

  it('names a root-level topic after the fallback', () => {
    expect(groupTopicFiles({ 'topic.oui': TOPIC }, 'mine')[0].topicId).toBe('mine')
  })
})

describe('reading picked files', () => {
  it('reads a bundle file and a zip file', async () => {
    const bundle = pickedFile('demo.loom.json', createTopicBundle([demo()]))
    expect((await readTopicArchive(bundle))[0].files).toEqual(demo().files)
    const zip = pickedFile('demo.zip', createTopicZip([demo()]))
    expect(await readTopicArchive(zip)).toEqual([{ topicId: 'demo', files: demo().files }])
  })

  it('reads a picked folder', async () => {
    const file = (path: string, text: string) => pickedFile(path.split('/').pop()!, text, path)
    const topics = await readTopicFolderFiles([file('demo/topic.oui', TOPIC), file('demo/sections/quiz.oui', QUIZ), file('demo/.DS_Store', '')])
    expect(topics).toEqual([{ topicId: 'demo', files: { 'topic.oui': TOPIC, 'sections/quiz.oui': QUIZ } }])
    await expect(readTopicFolderFiles([file('x/readme.md', '')])).rejects.toThrow(/no topic.oui/)
  })
})

describe('workspace export and import', () => {
  it('exports the topic as currently edited', async () => {
    const workspace = await TopicWorkspace.open(memoryFolder('demo', demo().files))
    workspace.setSource('intro', 'root = Text("Changed", ["Hi."])\n')
    workspace.updateMetadata({ title: 'Renamed' })
    const { topicId, files } = workspace.exportFiles()
    expect(topicId).toBe('demo')
    expect(files['sections/intro.oui']).toContain('Changed')
    expect(files['topic.oui']).toContain('Renamed')
    expect(Object.keys(files).sort()).toEqual(['sections/intro.oui', 'sections/quiz.oui', 'topic.oui'])
  })

  it('replaces folder contents and removes sections not in the import', async () => {
    const folder = memoryFolder('demo', demo().files)
    const topic = 'root = Topic("New", "Cat", "", [SectionRef("only")])\n'
    await TopicWorkspace.replaceFolderContents(folder, { 'topic.oui': topic, 'sections/only.oui': INTRO })
    expect([...folder.files.keys()].sort()).toEqual(['sections/only.oui', 'topic.oui'])
    const reopened = await TopicWorkspace.open(folder)
    expect(reopened.getSnapshot().metadata.title).toBe('New')
    expect(reopened.getSnapshot().sections.map((s) => s.name)).toEqual(['only'])
  })

  it('refuses an import whose topic.oui is broken, leaving the folder untouched', async () => {
    const folder = memoryFolder('demo', demo().files)
    await expect(TopicWorkspace.replaceFolderContents(folder, { 'topic.oui': 'root = Nope(' })).rejects.toThrow(WorkspaceError)
    expect(folder.files.get('topic.oui')).toBe(TOPIC)
  })
})

describe('viewer topic compilation', () => {
  it('compiles sections in manifest order and reports broken or missing ones', () => {
    const topic = compileViewerTopic({
      topicId: 'demo',
      files: {
        'topic.oui': 'root = Topic("Demo", "Cat", "", [SectionRef("intro"), SectionRef("broken"), SectionRef("missing")])\n',
        'sections/intro.oui': INTRO,
        'sections/broken.oui': 'root = Quiz(',
      },
    })
    expect(topic.manifest?.title).toBe('Demo')
    expect(topic.sections.map((s) => [s.name, s.config?.type ?? null])).toEqual([['intro', 'text'], ['broken', null], ['missing', null]])
    expect(topic.sections[2].error).toMatch(/missing/)
  })

  it('reports a broken topic.oui', () => {
    expect(compileViewerTopic({ topicId: 'x', files: { 'topic.oui': 'nope(' } }).error).toMatch(/topic.oui has errors/)
  })
})
