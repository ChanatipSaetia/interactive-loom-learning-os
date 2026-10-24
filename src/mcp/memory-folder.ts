/**
 * The local server's memory folder (decisions 149, 186, 187): the learner's
 * event log as `events-<device>.jsonl` files (one per machine, merged by union,
 * so a folder synced by OneDrive, Google Drive or Dropbox never sees two
 * writers on one file) and the topics shown, as `topics/<id>.loom.oui`.
 * Pointed at the drive's `Loom/` folder (decision 198), it also reads the
 * progress notes chats on the phone or the web saved to `progress/*.md`.
 */
// @ts-expect-error Node's fs has no types in this project (see tests/unit/sections/present/helpers.ts)
import { appendFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
// @ts-expect-error Node's os has no types in this project
import { homedir, hostname } from 'node:os'
// @ts-expect-error Node's path has no types in this project
import { join } from 'node:path'
import { mergeEvents, parseJSONL, toJSONL, type LearnerEvent } from '../core/supporting/learner-progress/memory/events'
import type { LearnerStore, ProgressNoteFile, SavedTopic } from './server'

/** `~/.loom`, unless the learner points the server elsewhere (`--memory <folder>` or LOOM_MEMORY_DIR). */
export function defaultMemoryDir(): string {
  return join(homedir(), '.loom')
}

const TOPIC_FILE = /^([\w-]+)\.loom\.oui$/
const NOTE_FILE = /\.md$/

export function folderStore(dir: string, device = `local-${String(hostname()).replace(/[^\w-]/g, '-')}`): LearnerStore {
  const topics = join(dir, 'topics')
  const ready = Promise.all([mkdir(dir, { recursive: true }), mkdir(topics, { recursive: true })])
  return {
    device,
    async appendEvents(events: LearnerEvent[]) {
      await ready
      await appendFile(join(dir, `events-${device}.jsonl`), toJSONL(events.map((e) => ({ ...e, device }))))
    },
    async readEvents() {
      await ready
      const files = ((await readdir(dir)) as string[]).filter((f) => /^events-.+\.jsonl$/.test(f))
      const logs = await Promise.all(files.map(async (f) => parseJSONL(await readFile(join(dir, f), 'utf8'))))
      return mergeEvents(...logs)
    },
    async saveTopic(topic: SavedTopic) {
      await ready
      await writeFile(join(topics, `${topic.id}.loom.oui`), topic.oui)
    },
    async listTopics() {
      await ready
      const files = ((await readdir(topics)) as string[]).filter((f) => TOPIC_FILE.test(f)).sort()
      return files.map((f) => TOPIC_FILE.exec(f)![1])
    },
    async readTopic(id: string) {
      if (!/^[\w-]+$/.test(id)) return null
      try {
        return await readFile(join(topics, `${id}.loom.oui`), 'utf8')
      } catch {
        return null
      }
    },
    async readNotes() {
      const progress = join(dir, 'progress')
      let files: string[]
      try {
        files = ((await readdir(progress)) as string[]).filter((f) => NOTE_FILE.test(f))
      } catch {
        return []
      }
      const notes = await Promise.all(files.map(async (name) => {
        const file = join(progress, name)
        const [text, info] = await Promise.all([readFile(file, 'utf8'), stat(file)])
        return { name, text, time: Number(info.mtimeMs) }
      }))
      return notes.sort((a, b) => b.time - a.time).map(({ name, text }): ProgressNoteFile => ({ name, text }))
    },
  }
}
