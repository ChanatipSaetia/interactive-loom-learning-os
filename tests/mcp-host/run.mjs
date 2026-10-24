// Starts everything the test host needs on localhost, after `npm run build:mcp`:
//   http://localhost:3001/mcp   the Loom MCP server (dist-mcp/loom-mcp.mjs --http), memory in tests/mcp-host/results/memory
//   http://localhost:5180       dist/ as the app's origin (stands in for GitHub Pages)
//   http://localhost:8090       the test host, with /topics/<id>.loom.oui from public/content
// Then open http://localhost:8090/ or run `node tests/mcp-host/check.cjs`.
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, readdir, rm } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { createServer as createVite } from 'vite'

const root = process.cwd()
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' }

// The learner's memory folder for this run (topics shown and events), fresh each time
const memoryDir = join(root, 'tests/mcp-host/results/memory')
await rm(memoryDir, { recursive: true, force: true })
const mcp = spawn('node', ['dist-mcp/loom-mcp.mjs', '--http', '3001', '--memory', memoryDir], {
  env: { ...process.env, LOOM_APP_URL: 'http://localhost:5180/mcp-app/v1/' },
  stdio: ['ignore', 'inherit', 'inherit'],
})
process.on('exit', () => mcp.kill())

createServer(async (req, res) => {
  try {
    const file = join(root, 'dist', new URL(req.url, 'http://x').pathname)
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Access-Control-Allow-Origin': '*' }).end(body)
  } catch {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' }).end()
  }
}).listen(5180, '127.0.0.1')

/** A topic folder as one .loom.oui text, like Studio's export. */
async function topicSource(id) {
  const dir = join(root, 'public/content', id)
  let text = `// @loom-topic ${id}\n// === topic.oui ===\n${await readFile(join(dir, 'topic.oui'), 'utf8')}`
  for (const f of (await readdir(join(dir, 'sections'))).sort()) {
    text += `// === sections/${f} ===\n${await readFile(join(dir, 'sections', f), 'utf8')}`
  }
  return text
}

const vite = await createVite({
  configFile: false,
  root: join(root, 'tests/mcp-host'),
  server: { port: 8090, strictPort: true, host: '127.0.0.1' },
  logLevel: 'warn',
  plugins: [{
    name: 'loom-topics',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const id = /^\/topics\/([\w-]+)\.loom\.oui$/.exec(req.url ?? '')?.[1]
        if (!id) return next()
        try {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(await topicSource(id))
        } catch {
          res.statusCode = 404
          res.end()
        }
      })
    },
  }],
})
await vite.listen()
console.error('Loom MCP test host on http://localhost:8090/ (app from http://localhost:5180/mcp-app/v1/)')
