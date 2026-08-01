/**
 * Theme registry.
 *
 * The default theme (Catppuccin Frappé) is defined on :root in
 * src/styles/variables.css. Additional themes override the raw
 * --ctp-* palette under a [data-theme='<id>'] selector, which the
 * semantic tokens resolve lazily — so the whole UI re-themes.
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
  { id: '', label: 'Catppuccin Frappé' },
  { id: 'medicare', label: 'MediCare+' },
  { id: 'recipebook', label: 'RecipeBook' },
  { id: 'pinkcatboo', label: 'PinkCatBoo' },
  { id: 'eink', label: 'E-Ink (Paper)', icon: '📄' },
]

export const DEFAULT_THEME_ID = ''

export const THEME_STORAGE_KEY = 'loom-theme'
