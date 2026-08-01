import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../../../../../../src/core/learning-engine/composition/hooks/usePagination'

const items = Array.from({ length: 26 }, (_, i) => ({ id: i, name: `Item ${i + 1}` }))

describe('usePagination', () => {
  it('returns correct page items on first page', () => {
    const { result } = renderHook(() =>
      usePagination({ items, page: 1, pageSize: 10 })
    )

    expect(result.current.pageItems).toHaveLength(10)
    expect(result.current.pageItems[0].id).toBe(0)
    expect(result.current.pageItems[9].id).toBe(9)
  })

  it('returns correct page items on second page', () => {
    const { result, rerender } = renderHook(
      ({ page }) => usePagination({ items, page, pageSize: 10 }),
      { initialProps: { page: 1 } }
    )

    act(() => {
      rerender({ page: 2 })
    })

    expect(result.current.pageItems).toHaveLength(10)
    expect(result.current.pageItems[0].id).toBe(10)
    expect(result.current.pageItems[9].id).toBe(19)
  })

  it('returns remaining items on last page', () => {
    const { result, rerender } = renderHook(
      ({ page }) => usePagination({ items, page, pageSize: 10 }),
      { initialProps: { page: 1 } }
    )

    act(() => {
      rerender({ page: 3 })
    })

    expect(result.current.pageItems).toHaveLength(6)
    expect(result.current.totalPages).toBe(3)
  })

  it('caps page to totalPages when page exceeds bounds', () => {
    const { result, rerender } = renderHook(
      ({ page }) => usePagination({ items, page, pageSize: 10 }),
      { initialProps: { page: 1 } }
    )

    act(() => {
      rerender({ page: 99 })
    })

    expect(result.current.pageItems).toHaveLength(6)
    expect(result.current.totalPages).toBe(3)
  })

  it('hasPrev and hasNext reflect boundaries', () => {
    const { result, rerender } = renderHook(
      ({ page }) => usePagination({ items, page, pageSize: 10 }),
      { initialProps: { page: 1 } }
    )

    expect(result.current.hasPrev).toBe(false)
    expect(result.current.hasNext).toBe(true)

    act(() => {
      rerender({ page: 2 })
    })

    expect(result.current.hasPrev).toBe(true)
    expect(result.current.hasNext).toBe(true)

    act(() => {
      rerender({ page: 3 })
    })

    expect(result.current.hasPrev).toBe(true)
    expect(result.current.hasNext).toBe(false)
  })

  it('returns empty for empty items', () => {
    const { result } = renderHook(() =>
      usePagination({ items: [], page: 1, pageSize: 10 })
    )

    expect(result.current.pageItems).toHaveLength(0)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.totalItems).toBe(0)
    expect(result.current.hasPrev).toBe(false)
    expect(result.current.hasNext).toBe(false)
  })

  it('startIdx and endIdx are correct', () => {
    const { result, rerender } = renderHook(
      ({ page }) => usePagination({ items, page, pageSize: 10 }),
      { initialProps: { page: 1 } }
    )

    expect(result.current.startIdx).toBe(0)
    expect(result.current.endIdx).toBe(10)

    act(() => {
      rerender({ page: 2 })
    })

    expect(result.current.startIdx).toBe(10)
    expect(result.current.endIdx).toBe(20)

    act(() => {
      rerender({ page: 3 })
    })

    expect(result.current.startIdx).toBe(20)
    expect(result.current.endIdx).toBe(26)
  })

  it('totalItems equals items length', () => {
    const { result } = renderHook(() =>
      usePagination({ items, page: 1, pageSize: 10 })
    )

    expect(result.current.totalItems).toBe(26)
  })
})
