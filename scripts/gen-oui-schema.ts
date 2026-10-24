#!/usr/bin/env tsx
/**
 * Write the Loom OpenUI Lang spec, with every component and prop described,
 * for LLM chats and tools outside the app. Files in public/ are served by
 * the GitHub Pages build:
 *
 *   public/llm/loom-authoring-prompt.md  system prompt for writing a topic (.loom.oui file or folder)
 *   public/llm/loom-oui.schema.json      JSON Schema of every component's props
 *   public/llms.txt                      llms.txt index linking the two
 *   public/llm/skills/loom-topic-writer/ agent skill (SKILL.md + the prompt as a reference), also
 *                                        kept in .claude/skills/ (where `npx skills add` finds it)
 *   public/llm/skills/loom-topic-writer.zip  the skill folder zipped, for uploading to the Claude app
 *   public/llm/skills/loom-tutor-app/, loom-tutor-viewer/ (and their zips)  the learner skills, also in .claude/skills/
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
import { strToU8, unzipSync, zipSync } from 'fflate'
import { LOOM_SKILL_NAMES, skillZipPath } from '../src/core/learning-engine/composition/oui/llm-guide'
import { ouiSchemaFiles, skillZipFiles } from '../src/core/learning-engine/composition/oui/schema-files'

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

// Zips are compared by their contents, so a different fflate build does not make them stale.
for (const skill of LOOM_SKILL_NAMES) {
  const zipPath = skillZipPath(skill)
  const zipFile = path.join(ROOT, 'public', zipPath)
  const zipEntries = skillZipFiles(skill)
  if (check) {
    const committed = fs.existsSync(zipFile) ? unzipSync(fs.readFileSync(zipFile)) : {}
    const decoder = new TextDecoder()
    const same =
      Object.keys(committed).sort().join('\n') === Object.keys(zipEntries).sort().join('\n') &&
      Object.entries(zipEntries).every(([name, text]) => decoder.decode(committed[name]) === text)
    if (!same) {
      console.error(`stale: public/${zipPath}`)
      stale = true
    }
  } else {
    // A fixed date keeps the zip byte-identical between runs.
    const entries = Object.fromEntries(Object.entries(zipEntries).map(([name, text]) => [name, strToU8(text)]))
    fs.writeFileSync(zipFile, zipSync(entries, { level: 9, mtime: new Date('2025-01-01T00:00:00Z') }))
    console.log(`wrote public/${zipPath}`)
  }
}
if (stale) {
  console.error('Run `npm run oui:schema` to refresh the Loom LLM files.')
  process.exit(1)
}
