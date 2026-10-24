// Starts the two static origins the spike needs, next to `node server.mjs --http`:
//   http://localhost:5180  the app's asset origin (stands in for GitHub Pages; sends CORS headers)
//   http://localhost:8090  the test host page, plus /topic.oui (a real topic from public/content)
import { createServer } from 'node:http'
import { readFile, readdir, copyFile } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))
const TOPIC = process.env.TOPIC ?? 'chinese101-day1'
const types = { '.js': 'text/javascript', '.html': 'text/html', '.oui': 'text/plain; charset=utf-8' }

await copyFile(join(here, 'node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js'), join(here, 'assets/ext-apps.js'))
await build({ entryPoints: [join(here, 'host/host.js')], bundle: true, format: 'esm', outfile: join(here, 'host/host.bundle.js'), logLevel: 'warning' })

async function topicText() {
  const dir = join(here, '../../public/content', TOPIC)
  const files = (await readdir(join(dir, 'sections'))).filter((f) => f.endsWith('.oui')).sort()
  const parts = [await readFile(join(dir, 'topic.oui'), 'utf8')]
  for (const f of files) parts.push(`// sections/${f}\n${await readFile(join(dir, 'sections', f), 'utf8')}`)
  return parts.join('\n\n')
}

function serve(port, root, extra = {}) {
  createServer(async (req, res) => {
    const path = new URL(req.url, 'http://x').pathname
    res.setHeader('Access-Control-Allow-Origin', '*')
    try {
      if (extra[path]) {
        const body = await extra[path]()
        return res.writeHead(200, { 'Content-Type': types['.oui'] }).end(body)
      }
      const file = join(root, path === '/' ? 'index.html' : path)
      const body = await readFile(file)
      res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(body)
    } catch {
      res.writeHead(404).end()
    }
  }).listen(port, () => console.error(`serving ${root} on http://localhost:${port}`))
}

serve(5180, join(here, 'assets'))
serve(8090, join(here, 'host'), { '/topic.oui': topicText })
