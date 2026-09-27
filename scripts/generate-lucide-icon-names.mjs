#!/usr/bin/env node
/**
 * Generates `src/core/learning-engine/sub-contexts/progressive-content/lucide-icon-names.ts`
 * from the installed lucide-react package.
 *
 * The Validation Gateway must stay React-free, so validation cannot import
 * `lucide-react` itself to check taxonomy `icon` names. This script parses the
 * lucide-react ESM entry (no imports executed) and emits the canonical icon
 * export names as a plain string array.
 *
 * Run after bumping lucide-react:  node scripts/generate-lucide-icon-names.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ENTRY = path.join(ROOT, 'node_modules', 'lucide-react', 'dist', 'esm', 'lucide-react.mjs')
const OUT = path.join(
  ROOT,
  'src',
  'core',
  'learning-engine',
  'sub-contexts',
  'progressive-content',
  'lucide-icon-names.ts',
)

const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'node_modules', 'lucide-react', 'package.json'), 'utf-8'),
)
const version = pkg.version

const src = fs.readFileSync(ENTRY, 'utf-8')

// Only icon components: `export { default as Name, default as Alias, ... } from './icons/<file>.mjs'`
const exportLine = /^export \{([^}]*)\} from '\.\/icons\/[^']+';$/gm
const defaultAs = /\bdefault as ([A-Za-z0-9_$]+)(?![A-Za-z0-9_$])/g

const all = new Set()
for (const line of src.matchAll(exportLine)) {
  for (const name of line[1].matchAll(defaultAs)) {
    all.add(name[1])
  }
}

if (all.size < 500) {
  console.error(`Expected 500+ lucide icon export names, found ${all.size}. Aborting.`)
  process.exit(1)
}

// Canonical icon names: drop the `Lucide`-prefixed and `Icon`-suffixed aliases.
const canonical = [...all]
  .filter((n) => !/^Lucide[A-Z]/.test(n) && !(n.endsWith('Icon') && all.has(n.slice(0, -4))))
  .sort()

const body = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/generate-lucide-icon-names.mjs
//
// Source: lucide-react v${version} (dist/esm/lucide-react.mjs icon exports).
// The taxonomy-browser renderer resolves \`icon\` via \`import * as Icons from 'lucide-react'\`;
// validation checks against this list instead of importing lucide-react, keeping
// the Validation Gateway free of React imports.

/** Canonical lucide icon names (PascalCase), as listed on https://lucide.dev/icons/. */
export const LUCIDE_ICON_NAMES: readonly string[] = [
${canonical.map((n) => `  '${n}',`).join('\n')}
]

const iconNameSet = new Set<string>(LUCIDE_ICON_NAMES)

/** True when \`name\` is a canonical lucide icon name the renderer can resolve. */
export function isLucideIconName(name: string): boolean {
  return iconNameSet.has(name)
}

/** The lucide-react version this list was generated from. */
export const LUCIDE_ICONS_VERSION = '${version}' as const
`

fs.writeFileSync(OUT, body)
console.log(`Wrote ${canonical.length} canonical icon names (of ${all.size} exports) to ${path.relative(ROOT, OUT)}`)
