import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY, THEMES } from './themes'

function isKnownTheme(id: string): boolean {
  return THEMES.some((theme) => theme.id === id)
}

function readStoredTheme(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored !== null && isKnownTheme(stored) ? stored : DEFAULT_THEME_ID
}

function applyTheme(id: string): void {
  const root = document.documentElement
  if (id) {
    root.dataset.theme = id
  } else {
    delete root.dataset.theme
  }
}

/**
 * Manages the active theme: applies it to <html data-theme>, and
 * persists the choice in localStorage.
 */
export function useTheme() {
  const [themeId, setThemeId] = useState<string>(readStoredTheme)

  useEffect(() => {
    applyTheme(themeId)
  }, [themeId])

  const setTheme = useCallback((id: string) => {
    const next = isKnownTheme(id) ? id : DEFAULT_THEME_ID
    setThemeId(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* storage unavailable — theme still applies for the session */
    }
  }, [])

  return { themeId, setTheme, themes: THEMES }
}
