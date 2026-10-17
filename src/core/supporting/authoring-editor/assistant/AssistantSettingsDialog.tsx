/**
 * Connection settings for the AI assistant (grill-log-ai-assistant.md,
 * decisions 55 and 57): named profiles, the API key with "Remember key on
 * this device", and Test connection, which fills the model list or says why
 * the server could not be reached and what to do about it.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../../../ui-system'
import { normalizeBaseUrl, testConnection, type AssistantFailureKind, type ConnectionReport } from './client'
import { ASSISTANT_PRESETS, failureHint, presetOf, type AssistantPresetId } from './presets'
import {
  createProfile,
  deleteProfileKey,
  formatHeaders,
  loadAssistantSettings,
  loadProfileKey,
  parseHeaders,
  saveAssistantSettings,
  saveProfileKey,
  type AssistantProfile,
  type AssistantSettings,
} from './profiles'
import './assistant.css'

interface Draft {
  profile: AssistantProfile
  key: string
  remember: boolean
  headersText: string
  /** The base URL was typed, so changing the preset leaves it alone. */
  baseUrlEdited: boolean
}

const draftOf = (profile: AssistantProfile, baseUrlEdited = true): Draft => {
  const stored = loadProfileKey(profile.id)
  return { profile, key: stored.key, remember: stored.remember, headersText: formatHeaders(profile.headers), baseUrlEdited }
}

type TestState = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; report: ConnectionReport; preset: AssistantPresetId }

const FAILURE_TITLES: Record<AssistantFailureKind, string> = {
  'invalid-url': 'Not a valid base URL',
  'mixed-content': 'Blocked: http from an https page',
  network: 'Could not reach the server',
  auth: 'API key refused',
  'not-found': 'Wrong path',
  'no-models': 'No models',
  'bad-response': 'Not an OpenAI-compatible answer',
  http: 'Server error',
  aborted: 'Stopped',
}

export interface AssistantSettingsDialogProps {
  open: boolean
  onClose: () => void
  /** Called after Save or Delete with the settings now stored. */
  onChange?: (settings: AssistantSettings) => void
  /** For tests: replaces `fetch` in Test connection. */
  fetchImpl?: typeof fetch
}

export function AssistantSettingsDialog({ open, onClose, onChange, fetchImpl }: AssistantSettingsDialogProps) {
  const [settings, setSettings] = useState<AssistantSettings>(loadAssistantSettings)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [test, setTest] = useState<TestState>({ kind: 'idle' })
  const [models, setModels] = useState<string[]>([])
  const abort = useRef<AbortController | null>(null)

  // Opening starts from what is stored: the active profile, or a new one.
  useEffect(() => {
    if (!open) return
    const stored = loadAssistantSettings()
    setSettings(stored)
    const current = stored.profiles.find((profile) => profile.id === stored.activeId) ?? stored.profiles[0]
    setDraft(current ? draftOf(current) : draftOf(createProfile('ollama'), false))
    setTest({ kind: 'idle' })
    setModels([])
    return () => abort.current?.abort()
  }, [open])

  const isNew = !!draft && !settings.profiles.some((profile) => profile.id === draft.profile.id)
  const headers = useMemo(() => parseHeaders(draft?.headersText ?? ''), [draft?.headersText])
  const baseUrl = draft ? normalizeBaseUrl(draft.profile.baseUrl) : null
  const problem = !draft
    ? null
    : !draft.profile.name.trim()
      ? 'Give the profile a name.'
      : !baseUrl
        ? 'Enter a base URL starting with http:// or https://.'
        : headers.invalid.length
          ? `Not a header: ${headers.invalid[0]}`
          : null

  if (!draft) return null

  const update = (patch: Partial<AssistantProfile>) => setDraft({ ...draft, profile: { ...draft.profile, ...patch } })

  const choosePreset = (preset: AssistantPresetId) => {
    const base = presetOf(preset)
    setDraft({
      ...draft,
      profile: {
        ...draft.profile,
        preset,
        baseUrl: draft.baseUrlEdited && draft.profile.baseUrl ? draft.profile.baseUrl : base.baseUrl,
        tokenBudget: base.tokenBudget,
      },
      headersText: draft.headersText.trim() ? draft.headersText : formatHeaders(base.headers),
    })
    setTest({ kind: 'idle' })
    setModels([])
  }

  const selectProfile = (id: string) => {
    abort.current?.abort()
    const profile = settings.profiles.find((candidate) => candidate.id === id)
    if (profile) setDraft(draftOf(profile))
    setTest({ kind: 'idle' })
    setModels([])
  }

  const newProfile = () => {
    abort.current?.abort()
    setDraft(draftOf(createProfile('ollama', settings.profiles), false))
    setTest({ kind: 'idle' })
    setModels([])
  }

  const runTest = async () => {
    abort.current?.abort()
    const controller = new AbortController()
    abort.current = controller
    setTest({ kind: 'running' })
    const report = await testConnection(
      { baseUrl: draft.profile.baseUrl, apiKey: draft.key || undefined, headers: headers.headers },
      { signal: controller.signal, fetch: fetchImpl },
    )
    if (controller.signal.aborted) return
    setTest({ kind: 'done', report, preset: draft.profile.preset })
    if (report.ok) {
      setModels(report.models)
      if (!draft.profile.model || !report.models.includes(draft.profile.model)) {
        setDraft((current) => (current && !current.profile.model ? { ...current, profile: { ...current.profile, model: report.models[0] } } : current))
      }
    }
  }

  const save = () => {
    if (problem || !baseUrl) return
    const profile: AssistantProfile = { ...draft.profile, name: draft.profile.name.trim(), baseUrl, model: draft.profile.model.trim(), headers: headers.headers }
    const profiles = isNew
      ? [...settings.profiles, profile]
      : settings.profiles.map((candidate) => (candidate.id === profile.id ? profile : candidate))
    const next = { profiles, activeId: profile.id }
    saveAssistantSettings(next)
    saveProfileKey(profile.id, draft.key, draft.remember)
    setSettings(next)
    onChange?.(next)
    onClose()
  }

  const remove = () => {
    const profiles = settings.profiles.filter((candidate) => candidate.id !== draft.profile.id)
    const next = { profiles, activeId: settings.activeId === draft.profile.id ? (profiles[0]?.id ?? null) : settings.activeId }
    saveAssistantSettings(next)
    deleteProfileKey(draft.profile.id)
    setSettings(next)
    onChange?.(next)
    const following = profiles.find((profile) => profile.id === next.activeId) ?? profiles[0]
    setDraft(following ? draftOf(following) : draftOf(createProfile('ollama'), false))
    setTest({ kind: 'idle' })
    setModels([])
  }

  const preset = presetOf(draft.profile.preset)
  const host = (() => {
    try {
      return new URL(baseUrl ?? '').host
    } catch {
      return draft.profile.baseUrl
    }
  })()

  return (
    <Modal open={open} onClose={onClose} title="AI assistant" maxWidth="lg">
      <form
        className="ai-settings"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        data-testid="ai-settings"
      >
        <p className="ai-settings-intro">
          Connect to any OpenAI-compatible API: a model on your computer (Ollama, LM Studio, llama.cpp), OpenRouter, OpenAI or another
          server. The page calls it directly; there is no Loom server in between.
        </p>

        <div className="ai-settings-profiles">
          <label className="ai-field ai-field--grow">
            <span>Profile</span>
            <select
              value={isNew ? '' : draft.profile.id}
              onChange={(e) => (e.target.value ? selectProfile(e.target.value) : newProfile())}
              data-testid="ai-profile-select"
            >
              {settings.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                  {profile.id === settings.activeId ? ' (active)' : ''}
                </option>
              ))}
              {isNew && <option value="">New profile</option>}
            </select>
          </label>
          <button type="button" className="ai-button" onClick={newProfile} disabled={isNew}>
            <Plus size={14} /> New
          </button>
          {!isNew && (
            <button type="button" className="ai-button ai-button--danger" onClick={remove} data-testid="ai-profile-delete">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>

        <div className="ai-settings-grid">
          <label className="ai-field">
            <span>Server</span>
            <select value={draft.profile.preset} onChange={(e) => choosePreset(e.target.value as AssistantPresetId)} data-testid="ai-preset">
              {ASSISTANT_PRESETS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ai-field">
            <span>Name</span>
            <input value={draft.profile.name} onChange={(e) => update({ name: e.target.value })} data-testid="ai-name" />
          </label>
          <label className="ai-field ai-field--wide">
            <span>Base URL</span>
            <input
              value={draft.profile.baseUrl}
              placeholder="http://localhost:11434/v1"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setDraft({ ...draft, baseUrlEdited: true, profile: { ...draft.profile, baseUrl: e.target.value } })}
              data-testid="ai-base-url"
            />
          </label>
          <label className="ai-field ai-field--wide">
            <span>API key{preset.needsKey ? '' : ' (optional)'}</span>
            <input
              type="password"
              value={draft.key}
              placeholder={preset.needsKey ? 'sk-…' : 'Not needed for most local servers'}
              autoComplete="off"
              onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              data-testid="ai-key"
            />
          </label>
          <label className="ai-check ai-field--wide">
            <input type="checkbox" checked={draft.remember} onChange={(e) => setDraft({ ...draft, remember: e.target.checked })} data-testid="ai-remember" />
            <span>
              Remember key on this device. Otherwise it is forgotten when this tab closes. It is only ever sent to {host || 'this server'}.
            </span>
          </label>
        </div>

        <div className="ai-settings-test">
          <button type="button" className="ai-button" onClick={runTest} disabled={test.kind === 'running' || !baseUrl} data-testid="ai-test">
            {test.kind === 'running' ? <Loader2 size={14} className="ai-spin" /> : null} Test connection
          </button>
          <TestResult test={test} host={host} />
        </div>

        <div className="ai-settings-grid">
          <label className="ai-field ai-field--wide">
            <span>Model</span>
            <input
              value={draft.profile.model}
              list="ai-model-list"
              placeholder={models.length ? 'Pick or type a model' : 'Test connection to list models, or type one'}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => update({ model: e.target.value })}
              data-testid="ai-model"
            />
            <datalist id="ai-model-list">
              {models.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </label>
        </div>

        <details className="ai-settings-more">
          <summary>More settings</summary>
          <div className="ai-settings-grid">
            <label className="ai-field ai-field--wide">
              <span>Extra headers (one "Name: value" per line)</span>
              <textarea
                rows={2}
                value={draft.headersText}
                spellCheck={false}
                onChange={(e) => setDraft({ ...draft, headersText: e.target.value })}
                data-testid="ai-headers"
              />
            </label>
            <label className="ai-field">
              <span>History budget (tokens)</span>
              <input
                type="number"
                min={1000}
                step={1000}
                value={draft.profile.tokenBudget}
                onChange={(e) => update({ tokenBudget: Math.max(1000, Number(e.target.value) || 0) })}
              />
            </label>
            <label className="ai-check ai-field--wide">
              <input type="checkbox" checked={draft.profile.fullReference} onChange={(e) => update({ fullReference: e.target.checked })} />
              <span>Full reference: send the whole authoring prompt (about 12k tokens) for models with a large context.</span>
            </label>
          </div>
        </details>

        {problem && <p className="ai-settings-problem">{problem}</p>}
        <div className="ai-settings-actions">
          <button type="button" className="ai-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ai-button ai-button--primary" disabled={!!problem} data-testid="ai-save">
            Save and use
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TestResult({ test, host }: { test: TestState; host: string }) {
  if (test.kind === 'idle') return null
  if (test.kind === 'running') return <span className="ai-test-note">Asking {host} for its models…</span>
  const { report, preset } = test
  if (report.ok) {
    return (
      <span className="ai-test-ok" role="status" data-testid="ai-test-result">
        <CheckCircle2 size={14} /> Connected · {report.models.length} model{report.models.length === 1 ? '' : 's'}
      </span>
    )
  }
  const page = typeof location !== 'undefined' ? location : undefined
  const hint = failureHint(report.error.kind, preset, {
    origin: page?.origin ?? '',
    host,
    secure: page?.protocol === 'https:',
  })
  return (
    <div className="ai-test-fail" role="alert" data-testid="ai-test-result" data-kind={report.error.kind}>
      <strong>
        <AlertTriangle size={14} /> {FAILURE_TITLES[report.error.kind]}
      </strong>
      <span>{report.error.message}</span>
      <span>{hint}</span>
    </div>
  )
}
