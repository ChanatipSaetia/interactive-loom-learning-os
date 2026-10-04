/**
 * Topic archives — move whole topic folders in and out of Loom Studio.
 *
 *   - Single file (`<topic>.loom.oui`): every `.oui` file of one or more
 *     topics in one text file. Each topic starts with `// @loom-topic <id>`,
 *     each file with a `// === <path> ===` marker line. Easy for an LLM chat
 *     to write (see composition/oui/authoring-prompt.ts).
 *   - Zip (`<topic>.zip`): the topic folder itself (`<topic>/topic.oui`,
 *     `<topic>/sections/<name>.oui`), including folder entries.
 *
 * Paths inside a topic are relative to the topic folder and use `/`, the
 * same as TopicFolder. Only `topic.oui` and `sections/<name>.oui` belong to a
 * topic; anything else is ignored on import.
 */
import { CONTENT_ID } from '../../../learning-engine/composition/oui/catalog-gen'

export interface TopicFiles {
  /** Topic folder name. */
  topicId: string
  /** File contents keyed by path relative to the topic folder. */
  files: Record<string, string>
}

export class TopicArchiveError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TopicArchiveError'
  }
}

export const SOURCE_EXTENSION = '.loom.oui'

const TOPIC_FILE = 'topic.oui'
const SECTION_FILE = /^sections\/([^/]+)\.oui$/

/** True for paths that belong to a topic folder (`topic.oui`, `sections/<name>.oui`). */
export function isTopicPath(path: string): boolean {
  if (path === TOPIC_FILE) return true
  const match = SECTION_FILE.exec(path)
  return !!match && CONTENT_ID.test(match[1])
}

/** Topic files in a stable order: topic.oui first, then sections by name. */
function sortedPaths(files: Record<string, string>): string[] {
  return Object.keys(files).sort((a, b) => (a === TOPIC_FILE ? -1 : b === TOPIC_FILE ? 1 : a.localeCompare(b)))
}

// ============================================================================
// Single file (.loom.oui)
// ============================================================================

const TOPIC_HEADER = /^\/\/\s*@loom-topic\s+(\S+)\s*$/
const FILE_MARKER = /^\/\/\s*={3,}\s*(\S+?)\s*={3,}\s*$/
const CODE_FENCE = /^\s*```[\w-]*\s*$/

/**
 * Serialize topics into one `.loom.oui` text: per topic a `// @loom-topic <id>`
 * line, then each file (topic.oui first) after its `// === <path> ===` marker.
 * File text is kept verbatim, so the round trip is exact for files that end
 * with a newline (a missing final newline is added).
 */
export function createTopicSource(topics: TopicFiles[]): string {
  return topics.map(({ topicId, files }) => {
    const parts = sortedPaths(files).map((p) => `// === ${p} ===\n${files[p].endsWith('\n') ? files[p] : `${files[p]}\n`}`)
    return `// @loom-topic ${topicId}\n${parts.join('')}`
  }).join('')
}

/**
 * Parse a `.loom.oui` text into its topics. Markdown code fence lines (as LLM
 * chats add them) are ignored. A text without a `// @loom-topic` line is one
 * topic named `fallbackId`. Throws TopicArchiveError when it is not a topic.
 */
export function parseTopicSource(text: string, fallbackId = 'topic'): TopicFiles[] {
  if (text.replace(/^\s*```[\w-]*\s*$/gm, '').trimStart().startsWith('{')) {
    throw new TopicArchiveError('JSON topic bundles (.loom.json) are no longer supported. Export the topic again from Loom Studio as a .loom.oui file.')
  }
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines[lines.length - 1] === '') lines.pop()

  const topics: Array<{ topicId: string; files: Record<string, string[]> }> = []
  let topic: (typeof topics)[number] | null = null
  let file: string[] | null = null
  for (const line of lines) {
    if (CODE_FENCE.test(line)) continue
    const header = TOPIC_HEADER.exec(line)
    if (header) {
      topic = { topicId: header[1], files: {} }
      topics.push(topic)
      file = null
      continue
    }
    const marker = FILE_MARKER.exec(line)
    if (marker) {
      const path = marker[1]
      if (!isTopicPath(path)) {
        throw new TopicArchiveError(`"${path}" is not a topic file. Use topic.oui or sections/<name>.oui (lowercase letters, digits, - and _).`)
      }
      if (!topic) {
        topic = { topicId: fallbackId, files: {} }
        topics.push(topic)
      }
      if (topic.files[path]) throw new TopicArchiveError(`${path} appears twice in topic "${topic.topicId}".`)
      file = topic.files[path] = []
      continue
    }
    if (file) file.push(line)
    else if (line.trim() && !line.trim().startsWith('//')) {
      throw new TopicArchiveError('Content before the first file marker. Start each file with a line like `// === topic.oui ===`.')
    }
  }

  if (topics.every((t) => Object.keys(t.files).length === 0)) {
    throw new TopicArchiveError('This .oui file has no file markers. A .loom.oui file puts each file after a line like `// === sections/intro.oui ===`.')
  }
  return topics.map(({ topicId, files }) => {
    if (!CONTENT_ID.test(topicId)) throw new TopicArchiveError(`"${topicId}" is not a valid topic ID (lowercase letters, digits, - and _).`)
    if (!(TOPIC_FILE in files)) throw new TopicArchiveError(`Topic "${topicId}" has no \`// === topic.oui ===\` part.`)
    return { topicId, files: Object.fromEntries(Object.entries(files).map(([p, l]) => [p, `${l.join('\n')}\n`])) }
  })
}

/** True when the text uses the `.loom.oui` layout (a `// @loom-topic` line or `// === <path> ===` markers). */
function hasTopicMarkers(text: string): boolean {
  return text.split(/\r?\n/).some((line) => TOPIC_HEADER.test(line) || FILE_MARKER.test(line))
}

const TOPIC_ROOT = /^\s*root\s*=\s*Topic\s*\(/m
const SECTION_TITLE = /^\s*root\s*=\s*\w+\s*\(\s*("(?:[^"\\\n]|\\.)*")/m
const OPENUI_TITLE = /^\s*\/\/\s*@openui\s+("(?:[^"\\\n]|\\.)*")/m

/** Title of a section source: its `// @openui "Title"` or the first string argument of `root = …(`. */
function sectionTitle(source: string): string | undefined {
  const match = OPENUI_TITLE.exec(source) ?? SECTION_TITLE.exec(source)
  if (!match) return undefined
  try {
    return JSON.parse(match[1]) as string
  } catch {
    return match[1].slice(1, -1)
  }
}

/**
 * Read topics from pasted or loaded text: a `.loom.oui` single file, or one
 * section file on its own (`root = Quiz(...)`, `// @openui …`), which becomes
 * a one-section topic named `name`. Throws TopicArchiveError otherwise.
 */
export function readTopicText(text: string, name = 'pasted'): TopicFiles[] {
  if (hasTopicMarkers(text) || text.replace(/^\s*```[\w-]*\s*$/gm, '').trimStart().startsWith('{')) {
    return parseTopicSource(text, name)
  }
  const source = text.replace(/\r\n?/g, '\n').split('\n').filter((line) => !CODE_FENCE.test(line)).join('\n').trim()
  if (!source) throw new TopicArchiveError('Nothing to open: the text is empty.')
  if (TOPIC_ROOT.test(source)) {
    throw new TopicArchiveError('This is only a topic.oui, without its sections. Open the whole .loom.oui file, or pick the topic folder.')
  }
  const id = CONTENT_ID.test(name) ? name : 'pasted'
  const title = sectionTitle(source) || id
  return [{
    topicId: id,
    files: {
      'topic.oui': `root = Topic(${JSON.stringify(title)}, "Single section", "", [SectionRef(${JSON.stringify(id)})])\n`,
      [`sections/${id}.oui`]: `${source}\n`,
    },
  }]
}

// ============================================================================
// Grouping loose files (folders, zips) into topics
// ============================================================================

/**
 * Find the topics in a set of files keyed by path (e.g. the entries of a zip
 * or a picked folder). Every folder holding a `topic.oui` is a topic; the
 * topic ID is that folder's name, or `fallbackId` for a `topic.oui` at the root.
 */
export function groupTopicFiles(entries: Record<string, string>, fallbackId = 'topic'): TopicFiles[] {
  const roots = Object.keys(entries)
    .filter((p) => p === TOPIC_FILE || p.endsWith(`/${TOPIC_FILE}`))
    .map((p) => p.slice(0, -TOPIC_FILE.length))
    .sort()
  return roots.map((root) => {
    const files: Record<string, string> = {}
    for (const [path, text] of Object.entries(entries)) {
      if (!path.startsWith(root)) continue
      const rel = path.slice(root.length)
      if (isTopicPath(rel)) files[rel] = text
    }
    const topicId = root.replace(/\/$/, '').split('/').pop() || fallbackId
    return { topicId, files }
  })
}

// ============================================================================
// Zip (store-only writer; reader also inflates deflated entries)
// ============================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date: Date): { time: number; date: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: (Math.max(0, date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

/** Build a zip holding each topic as a folder: `<topic>/topic.oui`, `<topic>/sections/…`. */
export function createTopicZip(topics: TopicFiles[], modified = new Date()): Uint8Array {
  const encoder = new TextEncoder()
  const entries: Array<{ name: string; data: Uint8Array }> = []
  for (const { topicId, files } of topics) {
    const paths = sortedPaths(files)
    entries.push({ name: `${topicId}/`, data: new Uint8Array() })
    if (paths.some((p) => p.startsWith('sections/'))) entries.push({ name: `${topicId}/sections/`, data: new Uint8Array() })
    for (const path of paths) entries.push({ name: `${topicId}/${path}`, data: encoder.encode(files[path]) })
  }

  const { time, date } = dosDateTime(modified)
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length
    const isDir = entry.name.endsWith('/')

    const local = new Uint8Array(30 + name.length + size)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true) // version needed
    lv.setUint16(6, 0x0800, true) // UTF-8 names
    lv.setUint16(8, 0, true) // stored
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, size, true)
    lv.setUint32(22, size, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)
    local.set(entry.data, 30 + name.length)

    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true) // version made by
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, size, true)
    cv.setUint32(24, size, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(38, isDir ? 0x10 : 0, true) // external attrs: MS-DOS directory flag
    cv.setUint32(42, offset, true)
    central.set(name, 46)

    locals.push(local)
    centrals.push(central)
    offset += local.length
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const out = new Uint8Array(offset + centralSize + end.length)
  let pos = 0
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, pos)
    pos += part.length
  }
  return out
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new TopicArchiveError('This browser cannot read compressed zip files.')
  }
  const stream = new Response(data).body!.pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Read the text files in a zip, keyed by path. Folders are skipped. */
export async function readZipEntries(bytes: Uint8Array): Promise<Record<string, string>> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new TopicArchiveError('This file is not a valid zip archive.')

  const count = view.getUint16(eocd + 10, true)
  let pos = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder()
  const entries: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    if (view.getUint32(pos, true) !== 0x02014b50) throw new TopicArchiveError('The zip archive is corrupted.')
    const method = view.getUint16(pos + 10, true)
    const compressedSize = view.getUint32(pos + 20, true)
    const nameLength = view.getUint16(pos + 28, true)
    const extraLength = view.getUint16(pos + 30, true)
    const commentLength = view.getUint16(pos + 32, true)
    const localOffset = view.getUint32(pos + 42, true)
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength)).replace(/\\/g, '/')
    pos += 46 + nameLength + extraLength + commentLength

    if (name.endsWith('/') || name.startsWith('__MACOSX/')) continue
    const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true)
    const raw = bytes.subarray(dataStart, dataStart + compressedSize)
    if (method === 0) entries[name] = decoder.decode(raw)
    else if (method === 8) entries[name] = decoder.decode(await inflateRaw(raw))
    else throw new TopicArchiveError(`Unsupported zip compression (method ${method}) for ${name}.`)
  }
  return entries
}

// ============================================================================
// Files picked in the browser
// ============================================================================

function isZip(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
}

/**
 * Read the topics in a picked file: a `.loom.oui` single file or a zip.
 * With `singleSection`, one section `.oui` file is also accepted (as a
 * one-section topic); Studio leaves it off so an import never replaces a
 * whole topic with one section.
 */
export async function readTopicArchive(file: Blob & { name?: string }, { singleSection = false } = {}): Promise<TopicFiles[]> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const baseName = (file.name ?? '').replace(/(\.loom)?\.(oui|zip|txt)$/i, '') || 'topic'
  if (isZip(bytes)) return nonEmpty(groupTopicFiles(await readZipEntries(bytes), baseName))
  const text = new TextDecoder().decode(bytes)
  return singleSection ? readTopicText(text, slug(baseName)) : parseTopicSource(text, slug(baseName))
}

function nonEmpty(topics: TopicFiles[]): TopicFiles[] {
  if (topics.length === 0) throw new TopicArchiveError('No topic found: the archive has no topic.oui.')
  return topics
}

/** File name → topic ID candidate (`My Topic (1)` → `my-topic-1`). */
function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^[-_]+|-+$/g, '') || 'topic'
}

/**
 * Read the topics in a folder picked with `<input type="file" webkitdirectory>`.
 * Each file's `webkitRelativePath` starts with the picked folder's name.
 */
export async function readTopicFolderFiles(fileList: Iterable<File>): Promise<TopicFiles[]> {
  const entries: Record<string, string> = {}
  let pickedName = 'topic'
  for (const file of fileList) {
    const path = (file.webkitRelativePath || file.name).replace(/\\/g, '/')
    if (!path.endsWith('.oui')) continue
    entries[path] = await file.text()
    pickedName = path.split('/')[0] || pickedName
  }
  const topics = groupTopicFiles(entries, pickedName)
  if (topics.length === 0) throw new TopicArchiveError('No topic found: the folder has no topic.oui.')
  return topics
}
