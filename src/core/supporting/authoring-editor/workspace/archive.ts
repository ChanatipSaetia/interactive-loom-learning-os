/**
 * Topic archives — move whole topic folders in and out of Loom Studio.
 *
 *   - Single-file bundle (`<topic>.loom.json`): every `.oui` file of one or
 *     more topics in one JSON document.
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

export const BUNDLE_FORMAT = 'loom-topic-bundle'
export const BUNDLE_VERSION = 1
export const BUNDLE_EXTENSION = '.loom.json'

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
// Single-file bundle
// ============================================================================

interface BundleDocument {
  format: typeof BUNDLE_FORMAT
  version: number
  exportedAt?: string
  topics: Array<{ id: string; files: Record<string, string> }>
}

/** Serialize topics into a single-file bundle. */
export function createTopicBundle(topics: TopicFiles[], exportedAt = new Date().toISOString()): string {
  const doc: BundleDocument = {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    exportedAt,
    topics: topics.map(({ topicId, files }) => ({
      id: topicId,
      files: Object.fromEntries(sortedPaths(files).map((p) => [p, files[p]])),
    })),
  }
  return `${JSON.stringify(doc, null, 2)}\n`
}

/** Parse a single-file bundle. Throws TopicArchiveError when it is not one. */
export function parseTopicBundle(text: string): TopicFiles[] {
  let doc: unknown
  try {
    doc = JSON.parse(text)
  } catch {
    throw new TopicArchiveError('This file is not a Loom topic bundle (invalid JSON).')
  }
  const d = doc as Partial<BundleDocument> | null
  if (!d || d.format !== BUNDLE_FORMAT || !Array.isArray(d.topics)) {
    throw new TopicArchiveError('This file is not a Loom topic bundle.')
  }
  if (typeof d.version !== 'number' || d.version > BUNDLE_VERSION) {
    throw new TopicArchiveError(`Unsupported bundle version ${String(d.version)}.`)
  }
  return d.topics.map((topic, i) => {
    if (!topic || typeof topic.id !== 'string' || !topic.files || typeof topic.files !== 'object') {
      throw new TopicArchiveError(`Topic #${i + 1} in the bundle is malformed.`)
    }
    const files: Record<string, string> = {}
    for (const [path, text] of Object.entries(topic.files)) {
      if (typeof text === 'string' && isTopicPath(path)) files[path] = text
    }
    if (!(TOPIC_FILE in files)) throw new TopicArchiveError(`Topic "${topic.id}" in the bundle has no topic.oui.`)
    return { topicId: topic.id, files }
  })
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

/** Read the topics in a picked file: a single-file bundle or a zip. */
export async function readTopicArchive(file: Blob & { name?: string }): Promise<TopicFiles[]> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const baseName = (file.name ?? '').replace(/(\.loom)?\.(json|zip)$/i, '') || 'topic'
  const topics = isZip(bytes)
    ? groupTopicFiles(await readZipEntries(bytes), baseName)
    : parseTopicBundle(new TextDecoder().decode(bytes))
  if (topics.length === 0) throw new TopicArchiveError('No topic found: the archive has no topic.oui.')
  return topics
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
