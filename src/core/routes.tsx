import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import * as yaml from 'js-yaml'

export interface TopicRoute {
  id: string
  label: string
  path: string
  category: string
  description: string
}

interface OKFIndexEntry {
  id: string
  label?: string
  path?: string
  category?: string
  description?: string
}

const OKF_BASE = `${import.meta.env.BASE_URL}okf`

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  return { meta: yaml.load(match[1]) as Record<string, unknown>, body: match[2] }
}

export async function discoverTopics(): Promise<TopicRoute[]> {
  try {
    const res = await fetch(`${OKF_BASE}/index.yaml`)
    if (!res.ok) return []
    const index = yaml.load(await res.text()) as OKFIndexEntry[]
    if (!Array.isArray(index)) return []

    const topics = await Promise.all(
      index.map(async (entry) => {
        let meta: Record<string, unknown> = {}
        try {
          const okfRes = await fetch(`${OKF_BASE}/${entry.id}/okf.md`)
          if (okfRes.ok) {
            const text = await okfRes.text()
            meta = parseFrontmatter(text).meta
          }
        } catch { /* use defaults */ }

        return {
          id: entry.id,
          label: entry.label ?? (meta.label as string) ?? entry.id,
          path: entry.path ?? (meta.path as string) ?? `/${entry.id}`,
          category: entry.category ?? (meta.category as string) ?? 'Uncategorized',
          description: entry.description ?? (meta.description as string) ?? '',
        }
      })
    )
    return topics
  } catch {
    return []
  }
}

// --- Context ---

interface TopicsContextValue {
  topics: TopicRoute[]
  loading: boolean
  error: Error | null
}

const TopicsContext = createContext<TopicsContextValue>({ topics: [], loading: false, error: null })

export function TopicsProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<TopicRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const discovered = await discoverTopics()
      setTopics(discovered)
      setError(null)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <TopicsContext.Provider value={{ topics, loading, error }}>
      {children}
    </TopicsContext.Provider>
  )
}

export function useTopics(): TopicsContextValue {
  return useContext(TopicsContext)
}
