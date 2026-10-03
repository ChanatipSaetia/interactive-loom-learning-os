import { describe, it, expect } from 'vitest'
import {
  SECTION_TEMPLATES,
  TopicWorkspace,
  WorkspaceError,
  memoryFolder,
  humanize,
} from '../../../../../../src/core/supporting/authoring-editor/workspace'
import { compileOUITopic } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { KNOWN_SECTION_TYPES } from '../../../../../../src/core/learning-engine/validation/gateway'
import { validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'

const TOPIC = 'root = Topic("Demo", "Architecture", "A demo", [SectionRef("intro"), SectionRef("quiz")], ["ai"])\n'
const INTRO = 'root = Bullets("Intro", [Bullet("Hello.")])\n'
const QUIZ = 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "A", true, "Yes")])\n'

function demoFolder(extra: Record<string, string> = {}) {
  return memoryFolder('demo', { 'topic.oui': TOPIC, 'sections/intro.oui': INTRO, 'sections/quiz.oui': QUIZ, ...extra })
}

const topicOnDisk = (folder: ReturnType<typeof memoryFolder>) => compileOUITopic(folder.files.get('topic.oui')!).value

describe('section templates', () => {
  it('cover every section type', () => {
    expect(new Set(SECTION_TEMPLATES.map((t) => t.type))).toEqual(KNOWN_SECTION_TYPES)
  })

  for (const template of SECTION_TEMPLATES) {
    it(`${template.type} template is valid`, () => {
      const result = validateOUISection(template.source('My Section'))
      expect(result.diagnostics).toEqual([])
      expect(result.payload?.meta).toMatchObject({ type: template.type, title: 'My Section' })
    })
  }

  it('humanizes folder names', () => {
    expect(humanize('my-new_topic')).toBe('My New Topic')
  })
})

describe('TopicWorkspace.open', () => {
  it('loads metadata and sections in topic.oui order', async () => {
    const ws = await TopicWorkspace.open(demoFolder())
    const snap = ws.getSnapshot()
    expect(snap.topicId).toBe('demo')
    expect(snap.metadata).toEqual({ title: 'Demo', category: 'Architecture', description: 'A demo', tags: ['ai'] })
    expect(snap.sections.map((s) => [s.name, s.lastValid?.meta.type])).toEqual([['intro', 'bullets'], ['quiz', 'quiz']])
    expect(snap.dirtySections).toEqual([])
    expect(snap.topicDirty).toBe(false)
    expect(snap.notices).toEqual([])
  })

  it('starts a new topic in an empty folder', async () => {
    const folder = memoryFolder('my-topic')
    const ws = await TopicWorkspace.open(folder)
    expect(ws.getSnapshot().metadata.title).toBe('My Topic')
    expect(ws.getSnapshot().sections).toEqual([])
    expect(topicOnDisk(folder)).toEqual({ title: 'My Topic', category: 'Uncategorized', description: '', sections: [] })
  })

  it('reports missing and unlisted section files', async () => {
    const folder = demoFolder({ 'sections/extra.oui': INTRO })
    folder.files.delete('sections/quiz.oui')
    const ws = await TopicWorkspace.open(folder)
    const snap = ws.getSnapshot()
    expect(snap.sections.map((s) => s.name)).toEqual(['intro', 'extra'])
    expect(snap.notices).toHaveLength(2)
    expect(snap.topicDirty).toBe(true)
  })

  it('refuses a broken topic.oui', async () => {
    await expect(TopicWorkspace.open(memoryFolder('x', { 'topic.oui': 'root = Topic(' }))).rejects.toBeInstanceOf(WorkspaceError)
  })
})

describe('content edits', () => {
  it('buffers source edits until save and keeps the last valid preview', async () => {
    const folder = demoFolder()
    const ws = await TopicWorkspace.open(folder)
    const notified: number[] = []
    ws.subscribe(() => notified.push(1))

    ws.setSource('intro', 'root = Bullets("Intro", [Bullet("Hello."), Bullet("More.")])\n')
    expect(ws.getSnapshot().dirtySections).toEqual(['intro'])
    expect(ws.section('intro')?.lastValid?.data).toEqual({ type: 'bullets', items: [{ text: 'Hello.' }, { text: 'More.' }] })

    ws.setSource('intro', 'root = Text("Intro", [')
    expect(ws.section('intro')?.validation.status).toBe('error')
    expect(ws.section('intro')?.lastValid?.data).toEqual({ type: 'bullets', items: [{ text: 'Hello.' }, { text: 'More.' }] })
    expect(folder.files.get('sections/intro.oui')).toBe(INTRO)

    ws.setSource('intro', '// edited\nroot = Bullets("Intro", [Bullet("Bye.")])\n')
    await ws.save()
    expect(folder.files.get('sections/intro.oui')).toBe('// edited\nroot = Bullets("Intro", [Bullet("Bye.")])\n')
    expect(ws.getSnapshot().dirtySections).toEqual([])
    expect(notified.length).toBeGreaterThan(0)
  })

  it('reprints the source for Visual Form edits', async () => {
    const ws = await TopicWorkspace.open(demoFolder())
    ws.setSectionData('intro', { type: 'bullets', title: 'Intro', resource: '.' }, { type: 'bullets', items: [{ text: 'From the form' }] })
    expect(ws.section('intro')?.source).toBe('root = Bullets("Intro", [Bullet("From the form")])\n')
  })

  it('reprints openui sections with their directive', async () => {
    const ws = await TopicWorkspace.open(demoFolder())
    ws.setSectionData('intro', { type: 'openui', title: 'Intro', resource: '.' }, { type: 'openui', source: 'root = Stack([TextContent("From the form")])' })
    expect(ws.section('intro')?.source).toBe('// @openui "Intro"\nroot = Stack([TextContent("From the form")])\n')
  })

  it('saves topic metadata edits', async () => {
    const folder = demoFolder()
    const ws = await TopicWorkspace.open(folder)
    ws.updateMetadata({ title: 'Renamed', tags: ['ai', 'agents'] })
    expect(ws.getSnapshot().topicDirty).toBe(true)
    await ws.save()
    expect(ws.getSnapshot().topicDirty).toBe(false)
    expect(topicOnDisk(folder)).toMatchObject({ title: 'Renamed', tags: ['ai', 'agents'], sections: ['intro', 'quiz'] })
  })
})

describe('structural actions', () => {
  it('adds a section from a template and writes it immediately', async () => {
    const folder = demoFolder()
    const ws = await TopicWorkspace.open(folder)
    await ws.addSection('flow', 'flowchart', 'Checkout Flow', 1)
    expect(ws.getSnapshot().sections.map((s) => s.name)).toEqual(['intro', 'flow', 'quiz'])
    expect(folder.files.get('sections/flow.oui')).toContain('root = Flowchart("Checkout Flow"')
    expect(topicOnDisk(folder)?.sections).toEqual(['intro', 'flow', 'quiz'])
    expect(ws.getSnapshot().topicDirty).toBe(false)
  })

  it('validates section names', async () => {
    const ws = await TopicWorkspace.open(demoFolder())
    expect(ws.checkSectionName('Bad Name')).toMatch(/lowercase/)
    expect(ws.checkSectionName('quiz')).toMatch(/already exists/)
    expect(ws.checkSectionName('quiz', 'quiz')).toBeNull()
    await expect(ws.addSection('quiz', 'text', 'T')).rejects.toBeInstanceOf(WorkspaceError)
  })

  it('renames a section, keeping unsaved edits buffered', async () => {
    const folder = demoFolder()
    const ws = await TopicWorkspace.open(folder)
    ws.setSource('quiz', QUIZ.replace('Why?', 'How?'))
    await ws.renameSection('quiz', 'knowledge-check')
    expect(folder.files.has('sections/quiz.oui')).toBe(false)
    expect(folder.files.get('sections/knowledge-check.oui')).toBe(QUIZ)
    expect(topicOnDisk(folder)?.sections).toEqual(['intro', 'knowledge-check'])
    expect(ws.getSnapshot().dirtySections).toEqual(['knowledge-check'])
  })

  it('deletes and reorders sections', async () => {
    const folder = demoFolder()
    const ws = await TopicWorkspace.open(folder)
    await ws.moveSection(1, 0)
    expect(topicOnDisk(folder)?.sections).toEqual(['quiz', 'intro'])
    await ws.deleteSection('intro')
    expect(folder.files.has('sections/intro.oui')).toBe(false)
    expect(topicOnDisk(folder)?.sections).toEqual(['quiz'])
  })

  it('writes structural changes with the saved metadata, leaving metadata edits pending', async () => {
    const folder = demoFolder()
    const ws = await TopicWorkspace.open(folder)
    ws.updateMetadata({ title: 'Unsaved Title' })
    await ws.moveSection(1, 0)
    expect(topicOnDisk(folder)?.title).toBe('Demo')
    expect(ws.getSnapshot().topicDirty).toBe(true)
    await ws.save()
    expect(topicOnDisk(folder)).toMatchObject({ title: 'Unsaved Title', sections: ['quiz', 'intro'] })
  })
})
