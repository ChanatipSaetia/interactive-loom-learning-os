/**
 * Assistant connection profiles (grill-log-ai-assistant.md, decision 55).
 *
 * Profiles (name, preset, base URL, model, extra headers, token budget,
 * Full reference) live in localStorage under one key. A profile's API key
 * is stored apart from it: in sessionStorage, so it is forgotten when the
 * tab closes, or in localStorage when "Remember key on this device" is on.
 * Nothing here is ever sent anywhere but the profile's own base URL, and
 * never as a cookie.
 */
import { DEFAULT_TOKEN_BUDGET, presetOf, type AssistantPresetId } from './presets'
import type { AssistantConnection } from './client'

export interface AssistantProfile {
  id: string
  name: string
  preset: AssistantPresetId
  baseUrl: string
  model: string
  /** Extra request headers, e.g. OpenRouter's `X-Title`. */
  headers: Record<string, string>
  /** Tokens a request may use for history (decision 56). */
  tokenBudget: number
  /** Send the full authoring prompt instead of the selected entries (decision 59). */
  fullReference: boolean
}

export interface AssistantSettings {
  profiles: AssistantProfile[]
  activeId: string | null
}

export const EMPTY_ASSISTANT_SETTINGS: AssistantSettings = { profiles: [], activeId: null }

const SETTINGS_KEY = 'loom-ai-profiles'
const keyStorageKey = (profileId: string) => `loom-ai-key:${profileId}`

const PRESET_IDS = new Set<AssistantPresetId>(['ollama', 'lmstudio', 'llamacpp', 'openrouter', 'openai', 'custom'])

/** Storage can be missing or throw (private windows, blocked site data). */
function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

function newId(): string {
  try {
    return crypto.randomUUID().slice(0, 8)
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

/** A new profile filled in from a preset. */
export function createProfile(preset: AssistantPresetId, existing: readonly AssistantProfile[] = []): AssistantProfile {
  const base = presetOf(preset)
  const taken = new Set(existing.map((profile) => profile.name))
  let name = base.label
  for (let n = 2; taken.has(name); n++) name = `${base.label} ${n}`
  return {
    id: newId(),
    name,
    preset: base.id,
    baseUrl: base.baseUrl,
    model: '',
    headers: { ...base.headers },
    tokenBudget: base.tokenBudget,
    fullReference: false,
  }
}

function readProfile(raw: unknown): AssistantProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<AssistantProfile>
  if (typeof value.id !== 'string' || !value.id) return null
  const headers: Record<string, string> = {}
  if (value.headers && typeof value.headers === 'object') {
    for (const [name, header] of Object.entries(value.headers)) if (typeof header === 'string') headers[name] = header
  }
  return {
    id: value.id,
    name: typeof value.name === 'string' && value.name.trim() ? value.name : 'Profile',
    preset: value.preset && PRESET_IDS.has(value.preset) ? value.preset : 'custom',
    baseUrl: typeof value.baseUrl === 'string' ? value.baseUrl : '',
    model: typeof value.model === 'string' ? value.model : '',
    headers,
    tokenBudget:
      typeof value.tokenBudget === 'number' && Number.isFinite(value.tokenBudget) && value.tokenBudget > 0
        ? Math.round(value.tokenBudget)
        : DEFAULT_TOKEN_BUDGET,
    fullReference: value.fullReference === true,
  }
}

export function loadAssistantSettings(): AssistantSettings {
  try {
    const raw = storage('local')?.getItem(SETTINGS_KEY)
    if (!raw) return EMPTY_ASSISTANT_SETTINGS
    const data = JSON.parse(raw) as { profiles?: unknown; activeId?: unknown }
    const profiles = Array.isArray(data.profiles)
      ? data.profiles.map(readProfile).filter((profile): profile is AssistantProfile => profile !== null)
      : []
    const activeId = typeof data.activeId === 'string' && profiles.some((profile) => profile.id === data.activeId) ? data.activeId : null
    return { profiles, activeId }
  } catch {
    return EMPTY_ASSISTANT_SETTINGS
  }
}

export function saveAssistantSettings(settings: AssistantSettings): void {
  try {
    const local = storage('local')
    if (!local) return
    if (settings.profiles.length === 0) local.removeItem(SETTINGS_KEY)
    else local.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage full or blocked: the settings last for this page only.
  }
}

export const activeProfile = (settings: AssistantSettings): AssistantProfile | null =>
  settings.profiles.find((profile) => profile.id === settings.activeId) ?? null

export interface StoredKey {
  key: string
  /** Kept in localStorage ("Remember key on this device"). */
  remember: boolean
}

export function loadProfileKey(profileId: string): StoredKey {
  try {
    const remembered = storage('local')?.getItem(keyStorageKey(profileId))
    if (remembered) return { key: remembered, remember: true }
    return { key: storage('session')?.getItem(keyStorageKey(profileId)) ?? '', remember: false }
  } catch {
    return { key: '', remember: false }
  }
}

/** Stores the key in exactly one place; an empty key removes it from both. */
export function saveProfileKey(profileId: string, key: string, remember: boolean): void {
  const name = keyStorageKey(profileId)
  try {
    storage('local')?.removeItem(name)
    storage('session')?.removeItem(name)
    const trimmed = key.trim()
    if (trimmed) storage(remember ? 'local' : 'session')?.setItem(name, trimmed)
  } catch {
    // Blocked storage: the key is not kept.
  }
}

export const deleteProfileKey = (profileId: string) => saveProfileKey(profileId, '', false)

/** What the client needs to call a profile's server. */
export function connectionOf(profile: AssistantProfile, key = loadProfileKey(profile.id).key): AssistantConnection {
  return { baseUrl: profile.baseUrl, apiKey: key || undefined, headers: profile.headers }
}

/** `Name: value` lines, as the settings dialog edits them. */
export function formatHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n')
}

/** Parses `Name: value` lines; returns the headers and the lines that are not headers. */
export function parseHeaders(text: string): { headers: Record<string, string>; invalid: string[] } {
  const headers: Record<string, string> = {}
  const invalid: string[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const colon = line.indexOf(':')
    const name = colon === -1 ? '' : line.slice(0, colon).trim()
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) {
      invalid.push(line.trim())
      continue
    }
    headers[name] = line.slice(colon + 1).trim()
  }
  return { headers, invalid }
}
