import type { OKFStoragePort } from '../../../delivery/ports'
import { validateSectionFiles } from '../../validation/gateway'
import type { ValidationDiagnostic } from '../../validation/types'
import type { OKFBundled, OKFBundledSection, OKFSectionData } from './types'

// ============================================================================
// Section Loading Use Case — storage (raw files) → Validation Gateway → bundle
// ============================================================================
// The Composition Engine never parses YAML: storage returns raw text and the
// gateway parses, validates, and transforms it. A section that fails keeps its
// slot (with diagnostics) so the rest of the topic still renders and hexmap /
// progress references to it still resolve.
// ============================================================================

const bundleCaches = new Map<OKFStoragePort, Map<string, OKFBundled>>()

function cacheFor(storage: OKFStoragePort): Map<string, OKFBundled> {
  let cache = bundleCaches.get(storage)
  if (!cache) {
    cache = new Map()
    bundleCaches.set(storage, cache)
  }
  return cache
}

export function getCachedOKFBundle(topicId: string, storage: OKFStoragePort): OKFBundled | undefined {
  return bundleCaches.get(storage)?.get(topicId)
}

export function clearOKFCache(): void {
  bundleCaches.clear()
}

function failedSection(sectionFolder: string, diagnostics: ValidationDiagnostic[]): OKFBundledSection {
  return {
    meta: { type: '', resource: '.' },
    data: {} as OKFSectionData,
    sectionBody: '',
    sectionFolder,
    validation: { status: 'error', diagnostics },
  }
}

/** Load one section folder through the Validation Gateway. Never throws. */
export async function loadSection(
  storage: OKFStoragePort,
  topicId: string,
  sectionFolder: string
): Promise<OKFBundledSection> {
  const file = `${topicId}/sections/${sectionFolder}`
  let files
  try {
    files = await storage.readSectionFiles(topicId, sectionFolder)
  } catch (e) {
    return failedSection(sectionFolder, [{
      tier: 1,
      file,
      message: e instanceof Error ? e.message : String(e),
      fixHint: 'Check that index.md links an existing section folder containing a section.md.',
    }])
  }

  const result = validateSectionFiles(files, { topicId, sectionName: sectionFolder, file })
  const { meta, data, body } = result.payload
  return {
    meta,
    data: { ...data, type: meta.type } as OKFSectionData,
    sectionBody: body,
    sectionFolder,
    validation: { status: result.status, diagnostics: result.diagnostics },
  }
}

/** Load every section of a topic in index.md order. Failed sections keep their slot. */
export async function loadOKFBundle(topicId: string, storage: OKFStoragePort): Promise<OKFBundled> {
  const cache = cacheFor(storage)
  const cached = cache.get(topicId)
  if (cached) return cached

  const folders = await storage.listSections(topicId)
  const bundle = await Promise.all(folders.map((folder) => loadSection(storage, topicId, folder)))
  cache.set(topicId, bundle)
  return bundle
}
