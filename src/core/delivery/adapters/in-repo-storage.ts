/**
 * InRepoStorageAdapter — concrete OKFStoragePort for OKF folders served over
 * HTTP (the Vite dev server or a Vite build), with writes through the Vite
 * dev-server endpoints.
 *
 * Returns raw text only. Section membership comes from the generated
 * `okf/<topicId>/manifest.json`; lesson order comes from the topic's index.md.
 */
import type { OKFStoragePort } from '../ports'
import type { OKFSectionData } from '../../learning-engine/composition/okf/types'
import type { SectionFiles } from '../../learning-engine/validation/types'
import { MANIFEST_FILE, parseTopicIndexSections, type TopicManifest } from '../manifest'
import * as yaml from 'js-yaml'

function defaultOkfBase(): string {
  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : undefined
  if (win?.__OKF_BASE_OVERRIDE__) {
    return win.__OKF_BASE_OVERRIDE__ as string
  }
  return `${import.meta.env.BASE_URL || '/'}okf`
}

export class InRepoStorageAdapter implements OKFStoragePort {
  private textCache = new Map<string, Promise<string>>()
  private manifestCache = new Map<string, Promise<TopicManifest>>()

  /**
   * @param okfBase - Base URL of the OKF folder (default: `<BASE_URL>okf`, or
   *   `window.__OKF_BASE_OVERRIDE__` when set)
   */
  constructor(private okfBase?: string) {}

  private get base(): string {
    return (this.okfBase ?? defaultOkfBase()).replace(/\/$/, '')
  }

  private fetchText(path: string): Promise<string> {
    let pending = this.textCache.get(path)
    if (!pending) {
      pending = fetch(`${this.base}/${path}`).then(async (res) => {
        if (!res.ok) throw new Error(`OKF fetch failed: ${path} (${res.status})`)
        return res.text()
      })
      pending.catch(() => this.textCache.delete(path))
      this.textCache.set(path, pending)
    }
    return pending
  }

  private readManifest(topicId: string): Promise<TopicManifest> {
    let pending = this.manifestCache.get(topicId)
    if (!pending) {
      const notFound = new Error(
        `OKF manifest not found for topic "${topicId}". OKF content must be served by the Vite dev server ` +
        `or a Vite build, which generate ${topicId}/${MANIFEST_FILE} from the section folders.`,
      )
      pending = this.fetchText(`${topicId}/${MANIFEST_FILE}`).then(
        (text) => {
          try {
            return JSON.parse(text) as TopicManifest
          } catch {
            throw notFound // e.g. an SPA fallback page instead of JSON
          }
        },
        () => {
          throw notFound
        },
      )
      pending.catch(() => this.manifestCache.delete(topicId))
      this.manifestCache.set(topicId, pending)
    }
    return pending
  }

  /** Drop cached files and manifests (after writes). */
  clearCache(): void {
    this.textCache.clear()
    this.manifestCache.clear()
  }

  async listSections(topicId: string): Promise<string[]> {
    const indexMd = await this.fetchText(`${topicId}/index.md`)
    return parseTopicIndexSections(indexMd)
  }

  async readSectionFiles(topicId: string, sectionFolder: string): Promise<SectionFiles> {
    const manifest = await this.readManifest(topicId)
    const names = manifest.sections[sectionFolder]
    if (!names) {
      throw new Error(`Section "${sectionFolder}" not found in topic "${topicId}" (no section.md in the manifest).`)
    }
    const contents = await Promise.all(names.map((name) => this.fetchText(`${topicId}/sections/${sectionFolder}/${name}`)))
    return Object.fromEntries(names.map((name, i) => [name, contents[i]]))
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

    this.clearCache()
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
   * List all available topic identifiers from the links in the OKF index.md.
   */
  async listTopics(): Promise<string[]> {
    const res = await fetch(`${this.base}/index.md`)
    if (!res.ok) {
      return []
    }

    const text = await res.text()
    const topicIds = new Set<string>()

    for (const line of text.split('\n')) {
      const linkMatch = line.trim().match(/^\*\s+\[([^\]]+)\]\(([^)]+index\.md)\)/)
      if (linkMatch) {
        const topicId = linkMatch[2].trim().replace(/^\.\//, '').replace(/\/index\.md$/, '')
        if (topicId) {
          topicIds.add(topicId)
        }
      }
    }

    return [...topicIds]
  }
}
