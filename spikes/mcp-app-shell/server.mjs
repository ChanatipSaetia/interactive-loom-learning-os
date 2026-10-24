// Slice 0 spike (decisions 181–189): one MCP App tool whose ui:// shell loads its script from a
// separate origin declared in _meta.ui.csp.resourceDomains, standing in for GitHub Pages.
//   node server.mjs --stdio                 for Goose, Claude Desktop, VS Code
//   node server.mjs --http [port]           Streamable HTTP on localhost (default 3001)
// ASSET_ORIGIN (default http://localhost:5180) is where app.js is served from.
import { createServer } from 'node:http'
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { toNodeHandler } from '@modelcontextprotocol/node'
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'

const ASSET_ORIGIN = process.env.ASSET_ORIGIN ?? 'http://localhost:5180'
const UI_URI = 'ui://loom/spike.html'

// The shell is all the server returns; everything else comes from ASSET_ORIGIN.
const shell = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Loom spike</title></head>
<body><div id="root">Loading Loom from ${ASSET_ORIGIN}…</div>
<script type="module" src="${ASSET_ORIGIN}/app.js"></script></body></html>`

function makeServer() {
  const server = new McpServer({ name: 'loom-spike', version: '0.0.1' }, { capabilities: { tools: {}, resources: {} } })

  registerAppResource(server, 'Loom spike view', UI_URI, {
    description: 'Shell that loads the Loom app from its asset origin',
  }, async () => ({
    contents: [{
      uri: UI_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: shell,
      _meta: { ui: { csp: { resourceDomains: [ASSET_ORIGIN] }, prefersBorder: true } },
    }],
  }))

  registerAppTool(server, 'show_topic', {
    title: 'Show a Loom topic',
    description: 'Show a Loom topic (.loom.oui text) in the chat, ready to play in Present.',
    inputSchema: z.object({ oui: z.string().describe('The whole topic as .loom.oui text') }),
    _meta: { ui: { resourceUri: UI_URI } },
  }, async ({ oui }) => ({
    content: [{ type: 'text', text: `Showing a Loom topic (${oui.length} characters). The learner can press Play.` }],
  }))

  return server
}

const args = process.argv.slice(2)
if (args.includes('--stdio')) {
  serveStdio(makeServer)
} else {
  const port = Number(args[args.indexOf('--http') + 1]) || 3001
  const handler = toNodeHandler(createMcpHandler(makeServer))
  createServer(async (req, res) => {
    // The test host calls from another localhost origin.
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Expose-Headers', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    if (req.method === 'OPTIONS') return res.writeHead(204).end()
    if (!req.url?.startsWith('/mcp')) return res.writeHead(404).end()
    await handler(req, res)
  }).listen(port, () => console.error(`loom-spike MCP on http://localhost:${port}/mcp, assets from ${ASSET_ORIGIN}`))
}
