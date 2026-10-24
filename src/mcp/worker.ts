/**
 * The hosted Loom MCP endpoint on Cloudflare Workers (slice 5, decisions 181,
 * 184 and 185 in grill-log-adaptive-learning.md): Streamable HTTP at `/mcp`
 * for chats on the web and the phone, with no sign-in and nothing stored.
 * Topics pass through unchecked (the free plan's 10 ms CPU limit); the app
 * checks them in the learner's browser and hands errors back to the chat.
 *
 * The Worker also serves the built site (`dist/`) as static assets, so the
 * app it points chats at always matches this release (the alternative named
 * in decision 182). `LOOM_APP_URL` points at another copy of the app, such as
 * GitHub Pages, instead.
 */
import { createMcpHandler, type McpHttpHandler } from '@modelcontextprotocol/server'
import { createLoomServer } from './server'

interface Env {
  /** Base URL of the app's `app.js` and `app.css`, ending in `/`; default: this Worker's own `/mcp-app/v1/`. */
  LOOM_APP_URL?: string
}

/** Chats in the browser (and test hosts) call from other origins. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

/** One handler per app URL, kept for as long as the isolate lives. */
const handlers = new Map<string, McpHttpHandler>()

function handlerFor(appUrl: string): McpHttpHandler {
  let handler = handlers.get(appUrl)
  if (!handler) {
    handler = createMcpHandler(() => createLoomServer({ appUrl }))
    handlers.set(appUrl, handler)
  }
  return handler
}

function withCors(response: Response): Response {
  const out = new Response(response.body, response)
  for (const [name, value] of Object.entries(CORS)) out.headers.set(name, value)
  return out
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Static assets answer every other path before the Worker runs
    if (url.pathname !== '/mcp') return new Response('Not found. The Loom MCP endpoint is /mcp.', { status: 404 })
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    const appUrl = env.LOOM_APP_URL || `${url.origin}/mcp-app/v1/`
    return withCors(await handlerFor(appUrl).fetch(request))
  },
}
