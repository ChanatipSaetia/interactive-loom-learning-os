/**
 * A tiny OpenAI-compatible server for AI assistant tests
 * (grill-log-ai-assistant.md, decision 62): canned `GET /v1/models` and a
 * streaming `POST /v1/chat/completions` that echoes the last user message
 * (or, for `REPLY<<text>>` in it, answers with exactly that text).
 *
 * `TOOL<<name {json args}>>` in the last user message makes it call that
 * tool once (streamed in pieces, as servers do) when the request offers
 * tools; once the result is back it answers `Tool said: <first line>`.
 *
 *   node tests/e2e/fixtures/mock-openai-server.mjs [port] [--no-cors]
 *
 * `--no-cors` leaves out the CORS headers, the way Ollama answers pages that
 * are not on its allow list. An `Authorization: Bearer bad` header gets 401.
 */
/* global process, console, setInterval, clearInterval */
import { createServer } from 'node:http'

export function startMockOpenAI({ port = 0, cors = true, models = ['mock-small', 'mock-large'] } = {}) {
  const server = createServer((req, res) => {
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-title, http-referer')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Private-Network', 'true')
    }
    if (req.method === 'OPTIONS') return res.writeHead(204).end()
    if (req.headers.authorization === 'Bearer bad') {
      return res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: { message: 'Invalid API key' } }))
    }
    if (req.method === 'GET' && req.url === '/v1/models') {
      return res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ object: 'list', data: models.map((id) => ({ id, object: 'model' })) }))
    }
    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        const request = JSON.parse(body || '{}')
        const last = [...(request.messages ?? [])].reverse().find((message) => message.role === 'user')
        // `REPLY<<…>>` in the last user message is answered with exactly that text.
        const scripted = /REPLY<<([\s\S]*?)>>/.exec(last?.content ?? '')
        // The echo leaves out the <topic-context> block a user turn can start with.
        let reply = scripted ? scripted[1] : `Echo: ${(last?.content ?? '').replace(/^<topic-context[\s\S]*?<\/topic-context>\n\n/, '')}`
        const tool = /TOOL<<(\w+) ([\s\S]*?)>>/.exec(last?.content ?? '')
        const lastIndex = (request.messages ?? []).lastIndexOf(last)
        const results = (request.messages ?? []).slice(lastIndex + 1).filter((message) => message.role === 'tool')
        if (tool && request.tools?.length && !results.length) {
          res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
          const args = tool[2]
          const half = Math.floor(args.length / 2)
          const pieces = [
            { index: 0, id: 'call_mock', type: 'function', function: { name: tool[1], arguments: args.slice(0, half) } },
            { index: 0, function: { arguments: args.slice(half) } },
          ]
          for (const piece of pieces) res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { tool_calls: [piece] }, finish_reason: null }] })}\n\n`)
          res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'tool_calls' }] })}\n\n`)
          return res.end('data: [DONE]\n\n')
        }
        if (tool && results.length) reply = `Tool said: ${results[results.length - 1].content.split('\n')[0]}`
        if (!request.stream) {
          return res
            .writeHead(200, { 'content-type': 'application/json' })
            .end(JSON.stringify({ choices: [{ index: 0, message: { role: 'assistant', content: reply }, finish_reason: 'stop' }] }))
        }
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
        const words = reply.split(/(?<= )/)
        let i = 0
        const timer = setInterval(() => {
          if (i < words.length) {
            res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: words[i++] }, finish_reason: null }] })}\n\n`)
            return
          }
          clearInterval(timer)
          res.write(`data: ${JSON.stringify({ choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`)
          res.end('data: [DONE]\n\n')
        }, 20)
        res.on('close', () => clearInterval(timer))
      })
      return
    }
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404 page not found')
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, close: () => new Promise((done) => server.close(done)) }))
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.argv[2]) || 11500
  const { port: actual } = await startMockOpenAI({ port, cors: !process.argv.includes('--no-cors') })
  console.log(`Mock OpenAI server on http://127.0.0.1:${actual}/v1`)
}
