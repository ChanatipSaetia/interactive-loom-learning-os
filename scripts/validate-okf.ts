#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as yaml from 'js-yaml'
import { paragraphsToStandardProgram } from '../src/core/learning-engine/composition/oui/standard.ts'
import { validateOKFSection, validateOKFSectionFile, formatValidationAsPrompt, tier2Validate, type ValidationDiagnostic, type ValidationResult } from '../src/core/learning-engine/validation/gateway.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OKF_DIR = path.join(ROOT, 'public', 'okf')

// Parse CLI flags
const args = process.argv.slice(2)
const isJson = args.includes('--json')
const isPrompt = args.includes('--format=prompt')
const topicArg = args.find((a) => a.startsWith('--topic='))?.split('=')[1]

function getTopics(): string[] {
  if (topicArg) return [topicArg]
  if (!fs.existsSync(OKF_DIR)) return []
  return fs.readdirSync(OKF_DIR).filter((item) => {
    const stat = fs.statSync(path.join(OKF_DIR, item))
    return stat.isDirectory()
  })
}

function parseParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function loadAndCombineSectionData(folderPath: string, meta: Record<string, unknown>): { data: Record<string, unknown>; syntaxErrors: ValidationDiagnostic[] } {
  const syntaxErrors: ValidationDiagnostic[] = []
  const sectionType = meta.type as string | undefined
  const resource = (meta.resource as string) || '.'
  const combined: Record<string, unknown> = { ...meta }

  const filesInFolder = fs.readdirSync(folderPath)
  const yamlFiles = filesInFolder.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))

  // 1. Read syntax for all YAML files in the directory
  const parsedFiles: Record<string, unknown> = {}
  for (const file of yamlFiles) {
    const filePath = path.join(folderPath, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    try {
      const parsed = yaml.load(content)
      parsedFiles[file] = parsed
    } catch (e: any) {
      const message = e.message || String(e)
      const lineMatch = message.match(/line\s+(\d+)/i)
      const colMatch = message.match(/column\s+(\d+)/i)
      syntaxErrors.push({
        tier: 1,
        line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
        column: colMatch ? parseInt(colMatch[1], 10) : undefined,
        message: `YAML Syntax Error in ${file}: ${message}`,
        fixHint: 'Fix YAML indentation and formatting around the specified line.',
      })
    }
  }

  // Legacy `text` sections (Markdown content file) load as `openui` sections, like the OKF reader does.
  if (sectionType === 'text') {
    const mdFile = resource !== '.' ? resource : filesInFolder.find((f) => f.endsWith('.md') && f !== 'section.md') || 'content.md'
    const mdPath = path.join(folderPath, mdFile)
    const paragraphs = fs.existsSync(mdPath) ? parseParagraphs(fs.readFileSync(mdPath, 'utf-8')) : []
    return { data: { ...meta, type: 'openui', source: paragraphsToStandardProgram(paragraphs) }, syntaxErrors }
  }

  // 2. Pure structural aggregation without mutation or alias normalization
  if (resource !== '.' && parsedFiles[resource]) {
    const resParsed = parsedFiles[resource]
    if (resParsed && typeof resParsed === 'object') {
      if (Array.isArray(resParsed)) {
        if (sectionType === 'flashcards') combined.terms = resParsed
        else if (sectionType === 'quiz') combined.questions = resParsed
        else if (sectionType === 'tradeoff-sandbox') combined.scenarios = resParsed
        else if (sectionType === 'taxonomy-browser') combined.categories = resParsed
        else if (sectionType === 'image-gallery') combined.items = resParsed
        else if (sectionType === 'bullets') combined.items = resParsed
        else if (sectionType === 'reflection-sequence' || sectionType === 'reflection-template') combined.challenges = resParsed
      } else {
        Object.assign(combined, resParsed)
      }
    }
  } else {
    // Resource is '.' or file not explicitly declared
    if (sectionType === 'flowchart') {
      const flowObj: Record<string, unknown> = {}
      for (const [file, parsed] of Object.entries(parsedFiles)) {
        const baseName = path.basename(file, path.extname(file))
        flowObj[baseName] = parsed
      }
      combined.flow = flowObj
    } else {
      // Collect arrays / objects from files
      for (const [file, parsed] of Object.entries(parsedFiles)) {
        if (!parsed || typeof parsed !== 'object') continue
        if (Array.isArray(parsed)) {
          if (sectionType === 'tradeoff-sandbox') {
            combined.scenarios = [...((combined.scenarios as any[]) || []), ...parsed]
          } else if (sectionType === 'taxonomy-browser') {
            combined.categories = [...((combined.categories as any[]) || []), ...parsed]
          }
        } else {
          const rawObj = parsed as Record<string, any>
          if (sectionType === 'tradeoff-sandbox' && rawObj.title && rawObj.steps) {
            combined.scenarios = [...((combined.scenarios as any[]) || []), rawObj]
          } else if (sectionType === 'taxonomy-browser' && (rawObj.type === 'taxonomy-category' || rawObj.analogy || rawObj.primaryFocus)) {
            combined.categories = [...((combined.categories as any[]) || []), rawObj]
          } else {
            Object.assign(combined, parsed)
          }
        }
      }
    }
  }

  return { data: combined, syntaxErrors }
}

function validateAll(): { totalFiles: number; diagnostics: ValidationDiagnostic[] } {
  const topics = getTopics()
  const diagnostics: ValidationDiagnostic[] = []
  let totalFiles = 0

  for (const topicId of topics) {
    const topicPath = path.join(OKF_DIR, topicId)
    const sectionsPath = path.join(topicPath, 'sections')

    if (!fs.existsSync(sectionsPath)) continue

    const sectionFolders = fs.readdirSync(sectionsPath).filter((f) => {
      return fs.statSync(path.join(sectionsPath, f)).isDirectory()
    })

    for (const sectionFolder of sectionFolders) {
      const folderPath = path.join(sectionsPath, sectionFolder)
      const sectionMdPath = path.join(folderPath, 'section.md')
      if (fs.existsSync(sectionMdPath)) {
        totalFiles++
        const rawMd = fs.readFileSync(sectionMdPath, 'utf-8')
        const context = {
          file: path.relative(ROOT, sectionMdPath),
          topicId,
          sectionName: sectionFolder,
        }

        const match = rawMd.match(/^---\s*\n([\s\S]*?)\n---/)
        let meta: Record<string, unknown> = {}
        if (match) {
          try {
            meta = (yaml.load(match[1]) as Record<string, unknown>) || {}
          } catch {}
        }

        const { data, syntaxErrors } = loadAndCombineSectionData(folderPath, meta)
        diagnostics.push(...syntaxErrors)

        const sectionType = (meta.type as string) || (data.type as string)
        const res = validateOKFSection(data, sectionType, context)
        diagnostics.push(...res.diagnostics)
      }
    }
  }

  return { totalFiles, diagnostics }
}

function main() {
  const { totalFiles, diagnostics } = validateAll()

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
