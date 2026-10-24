// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { mkdtemp, mkdir, rm, utimes, writeFile } from 'node:fs/promises'
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
})
