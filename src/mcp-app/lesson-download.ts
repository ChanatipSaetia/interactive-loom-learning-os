import type { App } from '@modelcontextprotocol/ext-apps'

/** Only the filename is normalized; the original source is never reserialized. */
export function lessonFileName(topicId?: string): string {
  const name = (topicId ?? '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  return `${name || 'lesson'}.loom.oui`
}

export async function downloadLesson(app: Pick<App, 'getHostCapabilities' | 'downloadFile'>, oui: string, topicId?: string): Promise<'requested' | 'unsupported' | 'failed'> {
  if (!app.getHostCapabilities()?.downloadFile) return 'unsupported'
  try {
    const result = await app.downloadFile({ contents: [{ type: 'resource', resource: {
      uri: `file:///${lessonFileName(topicId)}`, mimeType: 'text/plain', text: oui,
    } }] })
    return result.isError ? 'failed' : 'requested'
  } catch {
    return 'failed'
  }
}
