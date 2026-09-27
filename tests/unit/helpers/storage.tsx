import type { ReactNode } from 'react'
import type { OKFStoragePort } from '../../../src/core/delivery/ports'
import type { SectionFiles } from '../../../src/core/learning-engine/validation/types'
import { StorageProvider } from '../../../src/core/learning-engine/composition/context/StorageContext'

/** In-memory topic: index order plus raw files for each section folder. */
export interface MemoryTopic {
  sections: Record<string, SectionFiles>
  /** Section order as index.md would list it (default: key order of `sections`). */
  order?: string[]
}

/** OKFStoragePort over in-memory raw files, for tests. */
export function createMemoryStorage(topics: Record<string, MemoryTopic> = {}): OKFStoragePort {
  const topic = (topicId: string) => {
    const t = topics[topicId]
    if (!t) throw new Error(`Unknown topic "${topicId}"`)
    return t
  }
  return {
    async listSections(topicId) {
      const t = topic(topicId)
      return t.order ?? Object.keys(t.sections)
    },
    async readSectionFiles(topicId, sectionFolder) {
      const files = topic(topicId).sections[sectionFolder]
      if (!files) throw new Error(`Section "${sectionFolder}" not found in topic "${topicId}"`)
      return files
    },
    async saveSection() {},
    async readHexMap(topicId) {
      throw new Error(`No hex map for "${topicId}"`)
    },
    async listTopics() {
      return Object.keys(topics)
    },
  }
}

/** Wrapper for render/renderHook that supplies a storage adapter. */
export function withStorage(storage: OKFStoragePort = createMemoryStorage()) {
  return function StorageWrapper({ children }: { children: ReactNode }) {
    return <StorageProvider storage={storage}>{children}</StorageProvider>
  }
}
