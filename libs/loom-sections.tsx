import { createRoot, type Root } from 'react-dom/client'
import { Suspense, useMemo, type ComponentType } from 'react'
import type { SectionConfig } from '../src/core/registry'
import { Registry } from '../src/core/registry/generic-registry'
import { HUDProvider } from '../src/core/context/HUDContext'
import { ProgressProvider } from '../src/core/progress/context'

// Import section CSS
import '../src/styles/global.css'
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

function SectionsContainer({ sections }: { sections: SectionConfig[] }) {
  return (
    <div className="loom-sections-container">
      {sections.map((section, idx) => (
        <SectionRenderer key={`${section.type}-${idx}`} config={section} />
      ))}
    </div>
  )
}

// --- Public API ---

interface LoomSectionsAPI {
  render: (container: HTMLElement, sections: SectionConfig[]) => () => void
  registerSection: (type: string, component: ComponentType<any>) => void
}

const LoomSections: LoomSectionsAPI = {
  render(container: HTMLElement, sections: SectionConfig[]) {
    let root: Root | null = null

    const App = () => (
      <ProgressProvider>
        <HUDProvider>
          <SectionsContainer sections={sections} />
        </HUDProvider>
      </ProgressProvider>
    )

    root = createRoot(container)
    root.render(<App />)

    return () => {
      root?.unmount()
    }
  },

  registerSection(type: string, component: ComponentType<any>) {
    registry.register(type, component)
  },
}

export default LoomSections
export type { SectionConfig }

// Re-export key types
export type { BulletItem } from '../src/sections/bullets'
export type { TradeoffScenario, MetricDef, TradeoffChoice, TradeoffStep, TradeoffProCon } from '../src/sections/tradeoff-sandbox'
export type { TaxonomyCategory } from '../src/sections/taxonomy-browser'
export type { WordTerm } from '../src/types'

