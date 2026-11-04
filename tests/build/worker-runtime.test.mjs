import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Build-level guard plus bundled request test; actual workerd validation is a separate runtime check.
test('Worker bundle imports no Node runtime and lists only stateless public contracts', async () => {
  const path = new URL('../../dist-worker/worker.mjs', import.meta.url)
  const source = await readFile(path, 'utf8')
  assert.doesNotMatch(source, /(?:from\s*|import\s*\(|require\s*\()["']node:/)
  assert.doesNotMatch(source, /from\s*["'](?:fs|path|os|http|https|crypto)["']/)
  const { default: worker } = await import(path.href)
  const response = await worker.fetch(new Request('https://loom.example/mcp', {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  }), {})
  const text = await response.text()
  const data = JSON.parse(text.startsWith('{') ? text : text.split('\n').find((line) => line.startsWith('data: ')).slice(6))
  const names = data.result.tools.map((tool) => tool.name)
  for (const name of ['get_topic_context', 'get_loom_capabilities', 'validate_topic_plan', 'show_topic']) assert.ok(names.includes(name))
  for (const name of ['get_learning_checkpoint', 'read_learning_record', 'write_learning_record', 'validate_section', 'record_events']) assert.ok(!names.includes(name))
})
