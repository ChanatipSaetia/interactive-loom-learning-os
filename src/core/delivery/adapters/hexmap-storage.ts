/**
 * Reads hex campaign maps (`public/hexmaps/<topicId>.yaml`) over HTTP from the
 * Vite dev server or the static build. Hex maps are gamification data, not
 * section content, so they stay outside the content (OpenUI) storage port.
 */
export interface HexMapStoragePort {
  readHexMap(topicId: string): Promise<string>
  saveHexMap?(topicId: string, rawYaml: string): Promise<void>
}

export class HttpHexMapStorageAdapter implements HexMapStoragePort {
  async readHexMap(topicId: string): Promise<string> {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const hexMapUrl = `${baseUrl.replace(/\/$/, '')}/hexmaps/${topicId}.yaml`
    const res = await fetch(hexMapUrl)
    if (!res.ok) {
      throw new Error(`Failed to load hex map for topic "${topicId}": ${res.statusText}`)
    }
    return res.text()
  }
}
