import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { StudioWorkspace } from '../../../src/studio/components/StudioWorkspace'
import { StudioApp } from '../../../src/studio/StudioApp'
import { TopicWorkspace, memoryFolder } from '../../../src/core/supporting/authoring-editor/workspace'
import { registerCoreSections } from '../../../src/core/learning-engine/registry/register-core-sections'

const files = () => ({
  'topic.oui': 'root = Topic("Demo", "Architecture", "A demo", [SectionRef("intro"), SectionRef("quiz")])\n',
  'sections/intro.oui': 'root = Text("Intro", ["Hello."])\n',
  'sections/quiz.oui': 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "A", true, "Yes")])\n',
})

async function renderWorkspace() {
  const folder = memoryFolder('demo', files())
  const workspace = await TopicWorkspace.open(folder)
  const utils = render(<StudioWorkspace workspace={workspace} onOpenFolder={() => {}} />)
  return { folder, workspace, ...utils }
}

beforeAll(() => registerCoreSections())

describe('Loom Studio', () => {
  it('shows the landing page with a browser-support message in jsdom', () => {
    render(<StudioApp />)
    expect(screen.getByTestId('studio-landing')).toBeInTheDocument()
    expect(screen.getByRole('alert').textContent).toMatch(/Chromium-based browser/)
  })

  it('lists sections with their types and opens the first one', async () => {
    await renderWorkspace()
    expect(screen.getByTestId('studio-section-intro').textContent).toContain('text')
    expect(screen.getByTestId('studio-section-quiz').textContent).toContain('quiz')
    expect(screen.getByTestId('studio-section-editor')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('studio-preview').getAttribute('data-section-type')).toBe('text'))
  })

  it('tracks unsaved edits and saves with Ctrl+S', async () => {
    const { folder, workspace } = await renderWorkspace()
    expect(screen.getByTestId('studio-save').textContent).toContain('Saved')
    act(() => workspace.setSource('intro', 'root = Text("Intro", ["Changed."])\n'))
    expect(screen.getByTestId('studio-save').textContent).toContain('Save (1)')
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    await waitFor(() => expect(folder.files.get('sections/intro.oui')).toBe('root = Text("Intro", ["Changed."])\n'))
    await waitFor(() => expect(screen.getByTestId('studio-save').textContent).toContain('Saved'))
  })

  it('shows diagnostics and blocks the form for broken code', async () => {
    const { workspace } = await renderWorkspace()
    act(() => workspace.setSource('intro', 'root = Txt("Intro", [])\n'))
    expect(screen.getByTestId('studio-diagnostics').textContent).toMatch(/Line 1: Unknown component "Txt"/)
    fireEvent.click(screen.getByTestId('studio-tab-form'))
    expect(screen.getByRole('alert').textContent).toMatch(/Fix the errors in the code first/)
  })

  it('edits through the visual form', async () => {
    const { workspace } = await renderWorkspace()
    fireEvent.click(screen.getByTestId('studio-tab-form'))
    expect(screen.getByTestId('studio-form')).toBeInTheDocument()
    const titleInput = screen.getByDisplayValue('Intro')
    fireEvent.change(titleInput, { target: { value: 'Welcome' } })
    expect(workspace.section('intro')?.source).toContain('root = Text("Welcome"')
  })

  it('adds a section from a template', async () => {
    const { folder } = await renderWorkspace()
    fireEvent.click(screen.getByTestId('studio-add-section'))
    fireEvent.click(screen.getByTestId('studio-template-flashcards'))
    fireEvent.change(screen.getByTestId('studio-add-title'), { target: { value: 'Key Terms' } })
    expect((screen.getByTestId('studio-add-name') as HTMLInputElement).value).toBe('key-terms')
    fireEvent.click(screen.getByTestId('studio-confirm'))
    await waitFor(() => expect(screen.getByTestId('studio-section-key-terms')).toBeInTheDocument())
    expect(folder.files.get('topic.oui')).toContain('SectionRef("key-terms")')
  })

  it('renames, reorders and deletes sections', async () => {
    const { folder } = await renderWorkspace()
    fireEvent.click(screen.getByLabelText('Rename quiz'))
    fireEvent.change(screen.getByTestId('studio-rename-input'), { target: { value: 'Bad Name' } })
    expect(screen.getByText(/lowercase letters/)).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('studio-rename-input'), { target: { value: 'check' } })
    fireEvent.click(screen.getByTestId('studio-confirm'))
    await waitFor(() => expect(screen.getByTestId('studio-section-check')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Move check up'))
    await waitFor(() => expect(folder.files.get('topic.oui')).toMatch(/SectionRef\("check"\),\s*SectionRef\("intro"\)/))

    fireEvent.click(screen.getByLabelText('Delete intro'))
    fireEvent.click(screen.getByTestId('studio-confirm'))
    await waitFor(() => expect(screen.queryByTestId('studio-section-intro')).toBeNull())
    expect(folder.files.has('sections/intro.oui')).toBe(false)
  })

  it('edits topic settings', async () => {
    const { folder } = await renderWorkspace()
    fireEvent.click(screen.getByTestId('studio-topic-item'))
    fireEvent.change(screen.getByTestId('studio-topic-title'), { target: { value: 'Demo 2' } })
    fireEvent.click(screen.getByTestId('studio-save'))
    await waitFor(() => expect(folder.files.get('topic.oui')).toContain('"Demo 2"'))
  })
})
