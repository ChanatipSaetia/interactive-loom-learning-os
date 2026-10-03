/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRoot, type Root } from 'react-dom/client'
import { useMemo, type ComponentType } from 'react'
import type { SectionConfig } from '../src/core/learning-engine/registry'
import { bundleToSections } from '../src/core/learning-engine/composition/okf/sections'
import { HUDProvider, useHUD } from '../src/core/learning-engine/composition/context/HUDContext'
import { ProgressProvider } from '../src/core/supporting/learner-progress'
import { SoundProvider } from '../src/core/ui-system/sensory/SoundContext'
import { AudioToggle } from '../src/core/delivery/web-app-shell/AudioToggle'
import { ThemeToggle } from '../src/core/ui-system/motion/theme-toggle'
import { X } from 'lucide-react'
import { type ValidationDiagnostic } from '../src/core/learning-engine/validation/gateway'
import type { OKFBundled } from '../src/core/learning-engine/composition/okf/types'

// SingleHTMLEmbedAdapter — delegates bundle loading, rendering, validation
import { singleEmbedAdapter, registerEmbedSection } from '../src/core/delivery/adapters/single-html-embed'

// Import section CSS
import '../src/styles/global.css'
import '../src/core/delivery/web-app-shell/layout.css'
import '../src/core/learning-engine/sub-contexts/progressive-content/components/intro/intro.css'
import '../src/core/learning-engine/sub-contexts/progressive-content/components/text/text.css'
import '../src/core/learning-engine/sub-contexts/progressive-content/components/bullets/bullets.css'
import '../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/flowchart.css'
import '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox/tradeoff-sandbox.css'
import '../src/core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser/taxonomy-browser.css'
import '../src/core/learning-engine/sub-contexts/practice-assessment/components/flashcards/flashcards.css'
import '../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz/quiz.css'
import '../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map/concept-map.css'
import '../src/core/learning-engine/sub-contexts/process-simulation/components/scenario/scenario.css'
import '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/decision-tree/decision-tree.css'
import '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox/formula-sandbox.css'
import '../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence/reflection-sequence.css'
import '../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-template/reflection-template.css'

// Import all section components directly
import IntroSection from '../src/core/learning-engine/sub-contexts/progressive-content/components/intro'
import TextSection from '../src/core/learning-engine/sub-contexts/progressive-content/components/text'
import BulletsSection from '../src/core/learning-engine/sub-contexts/progressive-content/components/bullets'
import { Flowchart as FlowchartSection } from '../src/core/learning-engine/sub-contexts/process-simulation/components/FlowchartSection'
import TradeoffSandboxSection from '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox'
import TaxonomyBrowserSection from '../src/core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser'
import FlashcardsSection from '../src/core/learning-engine/sub-contexts/practice-assessment/components/flashcards'
import QuizSection from '../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz'
import ConceptMapSection from '../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map'
import { ScenarioSection } from '../src/core/learning-engine/sub-contexts/process-simulation/components/ScenarioSection'
import DecisionTreeSection from '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/decision-tree'
import ImageGallerySection from '../src/core/learning-engine/sub-contexts/progressive-content/components/image-gallery'
import FormulaSandboxSection from '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/formula-sandbox'
import ReflectionSequenceSection from '../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence'
import ReflectionTemplateSection from '../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-template'

// --- Auto-register all built-in sections with the adapter ---

const SECTIONS: Record<string, ComponentType<any>> = {
  intro: IntroSection,
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
  registerEmbedSection(type, component)
}

export type BuiltInTheme = 'frappe' | 'medicare' | 'recipebook' | 'pinkcatboo' | 'eink' | string

// --- Render options ---

/**
 * Optional top navigation header banner settings.
 */
export interface HeaderOptions {
  /** Title shown on the left of the header banner (default: 'Learning OS') */
  brandTitle?: string
  /** Show sound toggle button in header (default: true) */
  showAudioToggle?: boolean
  /** Show theme selector in header (default: true) */
  showThemePicker?: boolean
  /** Optional status badge text (e.g. '⚡ Inline JS Mode') */
  statusBadge?: string
}

/**
 * Optional configuration passed to `LoomSections.render()` or `loadAndRenderOKF()`.
 */
export interface RenderOptions {
  /**
   * When provided, the library renders a styled page-header above the sections
   * containing this title text.
   */
  title?: string
  /**
   * Theme to apply.
   */
  theme?: BuiltInTheme | Record<string, string>
  /**
   * @deprecated In-page editing was removed; author content with Loom Studio
   * (studio.html). Passing `true` logs a warning and is otherwise ignored.
   */
  editable?: boolean
  /**
   * @deprecated Only used by the removed in-page editor.
   */
  topicId?: string
  /**
   * Raw OKF bundle data.
   */
  bundle?: OKFBundled
  /**
   * Embed top navigation header banner (matching main web layout).
   */
  header?: boolean | HeaderOptions
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

// --- Section renderer (delegates to adapter) ---

function SectionRenderer({ config, sectionIndex }: { config: SectionConfig; sectionIndex?: number }) {
  return singleEmbedAdapter.runtime.renderSection(config, sectionIndex)
}

// --- HUD Drawer ---

function HUDDrawer() {
  const { isOpen, title, body, closeHUD } = useHUD()

  return (
    <div className={`hud-drawer ${isOpen ? 'open' : ''}`} data-testid="hud-drawer">
      <div className="hud-header">
        <span className="hud-title">{title}</span>
        <button className="hud-close" onClick={closeHUD} aria-label="Close details">
          <X size={18} />
        </button>
      </div>
      <div className="hud-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}

// --- Main App Content ---

function LoomAppContent({
  sections,
  title,
  header,
}: {
  sections: SectionConfig[]
  title?: string
  header?: boolean | HeaderOptions
}) {

  const headerConfig = useMemo(() => {
    if (!header) return null
    if (typeof header === 'boolean') {
      return {
        brandTitle: 'Learning OS',
        showAudioToggle: true,
        showThemePicker: true,
      }
    }
    return {
      brandTitle: header.brandTitle ?? 'Learning OS',
      showAudioToggle: header.showAudioToggle ?? true,
      showThemePicker: header.showThemePicker ?? true,
      statusBadge: header.statusBadge,
    }
  }, [header])

  const content = (
    <div className="topic-page topic-container">
      {title && <PageHeader title={title} />}
      <div className="loom-sections-container topic-content topic-container-content">
        {sections.map((section, idx) => (
          <SectionRenderer key={`${section.type}-${idx}`} config={section} sectionIndex={idx} />
        ))}
      </div>
      <HUDDrawer />
    </div>
  )

  if (headerConfig) {
    return (
      <div className="app-layout">
        <header className="topnav flex items-center justify-between">
          <div className="topnav-brand">
            <span className="topnav-title">{headerConfig.brandTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            {headerConfig.showAudioToggle && <AudioToggle />}
            {headerConfig.showThemePicker && <ThemeToggle />}
            {headerConfig.statusBadge && (
              <span className="status-badge success">{headerConfig.statusBadge}</span>
            )}
          </div>
        </header>
        <main className="main-content">{content}</main>
      </div>
    )
  }

  return content
}

// --- Theme selector widget ---

/**
 * Options for the floating theme selector widget.
 */
export interface ThemeSelectorOptions {
  /**
   * Which themes to list. Defaults to all four built-in Catppuccin flavours.
   */
  themes?: Array<BuiltInTheme | { name: string; label: string; tokens: Record<string, string> }>
  /**
   * Where to anchor the floating widget on the page.
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline'
}

// --- Public API ---

interface LoomSectionsAPI {
  render: (container: HTMLElement, sections: SectionConfig[], options?: RenderOptions) => () => void
  renderOKF: (container: HTMLElement, bundle: OKFBundled, options?: RenderOptions) => () => void
  renderThemeSelector: (
    widgetContainer: HTMLElement,
    sectionsContainer: HTMLElement,
    options?: ThemeSelectorOptions
  ) => () => void
  registerSection: (type: string, component: ComponentType<any>) => void
  loadAndRenderOKF: (container: HTMLElement, okfBaseUrl: string, topicId: string, options?: RenderOptions) => Promise<() => void>
  validateSection: (data: unknown, metaType?: string) => ValidationDiagnostic[]
  validateYAML: (rawYaml: string, metaType?: string) => { data: any; errors: ValidationDiagnostic[] }
  formatValidationPrompt: (errors: ValidationDiagnostic[], rawSource?: string) => string
}

const LoomSections: LoomSectionsAPI = {
  render(container: HTMLElement, sections: SectionConfig[], options?: RenderOptions) {
    let root: Root | null = null

    if (options?.theme !== undefined && typeof options.theme === 'string') {
      const themeId = options.theme === 'frappe' ? '' : options.theme
      if (themeId) {
        document.documentElement.setAttribute('data-theme', themeId)
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }

    const title = options?.title
    const headerOption = options?.header
    if (options?.editable) {
      console.warn('LoomSections: the "editable" option is no longer supported. Author content with Loom Studio (studio.html).')
    }

    const App = () => (
      <SoundProvider>
        <ProgressProvider>
          <HUDProvider>
            <LoomAppContent sections={sections} title={title} header={headerOption} />
          </HUDProvider>
        </ProgressProvider>
      </SoundProvider>
    )

    root = createRoot(container)
    root.render(<App />)

    return () => {
      root?.unmount()
    }
  },

  renderOKF(container: HTMLElement, bundle: OKFBundled, options?: RenderOptions) {
    const sections = bundleToSections(bundle)
    return LoomSections.render(container, sections, { ...options, bundle })
  },

  renderThemeSelector(
    widgetContainer: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sectionsContainer?: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: ThemeSelectorOptions,
  ) {
    let widgetRoot: Root | null = createRoot(widgetContainer)
    widgetRoot.render(<ThemeToggle />)

    return () => {
      widgetRoot?.unmount()
      widgetRoot = null
    }
  },

  registerSection(type: string, component: ComponentType<any>) {
    registerEmbedSection(type, component)
  },

  async loadAndRenderOKF(container: HTMLElement, okfBaseUrl: string, topicId: string, options?: RenderOptions) {
    if (typeof window !== 'undefined') {
      (window as any).__OKF_BASE_OVERRIDE__ = okfBaseUrl
    }
    const bundle = await singleEmbedAdapter.runtime.loadTopicBundle(topicId)
    return LoomSections.renderOKF(container, bundle, { ...options, topicId })
  },

  validateSection(data: unknown, metaType?: string) {
    const result = singleEmbedAdapter.runtime.validatePayload(data, metaType)
    return result.diagnostics
  },

  validateYAML(rawYaml: string, metaType?: string) {
    const result = singleEmbedAdapter.runtime.validatePayload(rawYaml, metaType)
    return {
      data: result.payload,
      errors: result.diagnostics,
    }
  },

  formatValidationPrompt(errors: ValidationDiagnostic[], rawSource?: string) {
    if (errors.length === 0) return 'No validation errors found.'

    let prompt = `# OKF Section Validation Error Report\n\n`
    prompt += `The following ${errors.length} error(s) were found during OKF section validation. Please fix the files accordingly.\n\n`

    errors.forEach((err, idx) => {
      prompt += `### Diagnostic ${idx + 1}: [Tier: ${err.tier}]\n`
      if (err.field) prompt += `- **Field Path**: \`${err.field}\`\n`
      if (err.line) prompt += `- **Location**: Line ${err.line}${err.column ? `, Column ${err.column}` : ''}\n`
      prompt += `- **Message**: ${err.message}\n`
      if (err.fixHint) prompt += `- **Suggested Fix**: ${err.fixHint}\n`
      prompt += `\n`
    })

    if (rawSource) {
      prompt += `## Source Snippet\n\`\`\`yaml\n${rawSource}\n\`\`\`\n`
    }

    prompt += `\n**Instructions for AI**: Update the specified file(s) to resolve the schema/syntax/semantic validation errors listed above while preserving valid section content.`

    return prompt
  },
}

export default LoomSections
export type { SectionConfig }

// Re-export key types
export type { BulletItem } from '../src/core/learning-engine/sub-contexts/progressive-content/components/bullets'
export type { TradeoffScenario, MetricDef, TradeoffChoice, TradeoffStep, TradeoffProCon } from '../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/tradeoff-sandbox'
export type { TaxonomyCategory } from '../src/core/learning-engine/sub-contexts/progressive-content/components/taxonomy-browser'
export type { WordTerm } from '../src/core/learning-engine/sub-contexts/practice-assessment'
