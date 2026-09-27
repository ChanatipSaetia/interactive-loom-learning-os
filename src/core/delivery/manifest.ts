/**
 * OKF topic manifest — the published list of files in each section folder.
 *
 * The filesystem is the source of truth for which files belong to a section.
 * Browsers cannot list directories, so the Vite plugin serves (dev) or emits
 * (build) `okf/<topicId>/manifest.json` generated from disk; Node adapters list
 * the directory directly. Both apply the same `isSectionFile` rule.
 */

export interface TopicManifest {
  /** Section folder name → files in that folder, sorted by name. */
  sections: Record<string, string[]>
}

export const MANIFEST_FILE = 'manifest.json'

/** Markdown and YAML files belong to a section; `_name` (disabled) and dotfiles do not. */
export function isSectionFile(name: string): boolean {
  return /\.(md|ya?ml)$/.test(name) && !name.startsWith('_') && !name.startsWith('.')
}

/**
 * Ordered section folders linked from a topic's index.md, e.g.
 * `* [Audience Map](sections/audience-map/section.md) — note` → `audience-map`.
 */
export function parseTopicIndexSections(indexMd: string): string[] {
  const folders: string[] = []
  for (const rawLine of indexMd.split('\n')) {
    const match = rawLine.trim().match(/^\*\s+\[[^\]]+\]\(([^)]+)\)/)
    if (!match) continue
    const href = match[1].trim().replace(/^\.\//, '')
    const folder = href.match(/^sections\/(.+)\/section\.md$/)?.[1]
    if (folder) folders.push(folder)
  }
  return folders
}
