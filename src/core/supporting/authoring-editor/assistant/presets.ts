/**
 * Connection presets for the AI assistant (grill-log-ai-assistant.md,
 * decision 57): the base URL a server usually answers on and the fix hints
 * shown when Test connection fails.
 */
import type { AssistantFailureKind } from './client'

export type AssistantPresetId = 'ollama' | 'lmstudio' | 'llamacpp' | 'openrouter' | 'openai' | 'custom'

export interface AssistantPreset {
  id: AssistantPresetId
  label: string
  baseUrl: string
  /** Whether the server wants an API key. */
  needsKey: boolean
  /** Extra headers a new profile starts with. */
  headers: Record<string, string>
  /** Smaller default for servers that usually run small local models. */
  tokenBudget: number
}

export const DEFAULT_TOKEN_BUDGET = 24_000
const LOCAL_TOKEN_BUDGET = 8_000

export const ASSISTANT_PRESETS: readonly AssistantPreset[] = [
  { id: 'ollama', label: 'Ollama', baseUrl: 'http://localhost:11434/v1', needsKey: false, headers: {}, tokenBudget: LOCAL_TOKEN_BUDGET },
  { id: 'lmstudio', label: 'LM Studio', baseUrl: 'http://localhost:1234/v1', needsKey: false, headers: {}, tokenBudget: LOCAL_TOKEN_BUDGET },
  { id: 'llamacpp', label: 'llama.cpp', baseUrl: 'http://localhost:8080/v1', needsKey: false, headers: {}, tokenBudget: LOCAL_TOKEN_BUDGET },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    needsKey: true,
    headers: { 'X-Title': 'Interactive Loom' },
    tokenBudget: DEFAULT_TOKEN_BUDGET,
  },
  { id: 'openai', label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', needsKey: true, headers: {}, tokenBudget: DEFAULT_TOKEN_BUDGET },
  { id: 'custom', label: 'Custom', baseUrl: '', needsKey: false, headers: {}, tokenBudget: DEFAULT_TOKEN_BUDGET },
]

export const presetOf = (id: AssistantPresetId): AssistantPreset =>
  ASSISTANT_PRESETS.find((preset) => preset.id === id) ?? ASSISTANT_PRESETS[ASSISTANT_PRESETS.length - 1]

export interface HintContext {
  /** The page's origin, e.g. `https://example.github.io`. */
  origin: string
  /** The host the profile points at, e.g. `localhost:11434`. */
  host: string
  /** The page is served over https. */
  secure: boolean
}

const NETWORK_HINTS: Partial<Record<AssistantPresetId, (ctx: HintContext) => string>> = {
  ollama: (ctx) =>
    `Check that Ollama is running. Ollama only answers pages on localhost unless told otherwise: quit it and start it with OLLAMA_ORIGINS=${ctx.origin} ollama serve (on macOS, launchctl setenv OLLAMA_ORIGINS "${ctx.origin}" and restart the app).`,
  lmstudio: () => 'In LM Studio, open the Developer tab, start the server and turn on "Enable CORS".',
  llamacpp: () => 'Check that llama-server is running on this port (it accepts requests from web pages by default).',
  openrouter: () => 'Check your network connection and the base URL.',
  openai: () => 'Check your network connection and the base URL.',
}

/** What to do about a failed request, worded for the profile's preset. */
export function failureHint(kind: AssistantFailureKind, preset: AssistantPresetId, ctx: HintContext): string {
  switch (kind) {
    case 'invalid-url':
      return 'Enter the full base URL, starting with http:// or https://, e.g. http://localhost:11434/v1.'
    case 'local-network':
      return `This page is served over https and ${ctx.host} is plain http. Chrome allows it for servers on your local network (including Tailscale's 100.x addresses) once you let this site access devices on your local network: answer the prompt with Allow, or allow "Local network access" in the site settings (the icon left of the address), then test again. A name that points to a public address is refused; use its https address. Other browsers block it; use Chrome, run Studio on your computer (npm run studio), or give the server an https address (e.g. tailscale serve). Also check that the server listens on the network (llama-server --host 0.0.0.0, OLLAMA_HOST=0.0.0.0) and allows this page (CORS).`
    case 'mixed-content':
      return `This page is served over https, so the browser blocks plain http to ${ctx.host}. Use http://localhost or a local-network address (192.168.x.x, 10.x.x.x, Tailscale's 100.x.x.x, <name>.local), an https address (for example a tunnel), or run Studio on your computer (npm run studio).`
    case 'network': {
      const specific =
        NETWORK_HINTS[preset]?.(ctx) ??
        `The server did not answer, or did not allow this page. Check that it is running and that it allows requests from ${ctx.origin} (CORS).`
      const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(ctx.host)
      return ctx.secure && local
        ? `${specific} Some browsers also block https pages from reaching servers on your computer; running Studio on your computer (npm run studio) avoids that.`
        : specific
    }
    case 'auth':
      if (preset === 'openrouter') return 'The API key was refused. Create or copy a key at openrouter.ai/keys.'
      if (preset === 'openai') return 'The API key was refused. Check it at platform.openai.com/api-keys.'
      return 'The server refused the request. Check the API key, or leave it empty if the server needs none.'
    case 'not-found':
      return 'Nothing answered at this path. The base URL usually ends in /v1 (for example http://localhost:11434/v1). If the server has no model list, type the model name instead.'
    case 'no-models':
      if (preset === 'ollama') return 'Ollama has no models yet. Pull one first, for example: ollama pull llama3.2'
      if (preset === 'lmstudio') return 'No model is loaded. Download and load a model in LM Studio.'
      return 'The server lists no models. Load one on the server, or type the model name.'
    case 'bad-response':
      return 'The server answered, but not in the OpenAI format. Check that the base URL points at its OpenAI-compatible API (often /v1).'
    case 'aborted':
      return 'The request was stopped.'
    case 'http':
      return 'The server returned an error. Its message is shown above.'
  }
}
