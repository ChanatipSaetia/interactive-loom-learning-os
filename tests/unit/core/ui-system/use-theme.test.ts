import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { applyStoredTheme, useTheme } from '../../../../src/core/ui-system/theme/useTheme'
import { THEME_STORAGE_KEY } from '../../../../src/core/ui-system/theme/themes'

/** A matchMedia stub whose light/dark answer the test can change, firing 'change' listeners. */
function stubColorScheme(light: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    get matches() {
      return light
    },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => query))
  return (next: boolean) => {
    light = next
    listeners.forEach((cb) => cb())
  }
}

describe('theme default', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })
  afterEach(() => vi.unstubAllGlobals())

  it('uses Liquid Glass in dark mode before the learner picks a theme', () => {
    stubColorScheme(false)
    applyStoredTheme()
    expect(document.documentElement.dataset.theme).toBe('liquid-glass')
  })

  it('uses Liquid Glass Light in light mode before the learner picks a theme', () => {
    stubColorScheme(true)
    applyStoredTheme()
    expect(document.documentElement.dataset.theme).toBe('liquid-glass-light')
  })

  it('keeps a theme the learner picked, Catppuccin included', () => {
    stubColorScheme(true)
    localStorage.setItem(THEME_STORAGE_KEY, '')
    applyStoredTheme()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('follows the system scheme until the learner picks, then stops following', () => {
    const setLight = stubColorScheme(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.themeId).toBe('liquid-glass')

    act(() => setLight(true))
    expect(result.current.themeId).toBe('liquid-glass-light')

    act(() => result.current.setTheme('bedtime'))
    act(() => setLight(false))
    expect(result.current.themeId).toBe('bedtime')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('bedtime')
  })
})
