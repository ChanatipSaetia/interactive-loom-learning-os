#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as yaml from 'js-yaml'
import { validateYAMLContent, validateSectionData, formatPayloadAsPrompt, type OKFValidationErrorPayload } from '../src/core/okf/validate.ts'
import { tier2Validate } from '../src/core/validation/gateway.ts'

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

function loadAndCombineSectionData(folderPath: string, meta: Record<string, unknown>): { data: Record<string, unknown>; syntaxErrors: OKFValidationErrorPayload[] } {
  const syntaxErrors: OKFValidationErrorPayload[] = []
  const sectionType = meta.type as string | undefined
  const resource = (meta.resource as string) || '.'
  const combined: Record<string, unknown> = { ...meta }

  const filesInFolder = fs.readdirSync(folderPath)
  const yamlFiles = filesInFolder.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))

  // 1. Read syntax for all YAML files in the directory
  const parsedFiles: Record<string, unknown> = {}
  for (const file of yamlFiles) {
    const filePath = path.join(folderPath, file)
    const relPath = path.relative(ROOT, filePath)
    const content = fs.readFileSync(filePath, 'utf-8')
    try {
      const parsed = yaml.load(content)
      parsedFiles[file] = parsed
    } catch (e: any) {
      const message = e.message || String(e)
      const lineMatch = message.match(/line\s+(\d+)/i)
      const colMatch = message.match(/column\s+(\d+)/i)
      syntaxErrors.push({
        file: relPath,
        tier: 'syntax',
        line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
        column: colMatch ? parseInt(colMatch[1], 10) : undefined,
        message: `YAML Syntax Error in ${file}: ${message}`,
        fixHint: 'Fix YAML indentation and formatting around the specified line.',
      })
    }
  }

  // Handle Markdown content file for text sections
  if (sectionType === 'text') {
    const mdFile = resource !== '.' ? resource : filesInFolder.find((f) => f.endsWith('.md') && f !== 'section.md') || 'content.md'
    const mdPath = path.join(folderPath, mdFile)
    if (fs.existsSync(mdPath)) {
      const mdContent = fs.readFileSync(mdPath, 'utf-8')
      combined.paragraphs = parseParagraphs(mdContent)
    }
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

function validateAll(): { totalFiles: number; errors: OKFValidationErrorPayload[] } {
  const topics = getTopics()
  const errors: OKFValidationErrorPayload[] = []
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
      let sectionMeta: Record<string, unknown> = {}

      // 1. Read metadata from section.md if present
      const sectionMdPath = path.join(folderPath, 'section.md')
      if (fs.existsSync(sectionMdPath)) {
        totalFiles++
        const rawMd = fs.readFileSync(sectionMdPath, 'utf-8')
        const frontmatterMatch = rawMd.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
        if (frontmatterMatch) {
          try {
            const parsedMeta = validateYAMLContent(frontmatterMatch[1], undefined, {
              file: path.relative(ROOT, sectionMdPath),
              topicId,
              sectionName: sectionFolder,
            })
            if (parsedMeta.errors.length > 0) {
              const syntaxFm = parsedMeta.errors.filter((e) => e.tier === 'syntax')
              errors.push(...syntaxFm)
            }
            if (parsedMeta.data && typeof parsedMeta.data === 'object') {
              sectionMeta = parsedMeta.data as Record<string, unknown>
            }
          } catch (e: any) {
            errors.push({
              file: path.relative(ROOT, sectionMdPath),
              topicId,
              sectionName: sectionFolder,
              tier: 'syntax',
              message: `YAML Frontmatter Error: ${e.message}`,
            })
          }
        }
      }

      // 2. Load resource files & validate syntax
      const { data: combinedData, syntaxErrors } = loadAndCombineSectionData(folderPath, sectionMeta)
      errors.push(...syntaxErrors)

      const sectionMetaType = combinedData.type as string | undefined

      // 3. Validate Tier 2 (Schema) & Tier 3 (Semantic) on combined section object
      if (sectionMetaType) {
        // Run legacy rule checks
        const legacyErrors = validateSectionData(
          combinedData,
          sectionMetaType,
          {
            file: path.relative(ROOT, folderPath),
            topicId,
            sectionName: sectionFolder,
          }
        )
        errors.push(...legacyErrors)

        // Run strict Zod 3-Tier Validation Gateway checks
        const context = {
          file: path.relative(ROOT, folderPath),
          topicId,
          sectionName: sectionFolder,
        }
        const t2Res = tier2Validate(combinedData, sectionMetaType, context)
        const t2Diagnostics: OKFValidationErrorPayload[] = t2Res.diagnostics.map((d) => ({
          file: d.field ? `${context.file} [${d.field}]` : context.file,
          topicId,
          sectionName: sectionFolder,
          tier: 'schema',
          field: d.field,
          message: d.message,
          fixHint: d.fixHint,
        }))
        errors.push(...t2Diagnostics)
      }
    }
  }

  return { totalFiles, errors }
}

function main() {
  const { totalFiles, errors } = validateAll()

  if (isJson) {
    console.log(JSON.stringify(errors, null, 2))
  } else if (isPrompt) {
    console.log(formatPayloadAsPrompt(errors))
  } else {
    console.log(`\n🔍 OKF Comprehensive Section Validation Report`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Scanned section directories: ${totalFiles}`)

    if (errors.length === 0) {
      console.log(`\n✅ All OKF section bundles and multi-file resources passed validation clean!`)
    } else {
      console.log(`\n❌ Found ${errors.length} validation error(s):\n`)
      errors.forEach((err, idx) => {
        console.log(`[${idx + 1}] ${err.tier.toUpperCase()} ERROR in ${err.file || err.sectionName}`)
        if (err.field) console.log(`    Field:   ${err.field}`)
        if (err.line) console.log(`    Line:    ${err.line}${err.column ? `:${err.column}` : ''}`)
        console.log(`    Message: ${err.message}`)
        if (err.fixHint) console.log(`    Hint:    ${err.fixHint}`)
        console.log()
      })
      process.exit(1)
    }
  }
}

main()
