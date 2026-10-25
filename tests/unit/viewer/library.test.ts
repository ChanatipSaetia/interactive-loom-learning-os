import { describe, expect, it } from 'vitest'
import { isLoomFolder, nextTopicRequest, parseProgressNote, readFileListFiles, readLoomFolder, topicStatus, upNext, type FolderFiles } from '../../../src/viewer/library'
import { progressNote, stampEvent } from '../../../src/core/supporting/learner-progress'

const topicText = (id: string, sections: string[]) => [
  `// @loom-topic ${id}`,
  '// @loom-domain fight-animation',
  '// === topic.oui ===',
  `root = Topic("${id} title", "Fight Animation", "", [${sections.map((s) => `SectionRef("${s}")`).join(', ')}])`,
  ...sections.flatMap((s) => [`// === sections/${s}.oui ===`, `root = Text("${s}", ["x"])`]),
  '',
].join('\n')

const domainFiles = (prefix: string): FolderFiles => ({
  [`${prefix}domain.oui`]: 'root = Domain("Fight Animation", "Fights in Blender", [TopicRef("punch"), TopicRef("block"), TopicRef("dodge")], "A 10-second fight")\n',
  [`${prefix}topics/punch.loom.oui`]: topicText('punch', ['pose', 'timing']),
  [`${prefix}topics/block.loom.oui`]: topicText('block', ['guard', 'counter']),
  [`${prefix}topics/extra.loom.oui`]: topicText('extra', ['one']),
  [`${prefix}progress/punch-2026-10-20.md`]: progressNote(
    { id: 'punch', domain: 'fight-animation', sections: [{ name: 'pose', title: 'Pose' }, { name: 'timing', title: 'Timing' }] },
    [stampEvent({ topic: 'punch', item: 'sections/pose.oui', kind: 'seen' }, 'x', new Date(2026, 9, 20, 9)), stampEvent({ topic: 'punch', item: 'sections/timing.oui#q1', kind: 'answered', result: 'wrong' }, 'x', new Date(2026, 9, 20, 10))],
    new Date(2026, 9, 20, 18),
  ).text,
})

describe('the learner\'s Loom folder in Viewer', () => {
  it('reads a progress note Loom wrote', () => {
    const note = parseProgressNote(domainFiles('')['progress/punch-2026-10-20.md'])!
    expect(note).toEqual({ domain: 'fight-animation', topic: 'punch', date: '2026-10-20', played: ['pose', 'timing'], answers: { 'sections/timing.oui#q1': 'wrong' } })
    expect(parseProgressNote('# just a note')).toBeNull()
  })

  it('opens a domain folder: planned topics in order, then the ones the plan does not list', () => {
    const files = domainFiles('')
    expect(isLoomFolder(files)).toBe(true)
    const { kind, domains: [domain] } = readLoomFolder(files, 'fight-animation')
    expect(kind).toBe('domain')
    expect(domain.title).toBe('Fight Animation')
    expect(domain.goal).toBe('A 10-second fight')
    expect(domain.topics.map((t) => `${t.id}:${t.planned}:${!!t.topic}`)).toEqual(['punch:true:true', 'block:true:true', 'dodge:true:false', 'extra:false:true'])
    expect(domain.topics[0].topic?.domainId).toBe('fight-animation')
  })

  it('opens the library: domains in index order, and domain folders it does not list', () => {
    const files = { 'index.oui': 'root = Library([DomainRef("fight-animation")])\n', ...domainFiles('fight-animation/'), 'networking/domain.oui': 'root = Domain("Home Networking", "", [])\n' }
    const library = readLoomFolder(files, 'Loom')
    expect(library.kind).toBe('library')
    expect(library.domains.map((d) => d.id)).toEqual(['fight-animation', 'networking'])
    expect(library.domains[0].topics).toHaveLength(4)
    expect(library.domains[0].notes).toHaveLength(1)
  })

  it('merges notes with this device\'s events: the latest try counts, and done means all played with nothing wrong', () => {
    const { domains: [domain] } = readLoomFolder(domainFiles(''), 'fight-animation')
    const [punch, block, dodge] = domain.topics
    expect(topicStatus(punch, domain.notes, [])).toMatchObject({ kind: 'to-review', played: 2, total: 2, review: ['sections/timing.oui#q1'], last: '2026-10-20' })
    const fixed = [stampEvent({ topic: 'punch', item: 'sections/timing.oui#q1', kind: 'answered', result: 'correct' }, 'viewer', new Date(2026, 9, 22, 9))]
    expect(topicStatus(punch, domain.notes, fixed)).toMatchObject({ kind: 'done', review: [], last: '2026-10-22' })
    expect(topicStatus(block, domain.notes, []).kind).toBe('not-started')
    expect(topicStatus(block, domain.notes, [stampEvent({ topic: 'block', item: 'sections/guard.oui', kind: 'seen' }, 'v')]).kind).toBe('in-progress')
    expect(topicStatus(dodge, domain.notes, []).kind).toBe('missing')
  })

  it('names the topic up next and asks the chat for it', () => {
    const { domains: [domain] } = readLoomFolder(domainFiles(''), 'fight-animation')
    const statuses = new Map(domain.topics.map((t) => [t.id, topicStatus(t, domain.notes, [])]))
    expect(upNext(domain, statuses)?.id).toBe('punch')
    const request = nextTopicRequest(domain, statuses)
    expect(request).toContain('"Fight Animation" (`Loom/fight-animation/`)')
    expect(request).toContain('My goal: A 10-second fight')
    expect(request).toContain('- punch title (`punch`): 2 of 2 sections played, to review: `sections/timing.oui#q1`')
    expect(request).toContain('- dodge (`dodge`): not written yet')
    expect(request).not.toContain('extra')
  })

  it('reads a folder picked with a file input, relative to it', async () => {
    const file = (path: string, text: string) => ({ name: path.split('/').pop()!, webkitRelativePath: path, text: async () => text }) as unknown as File
    const files = await readFileListFiles([file('fight-animation/domain.oui', 'x'), file('fight-animation/topics/a.loom.oui', 'y'), file('fight-animation/notes.txt', 'z')])
    expect(Object.keys(files).sort()).toEqual(['domain.oui', 'topics/a.loom.oui'])
  })
})
