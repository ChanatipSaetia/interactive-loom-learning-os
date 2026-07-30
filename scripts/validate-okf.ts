#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { validateYAMLContent, formatPayloadAsPrompt, type OKFValidationErrorPayload } from '../src/core/okf/validate.ts'

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
      let sectionMetaType: string | undefined

      // Read metadata from section.md if present
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
            if (parsedMeta.data && typeof parsedMeta.data === 'object') {
              sectionMetaType = (parsedMeta.data as any).type
            }
          } catch {
            // Handled during data.yaml parsing
          }
        }
      }

      // Validate data.yaml payload
      const dataYamlPath = path.join(folderPath, 'data.yaml')
      if (fs.existsSync(dataYamlPath)) {
        totalFiles++
        const rawYaml = fs.readFileSync(dataYamlPath, 'utf-8')
        const relPath = path.relative(ROOT, dataYamlPath)
        const result = validateYAMLContent(rawYaml, sectionMetaType, {
          file: relPath,
          topicId,
          sectionName: sectionFolder,
        })
        errors.push(...result.errors)
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
    console.log(`\n🔍 OKF Section Validation Report`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`Scanned files: ${totalFiles}`)

    if (errors.length === 0) {
      console.log(`\n✅ All OKF sections passed validation clean!`)
    } else {
      console.log(`\n❌ Found ${errors.length} validation error(s):\n`)
      errors.forEach((err, idx) => {
        console.log(`[${idx + 1}] ${err.tier.toUpperCase()} ERROR in ${err.file}`)
        if (err.field) console.log(`    Field:   ${err.field}`)
        if (err.line) console.log(`    Line:    ${err.line}${err.column ? `:${err.column}` : ''}`)
        console.log(`    Message: ${err.message}`)
        if (err.fixHint) console.log(`    Fix:     ${err.fixHint}`)
        console.log('')
      })
    }
  }

  if (errors.length > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

main()
