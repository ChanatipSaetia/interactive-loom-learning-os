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
const BASE_URL = import.meta.env.BASE_URL

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  return { meta: yaml.load(match[1]) as Record<string, unknown>, body: match[2] }
}

async function discoverFromIndexMd(): Promise<TopicRoute[] | null> {
  const res = await fetch(`${OKF_BASE}/index.md`)
  if (!res.ok) return null
  const text = await res.text()
  const body = parseFrontmatter(text).body
  const topics = parseIndexMd(body)
  return topics.length ? topics : null
}

function parseIndexMd(body: string): TopicRoute[] {
  const topics: TopicRoute[] = []
  let currentCategory = 'Uncategorized'
  const lines = body.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const headingMatch = line.match(/^#+\s+(.+)$/)
    if (headingMatch && !line.startsWith('*') && !line.match(/^\* \[/)) {
      currentCategory = headingMatch[1].trim()
      continue
    }
    const linkMatch = line.match(/^\*\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:—\s*(.+))?$/)
    if (linkMatch) {
      const label = linkMatch[1].trim()
      const href = linkMatch[2].trim()
      const description = linkMatch[3] ? linkMatch[3].trim() : ''
      const id = href.replace(/\/index\.md$/, '').replace(/^\//, '')
      topics.push({
        id,
        label,
        path: `/topics/${id}`,
        category: currentCategory,
        description,
      })
    }
  }
  return topics
}

export async function discoverTopics(): Promise<TopicRoute[]> {
  try {
    const mdTopics = await discoverFromIndexMd()
    if (mdTopics) return mdTopics

    const res = await fetch(`${BASE_URL}index.yaml`)
    if (!res.ok) return []
    const index = yaml.load(await res.text()) as OKFIndexEntry[]
    if (!Array.isArray(index)) return []

    const topics = await Promise.all(
      index.map(async (entry) => {
        let meta: Record<string, unknown> = {}
        try {
          const yamlRes = await fetch(`${OKF_BASE}/${entry.id}/index.yaml`)
          if (yamlRes.ok) {
            meta = yaml.load(await yamlRes.text()) as Record<string, unknown>
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
