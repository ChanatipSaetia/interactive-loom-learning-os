/**
 * TopicFolder — the storage port Loom Studio edits through.
 *
 * Paths are relative to the topic folder and use `/` (e.g. `topic.oui`,
 * `sections/quiz.oui`). Adapters:
 *   - `fileSystemAccessFolder`: a real folder picked with the File System
 *     Access API (`showDirectoryPicker`), or the origin-private file system.
 *   - `memoryFolder`: in-memory files (tests, demos).
 */

export interface TopicFolder {
  /** Folder name, used as the topic ID. */
  readonly name: string
  /** File contents, or null when the file does not exist. */
  readText(path: string): Promise<string | null>
  /** Create or overwrite a file (creating parent folders). */
  writeText(path: string, text: string): Promise<void>
  /** Delete a file; no-op when it does not exist. */
  remove(path: string): Promise<void>
  /** File names (not folders) directly inside `dir` ('' = folder root). */
  listFiles(dir: string): Promise<string[]>
}

// ============================================================================
// File System Access API
// ============================================================================

interface DirectoryIteration {
  values(): AsyncIterable<FileSystemHandle>
}

interface DirectoryPickerWindow {
  showDirectoryPicker?: (options?: { id?: string; mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

/** True when the browser can open local folders (Chromium-based browsers). */
export function supportsFolderPicker(): boolean {
  return typeof window !== 'undefined' && typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function'
}

/** Ask the user for a topic folder (read + write). */
export async function pickTopicFolder(): Promise<TopicFolder> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker
  if (!picker) throw new Error('This browser cannot open local folders. Use Chrome or Edge.')
  return fileSystemAccessFolder(await picker({ id: 'loom-studio-topic', mode: 'readwrite' }))
}

function splitPath(path: string): { dirs: string[]; file: string } {
  const parts = path.split('/').filter(Boolean)
  return { dirs: parts.slice(0, -1), file: parts[parts.length - 1] ?? '' }
}

function isNotFound(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')
}

export function fileSystemAccessFolder(root: FileSystemDirectoryHandle): TopicFolder {
  const dir = async (names: string[], create: boolean): Promise<FileSystemDirectoryHandle | null> => {
    let current = root
    for (const name of names) {
      try {
        current = await current.getDirectoryHandle(name, { create })
      } catch (e) {
        if (isNotFound(e)) return null
        throw e
      }
    }
    return current
  }

  return {
    name: root.name,
    async readText(path) {
      const { dirs, file } = splitPath(path)
      const parent = await dir(dirs, false)
      if (!parent) return null
      try {
        return await (await (await parent.getFileHandle(file)).getFile()).text()
      } catch (e) {
        if (isNotFound(e)) return null
        throw e
      }
    },
    async writeText(path, text) {
      const { dirs, file } = splitPath(path)
      const parent = (await dir(dirs, true))!
      const writable = await (await parent.getFileHandle(file, { create: true })).createWritable()
      await writable.write(text)
      await writable.close()
    },
    async remove(path) {
      const { dirs, file } = splitPath(path)
      const parent = await dir(dirs, false)
      if (!parent) return
      try {
        await parent.removeEntry(file)
      } catch (e) {
        if (!isNotFound(e)) throw e
      }
    },
    async listFiles(path) {
      const parent = await dir(path.split('/').filter(Boolean), false)
      if (!parent) return []
      const names: string[] = []
      for await (const entry of (parent as unknown as DirectoryIteration).values()) {
        if (entry.kind === 'file') names.push(entry.name)
      }
      return names.sort()
    },
  }
}

// ============================================================================
// In-memory
// ============================================================================

export interface MemoryFolder extends TopicFolder {
  /** Live view of the stored files, keyed by path. */
  readonly files: Map<string, string>
}

export function memoryFolder(name: string, initial: Record<string, string> = {}): MemoryFolder {
  const files = new Map(Object.entries(initial))
  return {
    name,
    files,
    async readText(path) {
      return files.get(path) ?? null
    },
    async writeText(path, text) {
      files.set(path, text)
    },
    async remove(path) {
      files.delete(path)
    },
    async listFiles(dir) {
      const prefix = dir ? `${dir.replace(/\/$/, '')}/` : ''
      return [...files.keys()]
        .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
        .map((p) => p.slice(prefix.length))
        .sort()
    },
  }
}
