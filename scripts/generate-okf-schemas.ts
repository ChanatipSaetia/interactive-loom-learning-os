// CLI: generate JSON Schemas for OKF YAML files (`npm run okf:schemas`).
// Writes one .schema.json per file shape declared in okf-schemas-manifest.ts
// so the Red Hat YAML extension can offer autocomplete and inline errors in
// VS Code. See docs/creating-topics.md ("VS Code YAML Schema Autocomplete").

// @ts-expect-error - Node builtins (no @types/node in the browser tsconfig)
import * as fs from 'fs'
// @ts-expect-error - Node builtins (no @types/node in the browser tsconfig)
import * as path from 'path'

import { SCHEMA_TARGETS, buildAllSchemas } from './okf-schemas-manifest'

const root = path.resolve(process.cwd())

const schemas = buildAllSchemas()

for (const [outPath, json] of Object.entries(schemas)) {
  const abs = path.join(root, outPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, `${JSON.stringify(json, null, 2)}\n`, 'utf-8')
  console.log(`✓ ${outPath}`)
}

console.log(`\nGenerated ${SCHEMA_TARGETS.length} JSON Schema(s).`)
