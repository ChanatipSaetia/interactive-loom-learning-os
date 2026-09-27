#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateSectionFiles, formatValidationAsPrompt, validateHexCampaign, type ValidationDiagnostic, type ValidationResult } from '../src/core/learning-engine/validation/gateway.ts'
import { NodeFsStorageAdapter } from '../src/core/delivery/adapters/node-fs-storage.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OKF_DIR = path.join(ROOT, 'public', 'okf')
const HEXMAPS_DIR = path.join(ROOT, 'public', 'hexmaps')
const storage = new NodeFsStorageAdapter(OKF_DIR, HEXMAPS_DIR)

// Parse CLI flags
const args = process.argv.slice(2)
const isJson = args.includes('--json')
const isPrompt = args.includes('--format=prompt')
const topicArg = args.find((a) => a.startsWith('--topic='))?.split('=')[1]

async function getTopics(): Promise<string[]> {
  if (topicArg) return [topicArg]
  if (!fs.existsSync(OKF_DIR)) return []
  return storage.listTopics()
}

async function validateAll(): Promise<{ totalFiles: number; diagnostics: ValidationDiagnostic[] }> {
  const diagnostics: ValidationDiagnostic[] = []
  let totalFiles = 0

  for (const topicId of await getTopics()) {
    // Every section folder on disk — linked or not — goes through the same gateway as the app.
    const folders = await storage.listSectionFolders(topicId)
    for (const folder of folders) {
      totalFiles++
      const files = await storage.readSectionFiles(topicId, folder)
      const file = path.relative(ROOT, path.join(OKF_DIR, topicId, 'sections', folder))
      const res = validateSectionFiles(files, { file, topicId, sectionName: folder })
      diagnostics.push(...res.diagnostics)
    }

    // Every lesson link in index.md must resolve to a section folder with a section.md.
    const indexFile = path.relative(ROOT, path.join(OKF_DIR, topicId, 'index.md'))
    for (const linked of await storage.listSections(topicId)) {
      if (!folders.includes(linked)) {
        diagnostics.push({
          tier: 1,
          file: indexFile,
          message: `index.md links section "${linked}", but sections/${linked}/section.md does not exist.`,
          fixHint: `Add sections/${linked}/section.md, or remove the link from index.md.`,
        })
      }
    }
  }

  // Validate Hex Campaigns in public/hexmaps
  if (fs.existsSync(HEXMAPS_DIR)) {
    const hexFiles = fs.readdirSync(HEXMAPS_DIR).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    for (const hexFile of hexFiles) {
      const topicId = path.basename(hexFile, path.extname(hexFile))
      if (topicArg && topicArg !== topicId) continue
      totalFiles++

      const hexFilePath = path.join(HEXMAPS_DIR, hexFile)
      const rawContent = fs.readFileSync(hexFilePath, 'utf-8')
      const sectionsPath = path.join(OKF_DIR, topicId, 'sections')
      const availableSectionIds = fs.existsSync(sectionsPath)
        ? fs.readdirSync(sectionsPath).filter((f) => fs.statSync(path.join(sectionsPath, f)).isDirectory())
        : []

      const res = validateHexCampaign(rawContent, availableSectionIds)
      for (const diag of res.diagnostics) {
        diagnostics.push({
          ...diag,
          file: path.relative(ROOT, hexFilePath),
        } as any)
      }
    }
  }

  return { totalFiles, diagnostics }
}

async function main() {
  const { totalFiles, diagnostics } = await validateAll()

  if (isJson) {
    console.log(JSON.stringify(diagnostics, null, 2))
  } else if (isPrompt) {
    const mockRes: ValidationResult<Record<string, unknown>> = {
      status: diagnostics.length > 0 ? 'error' : 'valid',
      payload: {},
      diagnostics,
    }
    console.log(formatValidationAsPrompt(mockRes))
  } else {
    console.log(`\n🔍 OKF Comprehensive Section Validation Report`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Scanned section directories: ${totalFiles}`)

    if (diagnostics.length === 0) {
      console.log(`\n✅ All OKF section bundles passed validation clean!`)
    } else {
      console.log(`\n❌ Found ${diagnostics.length} validation diagnostic(s):\n`)
      diagnostics.forEach((diag, idx) => {
        const fileLabel = (diag as any).file ? ` [${(diag as any).file}]` : ''
        console.log(`[${idx + 1}] TIER ${diag.tier}${fileLabel} ${diag.field ? `[${diag.field}]` : ''}`)
        if (diag.line) console.log(`    Line:    ${diag.line}${diag.column ? `:${diag.column}` : ''}`)
        console.log(`    Message: ${diag.message}`)
        if (diag.fixHint) console.log(`    Hint:    ${diag.fixHint}`)
        console.log()
      })
      process.exit(1)
    }
  }
}

main()
