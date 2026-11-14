#!/usr/bin/env tsx
/** Explicit, idempotent conversion. Old authoring formats are not runtime dialects. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { migrateSectionSource, migrateProseNarration, pageBodySource, rootCall } from '../src/core/learning-engine/composition/oui/page-source'
import { OUI_SECTION_TYPES } from '../src/core/learning-engine/composition/oui/library'

const write = process.argv.includes('--write')
const roots = process.argv.slice(2).filter((arg) => arg !== '--write')
if (!roots.length) throw new Error('Usage: npm run oui:migrate -- [--write] <file-or-directory> [...]. Without --write, report files needing conversion.')

function convert(source: string): string {
  // A portable topic contains independent programs separated by file markers.
  const marker = /(^[ \t]*\/\/\s*===\s*[^\n]+?\s*===\s*$)/m
  if (marker.test(source)) {
    let narration = false
    return source.split(marker).map((part) => {
      if (marker.test(part)) { narration = part.includes('.narrate.oui'); return part }
      const next = migrateSectionSource(part)
      return narration ? migrateProseNarration(next) : next
    }).join('')
  }
  return migrateSectionSource(source)
}

let changed = 0
async function visit(file: string): Promise<void> {
  const stat = await fs.stat(file)
  if (stat.isDirectory()) {
    for (const name of (await fs.readdir(file)).sort()) await visit(path.join(file, name))
  } else if (file.endsWith('.oui')) {
    const before = await fs.readFile(file, 'utf8')
    let after = convert(before)
    if (file.endsWith('.narrate.oui')) {
      after = migrateProseNarration(after)
      const section = await fs.readFile(file.replace(/\.narrate\.oui$/, '.oui'), 'utf8').catch(() => '')
      if (OUI_SECTION_TYPES.has(rootCall(pageBodySource(section))?.component ?? '')) {
        after = after.replace(/"root\.(?!body(?:\.|\[|"))([\w.[\]-]+)"/g, '"root.body.$1"')
      }
    }
    if (after === before) return
    changed++
    if (write) await fs.writeFile(file, after)
    console.log(`${write ? 'converted' : 'needs conversion'}: ${file}`)
  }
}
for (const root of roots) await visit(root)
console.log(`${changed} file(s) ${write ? 'converted' : 'need conversion'}.`)
if (!write && changed) process.exitCode = 1
