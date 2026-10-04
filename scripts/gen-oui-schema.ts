#!/usr/bin/env tsx
/**
 * Write the Loom OpenUI Lang library, with every component and prop
 * described, for tools outside the app:
 *
 *   schemas/oui/loom-oui.prompt.md    LLM system prompt for writing .oui files
 *   schemas/oui/loom-oui.schema.json  JSON Schema of every component's props
 *
 *   npx tsx scripts/gen-oui-schema.ts           # write both files
 *   npx tsx scripts/gen-oui-schema.ts --check   # fail if either is stale
 *
 * Descriptions come from each component's `fields` in
 * src/core/learning-engine/sub-contexts/<subdomain>/openui.ts.
 * Re-run after changing a component.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ouiSchemaFiles } from '../src/core/learning-engine/composition/oui/schema-files'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const check = process.argv.includes('--check')
let stale = false
for (const [relative, text] of Object.entries(ouiSchemaFiles())) {
  const file = path.join(ROOT, relative)
  if (check) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
      console.error(`stale: ${relative}`)
      stale = true
    }
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, text)
    console.log(`wrote ${relative}`)
  }
}
if (stale) {
  console.error('Run `npm run oui:schema` to refresh the Loom OpenUI schema files.')
  process.exit(1)
}
