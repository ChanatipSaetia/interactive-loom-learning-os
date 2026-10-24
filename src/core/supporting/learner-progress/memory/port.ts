/**
 * Where the learner's event log is kept (decision 144). Adapters: in memory,
 * IndexedDB in the browser (decision 147), and the local MCP server's memory
 * folder through `record_events` (decision 186).
 */
import { mergeEvents, type LearnerEvent } from './events'

export interface LearnerMemoryPort {
  append(events: LearnerEvent[]): Promise<void>
  readAll(): Promise<LearnerEvent[]>
}

/** Keeps the log for this page only (tests, or when nothing else is available). */
export function memoryAdapter(initial: LearnerEvent[] = []): LearnerMemoryPort {
  let log = mergeEvents(initial)
  return {
    async append(events) {
      log = mergeEvents(log, events)
    },
    async readAll() {
      return log
    },
  }
}

const DB_VERSION = 1
const STORE = 'events'

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** The log in IndexedDB, asking the browser to keep it (decision 147). */
export function indexedDbAdapter(name = 'loom-memory'): LearnerMemoryPort {
  let db: Promise<IDBDatabase> | null = null
  const open = () => {
    db ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(name, DB_VERSION)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    void navigator.storage?.persist?.().catch(() => false)
    return db
  }
  return {
    async append(events) {
      if (events.length === 0) return
      const tx = (await open()).transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      for (const e of events) store.put(e)
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    },
    async readAll() {
      const all = await request((await open()).transaction(STORE).objectStore(STORE).getAll() as IDBRequest<LearnerEvent[]>)
      return mergeEvents(all)
    },
  }
}

/** This browser's device ID, kept in localStorage (a new one per session when storage is blocked). */
export function deviceId(): string {
  const key = 'loom-device'
  try {
    const stored = localStorage.getItem(key)
    if (stored) return stored
    const id = `web-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, id)
    return id
  } catch {
    return `web-${Math.random().toString(36).slice(2, 10)}`
  }
}
