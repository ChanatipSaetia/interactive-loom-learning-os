#!/usr/bin/env tsx
// ============================================================================
// okf:new — Scaffold an OKF topic from its brief
// ============================================================================
// The topic brief (public/okf/<topicId>/brief.yaml) is the design record;
// this command builds the topic's files from it:
//   public/okf/<topicId>/index.md          (topic landing page, one heading per track)
//   public/okf/<topicId>/index.yaml        (category + tags — re-synced from the brief)
//   public/okf/<topicId>/sections/<n>/...  (one stub folder per brief section + intro)
//   public/okf/index.md                    (root registration)
//   public/hexmaps/<topicId>.yaml          (capital hub + one chain per track + boss)
//
//   npm run okf:new -- --from public/okf/<topicId>/brief.yaml
//   npm run okf:new -- <topicId> --category … --sections …   (writes a starter brief first)
//
// Re-running is additive: it creates only what is missing and never overwrites
// section content or hand-edited hex nodes. Every generated file is run through
// the Validation Gateway before anything touches disk — nothing is written
// unless validation is clean.
// ============================================================================

// @ts-expect-error — Node built-in; the browser tsconfig carries no Node types
import fs from 'fs'
// @ts-expect-error — Node built-in; the browser tsconfig carries no Node types
import path from 'path'
// @ts-expect-error — Node built-in; the browser tsconfig carries no Node types
import { fileURLToPath } from 'url'
import * as yaml from 'js-yaml'
import {
  KNOWN_SECTION_TYPES,
  validateHexCampaign,
  validateSectionFiles,
} from '../src/core/learning-engine/validation/gateway.ts'
import {
  BRIEF_FILE,
  INTRO_SECTION,
  GROUNDED_SECTION_TYPES,
  briefSectionNames,
  findBriefSection,
  prerequisiteTeachIds,
  rootIndexHeadingOf,
  validateTopicBrief,
  type TopicBrief,
} from '../src/core/learning-engine/validation/topic-brief.ts'
import type { ValidationDiagnostic } from '../src/core/learning-engine/validation/types.ts'

declare const process: { argv: string[]; exit(code?: number): never }

// --- Types ---

/** What a section stub template needs to know. */
export interface StubContext {
  topicId: string
  /** Topic title. */
  title: string
  tags: string[]
  /** Teach id the stub's assessment items are grounded in (quiz / reflection-sequence). */
  groundedIn?: string
  /** Intro roadmap entries (intro only). */
  roadmap?: { sectionId: string; title: string; type: string; description: string }[]
}

/** Read-only view of the repository the scaffold plans against. Paths are repo-root-relative. */
export interface RepoView {
  read(relPath: string): string | undefined
}

export interface TopicPlan {
  /** Files to write (created or updated), repo-root-relative path → content. */
  files: Map<string, string>
  /** Existing files left untouched. */
  kept: string[]
  /** Validation Gateway diagnostics for everything the plan writes (empty = clean). */
  diagnostics: ValidationDiagnostic[]
}

// --- Constants ---

export const TOPIC_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Section type → hex campaign node type (docs/creating-hexmaps.md §4). */
export const HEX_NODE_TYPE_BY_SECTION: Record<string, string> = {
  'intro': 'capital',
  'text': 'reading_sanctuary',
  'reflection-template': 'reading_sanctuary',
  'taxonomy-browser': 'archive_spire',
  'bullets': 'archive_spire',
  'pillar-layer': 'archive_spire',
  'decision-tree': 'archive_spire',
  'flowchart': 'simulation_nexus',
  'scenario': 'simulation_nexus',
  'concept-map': 'concept_monolith',
  'flashcards': 'concept_monolith',
  'image-gallery': 'observatory_gallery',
  'quiz': 'quiz_encounter',
  'reflection-sequence': 'reflection_decryption',
  'tradeoff-sandbox': 'tradeoff_workshop',
  'formula-sandbox': 'tradeoff_workshop',
}

const HEX_NODE_TITLES: Record<string, string> = {
  capital: 'Origin Citadel',
  reading_sanctuary: 'Reading Sanctuary',
  archive_spire: 'Archive Spire',
  simulation_nexus: 'Simulation Nexus',
  concept_monolith: 'Concept Monolith',
  observatory_gallery: 'Observatory Gallery',
  quiz_encounter: 'Quiz Encounter',
  reflection_decryption: 'Reflection Decryption',
  tradeoff_workshop: 'Trade-off Workshop',
  boss_lair: 'Boss Lair',
}

const RELIC_ICONS: Record<string, string> = {
  reading_sanctuary: '📖',
  archive_spire: '🗼',
  simulation_nexus: '⚙️',
  concept_monolith: '🗿',
  observatory_gallery: '🖼️',
  quiz_encounter: '⚔️',
  reflection_decryption: '🔮',
  tradeoff_workshop: '🛠️',
}

// --- Helpers ---

export function humanize(sectionOrSlug: string): string {
  return sectionOrSlug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function yamlQuote(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function sectionMd(type: string, title: string, resource: string, blurb: string): string {
  return `---\ntype: ${type}\ntitle: ${yamlQuote(title)}\nresource: ${resource}\n---\n\n${blurb}\n`
}

function roadmapYaml(roadmap: StubContext['roadmap']): string {
  if (!roadmap?.length) return ''
  const lines = ['roadmap:']
  for (const step of roadmap) {
    lines.push(
      `  - sectionId: ${yamlQuote(step.sectionId)}`,
      `    title: ${yamlQuote(step.title)}`,
      `    type: ${yamlQuote(step.type)}`,
      `    description: ${yamlQuote(step.description)}`,
    )
  }
  return `${lines.join('\n')}\n`
}

// --- Section stub builders (filename → content, section.md excluded) ---

type StubBuilder = (opts: StubContext) => Record<string, string>

const SECTION_STUBS: Record<string, StubBuilder> = {
  'intro': (o) => ({
    'content.yaml': `title: ${yamlQuote(o.title)}
subtitle: "A starter intro — replace this framing with your own"
estimatedTime: "10 min"
what:
  definition: "One sentence that defines ${o.title}."
  summary: "What ${o.title} covers and how this topic is organized."
  bullets:
    - "First key idea you will learn"
    - "Second key idea you will learn"
  tags:
    - ${o.tags[0] ?? o.topicId}
why:
  summary: "Why ${o.title} matters in practice."
  impact: "What goes wrong when teams ignore it."
${roadmapYaml(o.roadmap)}`,
  }),

  'text': (o) => ({
    'content.md': `Open with a paragraph that frames ${o.title} for the learner.

Replace these placeholder paragraphs with the real content of this lesson — one idea per paragraph.

Close with the takeaway the learner should remember.
`,
  }),

  'bullets': () => ({
    'items.yaml': `- text: "First key point"
  children:
    - text: "Supporting detail or example"
- text: "Second key point"
- text: "Third key point"
`,
  }),

  'taxonomy-browser': () => ({
    '01-example.yaml': `icon: BookOpen
title: "First Category"
subtitle: "One-line positioning of this category"
description: "What this category groups together and when to reach for it."
details: "Longer explanation shown in the detail pane."
analogy: "A memorable analogy that makes the category stick."
primaryFocus: "The one thing this category optimizes for"
inScope:
  - "Concept that belongs here"
  - "Another concept that belongs here"
outOfScope:
  - "A concept that lives in another category"
color: mauve
`,
  }),

  'image-gallery': (o) => ({
    'gallery.yaml': `- id: first-plate
  url: "https://placehold.co/1200x640/29283e/c6d0f1/png?text=${encodeURIComponent(o.topicId)}"
  caption: "Placeholder plate — replace url with your own diagram or screenshot."
`,
  }),

  'pillar-layer': (o) => ({
    'matrix.yaml': `title: ${yamlQuote(`${o.title} — Layers`)}
layers:
  - id: foundation
    title: "Foundation"
    description: "The base layer of the system."
matrix_blocks:
  - title: "Core Concept"
    description: "A concept that sits on the foundation layer."
    layer_id: foundation
    color: mauve
`,
  }),

  'flowchart': () => ({
    'actors.yaml': `learner:
  title: "Learner"
  desc: "The person exploring this flow."
`,
    'systems.yaml': `workspace:
  title: "Workspace"
  desc: "The system that runs the flow end to end."
  type: aggregate
`,
    'steps.yaml': `- type: linear
  id: start_flow
  initiatedBy: learner
  command: "Start the flow"
  policy: "Whenever the learner begins the walkthrough"
  handledBy: workspace
  resultEvents:
    - id: flow_started
      title: "Flow Started"
      desc: "The workspace accepted the request and begins."
`,
    'journeys.yaml': `- id: main-journey
  label: "Main Journey"
  description: "The end-to-end happy path through this flow."
  steps:
    - stepId: start_flow
      name: "Start the flow"
      description: "The learner starts the flow and the workspace takes over."
`,
  }),

  'scenario': (o) => ({
    'scenarios.yaml': `id: first-scenario
title: ${yamlQuote(`A ${o.title} Decision`)}
intro: "Set the scene here — one or two sentences of context."
nodes:
  start:
    prompt: "What do you do first?"
    choices:
      - id: option-a
        text: "Choose approach A"
        next: result-a
      - id: option-b
        text: "Choose approach B"
        next: result-b
  result-a:
    outcome:
      verdict: "Approach A works well in this situation."
      lesson: "The lesson the learner should take away."
      rating: a
  result-b:
    outcome:
      verdict: "Approach B backfires here."
      lesson: "Why approach B was the wrong call."
      rating: c
`,
  }),

  'tradeoff-sandbox': (o) => ({
    '01-example.yaml': `id: first-tradeoff
title: ${yamlQuote(`Choosing an Approach to ${o.title}`)}
description: "Describe the decision the learner is tuning."
metrics:
  - id: quality
    label: "Quality"
    baseValue: 50
    min: 0
    max: 100
    direction: higher
steps:
  - id: approach
    title: "Pick an approach"
    description: "Every choice moves the quality meter."
    recommended: option-a
    choices:
      - id: option-a
        label: "Option A"
        description: "The pragmatic choice."
        metrics:
          quality: 10
        pros:
          - title: "Simple to reason about"
        cons:
          - title: "Costs more at scale"
        whyThisFits: "When speed of learning matters most."
      - id: option-b
        label: "Option B"
        description: "The ambitious choice."
        metrics:
          quality: -10
        pros:
          - title: "Scales further"
        cons:
          - title: "Harder to get right"
        whyThisFits: "When you have time to invest up front."
`,
  }),

  'formula-sandbox': (o) => ({
    'sandbox.yaml': `variables:
  - id: effort
    label: "Effort (hours)"
    min: 1
    max: 40
    step: 1
    defaultValue: 8
metrics:
  - id: output
    label: "Output"
    formula: "Math.round(effort * 10)"
    description: "How output from ${o.title} grows with effort."
    analogy: "Like filling a bucket — steady, predictable gains."
    inScope:
      - "Steady, sustainable work"
    outOfScope:
      - "Burnout and heroics"
`,
  }),

  'decision-tree': () => ({
    'tree.yaml': `id: first-decision
title: "Which option fits?"
root: start
nodes:
  start:
    prompt: "What matters most right now?"
    choices:
      - id: speed
        text: "Speed of delivery"
        next: leaf-simple
        recommended: true
      - id: scale
        text: "Room to grow later"
        next: leaf-invest
  leaf-simple:
    leaf:
      recommendation: "Pick the simple option"
      explanation: "Explain why speed wins in this branch."
      tradeoffs:
        - "You may pay for simplicity later"
  leaf-invest:
    leaf:
      recommendation: "Pick the scalable option"
      explanation: "Explain why investing early pays off."
      tradeoffs:
        - "Slower to ship today"
`,
  }),

  'reflection-sequence': (o) => ({
    'sequence.yaml': `challenges:
  - prompt: ${yamlQuote(`Put the steps of ${o.title} in the right order.`)}
${o.groundedIn ? `    groundedIn: ${o.groundedIn}\n` : ''}    items:
      - id: step-3
        text: "Third step (shown scrambled)"
      - id: step-1
        text: "First step (shown scrambled)"
      - id: step-2
        text: "Second step (shown scrambled)"
    solution:
      - step-1
      - step-2
      - step-3
`,
  }),

  'reflection-template': (o) => ({
    'template.yaml': `challenges:
  - prompt: "Drop the right words into the blanks."
    template: "The {slot-1} of ${o.title} controls the {slot-2}."
    chips:
      - id: core
        text: "core"
      - id: behavior
        text: "behavior"
      - id: decoy
        text: "decoy"
    solution:
      slot-1: core
      slot-2: behavior
    explanation: "Explain why these placements are correct."
`,
  }),

  'quiz': (o) => ({
    'questions.yaml': `- id: q1
${o.groundedIn ? `  groundedIn: ${o.groundedIn}\n` : ''}  question: ${yamlQuote(`Check understanding of ${o.title} — ground this question in the sections above.`)}
  choices:
    - id: q1-a
      text: "The correct answer"
      correct: true
      explanation: "Why this answer is correct."
    - id: q1-b
      text: "A plausible wrong answer"
      correct: false
      explanation: "Why this answer is wrong."
  hint: "Revisit the section that teaches this."
`,
  }),

  'flashcards': () => ({
    'glossary.yaml': `- id: key-term
  word: "Key Term"
  pronunciation: "/kiː tɜːrm/"
  category: "Core"
  shortDefinition: "One-line definition of the term."
  detailedDefinition: "A longer definition that gives the term its boundaries and context."
  whyItMatters: "Why a practitioner should care about this term."
`,
  }),

  'concept-map': () => ({
    'concepts.yaml': `nodes:
  core-concept:
    title: "Core Concept"
    category: "foundation"
  supporting-concept:
    title: "Supporting Concept"
    category: "detail"
edges:
  - from: core-concept
    to: supporting-concept
    label: "enables"
`,
  }),
}

/** section.md "resource" per type: collection / fixed-file layouts use "."; single-file layouts name the file. */
const SECTION_RESOURCE: Record<string, string> = {
  'intro': 'content.yaml',
  'text': 'content.md',
  'bullets': 'items.yaml',
  'taxonomy-browser': '.',
  'image-gallery': 'gallery.yaml',
  'pillar-layer': 'matrix.yaml',
  'flowchart': '.',
  'scenario': 'scenarios.yaml',
  'tradeoff-sandbox': '.',
  'formula-sandbox': 'sandbox.yaml',
  'decision-tree': 'tree.yaml',
  'reflection-sequence': 'sequence.yaml',
  'reflection-template': 'template.yaml',
  'quiz': 'questions.yaml',
  'flashcards': 'glossary.yaml',
  'concept-map': 'concepts.yaml',
}


/** One section folder's files (section.md + data stubs), keyed by filename. */
export function buildSectionStub(type: string, ctx: StubContext, title = humanize(type)): Record<string, string> {
  const builder = SECTION_STUBS[type]
  if (!builder) throw new Error(`Unknown section type "${type}". Known types: ${[...KNOWN_SECTION_TYPES].join(', ')}`)
  const files: Record<string, string> = { ...builder(ctx) }
  files['section.md'] = sectionMd(type, title, SECTION_RESOURCE[type] ?? '.', `Starter ${humanize(type)} section — replace this stub content.`)
  return files
}

// --- Brief ---

/** Flag form: turn `--sections a,b,c,d` into a starter brief — two tracks, the last section of each is a key item. */
export function briefFromArgs(args: CliArgs): TopicBrief {
  const content = args.sections.filter((s) => s !== INTRO_SECTION)
  const half = Math.ceil(content.length / 2)
  const track = (id: string, title: string, types: string[]) => ({
    id,
    title,
    sections: types.map((type, i) => ({
      name: type,
      type,
      title: humanize(type),
      keyItem: i === types.length - 1,
      teaches: [],
    })),
  })
  return {
    id: args.topicId,
    title: args.title,
    description: args.description,
    category: args.category,
    tags: args.tags,
    boss: {
      title: 'The Failure Mode',
      failureMode: `The central failure mode of ${args.title} — describe it here.`,
    },
    tracks: [track('foundations', 'Foundations', content.slice(0, half)), track('practice', 'Practice', content.slice(half))],
  }
}

export function buildBriefYaml(brief: TopicBrief): string {
  const briefPath = `public/okf/${brief.id}/${BRIEF_FILE}`
  const lines = [
    `# Topic brief — the design record for "${brief.id}". Edit it, then run:`,
    `#   npm run okf:validate -- --topic=${brief.id} --brief`,
    `#   npm run okf:new -- --from ${briefPath}`,
    `# Reference: docs/creating-topics.md ("The topic brief")`,
    `id: ${brief.id}`,
    `title: ${yamlQuote(brief.title)}`,
    `description: ${yamlQuote(brief.description)}`,
    `category: ${yamlQuote(brief.category)}`,
    brief.tags.length ? 'tags:' : 'tags: []',
    ...brief.tags.map((t) => `  - ${yamlQuote(t)}`),
    '',
    '# The central failure mode of the domain — the boss learners defeat at the end.',
    'boss:',
    `  title: ${yamlQuote(brief.boss.title)}`,
    `  failureMode: ${yamlQuote(brief.boss.failureMode)}`,
    '',
    '# 2–4 exploration tracks radiating from the capital, sections in learning order.',
    '# keyItem: true drops a key item the boss requires. teaches: [{ id, point }]',
    '# lists what a section teaches; quizzes and reflection sequences later in the',
    '# same track reference those ids with groundedIn.',
    'tracks:',
  ]
  for (const track of brief.tracks) {
    lines.push(`  - id: ${track.id}`, `    title: ${yamlQuote(track.title)}`, '    sections:')
    for (const section of track.sections) {
      lines.push(
        `      - name: ${section.name}`,
        `        type: ${section.type}`,
        `        title: ${yamlQuote(section.title)}`,
        `        keyItem: ${section.keyItem}`,
      )
      if (section.teaches.length === 0) {
        lines.push('        teaches: []')
      } else {
        lines.push('        teaches:')
        for (const teach of section.teaches) {
          lines.push(`          - id: ${teach.id}`, `            point: ${yamlQuote(teach.point)}`)
        }
      }
    }
  }
  return `${lines.join('\n')}\n`
}

function sectionDescription(section: TopicBrief['tracks'][number]['sections'][number]): string {
  return section.teaches[0]?.point ?? `Starter ${section.type} section.`
}

// --- Topic-level files ---

function topicLink(title: string, name: string, description: string): string {
  return `* [${title}](sections/${name}/section.md) — ${description}`
}

export function buildTopicIndexMd(brief: TopicBrief): string {
  const lines = [`# ${brief.title}`, '', brief.description, '', '## Start', topicLink(brief.title, INTRO_SECTION, 'topic briefing and roadmap')]
  for (const track of brief.tracks) {
    lines.push('', `## ${track.title}`)
    for (const section of track.sections) lines.push(topicLink(section.title, section.name, sectionDescription(section)))
  }
  return `${lines.join('\n')}\n`
}

/** Append links for sections the existing topic index.md does not list yet. */
export function appendMissingTopicLinks(existing: string, brief: TopicBrief): string | undefined {
  const missing = brief.tracks
    .flatMap((t) => t.sections)
    .filter((s) => !existing.includes(`(sections/${s.name}/section.md)`))
  if (missing.length === 0) return undefined
  const links = missing.map((s) => topicLink(s.title, s.name, sectionDescription(s)))
  return `${existing.replace(/\s+$/, '')}\n${links.join('\n')}\n`
}

export function buildTopicIndexYaml(brief: TopicBrief): string {
  const tags = brief.tags.length ? brief.tags : [brief.id]
  return `# App metadata for ${brief.id} topic bundle — generated from ${BRIEF_FILE} by okf:new\ncategory: ${brief.category}\ntags:\n${tags.map((t) => `  - ${t}`).join('\n')}\n`
}

// --- Root index registration ---

/** Insert a topic entry under `## <category>` in the root index.md, creating the heading if missing. */
export function registerTopicInRootIndex(rootContent: string, category: string, entry: string): string {
  const lines = rootContent.replace(/\s+$/, '').split('\n')
  const wanted = `## ${category}`.trim().toLowerCase()
  const headingIdx = lines.findIndex((l) => l.trim().toLowerCase() === wanted)

  if (headingIdx === -1) {
    return `${lines.join('\n')}\n\n${`## ${category}`}\n${entry}\n`
  }

  let end = headingIdx + 1
  while (end < lines.length && !lines[end].startsWith('## ')) end++
  let insert = end
  while (insert > headingIdx + 1 && lines[insert - 1].trim() === '') insert--
  lines.splice(insert, 0, entry)
  return `${lines.join('\n')}\n`
}

// --- Hex map ---

const relicId = (section: string) => `${section}-relic`

function hexNodeYaml(section: TopicBrief['tracks'][number]['sections'][number], trackTitle: string, unlockedBy: string): string {
  const nodeType = HEX_NODE_TYPE_BY_SECTION[section.type]
  const lines = [
    `  - id: ${yamlQuote(section.name)}`,
    `    title: ${yamlQuote(section.title)}`,
    `    type: "${nodeType}"`,
    `    status: "locked"`,
    `    unlockedBy:`,
    `      - ${yamlQuote(unlockedBy)}`,
    `    sectionRef: ${yamlQuote(section.name)}`,
    `    description: ${yamlQuote(`${trackTitle} track — ${section.title}. Replace with your own story.`)}`,
  ]
  if (nodeType === 'quiz_encounter') {
    lines.push(`    monster:`, `      id: ${yamlQuote(`${section.name}-monster`)}`, `      name: "Knowledge Guardian"`, `      type: "goblin"`, `      maxHp: 100`, `      damage: 15`, `      icon: "👾"`)
  }
  if (section.keyItem) {
    lines.push(
      `    rewards:`,
      `      - id: ${yamlQuote(relicId(section.name))}`,
      `        name: ${yamlQuote(`${section.title} Relic`)}`,
      `        icon: "${RELIC_ICONS[nodeType] ?? '✨'}"`,
      `        description: ${yamlQuote(`Proof you mastered ${section.title}.`)}`,
    )
  }
  return lines.join('\n')
}

/** Campaign from the brief: capital hub, one unlock chain per track, boss lair gated by every key item. */
export function buildHexMapYaml(brief: TopicBrief): string {
  const nodes: string[] = []
  nodes.push(`  - id: "capital"
    title: ${yamlQuote(HEX_NODE_TITLES.capital)}
    type: "capital"
    status: "unlocked"
    sectionRef: "${INTRO_SECTION}"
    description: ${yamlQuote(`The starting hub of ${brief.title}. Replace this framing with your own.`)}`)

  for (const track of brief.tracks) {
    track.sections.forEach((section, i) => {
      nodes.push(hexNodeYaml(section, track.title, i === 0 ? 'capital' : track.sections[i - 1].name))
    })
  }

  const relics = brief.tracks.flatMap((t) => t.sections.filter((s) => s.keyItem).map((s) => relicId(s.name)))
  const boss = [
    `  - id: "boss-lair"`,
    `    title: ${yamlQuote(HEX_NODE_TITLES.boss_lair)}`,
    `    type: "boss_lair"`,
    `    status: "locked"`,
    `    unlockedBy:`,
    ...brief.tracks.map((t) => `      - ${yamlQuote(t.sections[t.sections.length - 1].name)}`),
    `    description: ${yamlQuote(brief.boss.failureMode)}`,
  ]
  if (relics.length > 0) boss.push(`    requiredItems:`, ...relics.map((r) => `      - ${yamlQuote(r)}`))
  boss.push(
    `    monster:`,
    `      id: "failure-mode"`,
    `      name: ${yamlQuote(brief.boss.title)}`,
    `      type: "boss"`,
    `      maxHp: 200`,
    `      damage: 35`,
    `      icon: "🐲"`,
  )
  nodes.push(boss.join('\n'))

  return `topicId: ${yamlQuote(brief.id)}
topicTitle: ${yamlQuote(brief.title)}
capitalId: "capital"

nodes:
${nodes.join('\n\n')}
`
}

/**
 * Additive re-run: append nodes for brief sections the existing map does not
 * reference, at the tip of their track, and add new key items to the boss.
 * Existing nodes are never moved or rewritten.
 */
export function appendToHexMap(existing: string, brief: TopicBrief, file: string): { content?: string; diagnostics: ValidationDiagnostic[] } {
  const fail = (message: string, fixHint: string) => ({ diagnostics: [{ tier: 3 as const, file, message, fixHint }] })

  type LooseNode = { id?: string; type?: string; sectionRef?: string }
  let parsed: { capitalId?: string; nodes?: LooseNode[] } | undefined
  try {
    parsed = yaml.load(existing) as typeof parsed
  } catch {
    return fail('Existing hex map has invalid YAML, so new nodes cannot be added.', `Fix ${file} first, then re-run okf:new.`)
  }
  const nodes: LooseNode[] = Array.isArray(parsed?.nodes) ? parsed.nodes : []
  const nodeIdBySection = new Map<string, string>()
  for (const node of nodes) if (node?.sectionRef && node.id) nodeIdBySection.set(node.sectionRef, node.id)
  const nodeIds = new Set(nodes.map((n) => n?.id))
  const capitalId: string = parsed?.capitalId ?? 'capital'

  const missing = briefSectionNames(brief).filter((name) => name !== INTRO_SECTION && !nodeIdBySection.has(name))
  if (missing.length === 0) return { diagnostics: [] }

  const topLevelKeys = existing.split('\n').filter((l) => /^[A-Za-z_][\w-]*:/.test(l))
  if (!topLevelKeys.length || !topLevelKeys[topLevelKeys.length - 1].startsWith('nodes:')) {
    return fail('`nodes:` must be the last top-level key of the hex map for okf:new to append nodes.', `Move \`nodes:\` to the end of ${file}, or add nodes for [${missing.join(', ')}] by hand.`)
  }

  const blocks: string[] = []
  const newRelics: string[] = []
  for (const name of missing) {
    const found = findBriefSection(brief, name)!
    if (nodeIds.has(name)) {
      return fail(`Hex map already has a node with id "${name}" that is not bound to section "${name}".`, `Rename that node or set its sectionRef to "${name}".`)
    }
    const prev = found.index > 0 ? found.track.sections[found.index - 1].name : undefined
    const unlockedBy = prev ? (nodeIdBySection.get(prev) ?? capitalId) : capitalId
    blocks.push(hexNodeYaml(found.section, found.track.title, unlockedBy))
    nodeIdBySection.set(name, name)
    if (found.section.keyItem) newRelics.push(relicId(name))
  }

  let lines = existing.replace(/\s+$/, '').split('\n')
  if (newRelics.length > 0) {
    const boss = nodes.find((n) => n?.type === 'boss_lair')
    const inserted = boss ? insertBossRelics(lines, String(boss.id), newRelics) : undefined
    if (!inserted) {
      return fail(`Could not add key items [${newRelics.join(', ')}] to the boss lair's requiredItems.`, `Add them to the boss node's requiredItems in ${file} by hand, then re-run okf:new.`)
    }
    lines = inserted
  }

  return { content: `${lines.join('\n')}\n\n${blocks.join('\n\n')}\n`, diagnostics: [] }
}

function insertBossRelics(lines: string[], bossId: string, relics: string[]): string[] | undefined {
  const escaped = bossId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const idLine = lines.findIndex((l) => new RegExp(`^\\s*-\\s+id:\\s*["']?${escaped}["']?\\s*$`).test(l))
  if (idLine === -1) return undefined
  const dashIndent = lines[idLine].indexOf('-')
  const propIndent = ' '.repeat(dashIndent + 2)

  let end = idLine + 1
  while (end < lines.length && !(lines[end].trim().startsWith('- ') && lines[end].indexOf('-') === dashIndent)) end++

  const out = [...lines]
  const reqLine = out.findIndex((l, i) => i > idLine && i < end && l === `${propIndent}requiredItems:`)
  if (reqLine === -1) {
    if (out.slice(idLine + 1, end).some((l) => l.startsWith(`${propIndent}requiredItems:`))) return undefined // inline list
    out.splice(idLine + 1, 0, `${propIndent}requiredItems:`, ...relics.map((r) => `${propIndent}  - ${yamlQuote(r)}`))
    return out
  }
  let last = reqLine
  while (last + 1 < end && /^\s*- /.test(out[last + 1]) && out[last + 1].indexOf('-') > propIndent.length - 1) last++
  const itemIndent = last > reqLine ? ' '.repeat(out[last].indexOf('-')) : `${propIndent}  `
  out.splice(last + 1, 0, ...relics.map((r) => `${itemIndent}- ${yamlQuote(r)}`))
  return out
}

// --- Plan: brief + repo → files to write ---

/**
 * Plan every file the brief implies, against what already exists. Additive:
 * existing sections, topic index.md entries, root registration and hex nodes
 * are kept; only index.yaml is re-synced from the brief. Nothing touches disk.
 */
export function planTopic(brief: TopicBrief, repo: RepoView): TopicPlan {
  const files = new Map<string, string>()
  const kept: string[] = []
  const diagnostics: ValidationDiagnostic[] = []
  const topicDir = `public/okf/${brief.id}`

  // Section folders.
  const roadmap = brief.tracks.flatMap((t) =>
    t.sections.map((s) => ({ sectionId: s.name, title: s.title, type: s.type, description: sectionDescription(s) })),
  )
  for (const name of briefSectionNames(brief)) {
    const folder = `${topicDir}/sections/${name}`
    if (repo.read(`${folder}/section.md`) !== undefined) {
      kept.push(`${folder}/`)
      continue
    }
    const section = findBriefSection(brief, name)?.section
    const type = section?.type ?? INTRO_SECTION
    const ctx: StubContext = {
      topicId: brief.id,
      title: brief.title,
      tags: brief.tags,
      groundedIn: GROUNDED_SECTION_TYPES.has(type) ? prerequisiteTeachIds(brief, name)[0] : undefined,
      roadmap: type === INTRO_SECTION ? roadmap : undefined,
    }
    const stub = buildSectionStub(type, ctx, section?.title ?? brief.title)
    for (const [file, content] of Object.entries(stub)) files.set(`${folder}/${file}`, content)
    diagnostics.push(...validateSectionFiles(stub, { file: folder, topicId: brief.id, sectionName: name }).diagnostics)
  }

  // index.yaml is generated — always re-synced from the brief.
  const indexYamlPath = `${topicDir}/index.yaml`
  const indexYaml = buildTopicIndexYaml(brief)
  if (repo.read(indexYamlPath) !== indexYaml) files.set(indexYamlPath, indexYaml)
  else kept.push(indexYamlPath)

  // Topic index.md: create, or append links for new sections.
  const indexMdPath = `${topicDir}/index.md`
  const existingIndexMd = repo.read(indexMdPath)
  if (existingIndexMd === undefined) files.set(indexMdPath, buildTopicIndexMd(brief))
  else {
    const updated = appendMissingTopicLinks(existingIndexMd, brief)
    if (updated) files.set(indexMdPath, updated)
    else kept.push(indexMdPath)
  }

  // Root registration.
  const rootPath = 'public/okf/index.md'
  const root = repo.read(rootPath) ?? ''
  if (rootIndexHeadingOf(root, brief.id) === undefined) {
    files.set(rootPath, registerTopicInRootIndex(root, brief.category, `* [${brief.title}](${brief.id}/index.md) — ${brief.description}`))
  } else {
    kept.push(rootPath)
  }

  // Hex map: generate, or append nodes for new sections.
  const hexPath = `public/hexmaps/${brief.id}.yaml`
  const existingHex = repo.read(hexPath)
  const hex = existingHex === undefined ? { content: buildHexMapYaml(brief), diagnostics: [] } : appendToHexMap(existingHex, brief, hexPath)
  diagnostics.push(...hex.diagnostics)
  if (hex.content !== undefined) {
    files.set(hexPath, hex.content)
    const result = validateHexCampaign(hex.content, briefSectionNames(brief))
    diagnostics.push(...result.diagnostics.map((d) => ({ ...d, file: d.file ?? hexPath })))
  } else if (hex.diagnostics.length === 0) {
    kept.push(hexPath)
  }

  return { files, kept, diagnostics }
}

// --- CLI ---

export const USAGE = `Usage:
  npm run okf:new -- --from public/okf/<topic-slug>/brief.yaml
  npm run okf:new -- <topic-slug> --category <Category> --sections <type1,type2,...> [options]

--from scaffolds everything the brief declares that does not exist yet (safe to re-run).
The flag form writes a starter brief (two tracks) for a NEW topic, then scaffolds from it.

Options (flag form):
  --category <name>      Home-page category heading (default: "General")
  --sections <list>      Comma-separated section types, at least 2 (intro is always added for the capital hub)
  --title <text>         Display title (default: humanized topic slug)
  --description <text>   One-line description (default: generated)
  --tags <list>          Comma-separated tags (default: [<topic-slug>])

Known section types: ${[...KNOWN_SECTION_TYPES].join(', ')}`

export interface CliArgs {
  topicId: string
  category: string
  sections: string[]
  title: string
  description: string
  tags: string[]
}

function parseFlags(argv: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {}
  const positional: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1)
      } else {
        flags[arg.slice(2)] = argv[++i] ?? ''
      }
    } else {
      positional.push(arg)
    }
  }
  return { flags, positional }
}

/** `--from <path>` when given, otherwise undefined. */
export function parseFromArg(argv: string[]): string | undefined {
  const { flags } = parseFlags(argv)
  if (!('from' in flags)) return undefined
  if (!flags.from) throw new Error(`--from needs a path to a brief.yaml.\n\n${USAGE}`)
  return flags.from
}

export function parseArgs(argv: string[]): CliArgs {
  const { flags, positional } = parseFlags(argv)

  if (positional.length !== 1) {
    throw new Error(`Exactly one <topic-slug> is required.\n\n${USAGE}`)
  }
  const topicId = positional[0]
  if (!TOPIC_ID_RE.test(topicId)) {
    throw new Error(`Invalid topic slug "${topicId}" — use lowercase letters, digits, and dashes (e.g. my-topic).`)
  }
  if (!flags.sections) {
    throw new Error(`--sections is required.\n\n${USAGE}`)
  }

  const sections: string[] = []
  for (const raw of flags.sections.split(',')) {
    const type = raw.trim()
    if (!type) continue
    if (!KNOWN_SECTION_TYPES.has(type)) {
      throw new Error(`Unknown section type "${type}".\n\n${USAGE}`)
    }
    if (sections.includes(type)) {
      throw new Error(`Duplicate section type "${type}" — the flag form names folders after types; write a brief to use a type twice.`)
    }
    sections.push(type)
  }
  if (sections.filter((s) => s !== INTRO_SECTION).length < 2) {
    throw new Error(`--sections needs at least 2 section types besides intro — a topic has 2–4 tracks.\n\n${USAGE}`)
  }
  if (!sections.includes(INTRO_SECTION)) sections.unshift(INTRO_SECTION)

  const category = flags.category?.trim() || 'General'
  return {
    topicId,
    category,
    sections,
    title: flags.title?.trim() || humanize(topicId),
    description: flags.description?.trim() || `Learn ${humanize(topicId)} with interactive OKF sections.`,
    tags: (flags.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
  }
}

function printDiagnostics(diagnostics: ValidationDiagnostic[]): void {
  for (const d of diagnostics) {
    const where = [d.file, d.field].filter(Boolean).join(' ')
    console.error(`  [Tier ${d.tier}]${where ? ` ${where}:` : ''} ${d.message}${d.fixHint ? `\n    fix: ${d.fixHint}` : ''}`)
  }
}

function main(): void {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const root = path.join(__dirname, '..')
  const repo: RepoView = {
    read: (relPath) => {
      const abs = path.join(root, relPath)
      return fs.existsSync(abs) ? String(fs.readFileSync(abs, 'utf8')) : undefined
    },
  }
  const argv = process.argv.slice(2)

  let brief: TopicBrief
  try {
    const from = parseFromArg(argv)
    if (from === undefined) {
      writeStarterBrief(parseArgs(argv), root, repo)
      return
    }
    const rel = path.relative(root, path.resolve(root, from)).split(path.sep).join('/')
    const raw = repo.read(rel)
    if (raw === undefined) throw new Error(`Brief not found: ${rel}`)
    const result = validateTopicBrief(raw, rel)
    if (!result.payload || result.diagnostics.length > 0) {
      console.error(`Brief ${rel} is invalid — nothing was written:`)
      printDiagnostics(result.diagnostics)
      process.exit(1)
      return
    }
    brief = result.payload
    const expected = `public/okf/${brief.id}/${BRIEF_FILE}`
    if (rel !== expected) throw new Error(`The brief for "${brief.id}" must live at ${expected} (got ${rel}).`)
  } catch (e) {
    console.error(String((e as Error).message ?? e))
    process.exit(1)
    return
  }

  const plan = planTopic(brief, repo)
  if (plan.diagnostics.length > 0) {
    console.error(`Scaffold for "${brief.id}" failed validation — nothing was written:`)
    printDiagnostics(plan.diagnostics)
    process.exit(1)
    return
  }

  for (const [relPath, content] of plan.files) {
    const abs = path.join(root, relPath)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, 'utf8')
  }

  if (plan.files.size === 0) {
    console.log(`Topic "${brief.id}" already matches its brief — nothing to scaffold.`)
  } else {
    console.log(`Scaffolded topic "${brief.id}" from its brief (validated clean):`)
    for (const relPath of plan.files.keys()) console.log(`  + ${relPath}`)
    if (plan.kept.length) console.log(`Kept ${plan.kept.length} existing file(s)/folder(s) untouched.`)
  }
  console.log(`\nNext steps:`)
  console.log(`  1. Replace the stub content in public/okf/${brief.id}/sections/ — add groundedIn to quiz / reflection-sequence items`)
  console.log(`  2. Rewrite the hex map story in public/hexmaps/${brief.id}.yaml`)
  console.log(`  3. Verify with: npm run okf:validate -- --topic=${brief.id}`)
}

/** Flag form: write only a starter brief — scaffolding waits until the brief is reviewed. */
function writeStarterBrief(args: CliArgs, root: string, repo: RepoView): void {
  const briefPath = `public/okf/${args.topicId}/${BRIEF_FILE}`
  if (repo.read(briefPath) !== undefined) {
    throw new Error(`${briefPath} already exists. Edit it and run: npm run okf:new -- --from ${briefPath}`)
  }
  if (repo.read(`public/okf/${args.topicId}/index.md`) !== undefined || repo.read(`public/hexmaps/${args.topicId}.yaml`) !== undefined) {
    throw new Error(`Topic "${args.topicId}" already exists. Refusing to overwrite.`)
  }

  const content = buildBriefYaml(briefFromArgs(args))
  const result = validateTopicBrief(content, briefPath)
  if (result.diagnostics.length > 0) {
    console.error(`Starter brief for "${args.topicId}" is invalid — nothing was written:`)
    printDiagnostics(result.diagnostics)
    process.exit(1)
    return
  }

  const abs = path.join(root, briefPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, 'utf8')
  console.log(`Wrote starter brief ${briefPath}.`)
  console.log(`\nNext steps:`)
  console.log(`  1. Design the topic in the brief: tracks, section names/titles, keyItem milestones, boss, teaches`)
  console.log(`  2. Check it:  npm run okf:validate -- --topic=${args.topicId} --brief`)
  console.log(`  3. Review it (AI agents: stop here and ask the user to approve the brief)`)
  console.log(`  4. Scaffold:  npm run okf:new -- --from ${briefPath}`)
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) main()
