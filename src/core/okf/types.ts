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
}

export interface OKFJourneyRaw {
  id: string
  label: string
  description: string
  steps: Array<{ nodeId: string; description: string; processGroup?: 'planning' | 'execution' | 'evaluation' | 'escalation' }>
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
