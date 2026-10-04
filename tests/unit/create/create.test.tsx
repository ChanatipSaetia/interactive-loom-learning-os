import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateApp } from '../../../src/create/CreateApp'
import { LOOM_PROMPT_PATH, assistantInstructions } from '../../../src/core/learning-engine/composition/oui/llm-guide'

const PROMPT = '# Loom prompt\nYou write learning topics…\n'

describe('Create with AI page', () => {
  const writeText = vi.fn(async () => {})

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(PROMPT)))
    Object.assign(navigator, { clipboard: { writeText } })
    writeText.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('loads the published prompt and copies it', async () => {
    render(<CreateApp />)
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`${LOOM_PROMPT_PATH}$`)))
    const copy = screen.getByTestId('create-copy-prompt')
    await waitFor(() => expect(copy).toBeEnabled())
    fireEvent.click(copy)
    await waitFor(() => expect(copy.textContent).toBe('Copied'))
    expect(writeText).toHaveBeenCalledWith(PROMPT)
  })

  it('downloads the prompt as a markdown file', async () => {
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob.type).toBe('text/markdown')
      return 'blob:prompt'
    })
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('loom-authoring-prompt.md')
    })
    render(<CreateApp />)
    const download = screen.getByTestId('create-download-prompt')
    await waitFor(() => expect(download).toBeEnabled())
    fireEvent.click(download)
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    click.mockRestore()
  })

  it('copies the Claude Project instructions and example requests', async () => {
    render(<CreateApp />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Create a Loom topic with Claude')
    fireEvent.click(screen.getByTestId('create-copy-instructions'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(assistantInstructions('claude')))
    fireEvent.click(screen.getByTestId('create-copy-example-0'))
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('Loom topic')))
    expect(screen.getByTestId('create-open-viewer').getAttribute('href')).toMatch(/viewer\.html$/)
  })

  it('switches the guide to Gemini and remembers the choice', async () => {
    const { unmount } = render(<CreateApp />)
    fireEvent.click(screen.getByTestId('create-assistant-gemini'))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Create a Loom topic with Gemini')
    expect(screen.getByRole('heading', { name: /Set up a Gemini Gem/ })).toBeInTheDocument()
    expect(screen.getByTestId('create-instructions').textContent).toContain('Put the whole topic in ONE Canvas')
    expect(window.location.search).toBe('?ai=gemini')
    fireEvent.click(screen.getByTestId('create-copy-instructions'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(assistantInstructions('gemini')))
    unmount()

    window.history.replaceState(null, '', '/')
    render(<CreateApp />)
    expect(screen.getByTestId('create-assistant-gemini').getAttribute('aria-checked')).toBe('true')
  })

  it('preselects the assistant from ?ai=', () => {
    localStorage.setItem('loom-create-assistant', 'gemini')
    window.history.replaceState(null, '', '/?ai=claude')
    render(<CreateApp />)
    expect(screen.getByTestId('create-assistant-claude').getAttribute('aria-checked')).toBe('true')
  })

  it('points to the prompt file when it cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })))
    render(<CreateApp />)
    expect((await screen.findByRole('alert')).textContent).toMatch(/Could not load the prompt/)
    expect(screen.getByTestId('create-copy-prompt')).toBeDisabled()
  })
})
