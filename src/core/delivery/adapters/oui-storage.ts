/**
 * OUIStorageAdapter — OKFStoragePort for OpenUI Lang content in
 * `public/content/` (see composition/oui/reader.ts for the layout).
 *
 * Reads go through the cached OpenUI reader (compile + validate). The
 * learning app is read-only: authoring happens in Loom Studio.
 */
import { READ_ONLY_CONTENT_MESSAGE, type OKFStoragePort } from '../ports'
import type { OKFSectionData, OKFSectionMeta } from '../../learning-engine/composition/okf/types'
import {
  getCachedOUITopic,
  loadOUICatalogTopicIds,
  loadOUISection,
} from '../../learning-engine/composition/oui/reader'

export class OUIStorageAdapter implements OKFStoragePort {
  /** Read one section; `body` is the raw `.oui` source. */
  async readSection(
    topicId: string,
    sectionFolder: string,
  ): Promise<{ meta: OKFSectionMeta; data: OKFSectionData; body: string }> {
    const section = getCachedOUITopic(topicId)?.sections.find((s) => s.sectionFolder === sectionFolder)
      ?? await loadOUISection(topicId, sectionFolder)
    return { meta: section.meta, data: section.data, body: section.source }
  }

  /**
   * Read-only: the learning app does not write content. Edit topic folders
   * with Loom Studio instead.
   */
  async saveSection(): Promise<void> {
    throw new Error(READ_ONLY_CONTENT_MESSAGE)
  }

  /** List topic IDs from `index.oui`. */
  async listTopics(): Promise<string[]> {
    try {
      return await loadOUICatalogTopicIds()
    } catch {
      return []
    }
  }
}

export const ouiStorage = new OUIStorageAdapter()
