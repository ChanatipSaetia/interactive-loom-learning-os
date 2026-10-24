import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateApp } from '../../../src/create/CreateApp'
import { LOOM_SKILL_ZIP_PATH, SKILL_ADD_COMMAND, SKILL_UPDATE_COMMAND } from '../../../src/core/learning-engine/composition/oui/llm-guide'

describe('Create with AI page', () => {
  const writeText = vi.fn(async () => {})

  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText } })
    writeText.mockClear()
  })

  afterEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  it('has only the two skill tabs', () => {
    render(<CreateApp />)
    expect(screen.getAllByRole('radio').map((tab) => tab.textContent)).toEqual(['Claude app', 'Coding agents'])
  })

  it('offers the skill zip for the Claude app, then example requests and Viewer', async () => {
    render(<CreateApp />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Create a Loom topic with the Claude app')
    const download = screen.getByTestId('create-download-skill')
    expect(download.getAttribute('href')).toBe(`/${LOOM_SKILL_ZIP_PATH}`)
    expect(download).toHaveAttribute('download')
    expect(screen.queryByTestId('create-skill-add')).toBeNull()
    fireEvent.click(screen.getByTestId('create-copy-example-0'))
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('Loom topic')))
    expect(screen.getByTestId('create-open-viewer').getAttribute('href')).toMatch(/viewer\.html$/)
  })

  it('installs the skill for coding agents with npx skills add and remembers the tab', async () => {
    const { unmount } = render(<CreateApp />)
    fireEvent.click(screen.getByTestId('create-assistant-agent'))
    expect(window.location.search).toBe('?ai=agent')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Create a Loom topic with a coding agent')
    expect(screen.getByTestId('create-skill-add').textContent).toBe(SKILL_ADD_COMMAND)
    expect(SKILL_ADD_COMMAND).toBe('npx skills add ChanatipSaetia/interactive-loom-learning-os --skill loom-topic-writer -g')
    expect(screen.getByTestId('create-skill-update').textContent).toBe(SKILL_UPDATE_COMMAND)
    expect(screen.queryByTestId('create-download-skill')).toBeNull()
    fireEvent.click(screen.getByTestId('create-skill-add-copy'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(SKILL_ADD_COMMAND))
    unmount()

    window.history.replaceState(null, '', '/')
    render(<CreateApp />)
    expect(screen.getByTestId('create-assistant-agent').getAttribute('aria-checked')).toBe('true')
  })

  it('offers the learner skills: zips for the Claude app, commands for coding agents', () => {
    render(<CreateApp />)
    expect(screen.getByTestId('create-download-loom-tutor-app').getAttribute('href')).toBe('/llm/skills/loom-tutor-app.zip')
    expect(screen.getByTestId('create-download-loom-tutor-viewer').getAttribute('href')).toBe('/llm/skills/loom-tutor-viewer.zip')
    fireEvent.click(screen.getByTestId('create-assistant-agent'))
    expect(screen.getByTestId('create-add-loom-tutor-app').textContent).toBe('npx skills add ChanatipSaetia/interactive-loom-learning-os --skill loom-tutor-app -g')
    expect(screen.queryByTestId('create-download-loom-tutor-app')).toBeNull()
  })

  it('preselects the tab from ?ai= and falls back to the Claude app for old links', () => {
    localStorage.setItem('loom-create-assistant', 'agent')
    window.history.replaceState(null, '', '/?ai=claude')
    const { unmount } = render(<CreateApp />)
    expect(screen.getByTestId('create-assistant-claude').getAttribute('aria-checked')).toBe('true')
    unmount()

    localStorage.clear()
    window.history.replaceState(null, '', '/?ai=gemini')
    render(<CreateApp />)
    expect(screen.getByTestId('create-assistant-claude').getAttribute('aria-checked')).toBe('true')
  })
})
