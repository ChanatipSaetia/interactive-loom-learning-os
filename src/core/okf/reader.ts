import * as yaml from 'js-yaml'
import * as Icons from 'lucide-react'
import type { ComponentType } from 'react'
import type { AbstractFlow, ActorDecl, SystemDecl, FlowJourney } from '../../sections/flowchart/abstract-flow/types'
import { ref } from '../../sections/flowchart/abstract-flow/types'
import type { TradeoffScenario } from '../../sections/tradeoff-sandbox'
import type { TaxonomyCategory } from '../../sections/taxonomy-browser'
import type { BulletItem } from '../../sections/bullets'
import type { WordTerm } from '../../types'
import type {
  OKFBundled,
  OKFBundledMeta,
  OKFContent,
  OKFSectionRaw,
  OKFStepRaw,
  OKFJourneyRaw,
  OKFTradeoffScenarioRaw,
  OKFTaxonomyRaw,
  OKFGlossaryRaw,
} from './types'

const OKF_BASE = '/okf'

function parseYaml<T>(text: string): T {
  return yaml.load(text) as T
}

function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: content }
  return { meta: parseYaml(match[1]), body: match[2] }
}

async function fetchYaml(path: string): Promise<unknown> {
  const res = await fetch(`${OKF_BASE}/${path}`)
  if (!res.ok) throw new Error(`OKF fetch failed: ${path} (${res.status})`)
  return parseYaml(await res.text())
}

async function fetchMarkdown(path: string): Promise<{ meta: Record<string, unknown>; body: string }> {
  const res = await fetch(`${OKF_BASE}/${path}`)
  if (!res.ok) throw new Error(`OKF fetch failed: ${path} (${res.status})`)
  return parseFrontmatter(await res.text())
}

// --- Bundle loading ---

function discoverFilesFromManifest(related: string[], subdir: string): string[] {
  const basename = subdir.split('/').pop()!
  return related
    .filter((r) => r.startsWith(basename + '/') && r.endsWith('.yaml'))
    .map((r) => r.split('/').pop()!)
}

export async function loadOKFBundle(topicId: string): Promise<OKFBundled> {
  const metaRes = await fetchMarkdown(`${topicId}/okf.md`)
  const related = (metaRes.meta.related as string[]) ?? []

  const tradeoffFiles = discoverFilesFromManifest(related, `${topicId}/tradeoffs`)
  const taxonomyFiles = discoverFilesFromManifest(related, `${topicId}/taxonomies`)

  const [actorsRaw, systemsRaw, stepsRaw, journeysRaw, glossaryRaw, contentRes] = await Promise.all([
    fetchYaml(`${topicId}/flows/actors.yaml`) as Promise<Record<string, { title: string; desc: string }>>,
    fetchYaml(`${topicId}/flows/systems.yaml`) as Promise<Record<string, { title: string; desc: string; type: string; stateMachine?: any }>>,
    fetchYaml(`${topicId}/flows/steps.yaml`) as Promise<OKFStepRaw[]>,
    fetchYaml(`${topicId}/flows/journeys.yaml`) as Promise<OKFJourneyRaw[]>,
    fetchYaml(`${topicId}/glossary.yaml`) as Promise<OKFGlossaryRaw[]>,
    fetchMarkdown(`${topicId}/content.md`),
  ])

  const tradeoffPromises = tradeoffFiles.map((f) =>
    fetchYaml(`${topicId}/tradeoffs/${f}`) as Promise<OKFTradeoffScenarioRaw>
  )
  const taxonomyPromises = taxonomyFiles.map((f) =>
    fetchYaml(`${topicId}/taxonomies/${f}`) as Promise<OKFTaxonomyRaw>
  )

  const [tradeoffsRaw, taxonomyRaw] = await Promise.all([
    Promise.all(tradeoffPromises),
    Promise.all(taxonomyPromises),
  ])

  const meta: OKFBundledMeta = {
    type: (metaRes.meta.type as string) ?? 'topic',
    title: (metaRes.meta.title as string) ?? '',
    description: (metaRes.meta.description as string) ?? '',
    tags: (metaRes.meta.tags as string[]) ?? [],
    sections: (metaRes.meta.sections as OKFSectionRaw[]) ?? undefined,
  }

  const content = parseContentMarkdown(contentRes.body)

  return {
    meta,
    flow: mapFlow(actorsRaw, systemsRaw, stepsRaw, journeysRaw),
    tradeoffs: tradeoffsRaw.map(mapTradeoffScenario),
    taxonomy: taxonomyRaw.map(mapTaxonomyCategory),
    glossary: glossaryRaw.map(mapGlossaryTerm),
    content,
  }
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

function mapTradeoffScenario(raw: OKFTradeoffScenarioRaw): TradeoffScenario {
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

function mapTaxonomyCategory(raw: OKFTaxonomyRaw): TaxonomyCategory {
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
    shortDefinition: raw.shortDefinition,
    detailedDefinition: raw.detailedDefinition,
    whyItMatters: raw.whyItMatters,
    dialogue: raw.dialogue,
  }
}

// --- Content parsing ---

function parseContentMarkdown(body: string): OKFContent {
  const paragraphs: string[] = []
  const lifecycleMarkdown: string[] = []
  const capabilityBullets: BulletItem[] = []

  const whatIsMatch = body.match(/## What is an AI Agent\?\s*\n([\s\S]*?)(?=##|$)/)
  if (whatIsMatch) {
    const lines = whatIsMatch[1].trim().split('\n').filter((l) => l.trim())
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('#') && !trimmed.match(/^\d+\./) && !trimmed.startsWith('-')) {
        paragraphs.push(trimmed)
      }
    }
  }

  const lifecycleMatch = body.match(/## Agent Lifecycle\s*\n([\s\S]*?)(?=##|$)/)
  if (lifecycleMatch) {
    lifecycleMarkdown.push('## Agent Lifecycle\n\n' + lifecycleMatch[1].trim())
  }

  const capsMatch = body.match(/## Key Agent Capabilities\s*\n([\s\S]*?)(?=##|$)/)
  if (capsMatch) {
    capabilityBullets.push(...parseBulletList(capsMatch[1].trim()))
  }

  return { paragraphs, lifecycleMarkdown, capabilityBullets }
}

function parseBulletList(text: string): BulletItem[] {
  const items: BulletItem[] = []
  const lines = text.split('\n').filter((l) => l.trim())

  for (const line of lines) {
    const topLevel = line.match(/^(\s*)-\s+(.+)/)
    if (topLevel) {
      const indent = topLevel[1].length
      const text = topLevel[2].trim()
      if (indent === 0) {
        items.push({ text })
      } else if (items.length > 0) {
        const parent = items[items.length - 1]
        if (!parent.children) parent.children = []
        parent.children.push({ text })
      }
    }
  }
  return items
}
