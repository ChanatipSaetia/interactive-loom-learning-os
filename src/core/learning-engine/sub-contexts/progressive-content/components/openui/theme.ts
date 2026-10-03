import type { Theme } from '@openuidev/react-ui'
import defaultDarkTheme from '../../openui-standard/dark-theme.json'

/**
 * Bridge from the Loom design tokens (Catppuccin palette CSS variables, which
 * every Loom theme redefines) to OpenUI's `--openui-*` theme tokens, so the
 * standard components follow the active Loom theme.
 *
 * The tokens are injected as plain CSS custom properties rather than through
 * react-ui's `<ThemeProvider>`: the `genui-lib` bundle that renders OpenUI Lang
 * carries its own copy of the theme context, which an external provider can't
 * reach, so a provider would only add weight. Values are `var()` references, so
 * one static stylesheet follows Loom theme switches.
 */
const mix = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`

export const LOOM_OPENUI_THEME: Theme = {
  background: 'var(--ctp-base)',
  foreground: 'var(--ctp-surface0)',
  popoverBackground: 'var(--ctp-mantle)',
  sunkLight: 'var(--ctp-mantle)',
  sunk: 'var(--ctp-mantle)',
  sunkDeep: 'var(--ctp-crust)',
  elevatedLight: mix('var(--ctp-surface0)', 60),
  elevated: 'var(--ctp-surface0)',
  elevatedStrong: 'var(--ctp-surface1)',
  elevatedIntense: 'var(--ctp-surface2)',
  overlay: mix('var(--ctp-crust)', 70),
  highlightSubtle: mix('var(--ctp-text)', 3),
  highlight: mix('var(--ctp-text)', 6),
  highlightStrong: mix('var(--ctp-text)', 10),
  highlightIntense: mix('var(--ctp-text)', 20),
  invertedBackground: 'var(--ctp-text)',
  infoBackground: mix('var(--ctp-blue)', 16),
  successBackground: mix('var(--ctp-green)', 16),
  alertBackground: mix('var(--ctp-yellow)', 16),
  dangerBackground: mix('var(--ctp-red)', 16),
  purpleBackground: mix('var(--ctp-mauve)', 16),
  pinkBackground: mix('var(--ctp-pink)', 16),
  textNeutralPrimary: 'var(--ctp-text)',
  textNeutralSecondary: 'var(--ctp-subtext0)',
  textNeutralTertiary: 'var(--ctp-overlay1)',
  textNeutralLink: 'var(--primary)',
  textBrand: 'var(--primary)',
  textWhite: 'var(--ctp-text)',
  textBlack: 'var(--ctp-crust)',
  textAccentPrimary: 'var(--primary-foreground)',
  textAccentSecondary: mix('var(--primary-foreground)', 70),
  textAccentTertiary: mix('var(--primary-foreground)', 40),
  textSuccessPrimary: 'var(--ctp-green)',
  textAlertPrimary: 'var(--ctp-yellow)',
  textDangerPrimary: 'var(--ctp-red)',
  textDangerSecondary: mix('var(--ctp-red)', 70),
  textDangerTertiary: mix('var(--ctp-red)', 40),
  textInfoPrimary: 'var(--ctp-blue)',
  textPinkPrimary: 'var(--ctp-pink)',
  textPurplePrimary: 'var(--ctp-mauve)',
  interactiveAccentDefault: 'var(--primary)',
  interactiveAccentHover: mix('var(--primary)', 85),
  interactiveAccentPressed: mix('var(--primary)', 70),
  interactiveAccentDisabled: mix('var(--primary)', 35),
  interactiveDestructiveDefault: mix('var(--ctp-red)', 16),
  interactiveDestructiveHover: mix('var(--ctp-red)', 24),
  interactiveDestructivePressed: mix('var(--ctp-red)', 32),
  interactiveDestructiveDisabled: mix('var(--ctp-red)', 8),
  interactiveDestructiveAccentDefault: 'var(--ctp-red)',
  interactiveDestructiveAccentHover: mix('var(--ctp-red)', 85),
  interactiveDestructiveAccentPressed: mix('var(--ctp-red)', 70),
  interactiveDestructiveAccentDisabled: mix('var(--ctp-red)', 35),
  borderDefault: 'var(--border)',
  borderInteractive: 'var(--ctp-surface2)',
  borderInteractiveEmphasis: 'var(--ctp-overlay0)',
  borderInteractiveSelected: 'var(--primary)',
  borderAccent: mix('var(--primary)', 40),
  borderAccentEmphasis: mix('var(--primary)', 70),
  borderInfo: mix('var(--ctp-blue)', 40),
  borderInfoEmphasis: 'var(--ctp-blue)',
  borderAlert: mix('var(--ctp-yellow)', 40),
  borderAlertEmphasis: 'var(--ctp-yellow)',
  borderSuccess: mix('var(--ctp-green)', 40),
  borderSuccessEmphasis: 'var(--ctp-green)',
  borderDanger: mix('var(--ctp-red)', 40),
  borderDangerEmphasis: 'var(--ctp-red)',
  fontBody: 'var(--font-body)',
  fontHeading: 'var(--font-display)',
  fontLabel: 'var(--font-body)',
}

const UPSTREAM_FONT = '"Inter", sans-serif'

/**
 * react-ui's composite text tokens (`textBodyDefault: 400 16px/1.5 "Inter", …`)
 * hardcode the font family; swap in the Loom fonts (display font for headings).
 */
function withLoomFonts(theme: Record<string, string>): Theme {
  return Object.fromEntries(Object.entries(theme).map(([key, value]) => [
    key,
    value.includes(UPSTREAM_FONT)
      ? value.replace(UPSTREAM_FONT, key.startsWith('textHeading') ? 'var(--font-display)' : 'var(--font-body)')
      : value,
  ]))
}

/** Same naming as react-ui's `themeToCssVars`: `textBodyXs` → `--openui-text-body-xs`. */
function cssVarName(key: string): string {
  const kebab = key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])(\d)/g, '$1-$2')
    .toLowerCase()
  return `--openui-${kebab}`
}

/**
 * CSS declaring every `--openui-*` token: react-ui's dark defaults overlaid with
 * the Loom mapping. Declared on `body` so OpenUI popups (selects, tooltips,
 * modals), which portal to the end of the document, are themed as well.
 */
export function loomOpenUIThemeCss(selector = 'body'): string {
  const theme: Theme = { ...withLoomFonts(defaultDarkTheme), ...LOOM_OPENUI_THEME }
  const declarations = Object.entries(theme)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([key, value]) => `  ${cssVarName(key)}: ${value};`)
  return `${selector} {\n${declarations.join('\n')}\n}\n`
}

const STYLE_ID = 'loom-openui-theme'

/** Add the OpenUI theme stylesheet to the document once. */
export function ensureLoomOpenUITheme(doc: Document | undefined = typeof document !== 'undefined' ? document : undefined): void {
  if (!doc || doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = loomOpenUIThemeCss()
  doc.head.appendChild(style)
}
