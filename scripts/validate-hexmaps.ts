#!/usr/bin/env tsx
/**
 * Validate hex campaign maps against the OpenUI topic content.
 *
 *   npm run hexmap:validate                 # every map in public/hexmaps/
 *   npm run hexmap:validate -- demo pixijs  # only these topics
 *
 * Each `public/hexmaps/<topic>.yaml` goes through the Validation Gateway
 * (`validateHexCampaign`) with the section names of
 * `public/content/<topic>/sections/*.oui`, so `sectionRef` resolution and full
 * section coverage are checked against the OpenUI files. Exits 1 on any
 * Tier 1/2 error or Tier 3 diagnostic.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const HEXMAP_DIR = path.join(ROOT, 'public', 'hexmaps')
const CONTENT_DIR = path.join(ROOT, 'public', 'content')

const { validateHexCampaign } = await import('../src/core/learning-engine/validation/gateway.ts')

function sectionNames(topicId: string): string[] {
  const dir = path.join(CONTENT_DIR, topicId, 'sections')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith('.oui')).map((f) => f.slice(0, -'.oui'.length))
}

const requested = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const topics = requested.length
  ? requested
  : fs.readdirSync(HEXMAP_DIR).filter((f) => f.endsWith('.yaml')).map((f) => f.slice(0, -'.yaml'.length))

let problems = 0
for (const topicId of topics) {
  const file = path.join(HEXMAP_DIR, `${topicId}.yaml`)
  if (!fs.existsSync(file)) {
    console.error(`✗ ${topicId}: public/hexmaps/${topicId}.yaml not found`)
    problems++
    continue
  }
  const sections = sectionNames(topicId)
  if (sections.length === 0) {
    console.error(`✗ ${topicId}: no OpenUI sections in public/content/${topicId}/sections/`)
    problems++
    continue
  }
  const result = validateHexCampaign(fs.readFileSync(file, 'utf8'), sections)
  if (result.diagnostics.length === 0) {
    console.log(`✓ ${topicId}`)
    continue
  }
  problems += result.diagnostics.length
  console.error(`✗ ${topicId}:`)
  for (const d of result.diagnostics) {
    console.error(`    tier ${d.tier}${d.field ? ` ${d.field}` : ''}: ${d.message}`)
    if (d.fixHint) console.error(`      fix: ${d.fixHint}`)
  }
}

if (problems) {
  console.error(`\n${problems} problem(s) found.`)
  process.exit(1)
}
