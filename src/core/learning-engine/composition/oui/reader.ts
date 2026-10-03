/**
 * OpenUI Lang content reader
 *
 * Content layout (served from `public/content/`):
 *
 *   index.oui                      root = Catalog([TopicRef("demo"), …])
 *   <topic>/topic.oui              root = Topic("Title", "Category", "Description", [SectionRef("intro"), …])
 *   <topic>/sections/<name>.oui    root = Quiz(…) | Flowchart(…) | …
 *
 * Every section is compiled and validated through the OpenUI Validation
 * Gateway. Sections load as long as they compile; their diagnostics travel
 * with the bundle so hosts can surface warnings. A file that cannot be
 * compiled at all (tier 1) rejects with an `OUILoadError`.
 */
import { validateOUISection } from '../../validation/oui-gateway'
import type { ValidationDiagnostic } from '../../validation/types'
import type { TopicRoute } from '../routes'
import type { OKFBundledSection } from '../okf/types'
import { compileOUICatalog, compileOUITopic, type OUIIssue, type OUITopicManifest } from './compile'

export interface OUIBundledSection extends OKFBundledSection {
  /** Raw `.oui` source of the section. */
  source: string
  diagnostics: ValidationDiagnostic[]
}

export interface OUITopicBundle {
  topicId: string
  manifest: OUITopicManifest
  sections: OUIBundledSection[]
}

export class OUILoadError extends Error {
  constructor(
    public readonly file: string,
    public readonly diagnostics: Array<Pick<ValidationDiagnostic, 'tier' | 'line' | 'message' | 'fixHint'>>,
  ) {
    const details = diagnostics
      .filter((d) => d.tier === 1)
      .map((d) => `  ${d.line ? `line ${d.line}: ` : ''}${d.message}`)
      .join('\n')
    super(`Cannot load ${file}:\n${details}`)
    this.name = 'OUILoadError'
  }
}

export function getContentBase(): string {
  const override = typeof window !== 'undefined'
    ? (window as unknown as Record<string, unknown>).__LOOM_CONTENT_BASE__
    : undefined
  if (typeof override === 'string') return override
  return `${import.meta.env.BASE_URL || '/'}content`
}

const textCache = new Map<string, Promise<string>>()
const topicCache = new Map<string, OUITopicBundle>()

export function clearOUICache(): void {
  textCache.clear()
  topicCache.clear()
}

export function getCachedOUITopic(topicId: string): OUITopicBundle | undefined {
  return topicCache.get(topicId)
}

async function fetchText(path: string): Promise<string> {
  let pending = textCache.get(path)
  if (!pending) {
    pending = fetch(`${getContentBase()}/${path}`).then(async (res) => {
      if (!res.ok) throw new Error(`Content fetch failed: ${path} (${res.status})`)
      return res.text()
    })
    pending.catch(() => textCache.delete(path))
    textCache.set(path, pending)
  }
  return pending
}

function assertCompiled<T>(file: string, value: T | null, issues: OUIIssue[]): T {
  if (value === null || issues.some((i) => i.tier === 1)) throw new OUILoadError(file, issues)
  return value
}

export function sectionPath(topicId: string, sectionName: string): string {
  return `${topicId}/sections/${sectionName}.oui`
}

/** Fetch, compile and validate one section file. */
export async function loadOUISection(topicId: string, sectionName: string): Promise<OUIBundledSection> {
  const file = sectionPath(topicId, sectionName)
  const source = await fetchText(file)
  const result = validateOUISection(source, { topicId, sectionName, file })
  if (!result.payload) throw new OUILoadError(file, result.diagnostics)
  return {
    ...result.payload,
    sectionBody: source,
    sectionFolder: sectionName,
    source,
    diagnostics: result.diagnostics,
  }
}

/** Fetch and compile a topic manifest (`<topic>/topic.oui`). */
export async function loadOUITopicManifest(topicId: string): Promise<OUITopicManifest> {
  const file = `${topicId}/topic.oui`
  const compiled = compileOUITopic(await fetchText(file))
  return assertCompiled(file, compiled.value, compiled.issues)
}

/** Load a topic manifest and all of its sections (cached per topic). */
export async function loadOUITopic(topicId: string): Promise<OUITopicBundle> {
  const cached = topicCache.get(topicId)
  if (cached) return cached

  const manifest = await loadOUITopicManifest(topicId)
  manifest.sections.forEach((name) => fetchText(sectionPath(topicId, name)).catch(() => {}))
  const sections = await Promise.all(manifest.sections.map((name) => loadOUISection(topicId, name)))

  const bundle: OUITopicBundle = { topicId, manifest, sections }
  topicCache.set(topicId, bundle)
  return bundle
}

/** List topic IDs from the content catalog (`index.oui`). */
export async function loadOUICatalogTopicIds(): Promise<string[]> {
  const compiled = compileOUICatalog(await fetchText('index.oui'))
  return assertCompiled('index.oui', compiled.value, compiled.issues).topics
}

/** Load catalog entries (topic manifests) as routes for discovery UIs. */
export async function loadOUICatalog(): Promise<TopicRoute[]> {
  const ids = await loadOUICatalogTopicIds()
  const manifests = await Promise.all(ids.map((id) => loadOUITopicManifest(id)))
  return manifests.map((m, idx) => ({
    id: ids[idx],
    label: m.title,
    path: `/topics/${ids[idx]}`,
    category: m.category,
    description: m.description,
    updatedAt: m.updatedAt,
    isNew: m.isNew,
    tags: m.tags,
    difficulty: m.difficulty,
  }))
}
