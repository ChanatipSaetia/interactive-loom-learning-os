#!/usr/bin/env tsx
// ============================================================================
// okf:new — Scaffold a new OKF topic
// ============================================================================
// Generates a complete, valid OKF topic in one command:
//   public/okf/<topicId>/index.md          (topic landing page)
//   public/okf/<topicId>/index.yaml        (category + tags)
//   public/okf/<topicId>/sections/<n>/...  (one folder per section type)
//   public/okf/index.md                    (root registration)
//   public/hexmaps/<topicId>.yaml          (capital hub + node per section + boss)
//
// Every generated file is run through the Validation Gateway (3 tiers) before
// anything touches disk — the command writes nothing unless validation is clean.
// ============================================================================

// @ts-expect-error — Node built-in; the browser tsconfig carries no Node types
import fs from 'fs'
// @ts-expect-error — Node built-in; the browser tsconfig carries no Node types
import path from 'path'
// @ts-expect-error — Node built-in; the browser tsconfig carries no Node types
import { fileURLToPath } from 'url'
import {
  KNOWN_SECTION_TYPES,
  validateHexCampaign,
  validateSectionFiles,
} from '../src/core/learning-engine/validation/gateway.ts'
import type { ValidationDiagnostic } from '../src/core/learning-engine/validation/types.ts'

declare const process: { argv: string[]; exit(code?: number): never }

// --- Types ---

export interface ScaffoldOptions {
  topicId: string
  title: string
  description: string
  category: string
  tags: string[]
  sections: string[]
}

export interface GeneratedTopic {
  /** Repo-root-relative file paths mapped to their generated content. */
  files: Map<string, string>
  /** Validation Gateway diagnostics for the generated content (empty = clean). */
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

function sectionMd(type: string, resource: string, blurb: string): string {
  return `---\ntype: ${type}\ntitle: ${yamlQuote(humanize(type))}\nresource: ${resource}\n---\n\n${blurb}\n`
}

// --- Section stub builders (filename → content, section.md excluded) ---

type StubBuilder = (opts: ScaffoldOptions) => Record<string, string>

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
`,
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
    items:
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
  question: ${yamlQuote(`Check understanding of ${o.title} — ground this question in the sections above.`)}
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
export function buildSectionStub(type: string, opts: ScaffoldOptions): Record<string, string> {
  const builder = SECTION_STUBS[type]
  if (!builder) throw new Error(`Unknown section type "${type}". Known types: ${[...KNOWN_SECTION_TYPES].join(', ')}`)
  const files: Record<string, string> = { ...builder(opts) }
  files['section.md'] = sectionMd(type, SECTION_RESOURCE[type] ?? '.', `Starter ${humanize(type)} section — replace this stub content.`)
  return files
}

// --- Topic-level files ---

export function buildTopicIndexMd(opts: ScaffoldOptions): string {
  const lines = [`# ${opts.title}`, '', opts.description, '', '## Modules']
  for (const section of opts.sections) {
    lines.push(`* [${humanize(section)}](sections/${section}/section.md) — starter ${section} section`)
  }
  return `${lines.join('\n')}\n`
}

export function buildTopicIndexYaml(opts: ScaffoldOptions): string {
  const tags = opts.tags.length ? opts.tags : [opts.topicId]
  return `# App metadata for ${opts.topicId} topic bundle\ncategory: ${opts.category}\ntags:\n${tags.map((t) => `  - ${t}`).join('\n')}\n`
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

/** Starter campaign: capital hub, one node per section (free exploration), boss lair gated by all relics. */
export function buildHexMapYaml(opts: ScaffoldOptions): string {
  const contentSections = opts.sections.filter((s) => HEX_NODE_TYPE_BY_SECTION[s] !== 'capital')
  const relicIds = contentSections.map((s) => `${s}-relic`)

  const nodes: string[] = []
  nodes.push(`  - id: "capital"
    title: ${yamlQuote(HEX_NODE_TITLES.capital)}
    type: "capital"
    status: "unlocked"
    sectionRef: "intro"
    description: "The starting hub. Replace this framing with your own for ${opts.title}."`)

  for (const section of contentSections) {
    const nodeType = HEX_NODE_TYPE_BY_SECTION[section]
    const nodeTitle = HEX_NODE_TITLES[nodeType]
    const lines = [
      `  - id: ${yamlQuote(section)}`,
      `    title: ${yamlQuote(nodeTitle)}`,
      `    type: "${nodeType}"`,
      `    status: "locked"`,
      `    unlockedBy:`,
      `      - "capital"`,
      `    sectionRef: ${yamlQuote(section)}`,
      `    description: "Starter ${nodeType.replace(/_/g, ' ')} node for the ${section} section."`,
    ]
    if (nodeType === 'quiz_encounter') {
      lines.push(`    monster:`, `      id: ${yamlQuote(`${section}-monster`)}`, `      name: "Knowledge Guardian"`, `      type: "goblin"`, `      maxHp: 100`, `      damage: 15`, `      icon: "👾"`)
    }
    lines.push(`    rewards:`, `      - id: ${yamlQuote(`${section}-relic`)}`, `        name: ${yamlQuote(`${nodeTitle} Relic`)}`, `        icon: "${RELIC_ICONS[nodeType] ?? '✨'}"`, `        description: "Proof you completed the ${section} section."`)
    nodes.push(lines.join('\n'))
  }

  const boss = [
    `  - id: "boss-lair"`,
    `    title: ${yamlQuote(HEX_NODE_TITLES.boss_lair)}`,
    `    type: "boss_lair"`,
    `    status: "locked"`,
    `    unlockedBy:`,
  ]
  for (const unlocker of contentSections) boss.push(`      - ${yamlQuote(unlocker)}`)
  if (contentSections.length === 0) boss.push(`      - "capital"`)
  boss.push(`    description: "The central failure mode of ${opts.title}. Design the encounter around it."`)
  if (relicIds.length > 0) {
    boss.push(`    requiredItems:`)
    for (const relic of relicIds) boss.push(`      - ${yamlQuote(relic)}`)
  }
  boss.push(`    monster:`)
  boss.push(`      id: "failure-mode"`)
  boss.push(`      name: "The Failure Mode"`)
  boss.push(`      type: "boss"`)
  boss.push(`      maxHp: 200`)
  boss.push(`      damage: 35`)
  boss.push(`      icon: "🐲"`)
  nodes.push(boss.join('\n'))

  return `topicId: ${yamlQuote(opts.topicId)}
topicTitle: ${yamlQuote(opts.title)}
capitalId: "capital"

nodes:
${nodes.join('\n\n')}
`
}

// --- Generation + validation ---

/** Generate every file for the topic and run the Validation Gateway on the result. Nothing touches disk. */
export function generateTopic(opts: ScaffoldOptions, existingRootIndex: string): GeneratedTopic {
  const files = new Map<string, string>()
  const diagnostics: ValidationDiagnostic[] = []
  const topicDir = `public/okf/${opts.topicId}`

  files.set(`${topicDir}/index.md`, buildTopicIndexMd(opts))
  files.set(`${topicDir}/index.yaml`, buildTopicIndexYaml(opts))

  for (const section of opts.sections) {
    const stub = buildSectionStub(section, opts)
    const sectionFiles: Record<string, string> = {}
    for (const [name, content] of Object.entries(stub)) {
      files.set(`${topicDir}/sections/${section}/${name}`, content)
      sectionFiles[name] = content
    }
    const result = validateSectionFiles(sectionFiles, {
      file: `${topicDir}/sections/${section}`,
      topicId: opts.topicId,
      sectionName: section,
    })
    diagnostics.push(...result.diagnostics)
  }

  const hexMap = buildHexMapYaml(opts)
  files.set(`public/hexmaps/${opts.topicId}.yaml`, hexMap)
  const hexResult = validateHexCampaign(hexMap, opts.sections)
  diagnostics.push(...hexResult.diagnostics)

  const entry = `* [${opts.title}](${opts.topicId}/index.md) — ${opts.description}`
  if (existingRootIndex.includes(`(${opts.topicId}/index.md)`)) {
    diagnostics.push({
      tier: 3,
      field: 'rootIndex',
      message: `Topic "${opts.topicId}" is already registered in public/okf/index.md.`,
      fixHint: 'Choose a different topic id or remove the existing entry first.',
    })
  } else {
    files.set('public/okf/index.md', registerTopicInRootIndex(existingRootIndex, opts.category, entry))
  }

  return { files, diagnostics }
}

// --- CLI ---

export const USAGE = `Usage: npm run okf:new -- <topic-slug> --category <Category> --sections <type1,type2,...> [options]

Options:
  --category <name>      Home-page category heading (default: "General")
  --sections <list>      Comma-separated section types (intro is always added for the capital hub)
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

export function parseArgs(argv: string[]): CliArgs {
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
      throw new Error(`Duplicate section type "${type}" — pass each type once; copy the generated folder for more.`)
    }
    sections.push(type)
  }
  if (sections.length === 0) {
    throw new Error(`--sections must list at least one section type.\n\n${USAGE}`)
  }
  if (!sections.includes('intro')) sections.unshift('intro')

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

function main(): void {
  let args: CliArgs
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (e) {
    console.error(String((e as Error).message ?? e))
    process.exit(1)
    return
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const root = path.join(__dirname, '..')
  const topicDir = path.join(root, 'public', 'okf', args.topicId)
  const hexMapPath = path.join(root, 'public', 'hexmaps', `${args.topicId}.yaml`)
  const rootIndexPath = path.join(root, 'public', 'okf', 'index.md')

  if (fs.existsSync(topicDir) || fs.existsSync(hexMapPath)) {
    console.error(`Topic "${args.topicId}" already exists. Refusing to overwrite.`)
    process.exit(1)
    return
  }

  const existingRootIndex = fs.existsSync(rootIndexPath) ? String(fs.readFileSync(rootIndexPath, 'utf8')) : ''
  const { files, diagnostics } = generateTopic(args, existingRootIndex)

  if (diagnostics.length > 0) {
    console.error(`Scaffold for "${args.topicId}" failed validation — nothing was written:`)
    for (const d of diagnostics) {
      console.error(`  [Tier ${d.tier}] ${d.field ? `${d.field}: ` : ''}${d.message}${d.fixHint ? `\n    fix: ${d.fixHint}` : ''}`)
    }
    process.exit(1)
    return
  }

  for (const [relPath, content] of files) {
    const abs = path.join(root, relPath)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, 'utf8')
  }

  console.log(`Scaffolded topic "${args.topicId}" (validated clean):`)
  for (const relPath of files.keys()) console.log(`  ${relPath}`)
  console.log(`\nNext steps:`)
  console.log(`  1. Replace the stub content in public/okf/${args.topicId}/sections/`)
  console.log(`  2. Rewrite the hex map story in public/hexmaps/${args.topicId}.yaml`)
  console.log(`  3. Verify with: npm run okf:validate -- --topic=${args.topicId}`)
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) main()
