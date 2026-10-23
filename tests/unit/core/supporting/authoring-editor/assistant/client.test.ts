import { describe, expect, it, vi } from 'vitest'
import {
  AssistantError,
  SSEDecoder,
  chatCompletion,
  listModels,
  isLocalNetworkHost,
  normalizeBaseUrl,
  testConnection,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

const enc = new TextEncoder()

/** A streaming response that sends the given pieces one by one. */
function sse(pieces: string[], init: ResponseInit = {}): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(enc.encode(piece))
      controller.close()
    },
  })
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' }, ...init })
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

const chunk = (content: string, finish?: string) =>
  JSON.stringify({ choices: [{ delta: { content }, finish_reason: finish ?? null }] })

const local = { baseUrl: 'http://localhost:11434/v1/' }
const page = { pageUrl: 'http://localhost:5173/viewer.html' }

describe('SSEDecoder', () => {
  it('splits events across chunks, with CRLF, missing spaces and comments', () => {
    const decoder = new SSEDecoder()
    expect(decoder.push(': keep-alive\r\ndata: {"a"')).toEqual([])
    expect(decoder.push(':1}\r')).toEqual([])
    expect(decoder.push('\n\r\ndata:{"b":2}\n\n')).toEqual(['{"a":1}', '{"b":2}'])
  })

  it('joins multi-line data, skips other fields and keeps bare JSON lines', () => {
    const decoder = new SSEDecoder()
    expect(decoder.push('event: message\nid: 3\ndata: one\ndata: two\n\n{"c":3}\n')).toEqual(['one\ntwo', '{"c":3}'])
  })

  it('flushes an event that ends without a blank line', () => {
    const decoder = new SSEDecoder()
    expect(decoder.push('data: [DONE]')).toEqual([])
    expect(decoder.flush()).toEqual(['[DONE]'])
  })
})

describe('isLocalNetworkHost', () => {
  it('knows private IP literals and .local names', () => {
    for (const host of ['192.168.1.112', '10.0.0.5', '100.100.124.7', '100.64.0.1', '100.127.255.254', '172.16.0.1', '172.31.255.1', '169.254.1.1', 'nas.local', '[fd12::1]', '[fe80::1]']) {
      expect(isLocalNetworkHost(host)).toBe(true)
    }
    for (const host of ['172.32.0.1', '100.63.0.1', '100.128.0.1', '8.8.8.8', 'localhost', 'example.com', 'local.example.com', '[2001:db8::1]']) {
      expect(isLocalNetworkHost(host)).toBe(false)
    }
  })
})

describe('normalizeBaseUrl', () => {
  it('drops trailing slashes and rejects other schemes', () => {
    expect(normalizeBaseUrl(' https://openrouter.ai/api/v1// ')).toBe('https://openrouter.ai/api/v1')
    expect(normalizeBaseUrl('localhost:11434')).toBeNull()
    expect(normalizeBaseUrl('ftp://x/v1')).toBeNull()
  })
})

describe('listModels and testConnection', () => {
  it('lists OpenAI-style models and sends the key and extra headers', async () => {
    const fetch = vi.fn(async () => json({ object: 'list', data: [{ id: 'qwen3:8b' }, { id: 'llama3.2' }] }))
    const models = await listModels({ ...local, apiKey: ' sk-1 ', headers: { 'X-Title': 'Loom', Empty: ' ' } }, { fetch, ...page })
    expect(models).toEqual(['llama3.2', 'qwen3:8b'])
    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/v1/models', expect.objectContaining({
      headers: { 'X-Title': 'Loom', Authorization: 'Bearer sk-1' },
    }))
  })

  it('accepts { models: [...] } and bare lists', async () => {
    expect(await listModels(local, { fetch: async () => json({ models: [{ name: 'a' }] }), ...page })).toEqual(['a'])
    expect(await listModels(local, { fetch: async () => json(['b', 'b']), ...page })).toEqual(['b'])
  })

  it('reports a 404 as a wrong path', async () => {
    const report = await testConnection(local, { fetch: async () => new Response('404 page not found', { status: 404 }), ...page })
    expect(report).toMatchObject({ ok: false, error: { kind: 'not-found', status: 404, message: '404 page not found' } })
  })

  it('reports a refused key with the server message', async () => {
    const fetch = async () => json({ error: { message: 'No auth credentials found', code: 401 } }, 401)
    const report = await testConnection({ baseUrl: 'https://openrouter.ai/api/v1' }, { fetch, ...page })
    expect(report).toMatchObject({ ok: false, error: { kind: 'auth', message: 'No auth credentials found' } })
  })

  it('reports an empty list as no models', async () => {
    const report = await testConnection(local, { fetch: async () => json({ data: [] }), ...page })
    expect(report).toMatchObject({ ok: false, error: { kind: 'no-models' } })
  })

  it('reports a failed fetch (CORS, server down) as a network error', async () => {
    const fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    const report = await testConnection(local, { fetch, ...page })
    expect(report).toMatchObject({ ok: false, error: { kind: 'network', message: 'Could not reach localhost:11434.' } })
  })

  it('blocks plain http to a public IP from an https page without sending anything', async () => {
    const fetch = vi.fn()
    const report = await testConnection({ baseUrl: 'http://8.8.8.8:8080/v1' }, { fetch, pageUrl: 'https://example.github.io/viewer.html' })
    expect(report).toMatchObject({ ok: false, error: { kind: 'mixed-content' } })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends Tailscale addresses and names over http as local-network requests; https and loopback stay unmarked', async () => {
    const fetch = vi.fn(async () => json({ data: [{ id: 'm' }] }))
    const https = { pageUrl: 'https://example.github.io/' }
    await testConnection({ baseUrl: 'http://100.100.124.7:8080/v1' }, { fetch, ...https })
    await testConnection({ baseUrl: 'http://box.tail1234.ts.net:8080/v1' }, { fetch, ...https })
    await testConnection({ baseUrl: 'https://openrouter.ai/api/v1' }, { fetch, ...https })
    await testConnection({ baseUrl: 'http://localhost:11434/v1' }, { fetch, ...https })
    const marks = fetch.mock.calls.map((call) => (call as unknown as [string, RequestInit & { targetAddressSpace?: string }])[1].targetAddressSpace)
    expect(marks).toEqual(['local', 'local', undefined, undefined])
  })

  it('sends plain http to the local network from an https page, marked for Local Network Access', async () => {
    const fetch = vi.fn(async () => json({ data: [{ id: 'm' }] }))
    const report = await testConnection({ baseUrl: 'http://192.168.1.112:8080/v1' }, { fetch, pageUrl: 'https://example.github.io/viewer.html' })
    expect(report).toEqual({ ok: true, models: ['m'] })
    expect(fetch).toHaveBeenCalledWith('http://192.168.1.112:8080/v1/models', expect.objectContaining({ targetAddressSpace: 'local' }))
  })

  it('says local network access is needed when such a request fails', async () => {
    const fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    const report = await testConnection({ baseUrl: 'http://studio-box.local:1234/v1' }, { fetch, pageUrl: 'https://example.github.io/' })
    expect(report).toMatchObject({ ok: false, error: { kind: 'local-network' } })
    // The same failure from an http page is an ordinary network error.
    const plain = await testConnection({ baseUrl: 'http://studio-box.local:1234/v1' }, { fetch, pageUrl: 'http://localhost:5173/' })
    expect(plain).toMatchObject({ ok: false, error: { kind: 'network' } })
  })

  it('lets an https page call http://localhost', async () => {
    const report = await testConnection(local, { fetch: async () => json({ data: [{ id: 'm' }] }), pageUrl: 'https://example.github.io/' })
    expect(report).toEqual({ ok: true, models: ['m'] })
  })

  it('rejects a base URL that is not http(s)', async () => {
    const report = await testConnection({ baseUrl: 'localhost:11434' }, { fetch: vi.fn(), ...page })
    expect(report).toMatchObject({ ok: false, error: { kind: 'invalid-url' } })
  })
})

describe('chatCompletion', () => {
  const messages = [{ role: 'user' as const, content: 'Hi' }]

  it('streams deltas, ignoring keep-alives, missing usage and text after [DONE]', async () => {
    const fetch = vi.fn(async () =>
      sse([`data: ${chunk('Hel')}\n\n: ping\n\n`, `data:${chunk('lo')}\r\n\r\n`, `data: ${chunk('', 'stop')}\n\ndata: [DONE]\n\ndata: ${chunk('!')}\n\n`]),
    )
    const deltas: string[] = []
    const result = await chatCompletion(local, { model: 'm', messages, onDelta: (d) => deltas.push(d) }, { fetch, ...page })
    expect(result).toEqual({ text: 'Hello', finishReason: 'stop', streamed: true })
    expect(deltas).toEqual(['Hel', 'lo'])
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://localhost:11434/v1/chat/completions')
    expect(JSON.parse(init.body as string)).toEqual({ model: 'm', messages, stream: true })
  })

  it('reads a stream that never sends [DONE] or a closing blank line', async () => {
    const result = await chatCompletion(local, { model: 'm', messages }, { fetch: async () => sse([`data: ${chunk('a')}\n\ndata: ${chunk('b')}`]), ...page })
    expect(result.text).toBe('ab')
  })

  it('takes a one-piece JSON answer from a server that ignores stream', async () => {
    const fetch = async () => json({ choices: [{ message: { role: 'assistant', content: 'Whole' }, finish_reason: 'stop' }] })
    const deltas: string[] = []
    const result = await chatCompletion(local, { model: 'm', messages, onDelta: (d) => deltas.push(d) }, { fetch, ...page })
    expect(result).toEqual({ text: 'Whole', finishReason: 'stop', streamed: false })
    expect(deltas).toEqual(['Whole'])
  })

  it('reads SSE sent with the wrong content type', async () => {
    const fetch = async () => new Response(`data: ${chunk('x')}\n\ndata: [DONE]\n\n`, { headers: { 'content-type': 'text/plain' } })
    expect((await chatCompletion(local, { model: 'm', messages }, { fetch, ...page })).text).toBe('x')
  })

  it('retries once without streaming when the server rejects stream', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ error: 'stream not supported' }, 400))
      .mockResolvedValueOnce(json({ choices: [{ message: { content: 'Plain' } }] }))
    const result = await chatCompletion(local, { model: 'm', messages }, { fetch, ...page })
    expect(result).toEqual({ text: 'Plain', finishReason: undefined, streamed: false })
    expect(JSON.parse((fetch.mock.calls[1][1] as RequestInit).body as string).stream).toBe(false)
  })

  it('retries without streaming when the stream breaks before any text', async () => {
    const broken = new Response(
      new ReadableStream({
        pull(controller) {
          controller.error(new Error('reset'))
        },
      }),
      { headers: { 'content-type': 'text/event-stream' } },
    )
    const fetch = vi.fn().mockResolvedValueOnce(broken).mockResolvedValueOnce(json({ choices: [{ message: { content: 'ok' } }] }))
    expect((await chatCompletion(local, { model: 'm', messages }, { fetch, ...page })).text).toBe('ok')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('keeps the partial text and does not retry when a stream breaks midway', async () => {
    let sent = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (!sent) {
          sent = true
          controller.enqueue(enc.encode(`data: ${chunk('part')}\n\n`))
        } else controller.error(new Error('reset'))
      },
    })
    const fetch = vi.fn(async () => new Response(body, { headers: { 'content-type': 'text/event-stream' } }))
    const error = await chatCompletion(local, { model: 'm', messages }, { fetch, ...page }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AssistantError)
    expect(error).toMatchObject({ kind: 'bad-response', partial: 'part' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('reports an error sent inside the stream', async () => {
    const fetch = vi.fn(async () => sse([`data: {"error":{"message":"Model overloaded"}}\n\n`]))
    await expect(chatCompletion(local, { model: 'm', messages }, { fetch, ...page })).rejects.toMatchObject({ kind: 'http', message: 'Model overloaded' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry a refused key or an unreachable server', async () => {
    const auth = vi.fn(async () => json({ error: { message: 'bad key' } }, 401))
    await expect(chatCompletion(local, { model: 'm', messages }, { fetch: auth, ...page })).rejects.toMatchObject({ kind: 'auth' })
    expect(auth).toHaveBeenCalledTimes(1)
    const down = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(chatCompletion(local, { model: 'm', messages }, { fetch: down, ...page })).rejects.toMatchObject({ kind: 'network' })
    expect(down).toHaveBeenCalledTimes(1)
  })

  it('reports Stop as aborted', async () => {
    const controller = new AbortController()
    const fetch = vi.fn(async (_url: string, init: RequestInit) => {
      controller.abort()
      if (init.signal?.aborted) throw new DOMException('aborted', 'AbortError')
      return json({})
    })
    await expect(chatCompletion(local, { model: 'm', messages, signal: controller.signal }, { fetch: fetch as unknown as typeof globalThis.fetch, ...page })).rejects.toMatchObject({ kind: 'aborted' })
  })
})

describe('chatCompletion with tools (decision 120)', () => {
  const messages = [{ role: 'user' as const, content: 'Hi' }]
  const tools = [{ type: 'function', function: { name: 'read', description: 'Read.', parameters: { type: 'object' } } }]
  const toolChunk = (calls: unknown[], finish?: string) => JSON.stringify({ choices: [{ delta: { tool_calls: calls }, finish_reason: finish ?? null }] })

  it('sends the tools and tool_choice, and assembles streamed tool calls by index', async () => {
    const fetch = vi.fn(async () =>
      sse([
        `data: ${toolChunk([{ index: 0, id: 'call_a', type: 'function', function: { name: 'read', arguments: '' } }])}\n\n`,
        `data: ${toolChunk([{ index: 0, function: { arguments: '{"address":' } }])}\n\n`,
        `data: ${toolChunk([{ index: 0, function: { arguments: '"quiz"}' } }, { index: 1, id: 'call_b', function: { name: 'navigate', arguments: '{}' } }])}\n\n`,
        `data: ${toolChunk([], 'tool_calls')}\n\ndata: [DONE]\n\n`,
      ]),
    )
    const result = await chatCompletion(local, { model: 'm', messages, tools, toolChoice: 'none' }, { fetch, ...page })
    expect(result.toolCalls).toEqual([
      { id: 'call_a', type: 'function', function: { name: 'read', arguments: '{"address":"quiz"}' } },
      { id: 'call_b', type: 'function', function: { name: 'navigate', arguments: '{}' } },
    ])
    expect(result.finishReason).toBe('tool_calls')
    const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.tools).toEqual(tools)
    expect(body.tool_choice).toBe('none')
  })

  it('reads tool calls from a whole answer, with object arguments and no id', async () => {
    const fetch = async () => json({ choices: [{ message: { content: null, tool_calls: [{ function: { name: 'read', arguments: { address: 'quiz' } } }] }, finish_reason: 'tool_calls' }] })
    const result = await chatCompletion(local, { model: 'm', messages, tools }, { fetch, ...page })
    expect(result.toolCalls).toEqual([{ id: 'call_0', type: 'function', function: { name: 'read', arguments: '{"address":"quiz"}' } }])
    expect(result.text).toBe('')
  })

  it('leaves tools out of the body when there are none', async () => {
    const fetch = vi.fn(async () => json({ choices: [{ message: { content: 'x' } }] }))
    const result = await chatCompletion(local, { model: 'm', messages, tools: [] }, { fetch, ...page })
    expect(result.toolCalls).toBeUndefined()
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).not.toHaveProperty('tools')
  })
})
