/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRoot, type Root } from 'react-dom/client'
import { useMemo, useEffect, type ComponentType } from 'react'
import type { SectionConfig } from '../src/core/registry'
import { bundleToSections } from '../src/core/okf/sections'
import { HUDProvider, useHUD } from '../src/core/context/HUDContext'
import { ProgressProvider } from '../src/core/progress/context'
import { EditorProvider, useEditor, useEditorSafe } from '../src/core/context/EditorContext'
import { EditSectionToggle } from '../src/components/layout/EditSectionToggle'
import { SplitPaneLayout } from '../src/components/layout/SplitPaneLayout'
import { EditorPanel } from '../src/components/editor/EditorPanel'
import { useSectionEditorBuffer } from '../src/core/hooks/useSectionEditorBuffer'
import { ToastProvider, useToast } from '../src/components/ui/Toast'
import { SoundProvider } from '../src/context/SoundContext'
import { AudioToggle } from '../src/components/layout/AudioToggle'
import { ThemeToggle } from '../src/components/motion/theme-toggle'
import { X } from 'lucide-react'
import { type OKFValidationErrorPayload } from '../src/core/okf/validate'
import type { OKFBundled } from '../src/core/okf/types'

// SingleHTMLEmbedAdapter — delegates bundle loading, rendering, validation
import { singleEmbedAdapter, registerEmbedSection } from '../src/core/delivery/adapters/single-html-embed'

// Import section CSS
import '../src/styles/global.css'
import '../src/components/layout/layout.css'
import '../src/sections/intro/intro.css'
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

// Import all section components directly
import IntroSection from '../src/sections/intro'
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
   * Enable OKF section editing (default: true).
   */
  editable?: boolean
  /**
   * Topic ID for disk save API calls (default: '.').
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

// --- Live Editor Mode View ---

function LivePreviewSection({ config }: { config: SectionConfig }) {
  const { activeSectionIndex } = useEditor()
  return (
    <div className="editor-preview-wrapper" data-testid="editor-preview-wrapper">
      <SectionRenderer config={config} sectionIndex={activeSectionIndex ?? 0} />
    </div>
  )
}

function EditorModeView({ topicLabel, topicId }: { topicLabel: string; topicId: string }) {
  const { activeSection, activeSectionIndex } = useEditor()
  const { showToast } = useToast()

  const {
    data: editedData,
    rawText,
    validationErrors,
    isDirty,
    isSaving,
    setVisualFormField,
    setRawText,
    saveToDisk,
    downloadFiles,
  } = useSectionEditorBuffer(activeSection)

  useEffect(() => {
    if (activeSection && editedData) {
      activeSection.data = editedData
    }
  }, [activeSection, editedData])

  const previewConfig = useMemo(() => {
    if (!activeSection) return null
    const original = bundleToSections([activeSection])[0]
    return {
      type: original.type,
      props: { ...original.props, ...editedData },
    }
  }, [activeSection, editedData])

  const sectionName = useMemo(() => {
    if (!activeSection) return ''
    return activeSection.sectionFolder ?? `section-${activeSectionIndex ?? 0}`
  }, [activeSection, activeSectionIndex])

  const handleSave = async () => {
    if (!sectionName || !isDirty) return
    try {
      await saveToDisk(topicId, sectionName)
      showToast('success', 'Section saved to disk')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      showToast('error', `Save failed: ${msg}. Downloading files instead...`)
      downloadFiles()
    }
  }

  const handleDownload = () => {
    downloadFiles()
  }

  if (!activeSection || !previewConfig) {
    return null
  }

  return (
    <div>
      <div className="editor-mode-header">
        <h2 className="topic-page-title">{topicLabel}</h2>
        <EditSectionToggle />
      </div>
      <SplitPaneLayout
        leftPanel={
          <EditorPanel
            sectionData={editedData}
            validationErrors={validationErrors}
            onVisualFormChange={setVisualFormField}
            onRawTextChange={setRawText}
            rawText={rawText}
            isDirty={isDirty}
            isSaving={isSaving}
            onSave={handleSave}
            onDownload={handleDownload}
          />
        }
        rightPanel={<LivePreviewSection config={previewConfig} />}
      />
      <HUDDrawer />
    </div>
  )
}

// --- Main App Content ---

function LoomAppContent({
  sections,
  title,
  topicId,
  editable,
  header,
}: {
  sections: SectionConfig[]
  title?: string
  topicId: string
  editable: boolean
  header?: boolean | HeaderOptions
}) {
  const editor = useEditorSafe()
  const editMode = editor?.editMode ?? false
  const bundle = editor?.bundle

  const displaySections = useMemo(() => {
    if (bundle && bundle.length > 0) {
      return bundleToSections(bundle)
    }
    return sections
  }, [bundle, sections])

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
        {displaySections.map((section, idx) => (
          <SectionRenderer key={`${section.type}-${idx}`} config={section} sectionIndex={idx} />
        ))}
      </div>
      <HUDDrawer />
    </div>
  )

  if (editable && editMode) {
    return (
      <div className="topic-page editor-mode">
        <EditorModeView topicLabel={title || 'Section Editor'} topicId={topicId} />
      </div>
    )
  }

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
  validateSection: (data: unknown, metaType?: string) => OKFValidationErrorPayload[]
  validateYAML: (rawYaml: string, metaType?: string) => { data: any; errors: OKFValidationErrorPayload[] }
  formatValidationPrompt: (errors: OKFValidationErrorPayload[], rawSource?: string) => string
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
    const editable = options?.editable ?? true
    const topicId = options?.topicId ?? '.'
    const bundleOption = options?.bundle
    const headerOption = options?.header

    const App = () => {
      const syntheticBundle: OKFBundled = useMemo(() => {
        if (bundleOption) return bundleOption
        return sections.map((sec, idx) => ({
          meta: { type: sec.type, title: (sec.props?.title as string) || sec.type, resource: '.' },
          data: { type: sec.type, ...sec.props } as any,
          sectionFolder: `section-${idx}`,
          sectionBody: '',
        }))
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [sections])

      return (
        <SoundProvider>
          <ProgressProvider>
            <HUDProvider>
              <ToastProvider>
                <EditorProvider bundle={syntheticBundle}>
                  <LoomAppContent
                    sections={sections}
                    title={title}
                    topicId={topicId}
                    editable={editable}
                    header={headerOption}
                  />
                </EditorProvider>
              </ToastProvider>
            </HUDProvider>
          </ProgressProvider>
        </SoundProvider>
      )
    }

    root = createRoot(container)
    root.render(<App />)

    return () => {
      root?.unmount()
    }
  },

  renderOKF(container: HTMLElement, bundle: OKFBundled, options?: RenderOptions) {
    const sections = bundleToSections(bundle)
    return LoomSections.render(container, sections, {
      ...options,
      bundle,
      editable: options?.editable ?? true,
    })
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
    return LoomSections.renderOKF(container, bundle, {
      ...options,
      topicId,
      editable: options?.editable ?? true,
    })
  },

  validateSection(data: unknown, metaType?: string) {
    const result = singleEmbedAdapter.runtime.validatePayload(data, metaType)
    // Convert ValidationGateway diagnostics to legacy OKFValidationErrorPayload format
    return result.diagnostics.map((d) => ({
      tier: d.tier === 1 ? 'syntax' as const : d.tier === 2 ? 'schema' as const : 'semantic' as const,
      field: d.field,
      line: d.line,
      column: d.column,
      message: d.message,
      fixHint: d.fixHint,
    }))
  },

  validateYAML(rawYaml: string, metaType?: string) {
    const result = singleEmbedAdapter.runtime.validatePayload(rawYaml, metaType)
    return {
      data: result.payload,
      errors: result.diagnostics.map((d) => ({
        tier: d.tier === 1 ? 'syntax' as const : d.tier === 2 ? 'schema' as const : 'semantic' as const,
        field: d.field,
        line: d.line,
        column: d.column,
        message: d.message,
        fixHint: d.fixHint,
      })),
    }
  },

  formatValidationPrompt(errors: OKFValidationErrorPayload[], rawSource?: string) {
    // Reuse existing format helper for backward compatibility
    if (errors.length === 0) return 'No validation errors found.'

    let prompt = `# OKF Section Validation Error Report\n\n`
    prompt += `The following ${errors.length} error(s) were found during OKF section validation. Please fix the files accordingly.\n\n`

    errors.forEach((err, idx) => {
      prompt += `### Error ${idx + 1}: [Tier: ${err.tier.toUpperCase()}] ${err.file || err.sectionName || 'Section'}\n`
      if (err.file) prompt += `- **File**: \`${err.file}\`\n`
      if (err.sectionName) prompt += `- **Section**: \`${err.sectionName}\`\n`
      if (err.field) prompt += `- **Field Path**: \`${err.field}\`\n`
      if (err.line) prompt += `- **Location**: Line ${err.line}${err.column ? `, Column ${err.column}` : ''}\n`
      prompt += `- **Message**: ${err.message}\n`
      if (err.fixHint) prompt += `- **Suggested Fix**: ${err.fixHint}\n`
      if (err.snippet) {
        prompt += `- **Snippet**:\n\`\`\`yaml\n${err.snippet}\n\`\`\`\n`
      }
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
export type { BulletItem } from '../src/sections/bullets'
export type { TradeoffScenario, MetricDef, TradeoffChoice, TradeoffStep, TradeoffProCon } from '../src/sections/tradeoff-sandbox'
export type { TaxonomyCategory } from '../src/sections/taxonomy-browser'
export type { WordTerm } from '../src/types'
