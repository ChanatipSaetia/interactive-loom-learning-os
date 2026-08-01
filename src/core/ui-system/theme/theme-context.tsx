import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type ThemeId = 'catppuccin-frappe' | 'pink-cat-boo'

export interface ThemeMeta {
  id: ThemeId
  name: string
  author: string
  /** Emoji or short symbol shown in the picker */
  icon: string
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'catppuccin-frappe',
    name: 'Catppuccin Frappé',
    author: 'Catppuccin',
    icon: '🫐',
  },
  {
    id: 'pink-cat-boo',
    name: 'Pink Cat Boo',
    author: 'Fiona Fan',
    icon: '🌸',
  },
]

const STORAGE_KEY = 'loom-os-theme'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (id: ThemeId) => void
  themes: ThemeMeta[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    return stored && THEMES.some((t) => t.id === stored) ? stored : 'catppuccin-frappe'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function setTheme(id: ThemeId) {
    setThemeState(id)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
