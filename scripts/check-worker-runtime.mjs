// Reproducible real-workerd smoke check. Local only: never deploys or needs Cloudflare credentials.
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const port = 8790
const runtime = spawn('npx', ['--yes', 'wrangler@4.146.0', 'dev', '--local', '--port', String(port)], {
  detached: process.platform !== 'win32',
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let exited = false
runtime.on('exit', () => { exited = true })
runtime.on('error', () => { exited = true })
// Drain output; do not copy arbitrary runtime logs or credential configuration into artifacts.
runtime.stdout.resume()
runtime.stderr.resume()
const endpoint = `http://127.0.0.1:${port}/mcp`
async function call(name, args = {}) {
  const response = await fetch(endpoint, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: name ? 'tools/call' : 'tools/list', ...(name ? { params: { name, arguments: args } } : {}) }),
  })
  assert.equal(response.status, 200)
  const raw = await response.text()
  const data = JSON.parse(raw.startsWith('{') ? raw : raw.split('\n').find((line) => line.startsWith('data: ')).slice(6))
  assert.ok(!data.error)
  assert.ok(!data.result.isError)
  return data.result
}
try {
  let ready = false
  for (let attempt = 0; attempt < 100 && !exited; attempt++) {
    try {
      const response = await fetch(endpoint, { method: 'OPTIONS', signal: AbortSignal.timeout(1000) })
      if (response.status === 204) { ready = true; break }
    } catch { /* runtime is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  assert.ok(ready, 'Local workerd did not become ready; inspect Wrangler directly for startup diagnostics')
  const names = (await call()).tools.map((tool) => tool.name)
  for (const name of ['get_loom_capabilities', 'get_topic_context', 'validate_topic_plan', 'get_authoring_guide']) assert.ok(names.includes(name))
  for (const name of ['read_learning_record', 'write_learning_record', 'get_learning_checkpoint', 'record_events', 'validate_section']) assert.ok(!names.includes(name))
  const guide = (await call('get_authoring_guide', { components: ['QuizQuestion'] })).content[0].text
  assert.match(guide, /^QuizQuestion\(/m)
  assert.match(guide, /^QuizChoice\(/m)
  assert.equal(JSON.parse((await call('validate_topic_plan', { plan: null })).content[0].text).valid, false)
  const context = JSON.parse((await call('get_topic_context', { files: { 'sections/text.oui': 'root = Text("T", ["One"])' }, roots: ['sections/text.oui'] })).content[0].text)
  assert.equal(context.sources.length, 1)
  assert.equal(context.truncated, false)
  console.log('Real workerd: startup, stateless tools, focused references, runtime input validation and source context passed.')
} finally {
  if (runtime.pid) {
    try { process.platform === 'win32' ? runtime.kill() : process.kill(-runtime.pid, 'SIGTERM') } catch { /* already stopped */ }
  }
}
