/**
 * Content source facade (OpenUI Lang first, OKF fallback).
 *
 * During the OKF → OpenUI migration a topic is served from
 * `public/content/` when the content catalog (`index.oui`) lists it, and
 * from `public/okf/` otherwise. Once every topic is migrated the OKF branch
 * is removed (see grill-log-openui-input.md, phase 6).
 */
import { useCallback, useEffect, useState } from 'react'
import { clearOKFCache, getCachedOKFBundle, loadOKFBundle } from './okf/reader'
import type { OKFBundled } from './okf/types'
import {
  clearOUICache,
  getCachedOUITopic,
  loadOUICatalog,
  loadOUICatalogTopicIds,
  loadOUITopic,
} from './oui/reader'
import type { TopicRoute } from './routes'

let ouiTopicIds: Promise<Set<string>> | null = null

/** Topic IDs served from OpenUI Lang content (empty if there is no catalog). */
export function getOUITopicIds(): Promise<Set<string>> {
  ouiTopicIds ??= loadOUICatalogTopicIds()
    .then((ids) => new Set(ids))
    .catch(() => new Set<string>())
  return ouiTopicIds
}

export async function isOUITopic(topicId: string): Promise<boolean> {
  return (await getOUITopicIds()).has(topicId)
}

/** Load a topic's sections from whichever source holds it. */
export async function loadTopicBundle(topicId: string): Promise<OKFBundled> {
  if (await isOUITopic(topicId)) return (await loadOUITopic(topicId)).sections
  return loadOKFBundle(topicId)
}

export function getCachedTopicBundle(topicId: string): OKFBundled | undefined {
  return getCachedOUITopic(topicId)?.sections ?? getCachedOKFBundle(topicId)
}

export function clearContentCache(): void {
  ouiTopicIds = null
  clearOUICache()
  clearOKFCache()
}

/**
 * Merge catalogs: OKF topics keep their position but are replaced by their
 * OpenUI entry once migrated; OpenUI-only topics are appended.
 */
export function mergeTopicRoutes(okf: TopicRoute[], oui: TopicRoute[]): TopicRoute[] {
  const ouiById = new Map(oui.map((t) => [t.id, t]))
  const merged = okf.map((t) => ouiById.get(t.id) ?? t)
  const seen = new Set(merged.map((t) => t.id))
  return [...merged, ...oui.filter((t) => !seen.has(t.id))]
}

/** OpenUI catalog routes, or [] when there is no `index.oui`. */
export async function discoverOUITopics(): Promise<TopicRoute[]> {
  if ((await getOUITopicIds()).size === 0) return []
  return loadOUICatalog()
}

/** React hook: load a topic bundle (OpenUI or OKF) with loading/error state. */
export function useTopicBundle(topicId: string) {
  const [bundle, setBundle] = useState<OKFBundled | null>(() => getCachedTopicBundle(topicId) ?? null)
  const [loading, setLoading] = useState(!getCachedTopicBundle(topicId))
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      if (!getCachedTopicBundle(topicId)) setLoading(true)
      setBundle(await loadTopicBundle(topicId))
      setError(null)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    load()
  }, [load])

  return { bundle, loading, error, reload: load }
}
