import { useState, useEffect, useCallback } from 'react'
import { useStorage } from '../context/StorageContext'
import { loadOKFBundle, getCachedOKFBundle } from './loader'
import type { OKFBundled } from './types'

export { toSectionConfig, toSectionConfigs } from './section-config'

export function useOKFBundled(topicId: string | null) {
  const storage = useStorage()
  const [bundle, setBundle] = useState<OKFBundled | null>(() => (topicId ? getCachedOKFBundle(topicId, storage) ?? null : null))
  const [loading, setLoading] = useState(!!topicId && !getCachedOKFBundle(topicId, storage))
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!topicId) return
    try {
      if (!getCachedOKFBundle(topicId, storage)) {
        setLoading(true)
      }
      const data = await loadOKFBundle(topicId, storage)
      setBundle(data)
      setError(null)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [topicId, storage])

  useEffect(() => {
    if (!topicId) return
    load()
  }, [load])

  return { bundle, loading, error, reload: load }
}
