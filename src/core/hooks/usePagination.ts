import { useMemo } from 'react'

interface UsePaginationResult<T> {
  pageItems: T[]
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  startIdx: number
  endIdx: number
  totalItems: number
}

interface UsePaginationProps<T> {
  items: T[]
  page: number
  pageSize: number
}

export function usePagination<T>({
  items,
  page,
  pageSize,
}: UsePaginationProps<T>): UsePaginationResult<T> {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
    const safePage = Math.min(page, totalPages)
    const startIdx = (safePage - 1) * pageSize
    const endIdx = Math.min(safePage * pageSize, items.length)

    return {
      pageItems: items.slice(startIdx, endIdx),
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
      startIdx,
      endIdx,
      totalItems: items.length,
    }
  }, [items, page, pageSize])
}
