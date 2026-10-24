/**
 * The local server's memory folder (decisions 149, 186, 187): the learner's
 * event log as `events-<device>.jsonl` files (one per machine, merged by union,
 * so a folder synced by OneDrive, Google Drive or Dropbox never sees two
 * writers on one file) and the topics shown, as `topics/<id>.loom.oui`.
 * Pointed at the drive's `Loom/` folder (decision 198), it follows its domain
 * layout (`<domain-id>/topics/`, `<domain-id>/progress/`, storage-guide.ts):
 * topics that name a domain are saved in its folder, and the progress notes
 * chats on the phone or the web saved there are read back.
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
const ID = /^[\w-]+$/
const DOMAIN_LINE = /^\/\/\s*@loom-domain\s+([\w-]+)\s*$/m

export function folderStore(dir: string, device = `local-${String(hostname()).replace(/[^\w-]/g, '-')}`): LearnerStore {
  const topics = join(dir, 'topics')
  const ready = Promise.all([mkdir(dir, { recursive: true }), mkdir(topics, { recursive: true })])

  const list = async (folder: string): Promise<string[]> => {
    try {
      return (await readdir(folder)) as string[]
    } catch {
      return []
    }
  }
  /** `<sub>/` at the top (topics saved without a domain) and in each domain folder, `<domain>/<sub>/` (storage-guide.ts). */
  const foldersOf = async (sub: 'topics' | 'progress', domain?: string): Promise<Array<{ domain?: string; path: string }>> => {
    await ready
    if (domain) return ID.test(domain) ? [{ domain, path: join(dir, domain, sub) }] : []
    const domains = (await list(dir)).filter((name) => ID.test(name) && name !== 'topics' && name !== 'progress')
    return [{ path: join(dir, sub) }, ...domains.map((d) => ({ domain: d, path: join(dir, d, sub) }))]
  }

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
      // A topic that names its domain goes to Loom/<domain-id>/topics/, as the storage guide says
      const domain = DOMAIN_LINE.exec(topic.oui)?.[1]
      const folder = domain ? join(dir, domain, 'topics') : topics
      await mkdir(folder, { recursive: true })
      await writeFile(join(folder, `${topic.id}.loom.oui`), topic.oui)
    },
    async listTopics(domain?: string) {
      const ids = new Set<string>()
      for (const folder of await foldersOf('topics', domain)) {
        for (const f of await list(folder.path)) if (TOPIC_FILE.test(f)) ids.add(TOPIC_FILE.exec(f)![1])
      }
      return [...ids].sort()
    },
    async readTopic(id: string) {
      if (!ID.test(id)) return null
      for (const folder of await foldersOf('topics')) {
        try {
          return await readFile(join(folder.path, `${id}.loom.oui`), 'utf8')
        } catch {
          // Not in this folder
        }
      }
      return null
    },
    async readLoomFiles(domain?: string) {
      await ready
      const root = domain ? (ID.test(domain) ? join(dir, domain) : null) : dir
      if (!root) return {}
      const files: Record<string, string> = {}
      const walk = async (folder: string, prefix: string, depth: number) => {
        for (const name of await list(folder)) {
          if (name.startsWith('.') || name.startsWith('events-')) continue
          const path = join(folder, name)
          const info = await stat(path).catch(() => null)
          if (info?.isDirectory()) {
            if (depth < 2) await walk(path, `${prefix}${name}/`, depth + 1)
          } else if (/\.(oui|md)$/.test(name)) files[`${prefix}${name}`] = await readFile(path, 'utf8')
        }
      }
      await walk(root, '', 0)
      return files
    },
    async readNotes() {
      const notes: Array<ProgressNoteFile & { time: number }> = []
      for (const folder of await foldersOf('progress')) {
        for (const name of (await list(folder.path)).filter((f) => NOTE_FILE.test(f))) {
          const file = join(folder.path, name)
          const [text, info] = await Promise.all([readFile(file, 'utf8'), stat(file)])
          notes.push({ name: folder.domain ? `${folder.domain}/${name}` : name, text, time: Number(info.mtimeMs) })
        }
      }
      return notes.sort((a, b) => b.time - a.time).map(({ name, text }): ProgressNoteFile => ({ name, text }))
    },
  }
}
