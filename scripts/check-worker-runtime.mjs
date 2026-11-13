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
  const entry = JSON.parse((await call('read_reference', { path: 'index.md' })).content[0].text)
  assert.equal(entry.path, 'index.md')
  assert.equal(entry.next[0].path, 'workflow/understand.md')
  assert.ok(!entry.content.includes('QuizQuestion('))
  const names = (await call()).tools.map((tool) => tool.name).sort()
  assert.deepEqual(names, ['get_topic_context', 'read_reference', 'show_domain', 'show_library', 'show_topic', 'validate_topic_plan'].sort())
  const read = async (path) => JSON.parse((await call('read_reference', { path })).content[0].text)
  assert.match((await read('components/QuizQuestion.md')).content, /^QuizQuestion\(/m)
  assert.match((await read('components/LessonText.md')).content, /^LessonText\(title: string, paragraphs:/m)
  assert.match((await read('components/Text.md')).content, /^Text\(variant\?/m)
  const flow = await read('capabilities/Flowchart.md')
  assert.match(flow.content, /sequence/)
  assert.match(flow.content, /data-flow/)
  const schema = JSON.parse((await read('contracts/topic-plan.schema.json')).content)
  assert.ok(schema.properties.sections.items.required.includes('components'))
  assert.equal((await read('runtime.md')).deployment.serverValidationAvailable, false)
  const plan = { schemaVersion: 1, topicId: 'selection-smoke', goal: 'Compare authoring capabilities', objectives: [{ id: 'compare', description: 'Compare authoring capabilities' }], sections: [{ id: 'comparison', title: 'Capabilities', objectiveRefs: ['compare'], components: ['LessonText'], activity: 'Read the comparison', rationale: 'Text explains complex concepts clearly.' }] }
  const review = JSON.parse((await call('validate_topic_plan', { plan })).content[0].text)
  assert.equal(review.valid, true)
  assert.ok(review.advisoryDiagnostics.some((diagnostic) => diagnostic.code === 'UNJUSTIFIED_TEXT_SELECTION'))
  const listPlan = { ...plan, sections: plan.sections.map((section) => ({ ...section, components: ['Bullets'], activity: 'Compare matching authoring attributes' })) }
  const listReview = JSON.parse((await call('validate_topic_plan', { plan: listPlan })).content[0].text)
  assert.equal(listReview.valid, true)
  assert.ok(listReview.advisoryDiagnostics.some((diagnostic) => diagnostic.code === 'LIST_STRUCTURE_REVIEW'))
  const shown = await call('show_topic', { oui: '// @loom-topic selection-smoke', plan })
  assert.equal(shown.structuredContent.experienceReadiness.status, 'review-needed')
  assert.ok(shown.structuredContent.advisoryDiagnostics.some((diagnostic) => diagnostic.code === 'UNJUSTIFIED_TEXT_SELECTION'))
  assert.equal(JSON.parse((await call('validate_topic_plan', { plan: null })).content[0].text).valid, false)
  const context = JSON.parse((await call('get_topic_context', { files: { 'sections/text.oui': "root = Page(\"T\", LessonText(\"T\", [\"One\"]))" }, roots: ['sections/text.oui'] })).content[0].text)
  assert.equal(context.sources.length, 1)
  assert.equal(context.truncated, false)
  console.log('Real workerd: startup, stateless tools, focused references, runtime input validation, representation readiness and source context passed.')
} finally {
  if (runtime.pid) {
    try { process.platform === 'win32' ? runtime.kill() : process.kill(-runtime.pid, 'SIGTERM') } catch { /* already stopped */ }
  }
}
