import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { SyntheticEvent } from 'react'
import { useGhostClickGuard } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/views/ghost-click'

const ev = (type: string) => ({ type }) as SyntheticEvent

describe('useGhostClickGuard', () => {
  afterEach(() => vi.useRealTimers())

  it('lets a mouse click through', () => {
    const { result } = renderHook(() => useGhostClickGuard())
    expect(result.current(ev('click'))).toBe(false)
  })

  it('ignores the click a browser fires right after a tap, so the tap is not undone', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useGhostClickGuard())
    expect(result.current(ev('touchend'))).toBe(false)
    expect(result.current(ev('click'))).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(result.current(ev('click'))).toBe(false)
  })
})
