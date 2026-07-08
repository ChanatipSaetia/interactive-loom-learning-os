import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const OKF_DIR = path.join(ROOT, 'public', 'okf')
const INDEX_PATH = path.join(ROOT, 'public', 'index.yaml')

function parseIndexMd(content) {
  const titleMatch = content.match(/^#+\s+(.+)$/m)
  return { title: titleMatch ? titleMatch[1].trim() : null }
}

const entries = []

for (const name of fs.readdirSync(OKF_DIR)) {
  const dirPath = path.join(OKF_DIR, name)
  const indexYaml = path.join(dirPath, 'index.yaml')
  const indexMd = path.join(dirPath, 'index.md')

  if (!fs.statSync(dirPath).isDirectory()) continue
  if (!fs.existsSync(indexYaml)) continue

  const yamlContent = fs.readFileSync(indexYaml, 'utf-8')
  const meta = yaml.load(yamlContent)

  let description = ''
  if (fs.existsSync(indexMd)) {
    const indexMdContent = fs.readFileSync(indexMd, 'utf-8')
    const lines = indexMdContent.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('*'))
    description = lines[0]?.trim() || ''
  }

  entries.push({
    id: name,
    label: meta.title || name,
    path: `/topics/${name}`,
    category: meta.category || 'Uncategorized',
    description: description || '',
  })
}

entries.sort((a, b) => a.id.localeCompare(b.id))

const output = yaml.dump(entries, { indent: 2, quotingType: '"' })
fs.writeFileSync(INDEX_PATH, `# Auto-generated — do not edit manually\n${output}`)
console.log(`Updated ${INDEX_PATH} with ${entries.length} topics`)
