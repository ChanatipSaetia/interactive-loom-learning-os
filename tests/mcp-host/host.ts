/**
 * A minimal MCP Apps host on localhost, standing in for a chat app (slice 0 in
 * grill-log-adaptive-learning.md): it connects to the Loom MCP server, plays
 * the model (validate_topic, then show_topic with a topic from public/content)
 * and renders the app's ui:// resource the way chat apps do, in a sandboxed
 * iframe with an opaque origin and a Content Security Policy built from the
 * origins the resource declares (no unsafe-eval).
 *
 *   ?topic=<id>      topic to show (default chinese101-day1)
 *   ?broken=1        break one section first, to see the error path
 *   ?theme=light     the chat's light mode
 *   ?mode=read       ask show_topic to open in Read
 */
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { AppBridge, PostMessageTransport, getToolUiResourceUri } from '@modelcontextprotocol/ext-apps/app-bridge'

interface Csp {
  resourceDomains?: string[]
  connectDomains?: string[]
}

const params = new URLSearchParams(location.search)
const SERVER = params.get('server') ?? 'http://localhost:3001/mcp'
const topicId = params.get('topic') ?? 'chinese101-day1'
const theme = params.get('theme') === 'light' ? 'light' : 'dark'
document.body.classList.toggle('light', theme === 'light')

const chat = document.getElementById('chat')!
const say = (who: string, text: string) => {
  const div = document.createElement('div')
  div.className = `msg ${who}`
  div.textContent = text
  chat.append(div)
  return div
}
const textOf = (result: unknown) =>
  ((result as { content?: Array<{ text?: string }> }).content ?? []).map((c) => c.text ?? '').join(' ')

function cspFor(csp: Csp = {}): string {
  const res = (csp.resourceDomains ?? []).join(' ')
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${res}`,
    `style-src 'unsafe-inline' ${res}`,
    `img-src data: blob: ${res}`,
    `font-src data: ${res}`,
    `media-src data: blob: ${res}`,
    `connect-src ${(csp.connectDomains ?? []).join(' ')}`,
  ].join('; ')
}

async function main() {
  const client = new Client({ name: 'loom-test-host', version: '0.1.0' })
  await client.connect(new StreamableHTTPClientTransport(new URL(SERVER)))
  const { tools } = await client.listTools()
  const show = tools.find((t) => t.name === 'show_topic')!
  const uri = getToolUiResourceUri(show)!

  let oui = await (await fetch(`/topics/${topicId}.loom.oui`)).text()
  if (params.has('broken')) oui = oui.replace(/root = Quiz\(/, 'root = Quizz(')
  say('user', `Teach me: ${topicId}`)

  const check = await client.callTool({ name: 'validate_topic', arguments: { oui } })
  say('model', `validate_topic → ${textOf(check).slice(0, 160)}`)

  const args: Record<string, unknown> = { oui }
  if (params.get('mode') === 'read') args.mode = 'read'
  const result = await client.callTool({ name: 'show_topic', arguments: args })
  say('model', `show_topic → ${textOf(result).slice(0, 160)}`)

  const { contents } = await client.readResource({ uri })
  const ui = contents[0] as { text: string; _meta?: { ui?: { csp?: Csp } } }
  const html = ui.text.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${cspFor(ui._meta?.ui?.csp)}">`)

  const frame = document.createElement('iframe')
  frame.id = 'app'
  frame.setAttribute('sandbox', 'allow-scripts')
  say('model', '').append(frame)

  const bridge = new AppBridge(
    client,
    { name: 'loom-test-host', version: '0.1.0' },
    { openLinks: {}, serverTools: {}, logging: {}, updateModelContext: { text: {} }, message: { text: {} } },
    { hostContext: { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'], theme } },
  )
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: args })
    await bridge.sendToolResult(result as Parameters<typeof bridge.sendToolResult>[0])
  }
  bridge.onrequestdisplaymode = async ({ mode }) => {
    document.body.classList.toggle('fullscreen', mode === 'fullscreen')
    return { mode }
  }
  bridge.onupdatemodelcontext = async (p) => {
    say('context', `model context ← ${textOf(p).slice(0, 200)}`)
    return {}
  }
  bridge.onmessage = async (p) => {
    say('user', `(from the app) ${textOf(p).slice(0, 200)}`)
    return {}
  }
  bridge.onsizechange = ({ height }) => {
    if (height && !document.body.classList.contains('fullscreen')) frame.style.height = `${Math.min(height, 900)}px`
  }
  await bridge.connect(new PostMessageTransport(frame.contentWindow!, frame.contentWindow!))
  frame.srcdoc = html
  Object.assign(window, { setHostTheme: (t: 'light' | 'dark') => { document.body.classList.toggle('light', t === 'light'); void bridge.sendHostContextChange({ theme: t }) } })
}

main().catch((e) => say('error', String(e?.stack ?? e)))
