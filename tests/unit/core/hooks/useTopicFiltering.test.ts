import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTopicFiltering, type SortColumn, type SortDirection } from '../../../../src/core/hooks/useTopicFiltering'
import type { TopicRoute } from '../../../../src/core/routes'

const mockTopics: TopicRoute[] = [
  { id: 'demo', label: 'REST API vs WebSocket', path: '/demo/rest-vs-websocket', category: 'Architecture', description: 'Compare REST API and WebSocket communication patterns', sections: [] },
  { id: 'grpc', label: 'gRPC Basics', path: '/demo/grpc-basics', category: 'Networking', description: 'Learn gRPC protocol fundamentals', sections: [] },
  { id: 'events', label: 'Event-Driven Architecture', path: '/demo/events', category: 'Architecture', description: 'Understanding event-driven systems', sections: [] },
]

describe('useTopicFiltering', () => {
  it('returns all categories from topics', () => {
    const { result } = renderHook(() =>
      useTopicFiltering({
        topics: mockTopics,
        search: '',
        activeCategory: 'all',
        sortColumn: null,
        sortDirection: null,
      })
    )

    expect(result.current.categories).toEqual(['all', 'Architecture', 'Networking'])
  })

  it('returns all topics when no filters applied', () => {
    const { result } = renderHook(() =>
      useTopicFiltering({
        topics: mockTopics,
        search: '',
        activeCategory: 'all',
        sortColumn: null,
        sortDirection: null,
      })
    )

    expect(result.current.filteredTopics).toHaveLength(3)
  })

  it('filters by search query on label', () => {
    const { result, rerender } = renderHook(
      ({ search }) =>
        useTopicFiltering({
          topics: mockTopics,
          search,
          activeCategory: 'all',
          sortColumn: null,
          sortDirection: null,
        }),
      { initialProps: { search: '' } }
    )

    act(() => {
      rerender({ search: 'grpc' })
    })

    expect(result.current.filteredTopics).toHaveLength(1)
    expect(result.current.filteredTopics[0].id).toBe('grpc')
  })

  it('filters by search query on description', () => {
    const { result, rerender } = renderHook(
      ({ search }) =>
        useTopicFiltering({
          topics: mockTopics,
          search,
          activeCategory: 'all',
          sortColumn: null,
          sortDirection: null,
        }),
      { initialProps: { search: '' } }
    )

    act(() => {
      rerender({ search: 'event-driven' })
    })

    expect(result.current.filteredTopics).toHaveLength(1)
    expect(result.current.filteredTopics[0].id).toBe('events')
  })

  it('filters by category', () => {
    const { result, rerender } = renderHook(
      ({ activeCategory }) =>
        useTopicFiltering({
          topics: mockTopics,
          search: '',
          activeCategory,
          sortColumn: null,
          sortDirection: null,
        }),
      { initialProps: { activeCategory: 'all' } }
    )

    act(() => {
      rerender({ activeCategory: 'Networking' })
    })

    expect(result.current.filteredTopics).toHaveLength(1)
    expect(result.current.filteredTopics[0].id).toBe('grpc')
  })

  it('returns empty array when no topics match', () => {
    const { result, rerender } = renderHook(
      ({ search }) =>
        useTopicFiltering({
          topics: mockTopics,
          search,
          activeCategory: 'all',
          sortColumn: null,
          sortDirection: null,
        }),
      { initialProps: { search: '' } }
    )

    act(() => {
      rerender({ search: 'xyznonexistent' })
    })

    expect(result.current.filteredTopics).toHaveLength(0)
  })

  it('sorts by label ascending', () => {
    const { result, rerender } = renderHook(
      ({ sortColumn, sortDirection }) =>
        useTopicFiltering({
          topics: mockTopics,
          search: '',
          activeCategory: 'all',
          sortColumn,
          sortDirection,
        }),
      { initialProps: { sortColumn: null as SortColumn, sortDirection: null as SortDirection } }
    )

    act(() => {
      rerender({ sortColumn: 'label', sortDirection: 'asc' })
    })

    expect(result.current.filteredTopics.map((t) => t.label)).toEqual([
      'Event-Driven Architecture',
      'gRPC Basics',
      'REST API vs WebSocket',
    ])
  })

  it('sorts by label descending', () => {
    const { result, rerender } = renderHook(
      ({ sortColumn, sortDirection }) =>
        useTopicFiltering({
          topics: mockTopics,
          search: '',
          activeCategory: 'all',
          sortColumn,
          sortDirection,
        }),
      { initialProps: { sortColumn: null as SortColumn, sortDirection: null as SortDirection } }
    )

    act(() => {
      rerender({ sortColumn: 'label', sortDirection: 'desc' })
    })

    expect(result.current.filteredTopics.map((t) => t.label)).toEqual([
      'REST API vs WebSocket',
      'gRPC Basics',
      'Event-Driven Architecture',
    ])
  })

  it('sort is stable - equal values preserve original order', () => {
    const stableTopics: TopicRoute[] = [
      { id: 'a', label: 'Same', path: '/a', category: 'Cat1', description: 'First', sections: [] },
      { id: 'b', label: 'Same', path: '/b', category: 'Cat1', description: 'Second', sections: [] },
      { id: 'c', label: 'Same', path: '/c', category: 'Cat1', description: 'Third', sections: [] },
    ]

    const { result, rerender } = renderHook(
      ({ sortColumn, sortDirection }) =>
        useTopicFiltering({
          topics: stableTopics,
          search: '',
          activeCategory: 'all',
          sortColumn,
          sortDirection,
        }),
      { initialProps: { sortColumn: null as SortColumn, sortDirection: null as SortDirection } }
    )

    act(() => {
      rerender({ sortColumn: 'label', sortDirection: 'asc' })
    })

    expect(result.current.filteredTopics.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('combines search + category + sort', () => {
    const { result, rerender } = renderHook(
      ({ search, activeCategory, sortColumn, sortDirection }) =>
        useTopicFiltering({
          topics: mockTopics,
          search,
          activeCategory,
          sortColumn,
          sortDirection,
        }),
      { initialProps: { search: '', activeCategory: 'all', sortColumn: null as SortColumn, sortDirection: null as SortDirection } }
    )

    act(() => {
      rerender({ search: 'api', activeCategory: 'Architecture', sortColumn: 'label', sortDirection: 'asc' })
    })

    expect(result.current.filteredTopics).toHaveLength(1)
    expect(result.current.filteredTopics[0].id).toBe('demo')
  })

  it('handles empty topics array', () => {
    const { result } = renderHook(() =>
      useTopicFiltering({
        topics: [],
        search: '',
        activeCategory: 'all',
        sortColumn: null,
        sortDirection: null,
      })
    )

    expect(result.current.categories).toEqual(['all'])
    expect(result.current.filteredTopics).toHaveLength(0)
  })

  it('search is case-insensitive', () => {
    const { result, rerender } = renderHook(
      ({ search }) =>
        useTopicFiltering({
          topics: mockTopics,
          search,
          activeCategory: 'all',
          sortColumn: null,
          sortDirection: null,
        }),
      { initialProps: { search: '' } }
    )

    act(() => {
      rerender({ search: 'GRPC' })
    })

    expect(result.current.filteredTopics).toHaveLength(1)
    expect(result.current.filteredTopics[0].id).toBe('grpc')
  })

  it('sort null resets to original order', () => {
    const { result, rerender } = renderHook(
      ({ sortColumn, sortDirection }) =>
        useTopicFiltering({
          topics: mockTopics,
          search: '',
          activeCategory: 'all',
          sortColumn,
          sortDirection,
        }),
      { initialProps: { sortColumn: 'label' as SortColumn, sortDirection: 'asc' as SortDirection } }
    )

    expect(result.current.filteredTopics[0].label).toBe('Event-Driven Architecture')

    act(() => {
      rerender({ sortColumn: null, sortDirection: null })
    })

    expect(result.current.filteredTopics[0].label).toBe('REST API vs WebSocket')
  })
})
