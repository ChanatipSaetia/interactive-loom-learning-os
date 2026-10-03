/**
 * Content catalog generation (dependency-free, shared by vite.config.ts and tests).
 *
 * `public/content/index.oui` is not committed: it is generated from the topic
 * folders that contain a `topic.oui`, sorted by folder name, so adding a
 * topic folder is enough to publish it.
 */

/** Folder names allowed as topic IDs (same rule as the content save endpoint). */
export const CONTENT_ID = /^[a-z0-9][a-z0-9_-]*$/

/** Generate `index.oui` source for the given topic folder names. */
export function generateCatalogSource(topicIds: string[]): string {
  const ids = [...new Set(topicIds.filter((id) => CONTENT_ID.test(id)))].sort()
  if (ids.length === 0) return 'root = Catalog([])\n'
  return `// Generated from public/content/*/topic.oui. Do not edit.\nroot = Catalog([\n${ids.map((id) => `  TopicRef(${JSON.stringify(id)}),`).join('\n')}\n])\n`
}
