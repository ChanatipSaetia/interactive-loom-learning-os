import { describe, expect, it } from 'vitest'
import worker from '../../../src/mcp/worker'

const HEADERS = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': '2025-06-18' }

/** One stateless 2025-era request, as a chat's connector sends it. */
async function call(body: unknown, env = {}) {
  const response = await worker.fetch(new Request('https://loom-mcp.example.workers.dev/mcp', { method: 'POST', headers: HEADERS, body: JSON.stringify(body) }), env)
  const text = await response.text()
  const data = text.startsWith('{') ? text : text.split('\n').find((line) => line.startsWith('data: '))!.slice(6)
  return { response, result: JSON.parse(data).result }
}

describe('hosted Loom MCP endpoint (slice 5)', () => {
  it('lists the hosted tools, with CORS for chats in the browser', async () => {
    const { response, result } = await call({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(result.tools.map((t: { name: string }) => t.name).sort()).toEqual(['get_authoring_guide', 'get_storage_guide', 'get_tutor_guide', 'show_domain', 'show_library', 'show_topic'])
  })

  it('points the app at its own assets, or at LOOM_APP_URL', async () => {
    const read = { jsonrpc: '2.0', id: 2, method: 'resources/read', params: { uri: 'ui://loom/app-v1.html' } }
    expect((await call(read)).result.contents[0].text).toContain('src="https://loom-mcp.example.workers.dev/mcp-app/v1/app.js"')
    const pages = await call(read, { LOOM_APP_URL: 'https://chanatipsaetia.github.io/interactive-loom-learning-os/mcp-app/v1/' })
    expect(pages.result.contents[0].text).toContain('src="https://chanatipsaetia.github.io/interactive-loom-learning-os/mcp-app/v1/app.js"')
  })

  it('leaves the Viewer link out unless asked, since it cannot know whether the chat shows apps', async () => {
    const show = (args: object) => call({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'show_topic', arguments: { oui: '// @loom-topic t', ...args } } })
    const plain = (await show({})).result.content[0].text
    expect(plain).toContain('viewerLink: true')
    expect(plain).not.toContain('viewer.html')
    expect((await show({ viewerLink: true })).result.content[0].text).toContain('https://loom-mcp.example.workers.dev/viewer.html#present&oui=')
  })

  it('answers preflight requests and nothing but /mcp', async () => {
    expect((await worker.fetch(new Request('https://x.workers.dev/mcp', { method: 'OPTIONS' }), {})).status).toBe(204)
    expect((await worker.fetch(new Request('https://x.workers.dev/other'), {})).status).toBe(404)
  })
})
