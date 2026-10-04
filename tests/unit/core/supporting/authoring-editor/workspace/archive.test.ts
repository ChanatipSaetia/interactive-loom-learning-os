import { describe, it, expect } from 'vitest'
import {
  TopicArchiveError,
  TopicWorkspace,
  WorkspaceError,
  createTopicSource,
  createTopicZip,
  groupTopicFiles,
  memoryFolder,
  parseTopicSource,
  readTopicArchive,
  readTopicText,
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

describe('single file (.loom.oui)', () => {
  it('round-trips topics exactly, topic.oui first', () => {
    const blankTail = { topicId: 'two', files: { 'topic.oui': TOPIC, 'sections/intro.oui': `${INTRO}\n\n` } }
    const source = createTopicSource([demo(), blankTail])
    expect(source.startsWith('// @loom-topic demo\n// === topic.oui ===\nroot = Topic(')).toBe(true)
    expect(source.indexOf('// === sections/intro.oui ===')).toBeLessThan(source.indexOf('// === sections/quiz.oui ==='))
    expect(parseTopicSource(source)).toEqual([demo(), blankTail])
    expect(parseTopicSource(source.replace(/\n/g, '\r\n'))).toEqual([demo(), blankTail])
  })

  it('ignores markdown code fences and names a headerless topic after the fallback', () => {
    expect(parseTopicSource(`\`\`\`oui\n${createTopicSource([demo()])}\`\`\`\n`)).toEqual([demo()])
    expect(() => parseTopicSource(`Here is your topic:\n\`\`\`oui\n${createTopicSource([demo()])}\`\`\``)).toThrow(/before the first file marker/)
    expect(parseTopicSource(`// === topic.oui ===\n${TOPIC}`, 'fallback')).toEqual([{ topicId: 'fallback', files: { 'topic.oui': TOPIC } }])
  })

  it('rejects text that is not a topic, including old JSON bundles', () => {
    expect(() => parseTopicSource(QUIZ)).toThrow(TopicArchiveError)
    expect(() => parseTopicSource(QUIZ)).toThrow(/before the first file marker/)
    expect(() => parseTopicSource('// just a comment\n')).toThrow(/no file markers/)
    expect(() => parseTopicSource('```json\n{"format": "loom-topic-bundle"}\n```')).toThrow(/\.loom\.json\) are no longer supported/)
    expect(() => parseTopicSource(`// === sections/intro.oui ===\n${INTRO}`)).toThrow(/no `\/\/ === topic.oui ===` part/)
    expect(() => parseTopicSource(`// === topic.oui ===\n${TOPIC}// === notes.md ===\nhi\n`)).toThrow(/"notes.md" is not a topic file/)
    expect(() => parseTopicSource(`// === topic.oui ===\n${TOPIC}// === topic.oui ===\n${TOPIC}`)).toThrow(/appears twice/)
    expect(() => parseTopicSource(`// @loom-topic Bad-ID\n// === topic.oui ===\n${TOPIC}`)).toThrow(/not a valid topic ID/)
  })
})

describe('marker lines as AI chats write them', () => {
  const topicWith = (marker: string) => `// @loom-topic g\n// === topic.oui ===\n${TOPIC}${marker}\n${INTRO}`
  const expected = { 'topic.oui': TOPIC, 'sections/intro.oui': INTRO }

  it.each([
    '// === sections/intro.oui ===',
    '// sections/intro.oui',
    '// --- sections/intro.oui ---',
    '// ═══ sections/intro.oui ═══',
    '// File: sections/intro.oui',
    '// === g/sections/intro.oui ===',
    '// **`sections/intro.oui`**',
  ])('splits files at %s', (marker) => {
    expect(parseTopicSource(topicWith(marker))[0].files).toEqual(expected)
  })

  it('keeps ordinary comments that mention a file', () => {
    const text = `// === topic.oui ===\n${TOPIC}// === sections/intro.oui ===\n// see sections/quiz.oui next\n${INTRO}`
    expect(parseTopicSource(text)[0].files['sections/intro.oui']).toBe(`// see sections/quiz.oui next\n${INTRO}`)
  })

  it('recovers sections glued into topic.oui, in SectionRef order', () => {
    const glued = `// @loom-topic demo\n// === topic.oui ===\n${TOPIC}\n${INTRO}\n${QUIZ}`
    expect(parseTopicSource(glued)).toEqual([demo()])
  })

  it('explains a file with several roots it cannot split', () => {
    const text = `// === topic.oui ===\n${TOPIC}// === sections/intro.oui ===\n${INTRO}${QUIZ}`
    expect(() => parseTopicSource(text)).toThrow(/sections\/intro.oui in topic "topic" has 2 `root =` statements/)
  })
})

describe('reading pasted text', () => {
  it('reads a .loom.oui text like parseTopicSource', () => {
    expect(readTopicText(createTopicSource([demo()]))).toEqual([demo()])
  })

  it('turns a single section into a one-section topic titled after the section', () => {
    expect(readTopicText(`\`\`\`oui\n${QUIZ}\`\`\``, 'check')).toEqual([{
      topicId: 'check',
      files: {
        'topic.oui': 'root = Topic("Check", "Single section", "", [SectionRef("check")])\n',
        'sections/check.oui': QUIZ,
      },
    }])
    const openui = '// @openui "Steep \\"Guide\\"" "By tea"\nroot = Card([TextContent("Hi")])\n'
    const [topic] = readTopicText(openui)
    expect(topic.topicId).toBe('pasted')
    expect(topic.files['topic.oui']).toContain('root = Topic("Steep \\"Guide\\""')
    expect(topic.files['sections/pasted.oui']).toBe(openui)
  })

  it('rejects empty text and a topic.oui on its own', () => {
    expect(() => readTopicText('  \n')).toThrow(/empty/)
    expect(() => readTopicText(TOPIC)).toThrow(/only a topic.oui, without its sections/)
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
  it('reads a .loom.oui file and a zip file', async () => {
    const single = pickedFile('demo.loom.oui', createTopicSource([demo()]))
    expect(await readTopicArchive(single)).toEqual([demo()])
    const zip = pickedFile('demo.zip', createTopicZip([demo()]))
    expect(await readTopicArchive(zip)).toEqual([{ topicId: 'demo', files: demo().files }])
  })

  it('reads a single section file only when asked to (Viewer, not Studio import)', async () => {
    await expect(readTopicArchive(pickedFile('quiz.oui', QUIZ))).rejects.toThrow(/before the first file marker/)
    const [topic] = await readTopicArchive(pickedFile('quiz.oui', QUIZ), { singleSection: true })
    expect(topic.topicId).toBe('quiz')
    expect(topic.files['sections/quiz.oui']).toBe(QUIZ)
  })

  it('reads a headerless, fenced .oui answer pasted from an LLM chat', async () => {
    const answer = `\`\`\`\n${createTopicSource([demo()]).replace('// @loom-topic demo\n', '')}\`\`\``
    expect(await readTopicArchive(pickedFile('My Topic.loom.oui', answer))).toEqual([{ topicId: 'my-topic', files: demo().files }])
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
