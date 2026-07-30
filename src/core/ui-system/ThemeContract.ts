/**
 * ThemeContract — Catppuccin Frappé color tokens, typography scales, spacing variables.
 *
 * Tokens mirror the CSS custom properties in `src/styles/variables.css`.
 * JavaScript/TypeScript consumers read from this module; CSS consumers
 * read directly from `var(--ctp-*)` in the stylesheet.
 */

// ---------------------------------------------------------------------------
// Catppuccin Frappé palette
// ---------------------------------------------------------------------------

export const CTP = {
  rosewater: '#f2d5cf',
  flamingo: '#eebebe',
  pink: '#f4b8e4',
  mauve: '#ca9ee6',
  red: '#e78284',
  maroon: '#ea999c',
  peach: '#ef9f76',
  yellow: '#e5c890',
  green: '#a6d189',
  teal: '#81c8be',
  sky: '#99d1db',
  sapphire: '#85c1dc',
  blue: '#8caaee',
  lavender: '#babbf1',
  text: '#c6d0f5',
  subtext1: '#b5bfe2',
  subtext0: '#a5adce',
  overlay2: '#949cbb',
  overlay1: '#838ba7',
  overlay0: '#737994',
  surface2: '#626880',
  surface1: '#51576d',
  surface0: '#414559',
  base: '#303446',
  mantle: '#292c3c',
  crust: '#232634',
} as const

export type CTPColor = (typeof CTP)[keyof typeof CTP]

// ---------------------------------------------------------------------------
// Semantic tokens (mirror CSS --variable names)
// ---------------------------------------------------------------------------

export interface ThemeTokens {
  /** Raw Catppuccin palette values */
  ctp: typeof CTP

  /** Tailwind / shadcn semantic tokens */
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
  destructive: string
  destructiveForeground: string

  /** Spacing (8 px base grid) */
  spacing: {
    xxs: string
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
    section: string
  }

  /** Border radius */
  radius: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    pill: string
    full: string
  }

  /** Typography scales */
  typography: {
    fontDisplay: string
    fontBody: string
    fontMono: string
    hero: string
    productDisplay: string
    sectionDisplay: string
    sectionHeading: string
    cardHeading: string
    featureHeading: string
    bodyLarge: string
    body: string
    button: string
    caption: string
    monoLabel: string
    micro: string
  }
}

/**
 * Runtime-resolved theme tokens. CSS consumers use `var(--*)` directly;
 * JS consumers may read computed styles or use this constant for defaults.
 */
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  ctp: CTP,
  background: 'var(--ctp-base)',
  foreground: 'var(--ctp-text)',
  card: 'var(--ctp-surface0)',
  cardForeground: 'var(--ctp-text)',
  primary: 'var(--ctp-blue)',
  primaryForeground: 'var(--ctp-crust)',
  secondary: 'var(--ctp-teal)',
  secondaryForeground: 'var(--ctp-crust)',
  muted: 'var(--ctp-surface1)',
  mutedForeground: 'var(--ctp-overlay2)',
  accent: 'var(--ctp-surface1)',
  accentForeground: 'var(--ctp-text)',
  border: 'var(--ctp-surface1)',
  input: 'var(--ctp-surface1)',
  ring: 'var(--ctp-blue)',
  destructive: 'var(--ctp-red)',
  destructiveForeground: 'var(--ctp-crust)',

  spacing: {
    xxs: '2px',
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    section: '80px',
  },

  radius: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '22px',
    xl: '30px',
    pill: '32px',
    full: '9999px',
  },

  typography: {
    fontDisplay: "'Noto Serif Thai', 'CohereText', 'Space Grotesk', 'Inter', ui-sans-serif, system-ui",
    fontBody: "'Noto Serif Thai', 'Unica77 Cohere Web', 'Inter', Arial, ui-sans-serif, system-ui",
    fontMono: "'CohereMono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    hero: '96px / 1.0 -1.92px',
    productDisplay: '72px / 1.0 -1.44px',
    sectionDisplay: '60px / 1.0 -1.2px',
    sectionHeading: '48px / 1.2 -0.48px',
    cardHeading: '32px / 1.2 -0.32px',
    featureHeading: '24px / 1.3 0',
    bodyLarge: '18px / 1.4 0',
    body: '16px / 1.5 0',
    button: '14px / 1.71 0',
    caption: '14px / 1.4 0',
    monoLabel: '14px / 1.4 0.28px',
    micro: '12px / 1.4 0',
  },
}
