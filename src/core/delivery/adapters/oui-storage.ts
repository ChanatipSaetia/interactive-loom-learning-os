/**
 * OUIStorageAdapter — OKFStoragePort for OpenUI Lang content in
 * `public/content/` (see composition/oui/reader.ts for the layout).
 *
 * Reads go through the cached OpenUI reader (compile + validate). Writes go
 * through the Vite dev-server endpoint `POST /api/content/save-section`,
 * which re-validates the source before writing `<topic>/sections/<name>.oui`.
 */
import type { OKFStoragePort } from '../ports'
import type { OKFSectionData, OKFSectionMeta } from '../../learning-engine/composition/okf/types'
import {
  clearOUICache,
  getCachedOUITopic,
  loadOUICatalogTopicIds,
  loadOUISection,
} from '../../learning-engine/composition/oui/reader'

export const OUI_SAVE_ENDPOINT = '/api/content/save-section'

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
   * Persist a section. `rawText` is the complete `.oui` source; `data` is
   * accepted for port compatibility but the source is the source of truth.
   */
  async saveSection(
    topicId: string,
    sectionFolder: string,
    _data: OKFSectionData,
    rawText: string,
  ): Promise<void> {
    const res = await fetch(OUI_SAVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, sectionName: sectionFolder, source: rawText }),
    })
    if (!res.ok) {
      throw new Error(`Failed to save section: ${await res.text()}`)
    }
    clearOUICache()
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
