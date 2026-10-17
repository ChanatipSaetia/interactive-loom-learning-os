import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  AssistantSettingsDialog,
  loadAssistantSettings,
  loadProfileKey,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

const models = (ids: string[]) =>
  new Response(JSON.stringify({ data: ids.map((id) => ({ id })) }), { headers: { 'content-type': 'application/json' } })

describe('AssistantSettingsDialog', () => {
  it('starts a new Ollama profile, tests it, fills the model and saves it as active', async () => {
    const fetchImpl = vi.fn(async () => models(['qwen3:8b', 'llama3.2']))
    const onChange = vi.fn()
    const onClose = vi.fn()
    render(<AssistantSettingsDialog open onClose={onClose} onChange={onChange} fetchImpl={fetchImpl} />)

    expect(screen.getByTestId('ai-base-url')).toHaveValue('http://localhost:11434/v1')
    fireEvent.click(screen.getByTestId('ai-test'))
    expect(await screen.findByTestId('ai-test-result')).toHaveTextContent('Connected · 2 models')
    expect(fetchImpl).toHaveBeenCalledWith('http://localhost:11434/v1/models', expect.anything())
    expect(screen.getByTestId('ai-model')).toHaveValue('llama3.2')

    fireEvent.click(screen.getByTestId('ai-save'))
    const saved = loadAssistantSettings()
    expect(saved.profiles).toHaveLength(1)
    expect(saved.activeId).toBe(saved.profiles[0].id)
    expect(saved.profiles[0]).toMatchObject({ name: 'Ollama', preset: 'ollama', model: 'llama3.2' })
    expect(onChange).toHaveBeenCalledWith(saved)
    expect(onClose).toHaveBeenCalled()
  })

  it('switching the preset fills its base URL and headers; the key stays for the session', () => {
    render(<AssistantSettingsDialog open onClose={() => {}} />)
    fireEvent.change(screen.getByTestId('ai-preset'), { target: { value: 'openrouter' } })
    expect(screen.getByTestId('ai-base-url')).toHaveValue('https://openrouter.ai/api/v1')
    expect(screen.getByTestId('ai-headers')).toHaveValue('X-Title: Interactive Loom')

    fireEvent.change(screen.getByTestId('ai-name'), { target: { value: 'My router' } })
    fireEvent.change(screen.getByTestId('ai-key'), { target: { value: 'sk-or-1' } })
    fireEvent.click(screen.getByTestId('ai-save'))

    const [profile] = loadAssistantSettings().profiles
    expect(profile).toMatchObject({ name: 'My router', headers: { 'X-Title': 'Interactive Loom' } })
    expect(loadProfileKey(profile.id)).toEqual({ key: 'sk-or-1', remember: false })
    expect(localStorage.getItem(`loom-ai-key:${profile.id}`)).toBeNull()
  })

  it('shows why a test failed and how to fix it', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    render(<AssistantSettingsDialog open onClose={() => {}} fetchImpl={fetchImpl} />)
    fireEvent.click(screen.getByTestId('ai-test'))
    const result = await screen.findByTestId('ai-test-result')
    expect(result).toHaveAttribute('data-kind', 'network')
    expect(result).toHaveTextContent('Could not reach the server')
    expect(result).toHaveTextContent('OLLAMA_ORIGINS=')
  })

  it('will not save a profile without a valid base URL', () => {
    render(<AssistantSettingsDialog open onClose={() => {}} />)
    fireEvent.change(screen.getByTestId('ai-base-url'), { target: { value: 'localhost:1234' } })
    expect(screen.getByTestId('ai-save')).toBeDisabled()
    expect(screen.getByText(/Enter a base URL/)).toBeInTheDocument()
  })

  it('deletes a profile and its key', async () => {
    const { rerender } = render(<AssistantSettingsDialog open onClose={() => {}} />)
    fireEvent.change(screen.getByTestId('ai-key'), { target: { value: 'k' } })
    fireEvent.click(screen.getByTestId('ai-remember'))
    fireEvent.click(screen.getByTestId('ai-save'))
    const [profile] = loadAssistantSettings().profiles
    expect(loadProfileKey(profile.id)).toEqual({ key: 'k', remember: true })

    rerender(<AssistantSettingsDialog open={false} onClose={() => {}} />)
    rerender(<AssistantSettingsDialog open onClose={() => {}} />)
    await waitFor(() => expect(screen.getByTestId('ai-profile-select')).toHaveValue(profile.id))
    fireEvent.click(screen.getByTestId('ai-profile-delete'))
    expect(loadAssistantSettings()).toEqual({ profiles: [], activeId: null })
    expect(loadProfileKey(profile.id)).toEqual({ key: '', remember: false })
  })
})
