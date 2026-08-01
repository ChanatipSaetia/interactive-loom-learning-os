import { useMemo } from 'react'
import type { TopicRoute } from '../../../learning-engine/composition/routes'

export type SortDirection = 'asc' | 'desc' | null
export type SortColumn = 'label' | 'category' | 'description' | null

interface UseTopicFilteringProps {
  topics: TopicRoute[]
  search: string
  activeCategory: string
  sortColumn: SortColumn
  sortDirection: SortDirection
}

export function useTopicFiltering({
  topics,
  search,
  activeCategory,
  sortColumn,
  sortDirection,
}: UseTopicFilteringProps) {
  const categories = useMemo(() => {
    const cats = new Set(topics.map((t) => t.category))
    return ['all', ...Array.from(cats)]
  }, [topics])

  const filteredTopics = useMemo(() => {
    let result = [...topics]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory)
    }

    if (sortColumn && sortDirection) {
      const col = sortColumn as 'label' | 'category' | 'description'
      const dir = sortDirection as 'asc' | 'desc'
      result.sort((a, b) => {
        const aVal = a[col]
        const bVal = b[col]
        const cmp = aVal.localeCompare(bVal)
        return dir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [topics, search, activeCategory, sortColumn, sortDirection])

  return { categories, filteredTopics }
}
