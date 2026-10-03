#!/usr/bin/env tsx
/**
 * OKF → OpenUI Lang converter.
 *
 *   npx tsx scripts/okf-to-oui.ts demo mtls     # convert some topics
 *   npx tsx scripts/okf-to-oui.ts --all         # convert every OKF topic
 *   npx tsx scripts/okf-to-oui.ts demo --check  # dry run: convert + validate, write nothing
 *
 * Loads each topic through the existing OKF reader (so the output matches what
 * the app renders today), prints every section with the OpenUI printer,
 * validates it through the OpenUI Validation Gateway, and writes:
 *
 *   public/content/<topic>/topic.oui
 *   public/content/<topic>/sections/<section>.oui
 *
 * The catalog (public/content/index.oui) is generated from the topic folders by
 * the loom-content-catalog Vite plugin, so it is not written here.
 *
 * Catalog metadata comes from public/okf/index.md (label, category,
 * description), public/okf/<topic>/index.yaml (tags) and public/index.yaml
 * (updatedAt, isNew, difficulty).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as yaml from 'js-yaml'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OKF_DIR = path.join(ROOT, 'public', 'okf')
const CONTENT_DIR = path.join(ROOT, 'public', 'content')

// --- Run the browser OKF reader under Node: point it at public/okf via fetch ---
;(globalThis as Record<string, unknown>).window = { __OKF_BASE_OVERRIDE__: '/okf' }
globalThis.fetch = (async (input: string | URL) => {
  const file = path.join(ROOT, 'public', decodeURIComponent(String(input)))
  return fs.existsSync(file) ? new Response(fs.readFileSync(file, 'utf8')) : new Response('not found', { status: 404 })
}) as typeof fetch

const { loadOKFBundle } = await import('../src/core/learning-engine/composition/okf/reader.ts')
const { printOUISection, printOUITopic } = await import('../src/core/learning-engine/composition/oui/print.ts')
const { validateOUISection } = await import('../src/core/learning-engine/validation/oui-gateway.ts')

// --- Catalog metadata ---

interface CatalogEntry {
  id: string
  label: string
  category: string
  description: string
}

function readCatalog(): CatalogEntry[] {
  const body = fs.readFileSync(path.join(OKF_DIR, 'index.md'), 'utf8').replace(/^---[\s\S]*?\n---\n/, '')
  const entries: CatalogEntry[] = []
  let category = 'Uncategorized'
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    const heading = /^##+\s+(.+)$/.exec(line)
    if (heading) {
      category = heading[1].trim()
      continue
    }
    const link = /^\*\s+\[([^\]]+)\]\(([^)]+)\)\s*(?:—\s*(.+))?$/.exec(line)
    if (link) {
      entries.push({
        id: link[2].trim().replace(/^\.\//, '').replace(/\/index\.md$/, ''),
        label: link[1].trim(),
        category,
        description: link[3]?.trim() ?? '',
      })
    }
  }
  return entries
}

function readYaml<T>(file: string): T | undefined {
  return fs.existsSync(file) ? (yaml.load(fs.readFileSync(file, 'utf8')) as T) : undefined
}

// --- Conversion ---

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const catalog = readCatalog()
const requested = args.includes('--all') ? catalog.map((e) => e.id) : args.filter((a) => !a.startsWith('--'))
if (requested.length === 0) {
  console.error('Usage: npx tsx scripts/okf-to-oui.ts <topic…> | --all [--check]')
  process.exit(1)
}

const appIndex = readYaml<Array<Record<string, unknown>>>(path.join(ROOT, 'public', 'index.yaml')) ?? []
let failures = 0

for (const topicId of requested) {
  const entry = catalog.find((e) => e.id === topicId)
  if (!entry) {
    console.error(`✗ ${topicId}: not listed in public/okf/index.md`)
    failures++
    continue
  }
  const bundle = await loadOKFBundle(topicId)
  const topicYaml = readYaml<{ tags?: string[] }>(path.join(OKF_DIR, topicId, 'index.yaml')) ?? {}
  const appMeta = appIndex.find((e) => e.id === topicId) ?? {}

  const files = new Map<string, string>()
  for (const section of bundle) {
    const name = section.sectionFolder!
    const source = printOUISection(section.meta, section.data)
    const result = validateOUISection(source, { topicId, sectionName: name, file: `${topicId}/sections/${name}.oui` })
    const problems = result.diagnostics.filter((d) => d.tier < 3)
    if (problems.length) {
      failures++
      console.error(`✗ ${topicId}/${name}:`)
      problems.forEach((d) => console.error(`    tier ${d.tier}${d.line ? ` line ${d.line}` : ''}: ${d.message}`))
    }
    files.set(path.join(topicId, 'sections', `${name}.oui`), source)
  }

  files.set(path.join(topicId, 'topic.oui'), printOUITopic({
    title: entry.label,
    category: entry.category,
    description: entry.description,
    sections: bundle.map((s) => s.sectionFolder!),
    tags: topicYaml.tags,
    difficulty: appMeta.difficulty as string | undefined,
    updatedAt: appMeta.updatedAt as string | undefined,
    isNew: appMeta.isNew as boolean | undefined,
  }))

  if (!checkOnly) {
    for (const [rel, source] of files) {
      fs.mkdirSync(path.dirname(path.join(CONTENT_DIR, rel)), { recursive: true })
      fs.writeFileSync(path.join(CONTENT_DIR, rel), source, 'utf8')
    }
  }
  console.log(`${checkOnly ? '✓ (check)' : '✓'} ${topicId}: ${bundle.length} sections`)
}

if (failures) {
  console.error(`\n${failures} problem(s) found.`)
  process.exit(1)
}
