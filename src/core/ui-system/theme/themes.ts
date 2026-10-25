/**
 * Theme registry.
 *
 * The base palette (Catppuccin Frappé) is defined on :root in
 * src/styles/variables.css. Additional themes override the raw
 * --ctp-* palette under a [data-theme='<id>'] selector, which the
 * semantic tokens resolve lazily — so the whole UI re-themes.
 *
 * Until the learner picks a theme, Loom follows the system: Liquid Glass
 * in dark mode, Liquid Glass Light in light mode (SYSTEM_THEMES).
 *
 * To add a new theme: append an entry here and add a matching
 * [data-theme='<id>'] block in variables.css.
 */
export interface ThemeOption {
  /** Value written to <html data-theme="...">. Empty string = default :root theme. */
  id: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Optional emoji or text icon shown beside the label. */
  icon?: string
}

export const THEMES: ThemeOption[] = [
  { id: 'liquid-glass', label: 'Liquid Glass', icon: '💧' },
  { id: 'liquid-glass-light', label: 'Liquid Glass Light', icon: '🫧' },
  { id: '', label: 'Catppuccin Frappé' },
  { id: 'medicare', label: 'MediCare+' },
  { id: 'recipebook', label: 'RecipeBook' },
  { id: 'pinkcatboo', label: 'PinkCatBoo' },
  { id: 'eink', label: 'E-Ink (Paper)', icon: '📄' },
  { id: 'bedtime', label: 'Bedtime (Night Reading)', icon: '🌙' },
]

/** The default theme for each system color scheme, used until the learner picks one. */
export const SYSTEM_THEMES = { dark: 'liquid-glass', light: 'liquid-glass-light' } as const

/** The media query that decides between SYSTEM_THEMES.light and SYSTEM_THEMES.dark. */
export const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)'

/** The default theme for the current system color scheme (dark when it cannot be read). */
export function systemThemeId(): string {
  const light = typeof window !== 'undefined' && window.matchMedia?.(LIGHT_SCHEME_QUERY).matches
  return light ? SYSTEM_THEMES.light : SYSTEM_THEMES.dark
}

export const THEME_STORAGE_KEY = 'loom-theme'
