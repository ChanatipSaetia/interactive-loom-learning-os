import type { AbstractFlow } from '../../sections/flowchart/abstract-flow/types'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'
import type { TaxonomyCategory } from '../../sections/taxonomy-browser'
import type { BulletItem } from '../../sections/bullets'
import type { WordTerm } from '../../types'

// --- Per-section bundle ---

export type OKFBundled = OKFBundledSection[]

export interface OKFBundledSection {
  meta: OKFSectionMeta
  data: OKFSectionData
}

export interface OKFSectionMeta {
  type: string
  title?: string
  heading?: string
  ordered?: boolean
  resource: string
}

export type OKFSectionData =
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
  shortDefinition: string
  detailedDefinition: string
  whyItMatters: string
  dialogue?: { user: string; aiThoughts: string; aiQuestion: string }
}

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
