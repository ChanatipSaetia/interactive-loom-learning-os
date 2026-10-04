import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ViewerApp } from '../../../src/viewer/ViewerApp'
import { createTopicSource } from '../../../src/core/supporting/authoring-editor/workspace'
import { registerCoreSections } from '../../../src/core/learning-engine/registry/register-core-sections'

const topic = (id: string, title: string) => ({
  topicId: id,
  files: {
    'topic.oui': `root = Topic("${title}", "Architecture", "About ${title}", [SectionRef("intro"), SectionRef("broken")])\n`,
    'sections/intro.oui': 'root = Text("Intro", ["Hello from the viewer."])\n',
    'sections/broken.oui': 'root = Quiz(',
  },
})

/** jsdom's File lacks arrayBuffer(), so fake the parts the reader uses. */
const pickedFile = (name: string, text: string) => ({ name, arrayBuffer: async () => new TextEncoder().encode(text).buffer })

beforeAll(() => {
  registerCoreSections()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
})

describe('Loom Viewer', () => {
  it('opens a .loom.oui file and switches between its topics', async () => {
    render(<ViewerApp />)
    expect(screen.getByTestId('viewer-landing')).toBeInTheDocument()
    const source = createTopicSource([topic('one', 'First Topic'), topic('two', 'Second Topic')])
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [pickedFile('all.loom.oui', source)] } })

    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('First Topic')
    expect(await screen.findByText(/Hello from the viewer/)).toBeInTheDocument()
    expect(screen.getByTestId('viewer-section-error').textContent).toContain('sections/broken.oui')

    fireEvent.change(screen.getByTestId('viewer-topic-select'), { target: { value: '1' } })
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Second Topic')

    fireEvent.click(screen.getByTestId('viewer-open-another'))
    expect(screen.getByTestId('viewer-landing')).toBeInTheDocument()
  })

  it('summarises section errors and copies them as a fix request', async () => {
    const writeText = vi.fn(async () => {})
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ViewerApp />)
    fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
    fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: createTopicSource([topic('one', 'Broken Topic')]) } })
    fireEvent.click(screen.getByTestId('viewer-paste-open'))
    const summary = await screen.findByTestId('viewer-error-summary')
    expect(summary.textContent).toContain('1 part of this topic has errors')
    expect(summary.textContent).toContain('sections/broken.oui')
    expect(screen.getAllByTestId('viewer-section-error')).toHaveLength(1)
    expect(document.querySelector('.topic-content [data-testid="viewer-section-error"]')).toBeNull()
    fireEvent.click(screen.getByTestId('viewer-copy-errors'))
    await waitFor(() => expect(screen.getByTestId('viewer-copy-errors').textContent).toBe('Copied'))
    const copied = (writeText.mock.calls[0] as unknown as [string])[0]
    expect(copied).toMatch(/^Loom Viewer found these errors in the topic "one"\. Fix only what they point at/)
    expect(copied).toContain('sections/broken.oui\nline 1:')
  })

  it('copies an error for text that cannot be opened', async () => {
    const writeText = vi.fn(async () => {})
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ViewerApp />)
    fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
    fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: 'root = Topic("T", "C", "", [SectionRef("a")])' } })
    fireEvent.click(screen.getByTestId('viewer-paste-open'))
    expect((await screen.findByRole('alert')).textContent).toMatch(/only a topic.oui/)
    fireEvent.click(screen.getByTestId('viewer-copy-load-error'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^Loom Viewer could not open the topic you wrote:\n\nThis is only a topic.oui/)))
  })

  it('opens pasted text from the Paste box', async () => {
    render(<ViewerApp />)
    fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
    const open = screen.getByTestId('viewer-paste-open')
    expect(open).toBeDisabled()
    fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: createTopicSource([topic('one', 'Pasted Topic')]) } })
    fireEvent.click(open)
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Pasted Topic')
  })

  it('opens text pasted anywhere on the start screen, including a single section', async () => {
    render(<ViewerApp />)
    const event = new Event('paste', { bubbles: true }) as Event & { clipboardData: unknown }
    event.clipboardData = { getData: () => 'root = Text("Just One", ["Hello from one section."])\n' }
    fireEvent(document.body, event)
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Just One')
    expect(await screen.findByText(/Hello from one section/)).toBeInTheDocument()
    expect(screen.queryByTestId('viewer-error-summary')).toBeNull()
  })

  it('opens a single section .oui file', async () => {
    render(<ViewerApp />)
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [pickedFile('intro.oui', 'root = Text("Intro File", ["From a file."])\n')] } })
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Intro File'))
  })

  it('shows an error for a file that is not a topic archive', async () => {
    render(<ViewerApp />)
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [pickedFile('topic.oui', 'root = Topic("T", "C", "", [SectionRef("a")])')] } })
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/only a topic.oui, without its sections/))
  })
})
