export interface OKFBundled {
  meta: OKFBundledMeta
  flow: import('../../sections/flowchart/abstract-flow/types').AbstractFlow
  tradeoffs: import('../../sections/tradeoff-sandbox').TradeoffScenario[]
  taxonomy: import('../../sections/taxonomy-browser').TaxonomyCategory[]
  glossary: import('../../types').WordTerm[]
  content: OKFContent
}

export interface OKFSectionRaw {
  type: string
  title?: string
  heading?: string
  contentKey?: string
  ordered?: boolean
}

export interface OKFBundledMeta {
  type: string
  title: string
  description: string
  tags: string[]
  sections?: OKFSectionRaw[]
}

export interface OKFContent {
  paragraphs: string[]
  lifecycleMarkdown: string[]
  capabilityBullets: import('../../sections/bullets').BulletItem[]
}

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
