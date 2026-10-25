import { useCallback, useEffect, useState } from 'react'
import { LIGHT_SCHEME_QUERY, THEME_STORAGE_KEY, THEMES, systemThemeId } from './themes'

function isKnownTheme(id: string): boolean {
  return THEMES.some((theme) => theme.id === id)
}

/** The theme the learner picked, or null while they have not picked one (or it is unknown). */
function readChosenTheme(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored !== null && isKnownTheme(stored) ? stored : null
  } catch {
    return null
  }
}

function readStoredTheme(): string {
  return readChosenTheme() ?? systemThemeId()
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
 * Applies the saved theme before the first render. Each page calls it at startup, so the theme
 * holds even while no ThemeToggle is mounted (e.g. it sits in a closed ⋯ menu on narrow screens).
 */
export function applyStoredTheme(): void {
  applyTheme(readStoredTheme())
}

/**
 * Manages the active theme: applies it to <html data-theme>, and
 * persists the choice in localStorage. Until the learner picks one,
 * it follows the system's light or dark scheme.
 */
export function useTheme() {
  const [themeId, setThemeId] = useState<string>(readStoredTheme)

  useEffect(() => {
    applyTheme(themeId)
  }, [themeId])

  useEffect(() => {
    const query = window.matchMedia?.(LIGHT_SCHEME_QUERY)
    if (!query) return
    const follow = () => {
      if (readChosenTheme() === null) setThemeId(systemThemeId())
    }
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [])

  const setTheme = useCallback((id: string) => {
    const next = isKnownTheme(id) ? id : systemThemeId()
    setThemeId(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* storage unavailable — theme still applies for the session */
    }
  }, [])

  return { themeId, setTheme, themes: THEMES }
}
