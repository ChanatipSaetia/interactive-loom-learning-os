// A minimal MCP Apps host for testing on localhost, standing in for a chat app. It connects to the
// spike server, calls show_topic like a model would, and renders the ui:// resource the way hosts
// do: a sandboxed iframe (opaque origin) whose Content Security Policy allows only the origins the
// resource declares. ?drop-domains=1 ignores the declared origins, to show the script is then blocked.
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { AppBridge, PostMessageTransport, getToolUiResourceUri } from '@modelcontextprotocol/ext-apps/app-bridge'

const params = new URLSearchParams(location.search)
const SERVER = params.get('server') ?? 'http://localhost:3001/mcp'
const dropDomains = params.has('drop-domains')
const hostTheme = params.get('theme') === 'light' ? 'light' : 'dark'
document.body.classList.toggle('light', hostTheme === 'light')
const chat = document.getElementById('chat')
const say = (who, text) => {
  const div = document.createElement('div')
  div.className = `msg ${who}`
  div.textContent = text
  chat.append(div)
  return div
}

function cspFor(csp = {}) {
  const res = dropDomains ? [] : (csp.resourceDomains ?? [])
  const con = csp.connectDomains ?? []
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${res.join(' ')}`,
    `style-src 'unsafe-inline' ${res.join(' ')}`,
    `img-src data: blob: ${res.join(' ')}`,
    `font-src ${res.join(' ')}`,
    `media-src data: blob: ${res.join(' ')}`,
    `connect-src ${con.join(' ')}`,
  ].join('; ')
}

async function main() {
  const client = new Client({ name: 'loom-spike-host', version: '0.0.1' })
  await client.connect(new StreamableHTTPClientTransport(new URL(SERVER)))
  const { tools } = await client.listTools()
  const tool = tools.find((t) => t.name === 'show_topic')
  const uri = getToolUiResourceUri(tool)

  const oui = await (await fetch('/topic.oui')).text()
  say('user', 'Teach me Chinese, day 1.')
  say('model', `(calls show_topic with ${oui.length} characters of .loom.oui)`)
  const result = await client.callTool({ name: 'show_topic', arguments: { oui } })

  const { contents } = await client.readResource({ uri })
  const ui = contents[0]
  const meta = ui._meta?.ui ?? {}
  const html = ui.text.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${cspFor(meta.csp)}">`)

  const frame = document.createElement('iframe')
  frame.id = 'app'
  frame.setAttribute('sandbox', 'allow-scripts')
  say('model', '').append(frame)

  const bridge = new AppBridge(
    client,
    { name: 'loom-spike-host', version: '0.0.1' },
    { openLinks: {}, serverTools: {}, logging: {}, updateModelContext: { text: {} }, message: { text: {} } },
    { hostContext: { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'], theme: hostTheme } },
  )
  bridge.oninitialized = async () => {
    await bridge.sendToolInput({ arguments: { oui } })
    await bridge.sendToolResult(result)
  }
  bridge.onrequestdisplaymode = async ({ mode }) => {
    document.body.classList.toggle('fullscreen', mode === 'fullscreen')
    return { mode }
  }
  bridge.onupdatemodelcontext = async (p) => {
    say('context', `model context ← ${p.content?.map((c) => c.text).join(' ')}`)
    return {}
  }
  bridge.onmessage = async (p) => {
    say('user', `${p.content?.map((c) => c.text).join(' ')}  (sent by the app)`)
    return {}
  }
  bridge.onsizechange = ({ height }) => {
    if (height) frame.style.height = `${height}px`
  }
  await bridge.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow))
  frame.srcdoc = html
  // Switching the chat's mode while the app is open, as a host's own theme switch would.
  window.setHostTheme = (theme) => {
    document.body.classList.toggle('light', theme === 'light')
    bridge.sendHostContextChange({ theme })
  }
  window.__spike = { csp: cspFor(meta.csp), resourceDomains: meta.csp?.resourceDomains }
}

main().catch((e) => say('error', String(e?.stack ?? e)))
