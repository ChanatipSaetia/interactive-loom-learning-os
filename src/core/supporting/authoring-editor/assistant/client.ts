/**
 * Browser client for OpenAI-compatible APIs (grill-log-ai-assistant.md,
 * decision 57): `GET {base}/models` and `POST {base}/chat/completions`,
 * called straight from the page with plain `fetch`, no backend and no SDK.
 *
 * Local and hosted servers are only *nearly* compatible, so the SSE reader
 * accepts `data:` with or without a space, CRLF line ends, bare JSON lines,
 * missing `usage` and a missing `[DONE]`; a server that ignores `stream`
 * and answers with one JSON body works too. When streaming fails before any
 * text arrives, the request is sent once more with `stream: false`.
 *
 * Plain http from an https page is refused before sending only for public
 * IP literals. Loopback, private-network addresses (`192.168.x.x`,
 * Tailscale's `100.64.0.0/10`, `*.local`, …) and other host names are sent
 * marked as local-network requests (`targetAddressSpace: "local"`): Chrome
 * asks the person to allow local network access instead of blocking them as
 * mixed content, and fails a name that resolves to a public address.
 */

export interface AssistantConnection {
  /** e.g. `http://localhost:11434/v1`; a trailing slash is ignored. */
  baseUrl: string
  apiKey?: string
  headers?: Record<string, string>
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  /** Assistant turns that called tools (decision 120). */
  tool_calls?: ToolCall[]
  /** Tool turns: the call they answer. */
  tool_call_id?: string
}

/** A function call the model asked for, in the wire format. */
export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export type AssistantFailureKind =
  | 'invalid-url'
  | 'mixed-content'
  | 'local-network'
  | 'network'
  | 'auth'
  | 'not-found'
  | 'no-models'
  | 'bad-response'
  | 'http'
  | 'aborted'

export class AssistantError extends Error {
  readonly kind: AssistantFailureKind
  readonly status?: number
  /** Text that arrived before a stream broke. */
  readonly partial?: string

  constructor(kind: AssistantFailureKind, message: string, options: { status?: number; partial?: string } = {}) {
    super(message)
    this.name = 'AssistantError'
    this.kind = kind
    this.status = options.status
    this.partial = options.partial
  }
}

/** Lets tests swap `fetch` and the page's location. */
export interface ClientEnvironment {
  fetch?: typeof fetch
  /** The page's URL; decides whether plain http is blocked as mixed content. */
  pageUrl?: string
}

const LOOPBACK = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/

/** `localhost`, `127.x.x.x` and `[::1]`: plain-http hosts every browser lets an https page call. */
export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK.test(hostname.toLowerCase())
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/

/** An IPv4 or bracketed IPv6 literal, as `URL.hostname` gives them. */
export const isIpLiteral = (hostname: string) => IPV4.test(hostname) || hostname.startsWith('[')

/**
 * A local-network address written as an IP literal, in the "local" address
 * space of the Local Network Access spec (10/8, 100.64/10 carrier-grade NAT
 * and Tailscale, 172.16/12, 192.168/16, 169.254/16, IPv6 fc00::/7, fe80::/10,
 * fec0::/10), or a `.local` name: the hosts Chrome lets an https page call
 * over http once the person allows local network access.
 */
export function isLocalNetworkHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host.endsWith('.local')) return true
  const v4 = IPV4.exec(host)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    return a === 10 || (a === 100 && b >= 64 && b <= 127) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)
  }
  return /^\[(f[cd][0-9a-f]{0,2}|fe[89a-f][0-9a-f]?):/.test(host)
}

/** Base URL without trailing slashes, or null when it is not an http(s) URL. */
export function normalizeBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '')
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

const pageUrlOf = (env: ClientEnvironment) => env.pageUrl ?? (typeof location !== 'undefined' ? location.href : 'http://localhost/')

interface Endpoint {
  url: string
  /** The server is on the local network (Local Network Access). */
  localNetwork: boolean
  /** Plain http to the local network from an https page: only browsers with Local Network Access allow it. */
  insecureLocal: boolean
}

/** The endpoint, or a thrown `invalid-url` / `mixed-content` error before anything is sent. */
function endpoint(connection: AssistantConnection, path: string, env: ClientEnvironment): Endpoint {
  const base = normalizeBaseUrl(connection.baseUrl)
  if (!base) throw new AssistantError('invalid-url', `"${connection.baseUrl}" is not an http(s) URL.`)
  const target = new URL(base)
  const page = new URL(pageUrlOf(env))
  const host = target.hostname
  const insecure = page.protocol === 'https:' && target.protocol === 'http:' && !isLoopbackHost(host)
  // A public IP literal can never be reached this way; a name may resolve to the local network.
  if (insecure && isIpLiteral(host) && !isLocalNetworkHost(host)) {
    throw new AssistantError('mixed-content', `The browser blocks http://${target.host} from an https page.`)
  }
  // Marking a loopback or public target as local would make the request fail, so only these are marked.
  const localNetwork = isLocalNetworkHost(host) || (insecure && !isIpLiteral(host))
  return { url: `${base}${path}`, localNetwork, insecureLocal: insecure }
}

function requestHeaders(connection: AssistantConnection, json: boolean): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [name, value] of Object.entries(connection.headers ?? {})) {
    if (name.trim() && value.trim()) headers[name.trim()] = value.trim()
  }
  if (json) headers['Content-Type'] = 'application/json'
  const key = connection.apiKey?.trim()
  if (key) headers.Authorization = `Bearer ${key}`
  return headers
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

async function send(target: Endpoint, init: RequestInit, env: ClientEnvironment): Promise<Response> {
  const doFetch = env.fetch ?? fetch
  const url = target.url
  // Tells Chrome the request is meant for the local network, so it asks for
  // permission instead of blocking it as mixed content. Other browsers ignore it.
  const request = target.localNetwork ? ({ ...init, targetAddressSpace: 'local' } as RequestInit) : init
  try {
    return await doFetch(url, request)
  } catch (error) {
    if (isAbort(error) || init.signal?.aborted) throw new AssistantError('aborted', 'The request was stopped.')
    if (target.insecureLocal) {
      throw new AssistantError('local-network', `Could not reach ${new URL(url).host} over http from this https page.`)
    }
    // Browsers report CORS refusals, stopped servers and blocked requests all
    // as the same TypeError; the hint lists the likely causes.
    throw new AssistantError('network', `Could not reach ${new URL(url).host}.`)
  }
}

/** The server's own error message from a JSON or text body. */
function errorMessageOf(body: string): string | undefined {
  try {
    const data = JSON.parse(body) as { error?: unknown; message?: unknown; detail?: unknown }
    const error = data.error
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
    if (typeof data.message === 'string') return data.message
    if (typeof data.detail === 'string') return data.detail
  } catch {
    // Not JSON.
  }
  const text = body.trim()
  return text ? text.slice(0, 300) : undefined
}

async function failure(response: Response): Promise<AssistantError> {
  const body = await response.text().catch(() => '')
  const message = errorMessageOf(body) ?? `${response.status} ${response.statusText}`.trim()
  const kind: AssistantFailureKind =
    response.status === 401 || response.status === 403 ? 'auth' : response.status === 404 ? 'not-found' : 'http'
  return new AssistantError(kind, message, { status: response.status })
}

/** Model IDs from `GET {base}/models`, sorted. */
export async function listModels(
  connection: AssistantConnection,
  options: { signal?: AbortSignal } & ClientEnvironment = {},
): Promise<string[]> {
  const target = endpoint(connection, '/models', options)
  const response = await send(target, { headers: requestHeaders(connection, false), signal: options.signal }, options)
  if (!response.ok) throw await failure(response)
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new AssistantError('bad-response', 'The model list is not JSON.')
  }
  // OpenAI: { data: [{ id }] }. Some servers return { models: [...] } or a bare list.
  const record = data as { data?: unknown; models?: unknown }
  const list = Array.isArray(data) ? data : Array.isArray(record?.data) ? record.data : Array.isArray(record?.models) ? record.models : null
  if (!list) throw new AssistantError('bad-response', 'The answer has no model list.')
  const ids = list
    .map((item) => (typeof item === 'string' ? item : (item as { id?: unknown; name?: unknown })?.id ?? (item as { name?: unknown })?.name))
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b))
}

export type ConnectionReport = { ok: true; models: string[] } | { ok: false; error: AssistantError }

/** Test connection: the model list, or why there is none (decision 57). */
export async function testConnection(
  connection: AssistantConnection,
  options: { signal?: AbortSignal } & ClientEnvironment = {},
): Promise<ConnectionReport> {
  try {
    const models = await listModels(connection, options)
    if (models.length === 0) return { ok: false, error: new AssistantError('no-models', 'The server lists no models.') }
    return { ok: true, models }
  } catch (error) {
    if (error instanceof AssistantError) return { ok: false, error }
    return { ok: false, error: new AssistantError('bad-response', String(error)) }
  }
}

// --- Server-sent events --------------------------------------------------------

/**
 * Splits a text stream into SSE `data` payloads. Lines may end in LF or
 * CRLF; `data:` may lack its space; several `data:` lines in one event join
 * with a newline; comments (`:`) and other fields are skipped. A line that
 * is bare JSON (no `data:`) is taken as a payload too.
 */
export class SSEDecoder {
  private buffer = ''
  private data: string[] = []

  push(text: string): string[] {
    this.buffer += text
    const out: string[] = []
    let match: RegExpExecArray | null
    while ((match = /\r\n|\n|\r/.exec(this.buffer))) {
      // A CR at the very end may be the first half of CRLF: wait for more.
      if (match[0] === '\r' && match.index === this.buffer.length - 1) break
      const line = this.buffer.slice(0, match.index)
      this.buffer = this.buffer.slice(match.index + match[0].length)
      this.line(line, out)
    }
    return out
  }

  /** Payloads left when the stream ends without a closing blank line. */
  flush(): string[] {
    const out: string[] = []
    if (this.buffer) this.line(this.buffer, out)
    this.buffer = ''
    this.dispatch(out)
    return out
  }

  private line(line: string, out: string[]) {
    if (line === '') return this.dispatch(out)
    if (line.startsWith(':')) return
    if (line.startsWith('{') && this.data.length === 0) {
      out.push(line)
      return
    }
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    if (field !== 'data') return
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    this.data.push(value)
  }

  private dispatch(out: string[]) {
    if (this.data.length) out.push(this.data.join('\n'))
    this.data = []
  }
}

interface ToolCallDelta {
  index?: unknown
  id?: unknown
  function?: { name?: unknown; arguments?: unknown }
}

interface ChunkChoice {
  delta?: { content?: unknown; tool_calls?: unknown }
  message?: { content?: unknown; tool_calls?: unknown }
  text?: unknown
  finish_reason?: unknown
}

/**
 * Collects tool calls from streamed deltas (a call's name and arguments come
 * in pieces, matched by `index`) or from a whole message. Servers that leave
 * out `index` or `id`, or send arguments as an object, are handled too.
 */
class ToolCallCollector {
  private calls: Array<{ id?: string; name: string; args: string }> = []

  add(deltas: unknown) {
    if (!Array.isArray(deltas)) return
    deltas.forEach((raw: ToolCallDelta, position) => {
      const index = typeof raw?.index === 'number' ? raw.index : this.calls.length > position && !raw?.id ? position : this.calls.length
      const call = (this.calls[index] ??= { name: '', args: '' })
      if (typeof raw?.id === 'string' && raw.id) call.id = raw.id
      const fn = raw?.function
      if (typeof fn?.name === 'string') call.name += fn.name
      if (typeof fn?.arguments === 'string') call.args += fn.arguments
      else if (fn?.arguments && typeof fn.arguments === 'object') call.args = JSON.stringify(fn.arguments)
    })
  }

  result(): ToolCall[] | undefined {
    const calls = this.calls.filter((c) => c?.name)
    if (!calls.length) return undefined
    return calls.map((c, i) => ({ id: c.id ?? `call_${i}`, type: 'function', function: { name: c.name, arguments: c.args || '{}' } }))
  }
}

/** Text, tool-call deltas and finish reason in one streamed chunk or a whole (non-streamed) answer. */
function readChoice(payload: unknown): { text: string; toolCalls?: unknown; finishReason?: string } {
  const data = payload as { choices?: ChunkChoice[]; error?: unknown }
  if (data?.error !== undefined) {
    throw new AssistantError('http', errorMessageOf(JSON.stringify(data)) ?? 'The server reported an error.')
  }
  const choice = data?.choices?.[0]
  if (!choice) return { text: '' }
  const content = choice.delta?.content ?? choice.message?.content ?? choice.text
  return {
    text: typeof content === 'string' ? content : '',
    toolCalls: choice.delta?.tool_calls ?? choice.message?.tool_calls,
    finishReason: typeof choice.finish_reason === 'string' ? choice.finish_reason : undefined,
  }
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
  /** Called with each piece of text as it streams in. */
  onDelta?: (text: string) => void
  /** Extra body fields, e.g. `temperature`. */
  extra?: Record<string, unknown>
  /** Function tools the model may call (decision 120). */
  tools?: unknown[]
  /** `none` makes the model answer without calling them. */
  toolChoice?: 'auto' | 'none'
}

export interface ChatResult {
  text: string
  /** The tools the model asked to call, if any. */
  toolCalls?: ToolCall[]
  finishReason?: string
  /** False when the answer came in one piece (the server ignored `stream`, or the retry). */
  streamed: boolean
}

/** One chat completion, streamed when the server can, else in one piece. */
export async function chatCompletion(
  connection: AssistantConnection,
  request: ChatRequest,
  env: ClientEnvironment = {},
): Promise<ChatResult> {
  try {
    return await chatOnce(connection, request, true, env)
  } catch (error) {
    if (!(error instanceof AssistantError) || !retryWithoutStream(error)) throw error
    return chatOnce(connection, request, false, env)
  }
}

/**
 * Streaming failed in a way plain requests might not: the server rejected
 * the body (400, 422, 5xx) or the stream broke before any text arrived.
 * Unreachable servers, refused keys, wrong paths and Stop are final.
 */
function retryWithoutStream(error: AssistantError): boolean {
  if (error.partial) return false
  if (error.kind === 'bad-response') return true
  return error.kind === 'http' && error.status !== undefined && error.status !== 429
}

async function chatOnce(
  connection: AssistantConnection,
  request: ChatRequest,
  stream: boolean,
  env: ClientEnvironment,
): Promise<ChatResult> {
  const target = endpoint(connection, '/chat/completions', env)
  const response = await send(
    target,
    {
      method: 'POST',
      headers: requestHeaders(connection, true),
      body: JSON.stringify({
        ...request.extra,
        model: request.model,
        messages: request.messages,
        ...(request.tools?.length ? { tools: request.tools, ...(request.toolChoice ? { tool_choice: request.toolChoice } : {}) } : {}),
        stream,
      }),
      signal: request.signal,
    },
    env,
  )
  if (!response.ok) throw await failure(response)

  const type = response.headers.get('content-type') ?? ''
  if (!stream || !type.includes('text/event-stream') || !response.body) {
    // The server answered in one piece (or ignored `stream`).
    const body = await response.text().catch(() => {
      throw new AssistantError(request.signal?.aborted ? 'aborted' : 'bad-response', 'The answer could not be read.')
    })
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      // A streaming body sent with the wrong content type.
      if (/^\s*(data:|\{)/.test(body)) return readStreamText(body, request)
      throw new AssistantError('bad-response', 'The answer is not JSON.')
    }
    const { text, toolCalls, finishReason } = readChoice(parsed)
    if (!text && !(parsed as { choices?: unknown })?.choices) throw new AssistantError('bad-response', 'The answer has no choices.')
    if (text) request.onDelta?.(text)
    const calls = new ToolCallCollector()
    calls.add(toolCalls)
    return { text, toolCalls: calls.result(), finishReason, streamed: false }
  }

  const reader = response.body.getReader()
  const utf8 = new TextDecoder()
  const decoder = new SSEDecoder()
  let text = ''
  let finishReason: string | undefined
  let done = false
  const calls = new ToolCallCollector()
  const take = (payloads: string[]) => {
    for (const payload of payloads) {
      if (payload.trim() === '[DONE]') {
        done = true
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(payload)
      } catch {
        continue // keep-alives and other non-JSON lines
      }
      const chunk = readChoice(parsed)
      if (chunk.finishReason) finishReason = chunk.finishReason
      calls.add(chunk.toolCalls)
      if (chunk.text) {
        text += chunk.text
        request.onDelta?.(chunk.text)
      }
    }
  }

  try {
    while (!done) {
      const { value, done: ended } = await reader.read()
      if (ended) break
      take(decoder.push(utf8.decode(value, { stream: true })))
    }
    if (!done) take(decoder.flush())
  } catch (error) {
    if (request.signal?.aborted || isAbort(error)) throw new AssistantError('aborted', 'The request was stopped.', { partial: text || undefined })
    if (error instanceof AssistantError) throw new AssistantError(error.kind, error.message, { status: error.status, partial: text || undefined })
    throw new AssistantError('bad-response', 'The stream broke off.', { partial: text || undefined })
  } finally {
    if (done) reader.cancel().catch(() => {})
  }
  return { text, toolCalls: calls.result(), finishReason, streamed: true }
}

function readStreamText(body: string, request: ChatRequest): ChatResult {
  const decoder = new SSEDecoder()
  const calls = new ToolCallCollector()
  let text = ''
  let finishReason: string | undefined
  for (const payload of [...decoder.push(body), ...decoder.flush()]) {
    if (payload.trim() === '[DONE]') break
    try {
      const chunk = readChoice(JSON.parse(payload))
      text += chunk.text
      calls.add(chunk.toolCalls)
      if (chunk.finishReason) finishReason = chunk.finishReason
    } catch (error) {
      if (error instanceof AssistantError) throw error
    }
  }
  if (text) request.onDelta?.(text)
  return { text, toolCalls: calls.result(), finishReason, streamed: false }
}
