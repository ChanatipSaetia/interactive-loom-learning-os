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
    expect(result.current.stepForward).toBeDefined()
    expect(result.current.stepBack).toBeDefined()
  })

  it('returns status object with playing, currentStep, totalSteps', () => {
    const addFn = vi.fn()
    const { result } = renderHook(() => useAnimation(addFn, { autoplay: false }))

    expect(result.current.status).toBeDefined()
    expect(typeof result.current.status.playing).toBe('boolean')
    expect(typeof result.current.status.currentStep).toBe('number')
    expect(typeof result.current.status.totalSteps).toBe('number')
  })

 it('status reflects totalSteps from options', () => {
    const addFn = vi.fn()
    const { result } = renderHook(() => useAnimation(addFn, { autoplay: false, totalSteps: 5 }))

    expect(result.current.status.totalSteps).toBe(5)
  })

  it('status.currentStep starts at 0', () => {
    const addFn = vi.fn()
    const { result } = renderHook(() => useAnimation(addFn, { autoplay: false }))

    expect(result.current.status.currentStep).toBe(0)
  })

  it('status.playing starts as false when autoplay is false', () => {
    const addFn = vi.fn()
    const { result } = renderHook(() => useAnimation(addFn, { autoplay: false }))

    expect(result.current.status.playing).toBe(false)
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

  it('reset sets currentStep to 0 and playing to false', () => {
    const addFn = vi.fn((tl: Parameters<Parameters<typeof useAnimation>[0]>[0]) => {
      tl.add('a' as unknown as never, { x: 100 } as unknown as never, 0)
      tl.add('b' as unknown as never, { x: 200 } as unknown as never, 500)
    })
    const { result } = renderHook(() => useAnimation(addFn, { autoplay: false }))

    result.current.reset()

    expect(result.current.status.currentStep).toBe(0)
    expect(result.current.status.playing).toBe(false)
  })
})
