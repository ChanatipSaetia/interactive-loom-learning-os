#!/usr/bin/env tsx
/**
 * Write the Loom OpenUI Lang spec, with every component and prop described,
 * for LLM chats and tools outside the app. Files in public/ are served by
 * the GitHub Pages build:
 *
 *   public/llm/loom-authoring-prompt.md  system prompt for writing a topic (.loom.oui file or folder)
 *   public/llm/loom-oui.schema.json      JSON Schema of every component's props
 *   public/llms.txt                      llms.txt index linking the two
 *   public/llm/skills/loom-topic-writer/ agent skill (SKILL.md + the prompt as a reference) for
 *                                        Claude Code / opencode, also kept in .claude/skills/
 *
 *   npx tsx scripts/gen-oui-schema.ts           # write the files
 *   npx tsx scripts/gen-oui-schema.ts --check   # fail if any is stale
 *
 * Descriptions come from each component's `fields` in
 * src/core/learning-engine/sub-contexts/<subdomain>/openui.ts; the prompt's
 * Loom parts from src/core/learning-engine/composition/oui/authoring-prompt.ts.
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
  console.error('Run `npm run oui:schema` to refresh the Loom LLM files.')
  process.exit(1)
}
