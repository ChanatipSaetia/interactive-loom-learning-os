import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import * as yaml from 'js-yaml'
import { discoverOUITopics, mergeTopicRoutes } from './content'

export interface TopicRoute {
  id: string
  label: string
  path: string
  category: string
  description: string
  updatedAt?: string
  isNew?: boolean
  tags?: string[]
  difficulty?: string
}

interface OKFIndexEntry {
  id: string
  label?: string
  path?: string
  category?: string
  description?: string
  updatedAt?: string
  isNew?: boolean
  tags?: string[]
  difficulty?: string
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
  const { meta, body } = parseFrontmatter(text)
  const topics = parseIndexMd(body, meta)
  return topics.length ? topics : null
}

function parseIndexMd(body: string, globalMeta?: Record<string, unknown>): TopicRoute[] {
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
      
      const itemMeta = (globalMeta?.topics as Record<string, unknown>)?.[id] as Record<string, unknown> | undefined

      topics.push({
        id,
        label,
        path: `/topics/${id}`,
        category: currentCategory,
        description,
        updatedAt: itemMeta?.updatedAt as string | undefined,
        isNew: itemMeta?.isNew as boolean | undefined,
        tags: itemMeta?.tags as string[] | undefined,
        difficulty: itemMeta?.difficulty as string | undefined,
      })
    }
  }
  return topics
}

export async function discoverTopics(): Promise<TopicRoute[]> {
  try {
    const mdTopics = await discoverFromIndexMd()
    
    // Always fetch index.yaml to merge metadata if index.yaml exists
    let yamlMap: Record<string, OKFIndexEntry> = {}
    try {
      const res = await fetch(`${BASE_URL}index.yaml`)
      if (res.ok) {
        const parsed = yaml.load(await res.text()) as OKFIndexEntry[]
        if (Array.isArray(parsed)) {
          yamlMap = Object.fromEntries(parsed.map((item) => [item.id, item]))
        }
      }
    } catch { /* ignore fallback */ }

    if (mdTopics) {
      return mdTopics.map((t) => {
        const yamlMeta = yamlMap[t.id]
        return {
          ...t,
          updatedAt: t.updatedAt ?? yamlMeta?.updatedAt,
          isNew: t.isNew ?? yamlMeta?.isNew,
          tags: t.tags ?? yamlMeta?.tags,
          difficulty: t.difficulty ?? yamlMeta?.difficulty,
        }
      })
    }

    if (Object.keys(yamlMap).length === 0) return []

    const topics = await Promise.all(
      Object.values(yamlMap).map(async (entry) => {
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
          updatedAt: entry.updatedAt ?? (meta.updatedAt as string) ?? (meta.updated_at as string),
          isNew: entry.isNew ?? (meta.isNew as boolean) ?? (meta.is_new as boolean),
          tags: entry.tags ?? (meta.tags as string[]),
          difficulty: entry.difficulty ?? (meta.difficulty as string),
        }
      })
    )
    return topics
  } catch {
    return []
  }
}

/**
 * All topics: OKF catalog merged with the OpenUI Lang content catalog
 * (migrated topics take their OpenUI metadata).
 */
export async function discoverAllTopics(): Promise<TopicRoute[]> {
  const [okf, oui] = await Promise.all([
    discoverTopics(),
    discoverOUITopics().catch((e: unknown) => {
      console.warn('OpenUI content catalog could not be loaded:', e)
      return [] as TopicRoute[]
    }),
  ])
  return mergeTopicRoutes(okf, oui)
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
      const discovered = await discoverAllTopics()
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
