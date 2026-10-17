import { beforeEach, describe, expect, it } from 'vitest'
import {
  activeProfile,
  connectionOf,
  createProfile,
  deleteProfileKey,
  failureHint,
  loadAssistantSettings,
  loadProfileKey,
  parseHeaders,
  saveAssistantSettings,
  saveProfileKey,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('assistant profiles', () => {
  it('fills a new profile from its preset and keeps names unique', () => {
    const first = createProfile('openrouter')
    expect(first).toMatchObject({
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      headers: { 'X-Title': 'Interactive Loom' },
      fullReference: false,
    })
    expect(createProfile('openrouter', [first]).name).toBe('OpenRouter 2')
    expect(createProfile('ollama').tokenBudget).toBeLessThan(first.tokenBudget)
  })

  it('round-trips settings through localStorage and never stores keys with them', () => {
    const profile = createProfile('ollama')
    saveAssistantSettings({ profiles: [profile], activeId: profile.id })
    saveProfileKey(profile.id, 'sk-secret', true)
    const loaded = loadAssistantSettings()
    expect(activeProfile(loaded)).toEqual(profile)
    expect(localStorage.getItem('loom-ai-profiles')).not.toContain('sk-secret')
  })

  it('drops broken entries and an active id that names no profile', () => {
    localStorage.setItem('loom-ai-profiles', JSON.stringify({ profiles: [{ id: 'a', preset: 'nope', tokenBudget: -1 }, 'x'], activeId: 'gone' }))
    const loaded = loadAssistantSettings()
    expect(loaded.activeId).toBeNull()
    expect(loaded.profiles).toEqual([
      { id: 'a', name: 'Profile', preset: 'custom', baseUrl: '', model: '', headers: {}, tokenBudget: 24000, fullReference: false },
    ])
    localStorage.setItem('loom-ai-profiles', '{not json')
    expect(loadAssistantSettings()).toEqual({ profiles: [], activeId: null })
  })

  it('keeps the key for the session unless remembered, and in one place only', () => {
    saveProfileKey('p', ' sk-1 ', false)
    expect(sessionStorage.getItem('loom-ai-key:p')).toBe('sk-1')
    expect(localStorage.getItem('loom-ai-key:p')).toBeNull()
    expect(loadProfileKey('p')).toEqual({ key: 'sk-1', remember: false })

    saveProfileKey('p', 'sk-1', true)
    expect(sessionStorage.getItem('loom-ai-key:p')).toBeNull()
    expect(loadProfileKey('p')).toEqual({ key: 'sk-1', remember: true })

    deleteProfileKey('p')
    expect(loadProfileKey('p')).toEqual({ key: '', remember: false })
  })

  it('builds the connection, leaving out an empty key', () => {
    const profile = { ...createProfile('ollama'), baseUrl: 'http://localhost:11434/v1' }
    expect(connectionOf(profile)).toEqual({ baseUrl: 'http://localhost:11434/v1', apiKey: undefined, headers: {} })
    expect(connectionOf(profile, 'k').apiKey).toBe('k')
  })

  it('parses header lines and reports the rest', () => {
    expect(parseHeaders('X-Title: Loom\n\nHTTP-Referer: https://a.b/c\nnot a header')).toEqual({
      headers: { 'X-Title': 'Loom', 'HTTP-Referer': 'https://a.b/c' },
      invalid: ['not a header'],
    })
  })
})

describe('failureHint', () => {
  const ctx = { origin: 'https://example.github.io', host: 'localhost:11434', secure: true }

  it('tells Ollama users to set OLLAMA_ORIGINS to this page', () => {
    const hint = failureHint('network', 'ollama', ctx)
    expect(hint).toContain('OLLAMA_ORIGINS=https://example.github.io')
    expect(hint).toContain('npm run studio')
  })

  it('words hints per preset', () => {
    expect(failureHint('network', 'lmstudio', { ...ctx, secure: false })).toContain('Enable CORS')
    expect(failureHint('auth', 'openrouter', ctx)).toContain('openrouter.ai/keys')
    expect(failureHint('no-models', 'ollama', ctx)).toContain('ollama pull')
    expect(failureHint('not-found', 'custom', ctx)).toContain('/v1')
    expect(failureHint('mixed-content', 'custom', { ...ctx, host: '192.168.1.2:1234' })).toContain('192.168.1.2:1234')
  })
})
