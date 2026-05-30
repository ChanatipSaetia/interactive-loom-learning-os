import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnimation } from '../../../../src/core/hooks/useAnimation'

describe('useAnimation', () => {
  it('returns animation control object with required methods', () => {
    const addFn = vi.fn()
    const { result } = renderHook(() => useAnimation(addFn, { autoplay: false }))

    expect(result.current.play).toBeDefined()
    expect(result.current.pause).toBeDefined()
    expect(result.current.reset).toBeDefined()
    expect(result.current.restart).toBeDefined()
    expect(result.current.seek).toBeDefined()
  })

  it('calls addFn with timeline on mount', () => {
    const addFn = vi.fn()
    renderHook(() => useAnimation(addFn, { autoplay: false }))

    expect(addFn).toHaveBeenCalledTimes(1)
    expect(addFn.mock.calls[0][0]).toBeDefined()
    expect(typeof addFn.mock.calls[0][0].add).toBe('function')
  })

  it('control methods are stable across re-renders', () => {
    const addFn = vi.fn()
    const { result, rerender } = renderHook(() => useAnimation(addFn, { autoplay: false }))

    const firstControl = result.current
    rerender()
    expect(result.current).toBe(firstControl)
  })
})
