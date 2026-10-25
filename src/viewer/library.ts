/**
 * The learner's Loom folder in Viewer (decisions 205–215 in grill-log-adaptive-learning.md):
 * a picked `Loom/` folder (with `index.oui`) is the library of domains, and a
 * picked `Loom/<domain-id>/` folder (with `domain.oui`) is one domain. This
 * module reads the files and works out each topic's status, the topic up
 * next and the request for the chat; `LibraryView.tsx` draws them.
 *
 * Status merges the progress notes in the folder (other devices, the chat)
 * with Viewer's own event log on this device, taking the latest result per
 * item. A topic is **done** when every section was played and no answer's
 * latest try is wrong.
 */
import { compileOUIDomain, compileOUILibrary, compileOUITopic } from '../core/learning-engine/composition/oui/compile'
import { parseTopicSource, type TopicFiles } from '../core/supporting/authoring-editor/workspace/archive'
import { localDate, type LearnerEvent } from '../core/supporting/learner-progress'

/** Files of a picked folder, by path relative to it (`domain.oui`, `fight-animation/topics/x.loom.oui`). */
export type FolderFiles = Record<string, string>

export interface DomainTopic {
  id: string
  /** In the domain's learning order (`domain.oui`). */
  planned: boolean
  /** Path of its `.loom.oui`, when the folder has one. */
  path?: string
  topic?: TopicFiles
  title: string
  /** Section file names, in order. */
  sections: string[]
}

export interface Domain {
  id: string
  title: string
  description: string
  goal?: string
  /** Planned topics in order, then topics in `topics/` the plan does not list. */
  topics: DomainTopic[]
  notes: ProgressNoteData[]
  /** Path prefix of the domain folder inside the picked folder: `''` or `fight-animation/`. */
  prefix: string
  error?: string
}

export interface LoomLibrary {
  /** A picked `Loom/` folder (with `index.oui`), or one domain folder. */
  kind: 'library' | 'domain'
  domains: Domain[]
  error?: string
}

export interface ProgressNoteData {
  domain?: string
  topic: string
  date: string
  played: string[]
  /** Latest result per item that day. */
  answers: Record<string, 'correct' | 'wrong'>
}

export type TopicStatusKind = 'missing' | 'not-started' | 'in-progress' | 'to-review' | 'done'

export interface TopicStatus {
  kind: TopicStatusKind
  played: number
  total: number
  /** Items whose latest answer is wrong. */
  review: string[]
  /** Last day the topic was studied (`YYYY-MM-DD`). */
  last?: string
}

const ID = /^[a-z0-9][a-z0-9_-]*$/
const TOPIC_PATH = /^(?:([^/]+)\/)?topics\/([^/]+)\.loom\.oui$/
const NOTE_PATH = /^(?:([^/]+)\/)?progress\/[^/]+\.md$/

/** Is this picked folder the learner's Loom folder or one of its domains? */
export function isLoomFolder(files: FolderFiles): boolean {
  return 'index.oui' in files || 'domain.oui' in files
}

/** Read a progress note written by Loom (`progress-note.ts`); null when it is not one. */
export function parseProgressNote(text: string): ProgressNoteData | null {
  const head = /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n?/g, '\n'))
  if (!head || !/^loom-progress:/m.test(head[1])) return null
  const field = (name: string) => new RegExp(`^${name}:\\s*(\\S+)\\s*$`, 'm').exec(head[1])?.[1]
  const topic = field('topic')
  const date = field('date')
  if (!topic || !date) return null
  const played: string[] = []
  const answers: Record<string, 'correct' | 'wrong'> = {}
  let part = ''
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) part = line.slice(3).trim()
    else if (part === 'Sections') {
      const checked = /^- \[x\] .*`([^`]+)`\)?\s*$/.exec(line)
      if (checked) played.push(checked[1])
    } else if (part === 'Answers') {
      const answer = /^- `([^`]+)`: (.+)$/.exec(line)
      if (answer) answers[answer[1]] = answer[2].trim().endsWith('right') ? 'correct' : 'wrong'
    }
  }
  return { domain: field('domain'), topic, date, played, answers }
}

function readTopic(text: string, id: string): TopicFiles | undefined {
  try {
    return parseTopicSource(text, id)[0]
  } catch {
    return undefined
  }
}

function readDomain(id: string, prefix: string, files: FolderFiles): Domain {
  const manifest = compileOUIDomain(files[`${prefix}domain.oui`] ?? '')
  const value = manifest.value
  const error = value ? undefined : `${prefix}domain.oui: ${manifest.issues.map((i) => i.message).join('; ') || 'missing'}`
  const found = new Map<string, string>()
  const notes: ProgressNoteData[] = []
  for (const [path, text] of Object.entries(files)) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    const topic = TOPIC_PATH.exec(rest)
    if (topic && !topic[1]) found.set(topic[2], path)
    const note = NOTE_PATH.exec(rest)
    if (note && !note[1]) {
      const parsed = parseProgressNote(text)
      if (parsed && (!parsed.domain || parsed.domain === id)) notes.push(parsed)
    }
  }
  const entry = (topicId: string, planned: boolean): DomainTopic => {
    const path = found.get(topicId)
    const topic = path ? readTopic(files[path], topicId) : undefined
    const manifest = topic ? compileOUITopic(topic.files['topic.oui'] ?? '').value : null
    return { id: topicId, planned, path, topic: topic && { ...topic, domainId: topic.domainId ?? id }, title: manifest?.title ?? topicId, sections: manifest?.sections ?? [] }
  }
  const order = value?.topics ?? []
  return {
    id,
    title: value?.title ?? id,
    description: value?.description ?? '',
    goal: value?.goal,
    topics: [...order.map((t) => entry(t, true)), ...[...found.keys()].filter((t) => !order.includes(t)).sort().map((t) => entry(t, false))],
    notes,
    prefix,
    error,
  }
}

/**
 * The library or the domain in a picked folder. `name` is the picked
 * folder's own name: a domain folder's name is its domain ID.
 */
export function readLoomFolder(files: FolderFiles, name: string): LoomLibrary {
  if ('domain.oui' in files && !('index.oui' in files)) return { kind: 'domain', domains: [readDomain(name, '', files)] }
  const index = compileOUILibrary(files['index.oui'] ?? '')
  const listed = index.value?.domains ?? []
  const present = [...new Set(Object.keys(files).map((p) => /^([^/]+)\/domain\.oui$/.exec(p)?.[1]).filter((d): d is string => !!d))]
  const ids = [...listed, ...present.filter((d) => !listed.includes(d)).sort()].filter((d) => ID.test(d))
  return {
    kind: 'library',
    domains: ids.map((id) => (`${id}/domain.oui` in files ? readDomain(id, `${id}/`, files) : { id, title: id, description: '', topics: [], notes: [], prefix: `${id}/`, error: `${id}/domain.oui is missing.` })),
    error: index.value ? undefined : `index.oui: ${index.issues.map((i) => i.message).join('; ')}`,
  }
}

/** A note counts as written at the end of its day: it holds that day's final state. */
const noteTime = (date: string) => `${date}T23:59:59`

/** Where one topic stands, from the notes and this device's events (decision 212). */
export function topicStatus(topic: DomainTopic, notes: ProgressNoteData[], events: LearnerEvent[]): TopicStatus {
  if (!topic.topic) return { kind: 'missing', played: 0, total: 0, review: [] }
  const played = new Set<string>()
  const latest = new Map<string, { t: string; result: 'correct' | 'wrong' }>()
  let last: string | undefined
  const answer = (item: string, t: string, result: 'correct' | 'wrong') => {
    const known = latest.get(item)
    if (!known || known.t <= t) latest.set(item, { t, result })
  }
  for (const note of notes.filter((n) => n.topic === topic.id)) {
    note.played.forEach((s) => played.add(s))
    for (const [item, result] of Object.entries(note.answers)) answer(item, noteTime(note.date), result)
    if (!last || note.date > last) last = note.date
  }
  for (const e of events.filter((ev) => ev.topic === topic.id)) {
    const section = /^sections\/([^#]+)\.oui/.exec(e.item)?.[1]
    if (section) played.add(section)
    if (e.kind === 'answered' && e.result) answer(e.item, e.t, e.result)
    const day = localDate(new Date(e.t))
    if (!last || day > last) last = day
  }
  const total = topic.sections.length
  const count = topic.sections.filter((s) => played.has(s)).length
  const review = [...latest].filter(([, a]) => a.result === 'wrong').map(([item]) => item)
  const kind: TopicStatusKind = count === 0 && latest.size === 0 ? 'not-started'
    : review.length ? 'to-review'
      : count >= total ? 'done'
        : 'in-progress'
  return { kind, played: count, total, review, last }
}

/** The topic to take next: the first planned topic that is not done (decision 213). */
export function upNext(domain: Domain, statuses: Map<string, TopicStatus>): DomainTopic | undefined {
  return domain.topics.find((t) => t.planned && statuses.get(t.id)?.kind !== 'done')
}

/** Each planned topic's status, one line each, for the chat's model. */
export function domainStatusLines(domain: Domain, statuses: Map<string, TopicStatus>): string[] {
  return domain.topics.filter((t) => t.planned).map((t) => {
      const s = statuses.get(t.id)!
      const state = s.kind === 'missing' ? 'not written yet'
        : s.kind === 'done' ? 'done'
          : s.kind === 'not-started' ? 'not started'
            : `${s.played} of ${s.total} sections played${s.review.length ? `, to review: ${s.review.map((r) => `\`${r}\``).join(', ')}` : ''}`
      return `- ${t.title} (\`${t.id}\`): ${state}`
  })
}

/** A request for the chat to plan or write the next topic in this domain (decision 214). */
export function nextTopicRequest(domain: Domain, statuses: Map<string, TopicStatus>): string {
  const next = upNext(domain, statuses)
  const lines = [
    `Plan my next Loom topic in the domain "${domain.title}" (\`Loom/${domain.id}/\`).`,
    ...(domain.goal ? [`My goal: ${domain.goal}`] : []),
    '',
    'Where I am:',
    ...domainStatusLines(domain, statuses),
    '',
    next
      ? next.topic
        ? `Up next is "${next.title}" (\`${next.id}\`). Suggest whether to continue it, review what I missed, or move on, and show the topic.`
        : `Up next is \`${next.id}\`, which is not written yet: write it as a short topic for this domain (with \`// @loom-domain ${domain.id}\`), show it, and save it to \`Loom/${domain.id}/topics/${next.id}.loom.oui\`.`
      : "Every planned topic is done: propose a new topic that moves me toward my goal, add it to the domain's domain.oui, write it and show it.",
    'Follow get_storage_guide (or the storage rules in your Loom skill) for where files go.',
  ]
  return lines.join('\n')
}

// ---- Reading a picked folder ------------------------------------------------

/** Files Loom keeps in its folder: `.oui` (with `.loom.oui`) and progress notes. */
const WANTED = /\.(oui|md)$/
const MAX_DEPTH = 3

type DirectoryIteration = { values(): AsyncIterable<FileSystemHandle> }

/** A picked folder through the File System Access API, paths relative to it. */
export async function readHandleFiles(root: FileSystemDirectoryHandle): Promise<FolderFiles> {
  const files: FolderFiles = {}
  const walk = async (dir: FileSystemDirectoryHandle, prefix: string, depth: number) => {
    for await (const entry of (dir as unknown as DirectoryIteration).values()) {
      if (entry.name.startsWith('.')) continue
      const path = `${prefix}${entry.name}`
      if (entry.kind === 'file' && WANTED.test(entry.name)) files[path] = await (await (entry as FileSystemFileHandle).getFile()).text()
      else if (entry.kind === 'directory' && depth < MAX_DEPTH) await walk(entry as FileSystemDirectoryHandle, `${path}/`, depth + 1)
    }
  }
  await walk(root, '', 0)
  return files
}

/** A folder picked with a file input (`webkitdirectory`), paths relative to it. */
export async function readFileListFiles(list: File[]): Promise<FolderFiles> {
  const files: FolderFiles = {}
  for (const file of list) {
    const path = (file.webkitRelativePath || file.name).replace(/\\/g, '/').split('/').slice(1).join('/')
    if (path && WANTED.test(path) && path.split('/').length <= MAX_DEPTH + 1) files[path] = await file.text()
  }
  return files
}

/**
 * Write a progress note into the picked folder (decision 211):
 * `<domain prefix>progress/<topic>-<date>.md`, asking for write access first.
 */
export async function saveNoteToFolder(root: FileSystemDirectoryHandle, prefix: string, fileName: string, text: string): Promise<void> {
  const handle = root as FileSystemDirectoryHandle & { requestPermission?: (d: { mode: 'readwrite' }) => Promise<PermissionState> }
  if (handle.requestPermission && (await handle.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('Viewer was not allowed to write to the folder.')
  let dir = root
  for (const part of [...prefix.split('/').filter(Boolean), 'progress']) dir = await dir.getDirectoryHandle(part, { create: true })
  const file = await dir.getFileHandle(fileName, { create: true })
  const writable = await (file as FileSystemFileHandle & { createWritable(): Promise<{ write(t: string): Promise<void>; close(): Promise<void> }> }).createWritable()
  await writable.write(text)
  await writable.close()
}
