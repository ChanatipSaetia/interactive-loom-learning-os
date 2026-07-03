import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

const OKF_DIR = path.resolve('public', 'okf')
const INDEX_PATH = path.join(OKF_DIR, 'index.yaml')

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return {}
  return yaml.load(match[1])
}

const entries = []

for (const name of fs.readdirSync(OKF_DIR)) {
  const dirPath = path.join(OKF_DIR, name)
  const okfMd = path.join(dirPath, 'okf.md')

  if (!fs.statSync(dirPath).isDirectory()) continue
  if (!fs.existsSync(okfMd)) continue

  const content = fs.readFileSync(okfMd, 'utf-8')
  const meta = parseFrontmatter(content)

  entries.push({
    id: name,
    label: meta.title || name,
    path: `/topics/${name}`,
    category: meta.category || 'Uncategorized',
    description: meta.description || '',
  })
}

entries.sort((a, b) => a.id.localeCompare(b.id))

const output = yaml.dump(entries, { indent: 2, quotingType: '"' })
fs.writeFileSync(INDEX_PATH, `# Auto-generated — do not edit manually\n${output}`)
console.log(`Updated ${INDEX_PATH} with ${entries.length} topics`)
