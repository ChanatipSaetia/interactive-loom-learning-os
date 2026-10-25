// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises'
// @ts-expect-error Node's fs has no types in this project
import { readFileSync } from 'node:fs'
// @ts-expect-error Node's os has no types in this project
import { tmpdir } from 'node:os'
// @ts-expect-error Node's path has no types in this project
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { folderStore } from '../../../src/mcp/memory-folder'

describe('memory folder: progress notes from other devices (slice 6)', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'loom-memory-'))
  })
  afterEach(() => rm(dir, { recursive: true, force: true }))

  it('has none until a chat saves one to progress/', async () => {
    expect(await folderStore(dir, 'test').readNotes!()).toEqual([])
  })

  it('reads progress/*.md, newest first, and nothing else', async () => {
    await mkdir(join(dir, 'progress'))
    await writeFile(join(dir, 'progress', 'kafka-2026-10-20.md'), 'older')
    await writeFile(join(dir, 'progress', 'chinese101-day1-2026-10-24.md'), 'newer')
    await writeFile(join(dir, 'progress', 'notes.txt'), 'not a note')
    await utimes(join(dir, 'progress', 'kafka-2026-10-20.md'), new Date(2026, 9, 20), new Date(2026, 9, 20))
    expect(await folderStore(dir, 'test').readNotes!()).toEqual([
      { name: 'chinese101-day1-2026-10-24.md', text: 'newer' },
      { name: 'kafka-2026-10-20.md', text: 'older' },
    ])
  })

  it('follows the domain layout: topics that name a domain go to its folder, notes come from every domain', async () => {
    const store = folderStore(dir, 'test')
    await store.saveTopic({ id: 'punch-basics', oui: '// @loom-topic punch-basics\n// @loom-domain fight-animation\n// === topic.oui ===\n' })
    await store.saveTopic({ id: 'loose', oui: '// @loom-topic loose\n// === topic.oui ===\n' })
    expect(readFileSync(join(dir, 'fight-animation', 'topics', 'punch-basics.loom.oui'), 'utf8')).toContain('@loom-domain')
    expect(await store.listTopics()).toEqual(['loose', 'punch-basics'])
    expect(await store.listTopics('fight-animation')).toEqual(['punch-basics'])
    expect(await store.readTopic('punch-basics')).toContain('fight-animation')
    await mkdir(join(dir, 'fight-animation', 'progress'), { recursive: true })
    await writeFile(join(dir, 'fight-animation', 'progress', 'punch-basics-2026-10-24.md'), '---\ndomain: fight-animation\n---')
    expect((await store.readNotes!()).map((n) => n.name)).toEqual(['fight-animation/punch-basics-2026-10-24.md'])
  })

  it('reads the Loom folder for show_library and show_domain, leaving out its own event logs', async () => {
    const store = folderStore(dir, 'test')
    await store.appendEvents([])
    await writeFile(join(dir, 'index.oui'), 'root = Library([DomainRef("chinese")])')
    await mkdir(join(dir, 'chinese', 'topics'), { recursive: true })
    await writeFile(join(dir, 'chinese', 'domain.oui'), 'root = Domain("Chinese", "", [])')
    await writeFile(join(dir, 'chinese', 'topics', 'tones.loom.oui'), '// @loom-topic tones')
    expect(Object.keys(await store.readLoomFiles!()).sort()).toEqual(['chinese/domain.oui', 'chinese/topics/tones.loom.oui', 'index.oui'])
    expect(Object.keys(await store.readLoomFiles!('chinese')).sort()).toEqual(['domain.oui', 'topics/tones.loom.oui'])
  })
})
