/**
 * Command line of the Loom MCP server.
 *   loom-mcp --stdio            for chats on this computer (Goose, Claude Desktop, VS Code)
 *   loom-mcp --http [port]      Streamable HTTP on localhost (default 3001), for testing
 *   --memory <folder>           where the learner's events and topics are kept (default ~/.loom)
 *   --no-memory                 keep nothing
 * LOOM_APP_URL overrides where the app is loaded from (default: GitHub Pages); LOOM_MEMORY_DIR the memory folder.
 */
// @ts-expect-error Node's http has no types in this project (see tests/unit/sections/present/helpers.ts)
import { createServer } from 'node:http'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { toNodeHandler, type NodeIncomingMessageLike, type NodeServerResponseLike } from '@modelcontextprotocol/node'
import { createLoomServer } from './server'
import { defaultMemoryDir, folderStore } from './memory-folder'

/** The part of Node's `process` this file uses (Node's types are not part of this project). */
declare const process: { argv: string[]; env: Record<string, string | undefined> }

type Response = NodeServerResponseLike & { setHeader(name: string, value: string): void }

const args = process.argv.slice(2)
const memoryDir = args.includes('--memory') ? args[args.indexOf('--memory') + 1] : process.env.LOOM_MEMORY_DIR || defaultMemoryDir()
const options = {
  appUrl: process.env.LOOM_APP_URL || undefined,
  store: args.includes('--no-memory') ? undefined : folderStore(memoryDir),
}

if (args.includes('--http')) {
  const port = Number(args[args.indexOf('--http') + 1]) || 3001
  const handler = toNodeHandler(createMcpHandler(() => createLoomServer(options)))
  createServer(async (req: NodeIncomingMessageLike, res: Response) => {
    // Browser-based test hosts call from another localhost origin.
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Expose-Headers', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    if (req.method === 'OPTIONS' || !req.url?.startsWith('/mcp')) {
      res.writeHead(req.method === 'OPTIONS' ? 204 : 404)
      res.end()
      return
    }
    await handler(req, res)
  }).listen(port, '127.0.0.1', () => console.error(`Loom MCP server on http://localhost:${port}/mcp`))
} else {
  serveStdio(() => createLoomServer(options))
}
