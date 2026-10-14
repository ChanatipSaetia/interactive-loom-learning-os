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

  it('refreshes an opened file, keeping the selected topic', async () => {
    let source = createTopicSource([topic('one', 'First Topic'), topic('two', 'Second Topic')])
    const file = { name: 'all.loom.oui', arrayBuffer: async () => new TextEncoder().encode(source).buffer }
    render(<ViewerApp />)
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('viewer-topic-select'), { target: { value: '1' } })

    source = createTopicSource([topic('one', 'First Topic'), topic('two', 'Second Topic, Revised')])
    fireEvent.click(screen.getByTestId('viewer-refresh'))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Second Topic, Revised'))
    expect(screen.getByTestId('viewer-status').textContent).toBe('Refreshed')
  })

  it('keeps the topic and shows the error when a refresh fails', async () => {
    let source = createTopicSource([topic('one', 'Good Topic')])
    const file = { name: 'one.loom.oui', arrayBuffer: async () => new TextEncoder().encode(source).buffer }
    render(<ViewerApp />)
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    source = 'root = Topic("T", "C", "", [SectionRef("a")])'
    fireEvent.click(screen.getByTestId('viewer-refresh'))
    await waitFor(() => expect(screen.getByTestId('viewer-status').textContent).toMatch(/^Could not refresh:/))
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Good Topic')
  })

  it('refreshes pasted text from the clipboard or the next paste', async () => {
    const readText = vi.fn(async () => createTopicSource([topic('one', 'From Clipboard')]))
    Object.assign(navigator, { clipboard: { readText } })
    render(<ViewerApp />)
    fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
    fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: createTopicSource([topic('one', 'Pasted Topic')]) } })
    fireEvent.click(screen.getByTestId('viewer-paste-open'))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Pasted Topic'))

    fireEvent.click(screen.getByTestId('viewer-refresh'))
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('From Clipboard'))

    const event = new Event('paste', { bubbles: true }) as Event & { clipboardData: unknown }
    event.clipboardData = { getData: () => createTopicSource([topic('one', 'Pasted Again')]) }
    fireEvent(document.body, event)
    await waitFor(() => expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Pasted Again'))
  })

  describe('Pick mode', () => {
    const pickTopic = () => createTopicSource([{
      topicId: 'kafka',
      files: {
        'topic.oui': 'root = Topic("Kafka", "Data", "Logs", [SectionRef("intro")])\n',
        'sections/intro.oui': '// Intro\nroot = Text("Intro", ["Hello from the viewer."])\n',
      },
    }])

    async function openPasted(text: string) {
      fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
      fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: text } })
      fireEvent.click(screen.getByTestId('viewer-paste-open'))
      await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    }

    it('picks sections and the topic header, then copies comments for the agent', async () => {
      localStorage.clear()
      const writeText = vi.fn(async () => {})
      Object.assign(navigator, { clipboard: { writeText } })
      const { unmount } = render(<ViewerApp />)
      await openPasted(pickTopic())

      const toggle = screen.getByTestId('pick-toggle')
      fireEvent.click(toggle)
      expect(toggle.getAttribute('aria-pressed')).toBe('true')
      expect(screen.getByTestId('pick-tray').textContent).toContain('Click part of a section')

      fireEvent.click(await screen.findByText(/Hello from the viewer/))
      fireEvent.click(screen.getByRole('heading', { level: 2 }))
      fireEvent.click(screen.getByText(/Hello from the viewer/))
      // Rows are grouped in reading order: topic.oui, then the sections.
      const entries = screen.getAllByTestId('pick-entry')
      expect(entries).toHaveLength(2)
      expect(entries[0].textContent).toContain('Whole section')
      expect(entries[1].textContent).toContain('root.paragraphs[0]')
      // A row opens to show its full pointer.
      fireEvent.click(screen.getAllByTestId('pick-row')[1])
      expect(entries[1].textContent).toContain('kafka/sections/intro.oui:2 #root.paragraphs[0]')

      fireEvent.click(screen.getAllByTestId('pick-add-note')[1])
      fireEvent.change(screen.getByTestId('pick-entry-note'), { target: { value: 'Say why logs matter.' } })
      fireEvent.click(screen.getByTestId('pick-copy'))
      await waitFor(() => expect(writeText).toHaveBeenCalled())
      expect((writeText.mock.calls[0] as unknown as [string])[0]).toBe(
        'Comments on the Loom topic "kafka":\n'
        + '- kafka/topic.oui:1 #root (from pasted text)\n'
        + '- kafka/sections/intro.oui:2 #root.paragraphs[0] (from pasted text)\n  Say why logs matter.\n',
      )

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(toggle.getAttribute('aria-pressed')).toBe('false')
      // The tray stays while it has entries, and is kept for the next visit.
      expect(screen.getByTestId('pick-tray')).toBeInTheDocument()
      unmount()
      render(<ViewerApp />)
      await openPasted(pickTopic())
      expect(screen.getAllByTestId('pick-entry')).toHaveLength(2)
      expect((screen.getByTestId('pick-entry-note') as HTMLTextAreaElement).value).toBe('Say why logs matter.')
      localStorage.clear()
    })

    it('picks with Alt+click outside Pick mode, toggles with P and marks entries stale after a refresh', async () => {
      localStorage.clear()
      render(<ViewerApp />)
      await openPasted(pickTopic())
      expect(screen.queryByTestId('pick-tray')).toBeNull()

      fireEvent.click(await screen.findByText(/Hello from the viewer/))
      expect(screen.queryByTestId('pick-tray')).toBeNull()
      fireEvent.click(screen.getByText(/Hello from the viewer/), { altKey: true })
      expect(screen.getAllByTestId('pick-entry')).toHaveLength(1)

      fireEvent.keyDown(window, { key: 'p' })
      expect(screen.getByTestId('pick-toggle').getAttribute('aria-pressed')).toBe('true')
      fireEvent.keyDown(window, { key: 'p' })
      expect(screen.getByTestId('pick-toggle').getAttribute('aria-pressed')).toBe('false')

      // Pasting a new version replaces the topic; the section is gone, so its entry is stale.
      const event = new Event('paste', { bubbles: true }) as Event & { clipboardData: unknown }
      event.clipboardData = { getData: () => pickTopic().replace('SectionRef("intro")', '').replace(/\/\/ === sections\/intro\.oui ===[\s\S]*$/, '') }
      fireEvent(document.body, event)
      await waitFor(() => expect(screen.getByTestId('pick-entry').className).toContain('is-stale'))
      expect(screen.getByTestId('pick-entry').textContent).toContain('No longer in the topic')
      localStorage.clear()
    })
  })
})
