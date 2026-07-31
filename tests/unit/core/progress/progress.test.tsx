import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import {
  ProgressProvider,
  useProgress,
  useSectionProgress,
  PROGRESS_STORAGE_KEY,
  loadProgress,
  saveProgress,
  defaultSectionProgress,
  type ProgressContextValue,
  type SectionProgress,
} from '../../../../src/core/subdomains/supporting/learner-progress'

function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>
}

// --- defaultSectionProgress ---

describe('defaultSectionProgress', () => {
  it('returns correct defaults', () => {
    const def = defaultSectionProgress()
    expect(def.viewed).toBe(false)
    expect(def.completed).toBe(false)
    expect(def.data).toEqual({})
  })
})

// --- storage ---

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadProgress returns empty object when no data', () => {
    expect(loadProgress()).toEqual({})
  })

  it('loadProgress returns stored data', () => {
    const store = { demo: { s1: { viewed: true, completed: false, data: {} } } }
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store))
    expect(loadProgress()).toEqual(store)
  })

  it('saveProgress persists to localStorage', () => {
    const store = { demo: { s1: { viewed: true, completed: false, data: {} } } }
    saveProgress(store)
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
    expect(raw).toBe(JSON.stringify(store))
  })

  it('loadProgress returns empty on malformed JSON', () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, 'not-json')
    expect(loadProgress()).toEqual({})
  })
})

// --- ProgressProvider + useProgress ---

describe('ProgressProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('useProgress throws outside provider', () => {
    expect(() => renderHook(() => useProgress())).toThrow(
      'useProgress must be used inside <ProgressProvider>',
    )
  })

  it('provides default empty store inside provider', () => {
    const { result } = renderHook(
      () => useProgress(),
      { wrapper: ProviderWrapper },
    )
    const ctx = result.current as ProgressContextValue
    expect(ctx.store).toEqual({})
  })

  it('getSectionProgress returns defaults for unknown section', () => {
    const { result } = renderHook(
      () => useProgress(),
      { wrapper: ProviderWrapper },
    )
    const ctx = result.current as ProgressContextValue
    const progress = ctx.getSectionProgress('demo', 's1')
    expect(progress.viewed).toBe(false)
    expect(progress.completed).toBe(false)
    expect(progress.data).toEqual({})
  })

  it('setSectionProgress persists and updates store', () => {
    const { result } = renderHook(
      () => useProgress(),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      ;(result.current as ProgressContextValue).setSectionProgress('demo', 's1', { viewed: true })
    })

    expect((result.current as ProgressContextValue).store.demo.s1).toEqual({
      viewed: true,
      completed: false,
      data: {},
    })

    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
    expect(JSON.parse(raw ?? '{}')).toHaveProperty('demo')
  })

  it('setSectionProgress merges with existing data', () => {
    const { result } = renderHook(
      () => useProgress(),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      ;(result.current as ProgressContextValue).setSectionProgress('demo', 's1', { viewed: true })
    })

    act(() => {
      ;(result.current as ProgressContextValue).setSectionProgress('demo', 's1', { completed: true })
    })

    expect((result.current as ProgressContextValue).store.demo.s1).toEqual({
      viewed: true,
      completed: true,
      data: {},
    })
  })

  it('updateSectionProgress supports function updater', () => {
    const { result } = renderHook(
      () => useProgress(),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      ;(result.current as ProgressContextValue).updateSectionProgress('demo', 's1', (prev: SectionProgress) => ({
        ...prev,
        viewed: true,
        data: { score: 95 },
      }))
    })

    expect((result.current as ProgressContextValue).store.demo.s1).toEqual({
      viewed: true,
      completed: false,
      data: { score: 95 },
    })
  })

  it('persists across renders', () => {
    const { result, rerender } = renderHook(
      () => useProgress(),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      ;(result.current as ProgressContextValue).setSectionProgress('demo', 's1', { viewed: true })
    })

    rerender()
    expect((result.current as ProgressContextValue).store.demo.s1.viewed).toBe(true)
  })
})

// --- useSectionProgress ---

describe('useSectionProgress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default progress for new section', () => {
    const { result } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    expect(result.current.progress).toEqual({
      viewed: false,
      completed: false,
      data: {},
    })
  })

  it('markViewed sets viewed to true', () => {
    const { result } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      result.current.markViewed()
    })

    expect(result.current.progress.viewed).toBe(true)
    expect(result.current.progress.completed).toBe(false)
  })

  it('markCompleted sets both viewed and completed to true', () => {
    const { result } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      result.current.markCompleted()
    })

    expect(result.current.progress.viewed).toBe(true)
    expect(result.current.progress.completed).toBe(true)
  })

  it('setData stores arbitrary data', () => {
    const { result } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      result.current.setData('quizScore', 85)
    })

    expect(result.current.progress.data.quizScore).toBe(85)
  })

  it('getData returns stored data', () => {
    const { result } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      result.current.setData('quizScore', 85)
    })

    expect(result.current.getData('quizScore')).toBe(85)
  })

  it('getData returns undefined for missing key', () => {
    const { result } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    expect(result.current.getData('nonexistent')).toBeUndefined()
  })

  it('persists data across sessions via localStorage', () => {
    const { result: first } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      first.current.markCompleted()
      first.current.setData('score', 100)
    })

    const { result: second } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )

    expect(second.current.progress.completed).toBe(true)
    expect(second.current.progress.data.score).toBe(100)
  })

  it('multiple sections are independent', () => {
    const { result: r1 } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )
    const { result: r2 } = renderHook(
      () => useSectionProgress('demo', 's2'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      r1.current.markCompleted()
    })

    expect(r1.current.progress.completed).toBe(true)
    expect(r2.current.progress.completed).toBe(false)
  })

  it('multiple topics are independent', () => {
    const { result: demo } = renderHook(
      () => useSectionProgress('demo', 's1'),
      { wrapper: ProviderWrapper },
    )
    const { result: motor } = renderHook(
      () => useSectionProgress('motorcycle', 's1'),
      { wrapper: ProviderWrapper },
    )

    act(() => {
      demo.current.markCompleted()
    })

    expect(demo.current.progress.completed).toBe(true)
    expect(motor.current.progress.completed).toBe(false)
  })
})
