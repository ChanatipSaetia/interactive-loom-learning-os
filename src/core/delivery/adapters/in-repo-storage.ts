/**
 * InRepoStorageAdapter — concrete OKFStoragePort for reading/writing local
 * OKF files via Vite dev-server endpoints and browser fetch.
 *
 * Used by the editor for disk I/O in development mode. Relies on the
 * existing reader cache for `readSection` to avoid duplicating multi-file
 * section loading logic.
 */
import type { OKFStoragePort } from '../ports'
import type { OKFBundledSection, OKFSectionMeta, OKFSectionData } from '../../learning-engine/composition/okf/types'
import { loadOKFBundle, clearOKFCache } from '../../learning-engine/composition/okf/reader'
import * as yaml from 'js-yaml'

function getOkfBase(): string {
  const win = window as unknown as Record<string, unknown> | undefined
  if (typeof win !== 'undefined' && win.__OKF_BASE_OVERRIDE__) {
    return win.__OKF_BASE_OVERRIDE__ as string
  }
  return `${import.meta.env.BASE_URL || '/'}okf`
}

/**
 * Parse markdown frontmatter from raw text content.
 */
function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  return { meta: yaml.load(match[1]) as Record<string, unknown>, body: match[2] }
}

export class InRepoStorageAdapter implements OKFStoragePort {
  /**
   * Read a single OKF section from the in-repo file structure.
   *
   * Delegates to loadOKFBundle which caches the full topic bundle, then
   * extracts the matching section by folder name. This avoids duplicating
   * the complex multi-file resource resolution logic.
   */
  async readSection(
    topicId: string,
    sectionFolder: string
  ): Promise<{ meta: OKFSectionMeta; data: OKFSectionData; body: string }> {
    const bundle = await loadOKFBundle(topicId)
    const section = bundle.find((s: OKFBundledSection) => s.sectionFolder === sectionFolder)

    if (!section) {
      throw new Error(`Section "${sectionFolder}" not found in topic "${topicId}"`)
    }

    return {
      meta: section.meta,
      data: section.data,
      body: section.sectionBody ?? '',
    }
  }

  /**
   * Persist an OKF section back to disk via the Vite dev-server endpoint.
   *
   * `rawText` is the reconstructed section.md with YAML frontmatter.
   * `data` is serialized to YAML for data.yaml.
   *
   * In production (non-dev) environments this will throw since the
   * /api/okf/save-section middleware only exists in the dev server.
   */
  async saveSection(
    topicId: string,
    sectionFolder: string,
    data: OKFSectionData,
    rawText: string
  ): Promise<void> {
    const dataYaml = yaml.dump(data, { lineWidth: -1, noRefs: true })
    const res = await fetch('/api/okf/save-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId,
        sectionName: sectionFolder,
        sectionMd: rawText,
        dataYaml,
      }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Failed to save section: ${errorBody}`)
    }

    clearOKFCache()
  }

  /**
   * Read a topic hex map campaign definition (e.g. from public/hexmaps/<topicId>.yaml).
   */
  async readHexMap(topicId: string): Promise<string> {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const hexMapUrl = `${baseUrl.replace(/\/$/, '')}/hexmaps/${topicId}.yaml`
    const res = await fetch(hexMapUrl)
    if (!res.ok) {
      throw new Error(`Failed to load hex map for topic "${topicId}": ${res.statusText}`)
    }
    return res.text()
  }

  /**
   * Save a topic hex map campaign definition back to disk via dev server.
   */
  async saveHexMap(topicId: string, rawYaml: string): Promise<void> {
    const res = await fetch('/api/okf/save-hexmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, rawYaml }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `Failed to save hex map: ${res.statusText}`)
    }
  }

  /**
   * List all available topic identifiers by parsing the OKF index.md.
   */
  async listTopics(): Promise<string[]> {
    const base = getOkfBase()
    const res = await fetch(`${base}/index.md`)
    if (!res.ok) {
      return []
    }

    const text = await res.text()
    const { body } = parseFrontmatter(text)

    const topicIds = new Set<string>()
    const lines = body.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      const linkMatch = trimmed.match(/^\*\s+\[([^\]]+)\]\(([^)]+index\.md)\)/)
      if (linkMatch) {
        const href = linkMatch[2].trim()
        const topicId = href.replace(/^\.\//, '').replace(/\/index\.md$/, '')
        if (topicId) {
          topicIds.add(topicId)
        }
      }
    }

    return [...topicIds]
  }
}
