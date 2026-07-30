import * as yaml from 'js-yaml'
import type { AbstractFlow, ActorDecl, SystemDecl, FlowJourney } from '../../sections/flowchart/abstract-flow/types'
import { ref } from '../../sections/flowchart/abstract-flow/types'
import type { BulletItem } from '../../sections/bullets'
import type { WordTerm } from '../../types'
import type {
  OKFBundled,
  OKFSectionMeta,
  OKFSectionData,
  OKFIntroSectionData,
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
  OKFFormulaSandboxSectionData,
  OKFReflectionSequenceSectionData,
  OKFReflectionTemplateSectionData,
  OKFReflectionSequenceChallenge,
  OKFReflectionTemplateChallenge,
  OKFGalleryItem,
  OKFStepRaw,
  OKFJourneyRaw,
  OKFTradeoffScenarioRaw,
  OKFTaxonomyRaw,
  OKFGlossaryRaw,
  OKFQuizQuestionRaw,
  OKFConceptMapRaw,
  OKFScenarioRaw,
  OKFDecisionTreeRaw,
  OKFFormulaSandboxRaw,
} from './types'

function getOkfBase(): string {
  if (typeof window !== 'undefined' && (window as any).__OKF_BASE_OVERRIDE__) {
    return (window as any).__OKF_BASE_OVERRIDE__
  }
  return `${import.meta.env.BASE_URL || '/'}okf`
}

function parseYaml<T>(text: string): T {
  return yaml.load(text) as T
}

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  return { meta: parseYaml(match[1]), body: match[2] }
}

const bundleCache = new Map<string, OKFBundled>()
const textFetchCache = new Map<string, Promise<string>>()

export function getCachedOKFBundle(topicId: string): OKFBundled | undefined {
  return bundleCache.get(topicId)
}

export function clearOKFCache(): void {
  bundleCache.clear()
  textFetchCache.clear()
}

async function fetchText(path: string): Promise<string> {
  let pending = textFetchCache.get(path)
  if (!pending) {
    const base = getOkfBase()
    pending = fetch(`${base}/${path}`).then(async (res) => {
      if (!res.ok) throw new Error(`OKF fetch failed: ${path} (${res.status})`)
      return res.text()
    })
    textFetchCache.set(path, pending)
  }
  return pending
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

function parseIndexMdSections(body: string): string[] {
  const sections: string[] = []
  const lines = body.split('\n')
  for (const rawLine of lines) {
    const line = rawLine.trim()
    const linkMatch = line.match(/^\*\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:—\s*(.+))?$/)
    if (linkMatch) {
      const href = linkMatch[2].trim()
      if (href.includes('/section.md')) {
        const sectionPath = href.replace(/^\.\//, '')
        sections.push(sectionPath)
      }
    }
  }
  return sections
}

export async function loadOKFBundle(topicId: string): Promise<OKFBundled> {
  const cached = bundleCache.get(topicId)
  if (cached) return cached

  // Fetch index.md and index.yaml concurrently at t=0
  const [indexMdRes, related] = await Promise.all([
    fetchMarkdown(`${topicId}/index.md`),
    (async () => {
      try {
        const yamlData = await fetchYaml<Record<string, unknown>>(`${topicId}/index.yaml`)
        return (yamlData.related as string[]) ?? []
      } catch {
        return []
      }
    })(),
  ])

  const sectionPaths = parseIndexMdSections(indexMdRes.body)

  // Pre-fire fetches for all section.md files and related files concurrently at t=0
  const prefetchPaths = [
    ...sectionPaths.map((sp) => `${topicId}/${sp.endsWith('section.md') ? sp : `${sp}/section.md`}`),
    ...related.map((rel) => `${topicId}/${rel}`),
  ]
  prefetchPaths.forEach((path) => fetchText(path).catch(() => {}))

  const sections = await Promise.all(
    sectionPaths.map(async (sectionPath, idx) => {
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
        intro: (sectionRes.meta.intro as any) ?? undefined,
      }

      const sectionDir = sectionFile.replace(/\/section\.md$/, '')
      const resourceFiles = discoverSectionFiles(related, sectionDir)
      const sectionBasePath = `${topicId}/${sectionDir}`

      const data = await loadSectionResource(meta.type, sectionBasePath, resourceFiles, meta.resource, sectionRes.body)
      const folderName = sectionDir.split('/').pop() ?? `section-${idx}`
      return { meta, data, sectionBody: sectionRes.body, sectionFolder: folderName }
    })
  )

  bundleCache.set(topicId, sections)
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
    case 'intro':
      return loadIntroSection(basePath, resource)
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
    case 'formula-sandbox':
      return loadFormulaSandboxSection(basePath, resource)
    case 'reflection-sequence':
      return loadReflectionSequenceSection(basePath, resource)
    case 'reflection-template':
      return loadReflectionTemplateSection(basePath, resource)
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
    fetchYaml<Record<string, { title: string; desc: string; type: string; collapsedTo?: string; stateMachine?: any }>>(`${basePath}/systems.yaml`),
    fetchYaml<OKFStepRaw[]>(`${basePath}/steps.yaml`),
    fetchYaml<OKFJourneyRaw[]>(`${basePath}/journeys.yaml`),
  ])
  const flow = mapFlow(actorsRaw, systemsRaw, stepsRaw, journeysRaw)
  return { type: 'flowchart', flow }
}

async function loadTradeoffSection(basePath: string, resourceFiles: string[]): Promise<OKFTradeoffSectionData> {
  const scenarioFiles = resourceFiles.filter((f) => !f.endsWith('section.yaml'))
  const promises = scenarioFiles.map((f) =>
    fetchYaml<any>(`${basePath}/${f}`)
  )
  const raw = await Promise.all(promises)
  const scenariosArr = Array.isArray(raw[0]) ? raw[0] : (raw[0]?.scenarios ?? raw)
  const scenarios = (scenariosArr as OKFTradeoffScenarioRaw[]).map(mapTradeoffScenario)
  return { type: 'tradeoff-sandbox', scenarios }
}

async function loadTaxonomySection(basePath: string, resourceFiles: string[]): Promise<OKFTaxonomySectionData> {
  const categoryFiles = resourceFiles.filter((f) => !f.endsWith('section.yaml'))
  const promises = categoryFiles.map((f) =>
    fetchYaml<any>(`${basePath}/${f}`)
  )
  const raw = await Promise.all(promises)
  const categoriesArr = Array.isArray(raw[0]) ? raw[0] : (raw[0]?.categories ?? raw)
  const categories = (categoriesArr as OKFTaxonomyRaw[]).map(mapTaxonomyCategory)
  return { type: 'taxonomy-browser', categories }
}

async function loadFlashcardSection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFFlashcardSectionData> {
  const glossaryFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'glossary.yaml')
  if (glossaryFile) {
    const raw = await fetchYaml<any>(`${basePath}/${glossaryFile}`)
    const termsArr = Array.isArray(raw) ? raw : (raw.terms ?? [])
    const terms = (termsArr as OKFGlossaryRaw[]).map(mapGlossaryTerm)
    return { type: 'flashcards', terms }
  }
  return { type: 'flashcards', terms: [] }
}

async function loadQuizSection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFQuizSectionData> {
  const questionsFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'questions.yaml')
  if (questionsFile) {
    const raw = await fetchYaml<any>(`${basePath}/${questionsFile}`)
    const questionsArr = Array.isArray(raw) ? raw : (raw.questions ?? [])
    const questions = (questionsArr as OKFQuizQuestionRaw[]).map(mapQuizQuestion)
    return { type: 'quiz', questions }
  }
  return { type: 'quiz', questions: [] }
}

async function loadConceptMapSection(basePath: string, resource: string): Promise<OKFConceptMapSectionData> {
  const conceptsFile = resource !== '.' ? resource : 'concepts.yaml'
  const raw = await fetchYaml<any>(`${basePath}/${conceptsFile}`)
  const unwrapped = raw.nodes && raw.edges && !Array.isArray(raw.nodes) ? raw : { nodes: raw.nodes ?? {}, edges: raw.edges ?? [] }
  const { nodes, edges } = mapConceptMap(unwrapped as OKFConceptMapRaw)
  return { type: 'concept-map', nodes, edges }
}

async function loadScenarioSection(basePath: string, resource: string): Promise<OKFScenarioSectionData> {
  const scenariosFile = resource !== '.' ? resource : 'scenarios.yaml'
  const raw = await fetchYaml<any>(`${basePath}/${scenariosFile}`)
  const unwrapped = raw.nodes && raw.id ? raw : { id: raw.id, title: raw.title, intro: raw.intro, nodes: raw.nodes }
  return mapScenario(unwrapped as OKFScenarioRaw)
}

async function loadImageGallerySection(basePath: string, resource: string, resourceFiles: string[]): Promise<OKFImageGallerySectionData> {
  const galleryFile = resource !== '.' ? resource : resourceFiles.find((f) => f === 'gallery.yaml')
  if (galleryFile) {
    const raw = await fetchYaml<any>(`${basePath}/${galleryFile}`)
    const itemsArr = Array.isArray(raw) ? raw : (raw.items ?? [])
    return { type: 'image-gallery', items: itemsArr as OKFGalleryItem[] }
  }
  return { type: 'image-gallery', items: [] }
}

// --- Flow mapping ---

function mapFlow(
  actorsRaw: Record<string, { title: string; desc: string }>,
  systemsRaw: Record<string, { title: string; desc: string; type: string; collapsedTo?: string; stateMachine?: any }>,
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
      ...(s.collapsedTo ? { collapsedTo: s.collapsedTo } : {}),
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
      ...(raw.description ? { description: raw.description } : {}),
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
  return {
    icon: raw.icon,
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
  const raw = await fetchYaml<any>(`${basePath}/${treeFile}`)
  const unwrapped = raw.nodes && raw.id && raw.root ? raw : { id: raw.id, title: raw.title, root: raw.root, nodes: raw.nodes }
  return mapDecisionTree(unwrapped as OKFDecisionTreeRaw)
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

async function loadFormulaSandboxSection(basePath: string, resource: string): Promise<OKFFormulaSandboxSectionData> {
  const file = resource !== '.' ? resource : 'sandbox.yaml'
  const raw = await fetchYaml<any>(`${basePath}/${file}`)
  const unwrapped = raw.variables && raw.metrics ? raw : { variables: raw.variables ?? [], metrics: raw.metrics ?? [] }
  return {
    type: 'formula-sandbox',
    variables: (unwrapped as OKFFormulaSandboxRaw).variables,
    metrics: (unwrapped as OKFFormulaSandboxRaw).metrics,
  }
}

async function loadReflectionSequenceSection(basePath: string, resource: string): Promise<OKFReflectionSequenceSectionData> {
  const file = resource !== '.' ? resource : 'sequence.yaml'
  const raw = await fetchYaml<any>(`${basePath}/${file}`)

  let challenges: OKFReflectionSequenceChallenge[] = []
  if (raw.challenges && Array.isArray(raw.challenges)) {
    challenges = raw.challenges
  } else if (raw.prompt && raw.items && raw.solution) {
    challenges = [
      {
        prompt: raw.prompt,
        items: raw.items,
        solution: raw.solution,
      }
    ]
  }

  return {
    type: 'reflection-sequence',
    challenges,
  }
}

async function loadReflectionTemplateSection(basePath: string, resource: string): Promise<OKFReflectionTemplateSectionData> {
  const file = resource !== '.' ? resource : 'template.yaml'
  const raw = await fetchYaml<any>(`${basePath}/${file}`)

  let challenges: OKFReflectionTemplateChallenge[] = []
  if (raw.challenges && Array.isArray(raw.challenges)) {
    challenges = raw.challenges
  } else if (raw.prompt && raw.template && raw.chips && raw.solution) {
    challenges = [
      {
        prompt: raw.prompt,
        template: raw.template,
        chips: raw.chips,
        solution: raw.solution,
        explanation: raw.explanation,
      }
    ]
  }

  return {
    type: 'reflection-template',
    challenges,
  }
}

async function loadIntroSection(basePath: string, resource: string): Promise<OKFIntroSectionData> {
  const file = resource && resource !== '.' ? resource : 'content.yaml'
  try {
    const raw = await fetchYaml<any>(`${basePath}/${file}`)
    return {
      type: 'intro',
      title: raw.title,
      subtitle: raw.subtitle,
      estimatedTime: raw.estimatedTime,
      moduleCount: raw.moduleCount,
      what: raw.what ?? { summary: '' },
      why: raw.why ?? { summary: '' },
      roadmap: raw.roadmap ?? [],
    }
  } catch (e) {
    return {
      type: 'intro',
      what: { summary: '' },
      why: { summary: '' },
      roadmap: [],
    }
  }
}

// --- Delivery Port Integration ---
// Storage adapter singleton for use by delivery layer (Phase 3.2)
// Imported at end of file to avoid circular dependency with adapter's import of loadOKFBundle

import { InRepoStorageAdapter } from '../delivery/adapters/in-repo-storage'

/**
 * Singleton storage adapter instance conforming to OKFStoragePort.
 * Used by the delivery layer for section read/write operations.
 * The adapter delegates readSection to loadOKFBundle (cached) to avoid
 * duplicating multi-file resource resolution logic.
 */
export const inRepoStorage = new InRepoStorageAdapter()

