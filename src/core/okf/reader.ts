import * as yaml from 'js-yaml'
import * as Icons from 'lucide-react'
import type { ComponentType } from 'react'
import type { AbstractFlow, ActorDecl, SystemDecl, FlowJourney } from '../../sections/flowchart/abstract-flow/types'
import { ref } from '../../sections/flowchart/abstract-flow/types'
import type { BulletItem } from '../../sections/bullets'
import type { WordTerm } from '../../types'
import type {
  OKFBundled,
  OKFSectionMeta,
  OKFSectionData,
  OKFTextSectionData,
  OKFBulletSectionData,
  OKFFlowSectionData,
  OKFTradeoffSectionData,
  OKFTaxonomySectionData,
  OKFFlashcardSectionData,
  OKFQuizSectionData,
  OKFConceptMapSectionData,
  OKFScenarioSectionData,
  OKFDecisionTreeSectionData,
  OKFImageGallerySectionData,
  OKFGalleryRaw,
  OKFStepRaw,
  OKFJourneyRaw,
  OKFTradeoffScenarioRaw,
  OKFTaxonomyRaw,
  OKFGlossaryRaw,
  OKFQuizQuestionRaw,
  OKFConceptMapRaw,
  OKFScenarioRaw,
  OKFDecisionTreeRaw,
} from './types'

const OKF_BASE = `${import.meta.env.BASE_URL}okf`

function parseYaml<T>(text: string): T {
  return yaml.load(text) as T
}

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  return { meta: parseYaml(match[1]), body: match[2] }
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(`${OKF_BASE}/${path}`)
  if (!res.ok) throw new Error(`OKF fetch failed: ${path} (${res.status})`)
  return res.text()
}

async function fetchYaml<T>(path: string): Promise<T> {
  const text = await fetchText(path)
  return parseYaml(text) as T
}

async function fetchMarkdown(path: string): Promise<{ meta: Record<string, unknown>; body: string }> {
  const text = await fetchText(path)
  return parseFrontmatter(text)
}

// --- Bundle loading ---

function discoverSectionFiles(related: string[], sectionPath: string): string[] {
  const normalized = sectionPath.replace(/\/$/, '')
  return related
    .filter((r) => r.startsWith(normalized + '/'))
    .filter((r) => r.endsWith('.yaml'))
    .map((r) => {
      const after = r.replace(normalized + '/', '')
      return after
    })
}

export async function loadOKFBundle(topicId: string): Promise<OKFBundled> {
  const metaRes = await fetchMarkdown(`${topicId}/okf.md`)
  const sectionPaths = (metaRes.meta.sections as string[]) ?? []
  const related = (metaRes.meta.related as string[]) ?? []

  const sections = await Promise.all(
    sectionPaths.map(async (sectionPath) => {
      const sectionFile = sectionPath.endsWith('section.md')
        ? sectionPath
        : `${sectionPath}/section.md`

      const sectionRes = await fetchMarkdown(`${topicId}/${sectionFile}`)
      const meta: OKFSectionMeta = {
        type: (sectionRes.meta.type as string) ?? 'text',
        title: (sectionRes.meta.title as string) ?? '',
        heading: (sectionRes.meta.heading as string) ?? undefined,
        ordered: (sectionRes.meta.ordered as boolean) ?? undefined,
        resource: (sectionRes.meta.resource as string) ?? '.',
      }

      const sectionDir = sectionFile.replace(/\/section\.md$/, '')
      const resourceFiles = discoverSectionFiles(related, sectionDir)
      const sectionBasePath = `${topicId}/${sectionDir}`

      const data = await loadSectionResource(meta.type, sectionBasePath, resourceFiles, meta.resource, sectionRes.body)
      return { meta, data }
    })
  )

  return sections
}

async function loadSectionResource(
  type: string,
  basePath: string,
  resourceFiles: string[],
  resource: string,
  sectionBody: string
): Promise<OKFSectionData> {
  switch (type) {
    case 'text':
      return loadTextSection(basePath, resource, sectionBody)
    case 'bullets':
      return loadBulletsSection(basePath, resource, resourceFiles)
    case 'flowchart':
      return loadFlowchartSection(basePath, resourceFiles)
    case 'tradeoff-sandbox':
      return loadTradeoffSection(basePath, resourceFiles)
    case 'taxonomy-browser':
      return loadTaxonomySection(basePath, resourceFiles)
    case 'flashcards':
      return loadFlashcardSection(basePath, resource, resourceFiles)
    case 'quiz':
      return loadQuizSection(basePath, resource, resourceFiles)
    case 'concept-map':
      return loadConceptMapSection(basePath, resource)
    case 'scenario':
      return loadScenarioSection(basePath, resource)
    case 'decision-tree':
      return loadDecisionTreeSection(basePath, resource)
    case 'image-gallery':
      return loadImageGallerySection(basePath, resource, resourceFiles)
    default:
      throw new Error(`Unknown section type: ${type}`)
  }
}

async function loadTextSection(basePath: string, resource: string, sectionBody: string): Promise<OKFTextSectionData> {
  const contentFile = resource !== '.' ? resource : 'content.md'
  try {
    const contentRes = await fetchMarkdown(`${basePath}/${contentFile}`)
    const paragraphs = parseParagraphs(contentRes.body)
    return { type: 'text', paragraphs }
  } catch {
    const paragraphs = parseParagraphs(sectionBody)
    return { type: 'text', paragraphs }
  }
}

async function loadBulletsSection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFBulletSectionData> {
  const itemsFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'items.yaml')
  if (itemsFile) {
    const raw = await fetchYaml<any[]>(`${basePath}/${itemsFile}`)
    const items = raw.map((r) => ({
      text: r.text as string,
      children: (r.children ?? []).map((c: any) => ({ text: c.text as string })),
    })) as BulletItem[]
    return { type: 'bullets', items }
  }
  return { type: 'bullets', items: [] }
}

async function loadFlowchartSection(basePath: string, _resourceFiles: string[]): Promise<OKFFlowSectionData> {
  const [actorsRaw, systemsRaw, stepsRaw, journeysRaw] = await Promise.all([
    fetchYaml<Record<string, { title: string; desc: string }>>(`${basePath}/actors.yaml`),
    fetchYaml<Record<string, { title: string; desc: string; type: string; stateMachine?: any }>>(`${basePath}/systems.yaml`),
    fetchYaml<OKFStepRaw[]>(`${basePath}/steps.yaml`),
    fetchYaml<OKFJourneyRaw[]>(`${basePath}/journeys.yaml`),
  ])
  const flow = mapFlow(actorsRaw, systemsRaw, stepsRaw, journeysRaw)
  return { type: 'flowchart', flow }
}

async function loadTradeoffSection(basePath: string, resourceFiles: string[]): Promise<OKFTradeoffSectionData> {
  const scenarioFiles = resourceFiles.filter((f) => !f.endsWith('section.yaml'))
  const promises = scenarioFiles.map((f) =>
    fetchYaml<OKFTradeoffScenarioRaw>(`${basePath}/${f}`)
  )
  const raw = await Promise.all(promises)
  const scenarios = raw.map(mapTradeoffScenario)
  return { type: 'tradeoff-sandbox', scenarios }
}

async function loadTaxonomySection(basePath: string, resourceFiles: string[]): Promise<OKFTaxonomySectionData> {
  const categoryFiles = resourceFiles.filter((f) => !f.endsWith('section.yaml'))
  const promises = categoryFiles.map((f) =>
    fetchYaml<OKFTaxonomyRaw>(`${basePath}/${f}`)
  )
  const raw = await Promise.all(promises)
  const categories = raw.map(mapTaxonomyCategory)
  return { type: 'taxonomy-browser', categories }
}

async function loadFlashcardSection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFFlashcardSectionData> {
  const glossaryFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'glossary.yaml')
  if (glossaryFile) {
    const raw = await fetchYaml<OKFGlossaryRaw[]>(`${basePath}/${glossaryFile}`)
    const terms = raw.map(mapGlossaryTerm)
    return { type: 'flashcards', terms }
  }
  return { type: 'flashcards', terms: [] }
}

async function loadQuizSection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFQuizSectionData> {
  const questionsFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'questions.yaml')
  if (questionsFile) {
    const raw = await fetchYaml<OKFQuizQuestionRaw[]>(`${basePath}/${questionsFile}`)
    const questions = raw.map(mapQuizQuestion)
    return { type: 'quiz', questions }
  }
  return { type: 'quiz', questions: [] }
}

async function loadConceptMapSection(basePath: string, resource: string): Promise<OKFConceptMapSectionData> {
  const conceptsFile = resource !== '.' ? resource : 'concepts.yaml'
  const raw = await fetchYaml<OKFConceptMapRaw>(`${basePath}/${conceptsFile}`)
  const { nodes, edges } = mapConceptMap(raw)
  return { type: 'concept-map', nodes, edges }
}

async function loadScenarioSection(basePath: string, resource: string): Promise<OKFScenarioSectionData> {
  const scenariosFile = resource !== '.' ? resource : 'scenarios.yaml'
  const raw = await fetchYaml<OKFScenarioRaw>(`${basePath}/${scenariosFile}`)
  return mapScenario(raw)
}

async function loadImageGallerySection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFImageGallerySectionData> {
  const galleryFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'gallery.yaml')
  if (galleryFile) {
    const raw = await fetchYaml<OKFGalleryRaw>(`${basePath}/${galleryFile}`)
    return { type: 'image-gallery', items: raw }
  }
  return { type: 'image-gallery', items: [] }
}

// --- Flow mapping ---

function mapFlow(
  actorsRaw: Record<string, { title: string; desc: string }>,
  systemsRaw: Record<string, { title: string; desc: string; type: string; stateMachine?: any }>,
  stepsRaw: OKFStepRaw[],
  journeysRaw: OKFJourneyRaw[]
): AbstractFlow {
  const actors: Record<string, ActorDecl> = {}
  for (const [id, a] of Object.entries(actorsRaw)) {
    actors[id] = { title: a.title, desc: a.desc }
  }

  const systems: Record<string, SystemDecl> = {}
  for (const [id, s] of Object.entries(systemsRaw)) {
    systems[id] = {
      title: s.title,
      desc: s.desc,
      type: s.type as 'aggregate' | 'external',
      stateMachine: s.stateMachine,
    }
  }

  return {
    actors,
    systems,
    steps: stepsRaw.map(mapStep),
    journeys: journeysRaw.map(mapJourney),
  }
}

function mapStep(raw: OKFStepRaw): import('../../sections/flowchart/abstract-flow/types').FlowStep {
  if (raw.type === 'linear') {
    return {
      type: 'linear' as const,
      id: raw.id,
      ...(raw.initiatedBy ? { initiatedBy: ref(raw.initiatedBy) } : {}),
      policy: raw.policy!,
      command: raw.command!,
      handledBy: ref(raw.handledBy!),
      ...(raw.delegatesTo ? { delegatesTo: ref(raw.delegatesTo) } : {}),
      resultEvents: raw.resultEvents ?? [],
      continuesAs: raw.continuesAs,
    }
  }
  return {
    type: 'branch' as const,
    id: raw.id,
    event: raw.event!,
    branches: (raw.branches ?? []).map((b) => ({
      id: b.id,
      label: b.label,
      dashed: b.dashed,
      policy: b.policy,
      command: b.command,
      handledBy: ref(b.handledBy),
      ...(b.delegatesTo ? { delegatesTo: ref(b.delegatesTo) } : {}),
      resultEvents: b.resultEvents,
      continuesAs: b.continuesAs,
      ...(b.description ? { description: b.description } : {}),
    })),
  }
}

function mapJourney(raw: OKFJourneyRaw): FlowJourney {
  return {
    id: raw.id,
    label: raw.label,
    description: raw.description,
    steps: raw.steps,
  }
}

// --- Tradeoff mapping ---

function mapTradeoffScenario(raw: OKFTradeoffScenarioRaw): import('../../sections/tradeoff-sandbox').TradeoffScenario {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    metrics: raw.metrics.map((m) => ({
      id: m.id,
      label: m.label,
      baseValue: m.baseValue,
      min: m.min,
      max: m.max,
      direction: m.direction,
    })),
    steps: raw.steps.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      recommended: s.recommended,
      choices: s.choices.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        metrics: c.metrics,
        pros: c.pros,
        cons: c.cons,
        whyThisFits: c.whyThisFits,
        whenToUse: c.whenToUse,
      })),
    })),
  }
}

// --- Taxonomy mapping ---

function mapTaxonomyCategory(raw: OKFTaxonomyRaw): import('../../sections/taxonomy-browser').TaxonomyCategory {
  const iconKey = raw.icon as keyof typeof Icons
  const IconComponent = (Icons as Record<string, unknown>)[iconKey] as ComponentType<any>
  return {
    icon: IconComponent,
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description,
    details: raw.details,
    analogy: raw.analogy,
    primaryFocus: raw.primaryFocus,
    inScope: raw.inScope,
    outOfScope: raw.outOfScope,
    color: raw.color,
  }
}

// --- Glossary mapping ---

function mapGlossaryTerm(raw: OKFGlossaryRaw): WordTerm {
  return {
    id: raw.id,
    word: raw.word,
    pronunciation: raw.pronunciation,
    category: raw.category,
    image: raw.image,
    shortDefinition: raw.shortDefinition,
    detailedDefinition: raw.detailedDefinition,
    whyItMatters: raw.whyItMatters,
    dialogue: raw.dialogue,
  }
}

// --- Quiz mapping ---

function mapQuizQuestion(raw: OKFQuizQuestionRaw): import('./types').OKFQuizQuestion {
  return {
    id: raw.id,
    question: raw.question,
    choices: raw.choices.map((c) => ({
      id: c.id,
      text: c.text,
      correct: c.correct,
      explanation: c.explanation,
    })),
    hint: raw.hint,
  }
}

// --- Concept Map mapping ---

function mapConceptMap(raw: OKFConceptMapRaw): { nodes: Record<string, import('./types').OKFConceptNode>; edges: import('./types').OKFConceptEdge[] } {
  const nodes: Record<string, import('./types').OKFConceptNode> = {}
  for (const [id, node] of Object.entries(raw.nodes)) {
    nodes[id] = {
      id,
      title: node.title,
      category: node.category,
    }
  }
  const edges = raw.edges.map((e) => ({
    from: e.from,
    to: e.to,
    label: e.label,
  }))
  return { nodes, edges }
}

async function loadDecisionTreeSection(basePath: string, resource: string): Promise<OKFDecisionTreeSectionData> {
  const treeFile = resource !== '.' ? resource : 'tree.yaml'
  const raw = await fetchYaml<OKFDecisionTreeRaw>(`${basePath}/${treeFile}`)
  return mapDecisionTree(raw)
}

function mapDecisionTree(raw: OKFDecisionTreeRaw): OKFDecisionTreeSectionData {
  const nodes: Record<string, import('./types').OKFDecisionTreeNode> = {}
  for (const [id, node] of Object.entries(raw.nodes)) {
    const mappedNode: import('./types').OKFDecisionTreeNode = { id }
    if (node.prompt) {
      mappedNode.prompt = node.prompt
    }
    if (node.choices) {
      mappedNode.choices = node.choices.map((c) => ({
        id: c.id,
        text: c.text,
        next: c.next,
        rationale: c.rationale,
        recommended: c.recommended,
      }))
    }
    if (node.leaf) {
      mappedNode.leaf = {
        recommendation: node.leaf.recommendation,
        explanation: node.leaf.explanation,
        tradeoffs: node.leaf.tradeoffs,
      }
    }
    nodes[id] = mappedNode
  }
  return {
    type: 'decision-tree',
    id: raw.id,
    title: raw.title,
    root: raw.root,
    nodes,
  }
}

function mapScenario(raw: OKFScenarioRaw): OKFScenarioSectionData {
  const nodes: Record<string, import('./types').OKFScenarioNode> = {}
  for (const [id, node] of Object.entries(raw.nodes)) {
    const mappedNode: import('./types').OKFScenarioNode = { id }
    if (node.prompt) {
      mappedNode.prompt = node.prompt
    }
    if (node.choices) {
      mappedNode.choices = node.choices.map((c) => ({
        id: c.id,
        text: c.text,
        next: c.next,
      }))
    }
    if (node.outcome) {
      mappedNode.outcome = {
        verdict: node.outcome.verdict,
        lesson: node.outcome.lesson,
        rating: node.outcome.rating,
      }
    }
    nodes[id] = mappedNode
  }
  return {
    type: 'scenario',
    id: raw.id,
    title: raw.title,
    intro: raw.intro,
    nodes,
    startNode: 'start',
  }
}

// --- Content parsing ---

function parseParagraphs(body: string): string[] {
  const paragraphs: string[] = []
  const lines = body.trim().split('\n').filter((l) => l.trim())
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const cleaned = trimmed.replace(/^\d+\.\s+/, '').replace(/^-+\s+/, '')
      paragraphs.push(cleaned)
    }
  }
  return paragraphs
}
