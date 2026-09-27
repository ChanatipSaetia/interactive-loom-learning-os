/* global process, console */
/**
 * One-off OKF content migration (grill-log-okf-loading-pipeline.md, Implied Story 2).
 *
 *   1. Canonicalize file shapes: unwrap `{type, <key>: [...]}` files to bare arrays,
 *      and wrap reflection files as `{challenges: [...]}`.
 *   2. Delete stale collection files that are not rendered today, and rename
 *      intentionally disabled ones to `_name.yaml` (collection layouts skip `_*`).
 *   3. Add numeric filename prefixes (`01-name.yaml`) to collection sections
 *      (tradeoff-sandbox / taxonomy-browser with `resource: .`) in current `related:`
 *      order, and rewrite `related:` to match.
 *
 * Every rewrite is verified by re-parsing. Idempotent. Dry run by default:
 *   node scripts/migrate-okf-content.mjs          # report only
 *   node scripts/migrate-okf-content.mjs --write  # apply
 */
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { isDeepStrictEqual } from 'util'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OKF_DIR = path.join(ROOT, 'public', 'okf')
const WRITE = process.argv.includes('--write')

// Excluded from `related:` on purpose (commented out) — kept, but skipped via `_` prefix.
const DISABLED_FILES = ['poe2-flicker-monk/sections/tradeoffs/gear-invested.yaml']

const COLLECTION_TYPES = new Set(['tradeoff-sandbox', 'taxonomy-browser'])
const PREFIX_RE = /^\d{2}-/

const STALE_FILES = [
  'motorcycle/sections/taxonomy/-drivetrain.yaml',
  'motorcycle/sections/taxonomy/-engine-system.yaml',
  'motorcycle/sections/taxonomy/.yaml',
]

// Canonical top-level shape of the file each section type loads.
const UNWRAP_KEY = {
  flowchart: { 'steps.yaml': 'steps' },
  quiz: 'questions',
  flashcards: 'terms',
  'taxonomy-browser': 'categories',
  'tradeoff-sandbox': 'scenarios',
}
const WRAP_CHALLENGES = new Set(['reflection-sequence', 'reflection-template'])

const log = []
const act = (msg, fn) => {
  log.push(msg)
  if (WRITE) fn()
}

function readFrontmatter(mdPath) {
  const match = fs.readFileSync(mdPath, 'utf8').match(/^---\s*\n([\s\S]*?)\n---/)
  return match ? yaml.load(match[1]) ?? {} : {}
}

function writeVerified(file, text, expected) {
  const actual = yaml.load(text)
  if (!isDeepStrictEqual(actual, expected)) throw new Error(`Verification failed for ${file}`)
  act(`rewrite ${path.relative(OKF_DIR, file)}`, () => fs.writeFileSync(file, text))
}

/** `type: x\n<key>:\n  - a` → `- a` (text-level, preserves quoting and layout). */
function unwrapFile(file, key) {
  const text = fs.readFileSync(file, 'utf8')
  const data = yaml.load(text)
  if (Array.isArray(data) || !data || !Array.isArray(data[key])) return
  const extraKeys = Object.keys(data).filter((k) => k !== key && k !== 'type')
  if (extraKeys.length) throw new Error(`${file}: unexpected keys ${extraKeys.join(', ')}`)

  const lines = text.split('\n')
  const keyLine = lines.findIndex((l) => l.startsWith(`${key}:`))
  const body = lines.slice(keyLine + 1)
  const indent = body.find((l) => l.trim())?.match(/^ */)[0].length ?? 0
  const out = body.map((l) => l.slice(Math.min(indent, l.match(/^ */)[0].length))).join('\n')
  writeVerified(file, out, data[key])
}

/** Bare array or single flat challenge → `challenges: [...]`. */
function wrapChallenges(file) {
  const text = fs.readFileSync(file, 'utf8')
  const data = yaml.load(text)
  if (data && !Array.isArray(data) && Array.isArray(data.challenges)) return

  const lines = text.replace(/\n+$/, '').split('\n')
  let out
  let expected
  if (Array.isArray(data)) {
    out = ['challenges:', ...lines.map((l) => (l ? `  ${l}` : l))]
    expected = { challenges: data }
  } else if (data && data.prompt) {
    out = ['challenges:', ...lines.map((l, i) => (i === 0 ? `  - ${l}` : l ? `    ${l}` : l))]
    expected = { challenges: [data] }
  } else {
    throw new Error(`${file}: unrecognized reflection shape`)
  }
  writeVerified(file, out.join('\n') + '\n', expected)
}

function canonicalizeShapes(topic, sectionDir, meta) {
  const dir = path.join(OKF_DIR, topic, 'sections', sectionDir)
  const resource = meta.resource && meta.resource !== '.' ? meta.resource : null
  const rule = UNWRAP_KEY[meta.type]

  if (typeof rule === 'string' && resource) unwrapFile(path.join(dir, resource), rule)
  if (rule && typeof rule === 'object') {
    for (const [file, key] of Object.entries(rule)) {
      if (fs.existsSync(path.join(dir, file))) unwrapFile(path.join(dir, file), key)
    }
  }
  if (WRAP_CHALLENGES.has(meta.type)) {
    const file = resource ?? (meta.type === 'reflection-sequence' ? 'sequence.yaml' : 'template.yaml')
    wrapChallenges(path.join(dir, file))
  }
}

function prefixCollection(topic, sectionDir, related, renames) {
  const dir = path.join(OKF_DIR, topic, 'sections', sectionDir)
  const onDisk = fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f) && !f.startsWith('_'))
    .filter((f) => ![...STALE_FILES, ...DISABLED_FILES].includes(`${topic}/sections/${sectionDir}/${f}`))
    .sort()
  if (onDisk.length && onDisk.every((f) => PREFIX_RE.test(f))) return

  const relPrefix = `sections/${sectionDir}/`
  const listed = related
    .filter((r) => r.startsWith(relPrefix) && /\.ya?ml$/.test(r))
    .map((r) => r.slice(relPrefix.length))
    .filter((f) => !f.includes('/'))
  const ordered = listed.length ? listed : onDisk

  const missing = ordered.filter((f) => !onDisk.includes(f))
  const unlisted = onDisk.filter((f) => !ordered.includes(f))
  if (missing.length || unlisted.length) {
    throw new Error(`${topic}/${sectionDir}: related/disk mismatch (missing: ${missing}, unlisted: ${unlisted})`)
  }

  ordered.forEach((file, i) => {
    const next = `${String(i + 1).padStart(2, '0')}-${file}`
    renames.push([`${relPrefix}${file}`, `${relPrefix}${next}`])
    act(`rename ${topic}/${relPrefix}${file} → ${next}`, () =>
      fs.renameSync(path.join(dir, file), path.join(dir, next)))
  })
}

function rewriteRelated(topic, renames) {
  const indexPath = path.join(OKF_DIR, topic, 'index.yaml')
  if (!renames.length || !fs.existsSync(indexPath)) return
  let text = fs.readFileSync(indexPath, 'utf8')
  for (const [from, to] of renames) {
    const re = new RegExp(`^(\\s*-\\s*["']?)${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["']?\\s*)$`, 'm')
    if (!re.test(text)) throw new Error(`${topic}/index.yaml: related entry not found for ${from}`)
    text = text.replace(re, `$1${to}$2`)
  }
  act(`rewrite ${topic}/index.yaml (${renames.length} related entries)`, () => fs.writeFileSync(indexPath, text))
}

for (const rel of STALE_FILES) {
  const file = path.join(OKF_DIR, rel)
  if (fs.existsSync(file)) act(`delete ${rel}`, () => fs.unlinkSync(file))
}

for (const rel of DISABLED_FILES) {
  const file = path.join(OKF_DIR, rel)
  const disabled = path.join(path.dirname(file), `_${path.basename(file)}`)
  if (!fs.existsSync(file)) continue
  act(`disable ${rel} → _${path.basename(file)}`, () => {
    fs.renameSync(file, disabled)
    const [topic, ...rest] = rel.split('/')
    const indexPath = path.join(OKF_DIR, topic, 'index.yaml')
    const entry = rest.join('/')
    const text = fs.readFileSync(indexPath, 'utf8')
    fs.writeFileSync(indexPath, text.replace(entry, entry.replace(/[^/]+$/, (n) => `_${n}`)))
  })
}

for (const topic of fs.readdirSync(OKF_DIR).sort()) {
  const sectionsPath = path.join(OKF_DIR, topic, 'sections')
  if (!fs.existsSync(sectionsPath)) continue
  const indexPath = path.join(OKF_DIR, topic, 'index.yaml')
  const related = fs.existsSync(indexPath) ? yaml.load(fs.readFileSync(indexPath, 'utf8'))?.related ?? [] : []
  const renames = []

  for (const sectionDir of fs.readdirSync(sectionsPath).sort()) {
    const mdPath = path.join(sectionsPath, sectionDir, 'section.md')
    if (!fs.existsSync(mdPath)) continue
    const meta = readFrontmatter(mdPath)
    canonicalizeShapes(topic, sectionDir, meta)
    const isCollection = COLLECTION_TYPES.has(meta.type) && (!meta.resource || meta.resource === '.')
    if (isCollection) prefixCollection(topic, sectionDir, related, renames)
  }
  rewriteRelated(topic, renames)
}

console.log(log.join('\n'))
console.log(`\n${log.length} change(s) ${WRITE ? 'applied' : 'planned (dry run — pass --write to apply)'}`)
