import type { AbstractFlow } from '../subdomains/process-simulation/components/flowchart/abstract-flow/types'
import type { TradeoffScenario } from '../subdomains/tradeoff-sandbox/components/tradeoff-sandbox'
import type { TaxonomyCategory } from '../subdomains/progressive-content/components/taxonomy-browser'
import type { BulletItem } from '../subdomains/progressive-content/components/bullets'
import type { WordTerm } from '../../types'

// --- Per-section bundle ---

export type OKFBundled = OKFBundledSection[]

export interface OKFBundledSection {
  meta: OKFSectionMeta
  data: OKFSectionData
  sectionBody?: string
  sectionFolder?: string
}

export interface OKFSectionIntro {
  what?: string
  why?: string
  next?: string
}

export interface OKFSectionMeta {
  type: string
  title?: string
  heading?: string
  ordered?: boolean
  resource: string
  intro?: OKFSectionIntro
}

export interface OKFIntroRoadmapStep {
  sectionId?: string
  title: string
  type: string
  description: string
}

export interface OKFIntroSectionData {
  type: 'intro'
  title?: string
  subtitle?: string
  estimatedTime?: string
  moduleCount?: number
  what: {
    definition?: string
    summary: string
    bullets?: string[]
    tags?: string[]
  }
  why: {
    summary: string
    impact?: string
  }
  roadmap?: OKFIntroRoadmapStep[]
}

export type OKFSectionData =
  | OKFIntroSectionData
  | OKFTextSectionData
  | OKFBulletSectionData
  | OKFFlowSectionData
  | OKFTradeoffSectionData
  | OKFTaxonomySectionData
  | OKFFlashcardSectionData
  | OKFQuizSectionData
  | OKFConceptMapSectionData
  | OKFScenarioSectionData
  | OKFDecisionTreeSectionData
  | OKFImageGallerySectionData
  | OKFFormulaSandboxSectionData
  | OKFReflectionSequenceSectionData
  | OKFReflectionTemplateSectionData

export interface OKFFormulaVariable {
  id: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export interface OKFFormulaMetric {
  id: string
  label: string
  formula: string
  description: string
  analogy?: string
  inScope?: string[]
  outOfScope?: string[]
}

export interface OKFFormulaSandboxSectionData {
  type: 'formula-sandbox'
  variables: OKFFormulaVariable[]
  metrics: OKFFormulaMetric[]
}

export interface OKFReflectionSequenceChallenge {
  prompt: string
  items: Array<{ id: string; text: string; icon?: string }>
  solution: string[]
}

export interface OKFReflectionSequenceSectionData {
  type: 'reflection-sequence'
  challenges: OKFReflectionSequenceChallenge[]
}

export interface OKFReflectionTemplateChallenge {
  prompt: string
  template: string
  chips: Array<{ id: string; text: string }>
  solution: Record<string, string>
  explanation?: string
}

export interface OKFReflectionTemplateSectionData {
  type: 'reflection-template'
  challenges: OKFReflectionTemplateChallenge[]
}

export interface OKFTextSectionData {
  type: 'text'
  paragraphs: string[]
}

export interface OKFBulletSectionData {
  type: 'bullets'
  items: BulletItem[]
}

export interface OKFFlowSectionData {
  type: 'flowchart'
  flow: AbstractFlow
}

export interface OKFTradeoffSectionData {
  type: 'tradeoff-sandbox'
  scenarios: TradeoffScenario[]
}

export interface OKFTaxonomySectionData {
  type: 'taxonomy-browser'
  categories: TaxonomyCategory[]
}

export interface OKFFlashcardSectionData {
  type: 'flashcards'
  terms: WordTerm[]
}

export interface OKFQuizSectionData {
  type: 'quiz'
  questions: OKFQuizQuestion[]
}

export interface OKFQuizQuestion {
  id: string
  question: string
  choices: OKFQuizChoice[]
  hint?: string
}

export interface OKFQuizChoice {
  id: string
  text: string
  correct: boolean
  explanation: string
}

// --- Concept Map section ---

export interface OKFConceptMapSectionData {
  type: 'concept-map'
  nodes: Record<string, OKFConceptNode>
  edges: OKFConceptEdge[]
}

export interface OKFConceptNode {
  id: string
  title: string
  category: string
}

export interface OKFConceptEdge {
  from: string
  to: string
  label?: string
}

// --- Raw types for concept map YAML ---

export interface OKFConceptNodeRaw {
  title: string
  category: string
}

export interface OKFConceptEdgeRaw {
  from: string
  to: string
  label?: string
}

export interface OKFConceptMapRaw {
  nodes: Record<string, OKFConceptNodeRaw>
  edges: OKFConceptEdgeRaw[]
}

// --- Raw types (YAML parsing) ---

export interface OKFQuizQuestionRaw {
  id: string
  question: string
  choices: Array<{ id: string; text: string; correct: boolean; explanation: string }>
  hint?: string
}

// --- Raw types (YAML parsing) ---

export interface OKFStepRaw {
  type: 'linear' | 'branch'
  id: string
  initiatedBy?: string
  policy?: string
  command?: string
  handledBy?: string
  delegatesTo?: string
  resultEvents?: Array<{ id: string; title: string; desc?: string }>
  continuesAs?: string
  event?: string
  branches?: OKFBranchRaw[]
  description?: string
}

export interface OKFBranchRaw {
  id: string
  label: string
  dashed?: boolean
  policy: string
  command: string
  handledBy: string
  delegatesTo?: string
  resultEvents: Array<{ id: string; title: string; desc?: string }>
  continuesAs?: string
  description?: string
}

export interface OKFJourneyRaw {
  id: string
  label: string
  description: string
  steps: Array<{ stepId: string; name: string; description: string; processGroup?: 'planning' | 'execution' | 'evaluation' | 'escalation' }>
}

export interface OKFTradeoffScenarioRaw {
  id: string
  title: string
  description: string
  metrics: Array<{ id: string; label: string; baseValue: number; min?: number; max?: number; direction?: 'higher' | 'lower' }>
  steps: Array<{
    id: string
    title: string
    description: string
    recommended?: string
    choices: Array<{
      id: string
      label: string
      description: string
      metrics: Record<string, number>
      pros: Array<{ title: string; description: string }>
      cons: Array<{ title: string; description: string }>
      whyThisFits?: string
      whenToUse?: string
    }>
  }>
}

export interface OKFTaxonomyRaw {
  icon: string
  title: string
  subtitle: string
  description: string
  details: string
  analogy: string
  primaryFocus: string
  inScope: string[]
  outOfScope: string[]
  color: string
}

export interface OKFGlossaryRaw {
  id: string
  word: string
  pronunciation: string
  category: string
  image?: string
  shortDefinition: string
  detailedDefinition: string
  whyItMatters: string
  dialogue?: { user: string; aiThoughts: string; aiQuestion: string }
}

// --- Image Gallery section types ---

export interface OKFGalleryItem {
  id: string
  url: string
  caption: string
  credit?: string
}

export interface OKFImageGallerySectionData {
  type: 'image-gallery'
  items: OKFGalleryItem[]
}

// --- Raw types for image-gallery YAML ---

export type OKFGalleryRaw = OKFGalleryItem[]

// --- Scenario section types ---

export type ScenarioRating = 'a' | 'b-plus' | 'b-minus' | 'c'

export interface OKFScenarioSectionData {
  type: 'scenario'
  id: string
  title: string
  intro: string
  nodes: Record<string, OKFScenarioNode>
  startNode: string
}

export interface OKFScenarioNode {
  id: string
  prompt?: string
  choices?: OKFScenarioChoice[]
  outcome?: OKFScenarioOutcome
}

export interface OKFScenarioChoice {
  id: string
  text: string
  next: string
}

export interface OKFScenarioOutcome {
  verdict: string
  lesson: string
  rating: ScenarioRating
}

// --- Raw types for scenario YAML ---

export interface OKFScenarioRaw {
  id: string
  title: string
  intro: string
  nodes: Record<string, OKFScenarioNodeRaw>
}

export interface OKFScenarioNodeRaw {
  prompt?: string
  choices?: Array<{ id: string; text: string; next: string }>
  outcome?: { verdict: string; lesson: string; rating: ScenarioRating }
}

// --- Decision Tree section types ---

export interface OKFDecisionTreeSectionData {
  type: 'decision-tree'
  id: string
  title: string
  root: string
  nodes: Record<string, OKFDecisionTreeNode>
}

export interface OKFDecisionTreeNode {
  id: string
  prompt?: string
  choices?: OKFDecisionTreeChoice[]
  leaf?: OKFDecisionTreeLeaf
}

export interface OKFDecisionTreeChoice {
  id: string
  text: string
  next: string
  rationale?: string
  recommended?: boolean
}

export interface OKFDecisionTreeLeaf {
  recommendation: string
  explanation: string
  tradeoffs?: string[]
}

// --- Raw types for decision tree YAML ---

export interface OKFDecisionTreeRaw {
  id: string
  title: string
  root: string
  nodes: Record<string, OKFDecisionTreeNodeRaw>
}

export interface OKFDecisionTreeNodeRaw {
  prompt?: string
  choices?: Array<{ id: string; text: string; next: string; rationale?: string; recommended?: boolean }>
  leaf?: { recommendation: string; explanation: string; tradeoffs?: string[] }
}

// --- Raw types for formula and reflection sections ---

export interface OKFFormulaSandboxRaw {
  variables: OKFFormulaVariable[]
  metrics: OKFFormulaMetric[]
}

export interface OKFReflectionSequenceRaw {
  prompt?: string
  items?: Array<{ id: string; text: string; icon?: string }>
  solution?: string[]
  challenges?: OKFReflectionSequenceChallenge[]
}

export interface OKFReflectionTemplateRaw {
  prompt?: string
  template?: string
  chips?: Array<{ id: string; text: string }>
  solution?: Record<string, string>
  explanation?: string
  challenges?: OKFReflectionTemplateChallenge[]
}

