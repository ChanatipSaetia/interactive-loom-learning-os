import { createRoot, type Root } from 'react-dom/client'
import React, { Suspense, useMemo, type ComponentType } from 'react'
import type { SectionConfig } from '../src/core/registry'
import { loadOKFBundle } from '../src/core/okf/reader'
import { bundleToSections } from '../src/core/okf/sections'
import { Registry } from '../src/core/registry/generic-registry'
import { HUDProvider } from '../src/core/context/HUDContext'
import { ProgressProvider } from '../src/core/progress/context'

// Import section CSS
import '../src/styles/global.css'
import '../src/components/layout/layout.css'
import '../src/sections/text/text.css'
import '../src/sections/bullets/bullets.css'
import '../src/sections/flowchart/flowchart.css'
import '../src/sections/tradeoff-sandbox/tradeoff-sandbox.css'
import '../src/sections/taxonomy-browser/taxonomy-browser.css'
import '../src/sections/quiz/quiz.css'
import '../src/sections/concept-map/concept-map.css'
import '../src/sections/scenario/scenario.css'
import '../src/sections/decision-tree/decision-tree.css'
import '../src/sections/formula-sandbox/formula-sandbox.css'
import '../src/sections/reflection-sequence/reflection-sequence.css'
import '../src/sections/reflection-template/reflection-template.css'
import { deriveSchema } from '../src/sections/flowchart/abstract-flow/derive'

// Import all section components directly
import TextSection from '../src/sections/text'
import BulletsSection from '../src/sections/bullets'
import FlowchartSection from '../src/sections/flowchart'
import TradeoffSandboxSection from '../src/sections/tradeoff-sandbox'
import TaxonomyBrowserSection from '../src/sections/taxonomy-browser'
import FlashcardsSection from '../src/sections/flashcards'
import QuizSection from '../src/sections/quiz'
import ConceptMapSection from '../src/sections/concept-map'
import ScenarioSection from '../src/sections/scenario'
import DecisionTreeSection from '../src/sections/decision-tree'
import ImageGallerySection from '../src/sections/image-gallery'
import FormulaSandboxSection from '../src/sections/formula-sandbox'
import ReflectionSequenceSection from '../src/sections/reflection-sequence'
import ReflectionTemplateSection from '../src/sections/reflection-template'

// --- Section registry ---

const registry = new Registry<ComponentType<any>>()

// Auto-register all built-in sections
const SECTIONS: Record<string, ComponentType<any>> = {
  text: TextSection,
  bullets: BulletsSection,
  flowchart: FlowchartSection,
  'tradeoff-sandbox': TradeoffSandboxSection,
  'taxonomy-browser': TaxonomyBrowserSection,
  flashcards: FlashcardsSection,
  quiz: QuizSection,
  'concept-map': ConceptMapSection,
  scenario: ScenarioSection,
  'decision-tree': DecisionTreeSection,
  'image-gallery': ImageGallerySection,
  'formula-sandbox': FormulaSandboxSection,
  'reflection-sequence': ReflectionSequenceSection,
  'reflection-template': ReflectionTemplateSection,
}

for (const [type, component] of Object.entries(SECTIONS)) {
  registry.register(type, component)
}

// --- Theme presets ---

/** Built-in theme names accepted by RenderOptions.theme. */
export type BuiltInTheme =
  // App themes (match the main Loom website)
  | 'frappe'      // Catppuccin Frappé (default dark)
  | 'medicare'    // MediCare+ (clinical light)
  | 'recipebook'  // RecipeBook (warm light)
  | 'pinkcatboo'  // PinkCatBoo (dark rose)
  // Extra Catppuccin flavours
  | 'latte'
  | 'mocha'
  | 'macchiato'

/** Full CSS-variable token maps for each built-in theme. */
const THEMES: Record<BuiltInTheme, Record<string, string>> = {
  // ── Catppuccin Frappé (default) ──────────────────────────────────────
  frappe: {
    '--ctp-rosewater': '#f2d5cf',
    '--ctp-flamingo': '#eebebe',
    '--ctp-pink': '#f4b8e4',
    '--ctp-mauve': '#ca9ee6',
    '--ctp-red': '#e78284',
    '--ctp-maroon': '#ea999c',
    '--ctp-peach': '#ef9f76',
    '--ctp-yellow': '#e5c890',
    '--ctp-green': '#a6d189',
    '--ctp-teal': '#81c8be',
    '--ctp-sky': '#99d1db',
    '--ctp-sapphire': '#85c1dc',
    '--ctp-blue': '#8caaee',
    '--ctp-lavender': '#babbf1',
    '--ctp-text': '#c6d0f5',
    '--ctp-subtext1': '#b5bfe2',
    '--ctp-subtext0': '#a5adce',
    '--ctp-overlay2': '#949cbb',
    '--ctp-overlay1': '#838ba7',
    '--ctp-overlay0': '#737994',
    '--ctp-surface2': '#626880',
    '--ctp-surface1': '#51576d',
    '--ctp-surface0': '#414559',
    '--ctp-base': '#303446',
    '--ctp-mantle': '#292c3c',
    '--ctp-crust': '#232634',
  },
  // ── MediCare+ (clinical light) ────────────────────────────────────────
  medicare: {
    '--background':        '#fafcff',
    '--foreground':        '#0f172a',
    '--card':              '#ffffff',
    '--card-foreground':   '#0f172a',
    '--primary':           '#0077b6',
    '--primary-foreground':'#ffffff',
    '--secondary':         '#e2e8f0',
    '--secondary-foreground':'#0f172a',
    '--muted':             '#e2e8f0',
    '--muted-foreground':  '#64748b',
    '--accent':            '#e2e8f0',
    '--accent-foreground': '#0f172a',
    '--border':            '#e2e8f0',
    '--input':             '#e2e8f0',
    '--ring':              '#0077b6',
    '--destructive':       '#dc2626',
    '--destructive-foreground':'#ffffff',
    '--ctp-crust':         '#ffffff',
    '--ctp-mantle':        '#f0f7ff',
    '--ctp-base':          '#fafcff',
    '--ctp-surface0':      '#ffffff',
    '--ctp-surface1':      '#e2e8f0',
    '--ctp-surface2':      '#cbd5e1',
    '--ctp-overlay0':      '#94a3b8',
    '--ctp-overlay1':      '#475569',
    '--ctp-overlay2':      '#64748b',
    '--ctp-subtext0':      '#475569',
    '--ctp-subtext1':      '#334155',
    '--ctp-text':          '#0f172a',
    '--ctp-blue':          '#0077b6',
    '--ctp-sapphire':      '#0284c7',
    '--ctp-lavender':      '#6366f1',
    '--ctp-sky':           '#48cae4',
    '--ctp-teal':          '#0d9488',
    '--ctp-mauve':         '#8b5cf6',
    '--ctp-pink':          '#db2777',
    '--ctp-rosewater':     '#fda4af',
    '--ctp-flamingo':      '#f43f5e',
    '--ctp-green':         '#059669',
    '--ctp-yellow':        '#d97706',
    '--ctp-peach':         '#ea580c',
    '--ctp-red':           '#dc2626',
    '--ctp-maroon':        '#be123c',
    '--pale-green':        'rgba(5, 150, 105, 0.10)',
    '--pale-blue':         'rgba(0, 119, 182, 0.10)',
    '--pale-pink':         'rgba(72, 202, 228, 0.12)',
  },
  // ── RecipeBook (warm homey light) ─────────────────────────────────────
  recipebook: {
    '--background':        '#fffbf5',
    '--foreground':        '#1c1917',
    '--card':              '#ffffff',
    '--card-foreground':   '#1c1917',
    '--primary':           '#65a30d',
    '--primary-foreground':'#ffffff',
    '--secondary':         '#e7e5e4',
    '--secondary-foreground':'#1c1917',
    '--muted':             '#e7e5e4',
    '--muted-foreground':  '#78716c',
    '--accent':            '#e7e5e4',
    '--accent-foreground': '#1c1917',
    '--border':            '#e7e5e4',
    '--input':             '#e7e5e4',
    '--ring':              '#65a30d',
    '--destructive':       '#ef4444',
    '--destructive-foreground':'#ffffff',
    '--ctp-crust':         '#ffffff',
    '--ctp-mantle':        '#fffbf5',
    '--ctp-base':          '#fffbf5',
    '--ctp-surface0':      '#ffffff',
    '--ctp-surface1':      '#e7e5e4',
    '--ctp-surface2':      '#d6d3d1',
    '--ctp-overlay0':      '#a8a29e',
    '--ctp-overlay1':      '#57534e',
    '--ctp-overlay2':      '#78716c',
    '--ctp-subtext0':      '#57534e',
    '--ctp-subtext1':      '#44403c',
    '--ctp-text':          '#1c1917',
    '--ctp-blue':          '#2b6cb0',
    '--ctp-sapphire':      '#2563eb',
    '--ctp-lavender':      '#5a67d8',
    '--ctp-sky':           '#4299e1',
    '--ctp-teal':          '#0d9488',
    '--ctp-mauve':         '#805ad5',
    '--ctp-pink':          '#db2777',
    '--ctp-rosewater':     '#fda4af',
    '--ctp-flamingo':      '#fca5a5',
    '--ctp-green':         '#059669',
    '--ctp-yellow':        '#d97706',
    '--ctp-peach':         '#ea580c',
    '--ctp-red':           '#ef4444',
    '--ctp-maroon':        '#be123c',
    '--pale-green':        'rgba(101, 163, 13, 0.12)',
    '--pale-blue':         'rgba(101, 163, 13, 0.10)',
    '--pale-pink':         'rgba(220, 38, 38, 0.10)',
  },
  // ── PinkCatBoo (dark rose/lavender) ───────────────────────────────────
  pinkcatboo: {
    '--background':        '#202330',
    '--foreground':        '#FFF0F5',
    '--card':              '#2d2f42',
    '--card-foreground':   '#FFF0F5',
    '--primary':           '#fe7c8e',
    '--primary-foreground':'#202330',
    '--secondary':         '#2d2f42',
    '--secondary-foreground':'#FFF0F5',
    '--muted':             '#2d2f42',
    '--muted-foreground':  '#9498a1',
    '--accent':            '#472541',
    '--accent-foreground': '#FFF0F5',
    '--border':            'rgba(148, 152, 161, 0.27)',
    '--input':             '#202330',
    '--ring':              '#fe7c8e',
    '--destructive':       '#ff62a5',
    '--destructive-foreground':'#202330',
    '--ctp-crust':         '#1a1c2a',
    '--ctp-mantle':        '#2d2f42',
    '--ctp-base':          '#202330',
    '--ctp-surface0':      '#2d2f42',
    '--ctp-surface1':      'rgba(148, 152, 161, 0.27)',
    '--ctp-surface2':      '#9498a1',
    '--ctp-overlay0':      '#565970',
    '--ctp-overlay1':      '#707070',
    '--ctp-overlay2':      '#9498a1',
    '--ctp-subtext0':      '#9498a1',
    '--ctp-subtext1':      '#c0c4cf',
    '--ctp-text':          '#FFF0F5',
    '--ctp-blue':          '#79c0ff',
    '--ctp-sapphire':      '#79c0ff',
    '--ctp-lavender':      '#e6a1ff',
    '--ctp-sky':           '#a2c2eb',
    '--ctp-teal':          '#80cbc4',
    '--ctp-mauve':         '#DCBFF2',
    '--ctp-pink':          '#FA508C',
    '--ctp-rosewater':     '#EBA4AC',
    '--ctp-flamingo':      '#ffedf0',
    '--ctp-green':         '#3bc089',
    '--ctp-yellow':        '#ffcb6b',
    '--ctp-peach':         '#ff9e79',
    '--ctp-red':           '#ff5370',
    '--ctp-maroon':        '#f07178',
    '--pale-green':        'rgba(59, 192, 137, 0.12)',
    '--pale-blue':         'rgba(254, 124, 142, 0.14)',
    '--pale-pink':         'rgba(71, 37, 65, 0.60)',
  },
  // ── Extra Catppuccin flavours ─────────────────────────────────────────
  latte: {
    '--ctp-rosewater': '#dc8a78',
    '--ctp-flamingo': '#dd7878',
    '--ctp-pink': '#ea76cb',
    '--ctp-mauve': '#8839ef',
    '--ctp-red': '#d20f39',
    '--ctp-maroon': '#e64553',
    '--ctp-peach': '#fe640b',
    '--ctp-yellow': '#df8e1d',
    '--ctp-green': '#40a02b',
    '--ctp-teal': '#179299',
    '--ctp-sky': '#04a5e5',
    '--ctp-sapphire': '#209fb5',
    '--ctp-blue': '#1e66f5',
    '--ctp-lavender': '#7287fd',
    '--ctp-text': '#4c4f69',
    '--ctp-subtext1': '#5c5f77',
    '--ctp-subtext0': '#6c6f85',
    '--ctp-overlay2': '#7c7f93',
    '--ctp-overlay1': '#8c8fa1',
    '--ctp-overlay0': '#9ca0b0',
    '--ctp-surface2': '#acb0be',
    '--ctp-surface1': '#bcc0cc',
    '--ctp-surface0': '#ccd0da',
    '--ctp-base': '#eff1f5',
    '--ctp-mantle': '#e6e9ef',
    '--ctp-crust': '#dce0e8',
  },
  mocha: {
    '--ctp-rosewater': '#f5e0dc',
    '--ctp-flamingo': '#f2cdcd',
    '--ctp-pink': '#f5c2e7',
    '--ctp-mauve': '#cba6f7',
    '--ctp-red': '#f38ba8',
    '--ctp-maroon': '#eba0ac',
    '--ctp-peach': '#fab387',
    '--ctp-yellow': '#f9e2af',
    '--ctp-green': '#a6e3a1',
    '--ctp-teal': '#94e2d5',
    '--ctp-sky': '#89dceb',
    '--ctp-sapphire': '#74c7ec',
    '--ctp-blue': '#89b4fa',
    '--ctp-lavender': '#b4befe',
    '--ctp-text': '#cdd6f4',
    '--ctp-subtext1': '#bac2de',
    '--ctp-subtext0': '#a6adc8',
    '--ctp-overlay2': '#9399b2',
    '--ctp-overlay1': '#7f849c',
    '--ctp-overlay0': '#6c7086',
    '--ctp-surface2': '#585b70',
    '--ctp-surface1': '#45475a',
    '--ctp-surface0': '#313244',
    '--ctp-base': '#1e1e2e',
    '--ctp-mantle': '#181825',
    '--ctp-crust': '#11111b',
  },
  macchiato: {
    '--ctp-rosewater': '#f4dbd6',
    '--ctp-flamingo': '#f0c6c6',
    '--ctp-pink': '#f5bde6',
    '--ctp-mauve': '#c6a0f6',
    '--ctp-red': '#ed8796',
    '--ctp-maroon': '#ee99a0',
    '--ctp-peach': '#f5a97f',
    '--ctp-yellow': '#eed49f',
    '--ctp-green': '#a6da95',
    '--ctp-teal': '#8bd5ca',
    '--ctp-sky': '#91d7e3',
    '--ctp-sapphire': '#7dc4e4',
    '--ctp-blue': '#8aadf4',
    '--ctp-lavender': '#b7bdf8',
    '--ctp-text': '#cad3f5',
    '--ctp-subtext1': '#b8c0e0',
    '--ctp-subtext0': '#a5adcb',
    '--ctp-overlay2': '#939ab7',
    '--ctp-overlay1': '#8087a2',
    '--ctp-overlay0': '#6e738d',
    '--ctp-surface2': '#5b6078',
    '--ctp-surface1': '#494d64',
    '--ctp-surface0': '#363a4f',
    '--ctp-base': '#24273a',
    '--ctp-mantle': '#1e2030',
    '--ctp-crust': '#181926',
  },
}

// --- Render options ---

/**
 * Optional configuration passed as the third argument to `LoomSections.render()`.
 */
export interface RenderOptions {
  /**
   * When provided, the library renders a styled page-header above the sections
   * containing this title text.
   */
  title?: string
  /**
   * Theme to apply.
   * - A built-in preset name: `"frappe"` | `"latte"` | `"mocha"` | `"macchiato"`
   * - Or a partial record of CSS custom property overrides, e.g.
   *   `{ "--ctp-base": "#1e1e2e", "--ctp-blue": "#89b4fa" }`
   *
   * The library injects a `<style>` tag scoped to the render container so
   * multiple independent `render()` calls on the same page stay isolated.
   */
  theme?: BuiltInTheme | Record<string, string>
}

// --- Theme injection helpers ---

let _themeCounter = 0

/**
 * Ensure the container has a unique ID we can use as a CSS scope anchor.
 * Returns the (possibly newly assigned) ID.
 */
function ensureContainerId(container: HTMLElement): string {
  if (!container.id) {
    container.id = `loom-root-${++_themeCounter}`
  }
  return container.id
}

/**
 * Resolve a theme option to a flat token map.
 */
function resolveTokens(theme: BuiltInTheme | Record<string, string>): Record<string, string> {
  if (typeof theme === 'string') {
    return THEMES[theme] ?? {}
  }
  return theme
}

/**
 * Inject a `<style>` tag scoped to `#containerId` and return a cleanup fn.
 * Also automatically sets `background-color`, `color`, and `--loom-section-bg`
 * from the token map so the container visually re-skins (not just CSS vars).
 */
function injectThemeStyle(containerId: string, tokens: Record<string, string>): () => void {
  const styleId = `loom-theme-${containerId}`
  document.getElementById(styleId)?.remove()

  const base = tokens['--ctp-base'] ?? tokens['--background'] ?? ''
  const text = tokens['--ctp-text'] ?? tokens['--foreground'] ?? ''

  const varDeclarations = Object.entries(tokens)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n')

  // Extra visual declarations so the container itself re-skins,
  // and sticky section title backgrounds match the theme background.
  const extraDeclarations = [
    base ? `  background-color: ${base};` : '',
    text ? `  color: ${text};` : '',
    base ? `  --loom-section-bg: ${base};` : '',
  ].filter(Boolean).join('\n')

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `#${containerId} {\n${varDeclarations}\n${extraDeclarations}\n}`
  document.head.appendChild(style)

  return () => {
    document.getElementById(styleId)?.remove()
  }
}

/**
 * Inject baseline CDN styles (sticky offset, default bg) so a theme `<style>`
 * injected at the same `#id` specificity can override them.
 * Also configures the centered max-width (860px) and default responsive padding.
 */
function injectBaselineStyle(containerId: string): () => void {
  const styleId = `loom-baseline-${containerId}`
  document.getElementById(styleId)?.remove()

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    #${containerId} {
      --loom-title-sticky-top: 0px;
      --loom-section-bg: var(--ctp-base, #303446);
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 24px;
      box-sizing: border-box;
    }
    @media (max-width: 768px) {
      #${containerId} {
        padding: 20px 16px;
      }
    }
  `
  document.head.appendChild(style)

  return () => {
    document.getElementById(styleId)?.remove()
  }
}

// --- Page header component ---

function PageHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: '28px 32px 24px',
        background: 'linear-gradient(135deg, var(--ctp-mantle, #292c3c), var(--ctp-base, #303446))',
        borderBottom: '1px solid rgba(198, 208, 245, 0.08)',
        marginBottom: '8px',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '26px',
          fontWeight: 700,
          background: 'linear-gradient(120deg, var(--ctp-lavender, #babbf1), var(--ctp-mauve, #ca9ee6), var(--ctp-sky, #99d1db))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.25,
        }}
      >
        {title}
      </h1>
    </div>
  )
}

// --- Section renderer ---

function SectionRenderer({ config }: { config: SectionConfig }) {
  const Component = useMemo(() => registry.get(config.type), [config.type])
  if (!Component) {
    return (
      <div className="section-missing" data-section-type={config.type}>
        Section type not registered: {config.type}
      </div>
    )
  }

  const adaptedProps = useMemo(() => {
    if (config.type === 'flowchart' && config.props?.schema) {
      const rawSchema = config.props.schema as any
      if (rawSchema.actors && rawSchema.steps && !rawSchema.entities) {
        try {
          return {
            ...config.props,
            schema: deriveSchema(rawSchema),
          }
        } catch (e) {
          console.error('Failed to auto-derive flowchart schema:', e)
        }
      }
    }
    return config.props
  }, [config.type, config.props])

  return (
    <Suspense fallback={<div className="section-loading">Loading section...</div>}>
      <Component {...adaptedProps} />
    </Suspense>
  )
}

// --- Sections container ---

function SectionsContainer({ sections, title }: { sections: SectionConfig[]; title?: string }) {
  return (
    <>
      {title && <PageHeader title={title} />}
      <div className="loom-sections-container">
        {sections.map((section, idx) => (
          <SectionRenderer key={`${section.type}-${idx}`} config={section} />
        ))}
      </div>
    </>
  )
}

// --- Theme selector widget ---

/**
 * Options for the floating theme selector widget.
 */
export interface ThemeSelectorOptions {
  /**
   * Which themes to list. Defaults to all four built-in Catppuccin flavours.
   * Each entry is either a preset name or a custom `{ name, label, tokens }` object.
   */
  themes?: Array<BuiltInTheme | { name: string; label: string; tokens: Record<string, string> }>
  /**
   * Where to anchor the floating widget on the page.
   * - `'inline'` — renders in-flow inside `widgetContainer` (use for custom placement).
   * - All other values position the widget `position: fixed` at a corner of the viewport.
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline'
}

/** Preset metadata displayed in the swatch panel. */
const THEME_META: Record<BuiltInTheme, { label: string; swatch: string; icon: string }> = {
  frappe:     { label: 'Catppuccin', swatch: '#303446', icon: '🎨' },
  medicare:   { label: 'MediCare+',  swatch: '#fafcff', icon: '🌙' },
  recipebook: { label: 'RecipeBook', swatch: '#fffbf5', icon: '☀️' },
  pinkcatboo: { label: 'PinkCatBoo', swatch: '#202330', icon: '🐱' },
  latte:      { label: 'Latte',      swatch: '#eff1f5', icon: '☕' },
  mocha:      { label: 'Mocha',      swatch: '#1e1e2e', icon: '🍫' },
  macchiato:  { label: 'Macchiato',  swatch: '#24273a', icon: '🌌' },
}

type ThemeEntry = { name: string; label: string; icon: string; swatch: string; tokens: Record<string, string> }

function resolveThemeEntries(
  raw?: ThemeSelectorOptions['themes'],
): ThemeEntry[] {
  // Default: the 4 themes that match the main Loom website
  const list = raw ?? (['frappe', 'medicare', 'recipebook', 'pinkcatboo'] as BuiltInTheme[])
  return list.map((t) => {
    if (typeof t === 'string') {
      const meta = THEME_META[t]
      return { name: t, label: meta.label, icon: meta.icon, swatch: meta.swatch, tokens: THEMES[t] }
    }
    return {
      name: t.name,
      label: t.label,
      icon: (t as any).icon ?? '🎨',
      swatch: t.tokens['--ctp-base'] ?? t.tokens['--background'] ?? '#303446',
      tokens: t.tokens,
    }
  })
}

function ThemeSelectorWidget({
  sectionsContainer,
  entries,
  position,
  initialTheme,
}: {
  sectionsContainer: HTMLElement
  entries: ThemeEntry[]
  position: ThemeSelectorOptions['position']
  initialTheme: string
}) {
  const [active, setActive] = React.useState(initialTheme)

  const positionStyle: React.CSSProperties =
    position === 'inline'
      ? {}
      : {
          position: 'fixed',
          zIndex: 9999,
          ...(position === 'top-right'    ? { top: 16, right: 16 } : {}),
          ...(position === 'top-left'     ? { top: 16, left:  16 } : {}),
          ...(position === 'bottom-right' ? { bottom: 16, right: 16 } : {}),
          ...(position === 'bottom-left'  ? { bottom: 16, left:  16 } : {}),
        }

  function applyTheme(entry: ThemeEntry) {
    setActive(entry.name)
    const containerId = ensureContainerId(sectionsContainer)
    
    // Set data-theme on html and the container so all variables resolve properly
    if (entry.name && entry.name !== 'frappe') {
      document.documentElement.setAttribute('data-theme', entry.name)
      sectionsContainer.setAttribute('data-theme', entry.name)
    } else {
      document.documentElement.removeAttribute('data-theme')
      sectionsContainer.removeAttribute('data-theme')
    }

    injectThemeStyle(containerId, entry.tokens)
  }

  const activeEntry = entries.find(e => e.name === active)

  return (
    <div
      style={{
        ...positionStyle,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'var(--ctp-mantle, #292c3c)',
        border: '1px solid rgba(198,208,245,0.10)',
        borderRadius: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(8px)',
      }}
      title="Switch theme"
    >
      {/* Active theme label */}
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--ctp-text, #c6d0f5)',
          marginRight: '2px',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span style={{ fontSize: '14px', lineHeight: 1 }}>{activeEntry?.icon ?? '🎨'}</span>
        {activeEntry?.label ?? 'Theme'}
      </span>
      <span style={{ width: '1px', height: '14px', background: 'rgba(198,208,245,0.15)', margin: '0 4px', flexShrink: 0 }} />
      {entries.map((entry) => {
        const isActive = entry.name === active
        // Use a ring on light swatches for visibility against light page backgrounds
        const isLight = entry.swatch.startsWith('#f') || entry.swatch.startsWith('#e')
        return (
          <button
            key={entry.name}
            onClick={() => applyTheme(entry)}
            title={`${entry.icon} ${entry.label}`}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: isActive
                ? '2.5px solid var(--ctp-lavender, #babbf1)'
                : isLight
                  ? '2px solid rgba(0,0,0,0.15)'
                  : '2px solid rgba(198,208,245,0.15)',
              background: entry.swatch,
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
              boxShadow: isActive ? '0 0 8px rgba(186,187,241,0.5)' : 'none',
              flexShrink: 0,
            }}
          />
        )
      })}
    </div>
  )
}

// --- Public API ---

interface LoomSectionsAPI {
  render: (container: HTMLElement, sections: SectionConfig[], options?: RenderOptions) => () => void
  renderThemeSelector: (
    widgetContainer: HTMLElement,
    sectionsContainer: HTMLElement,
    options?: ThemeSelectorOptions
  ) => () => void
  registerSection: (type: string, component: ComponentType<any>) => void
  loadAndRenderOKF: (container: HTMLElement, okfBaseUrl: string, topicId: string, options?: RenderOptions) => Promise<() => void>
}

const LoomSections: LoomSectionsAPI = {
  render(container: HTMLElement, sections: SectionConfig[], options?: RenderOptions) {
    let root: Root | null = null
    let cleanupBaseline: (() => void) | null = null
    let cleanupTheme: (() => void) | null = null

    // Ensure container has an ID (needed for theme scoping)
    const containerId = ensureContainerId(container)

    // Set data-theme on html and container for built-in themes
    if (options?.theme !== undefined && typeof options.theme === 'string') {
      document.documentElement.setAttribute('data-theme', options.theme)
      container.setAttribute('data-theme', options.theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
      container.removeAttribute('data-theme')
    }

    // Inject baseline CDN style (--loom-title-sticky-top, --loom-section-bg defaults).
    // Using a <style> tag (not inline style) so theme injection at the same
    // #id specificity can override these values.
    cleanupBaseline = injectBaselineStyle(containerId)

    // Inject scoped theme styles — overrides the baseline
    if (options?.theme !== undefined) {
      const tokens = resolveTokens(options.theme)
      cleanupTheme = injectThemeStyle(containerId, tokens)
    }

    const title = options?.title

    const App = () => (
      <ProgressProvider>
        <HUDProvider>
          <SectionsContainer sections={sections} title={title} />
        </HUDProvider>
      </ProgressProvider>
    )

    root = createRoot(container)
    root.render(<App />)

    return () => {
      root?.unmount()
      cleanupTheme?.()
      cleanupBaseline?.()
      document.documentElement.removeAttribute('data-theme')
      container.removeAttribute('data-theme')
    }
  },

  renderThemeSelector(
    widgetContainer: HTMLElement,
    sectionsContainer: HTMLElement,
    options?: ThemeSelectorOptions,
  ) {
    const entries = resolveThemeEntries(options?.themes)
    const position = options?.position ?? 'top-right'

    // Detect which theme is currently active
    const activeGlobalTheme = document.documentElement.getAttribute('data-theme')
    let initialTheme = activeGlobalTheme ?? 'frappe'
    if (!entries.some(e => e.name === initialTheme)) {
      const existingStyleId = `loom-theme-${sectionsContainer.id}`
      const existingStyle = document.getElementById(existingStyleId)
      initialTheme = entries[0]?.name ?? 'frappe'
      if (existingStyle) {
        for (const e of entries) {
          if (existingStyle.textContent?.includes(e.tokens['--ctp-base'] ?? '')) {
            initialTheme = e.name
            break
          }
        }
      }
    }

    let widgetRoot: Root | null = createRoot(widgetContainer)
    widgetRoot.render(
      <ThemeSelectorWidget
        sectionsContainer={sectionsContainer}
        entries={entries}
        position={position}
        initialTheme={initialTheme}
      />
    )

    return () => {
      widgetRoot?.unmount()
      widgetRoot = null
    }
  },

  registerSection(type: string, component: ComponentType<any>) {
    registry.register(type, component)
  },

  async loadAndRenderOKF(container: HTMLElement, okfBaseUrl: string, topicId: string, options?: RenderOptions) {
    if (typeof window !== 'undefined') {
      (window as any).__OKF_BASE_OVERRIDE__ = okfBaseUrl
    }
    const bundle = await loadOKFBundle(topicId)
    const sections = bundleToSections(bundle)
    return LoomSections.render(container, sections, options)
  },
}

export default LoomSections
export type { SectionConfig }

// Re-export key types
export type { BulletItem } from '../src/sections/bullets'
export type { TradeoffScenario, MetricDef, TradeoffChoice, TradeoffStep, TradeoffProCon } from '../src/sections/tradeoff-sandbox'
export type { TaxonomyCategory } from '../src/sections/taxonomy-browser'
export type { WordTerm } from '../src/types'
