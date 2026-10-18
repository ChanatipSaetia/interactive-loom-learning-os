import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ViewerApp } from '../../../src/viewer/ViewerApp'
import { createTopicSource } from '../../../src/core/supporting/authoring-editor/workspace'
import { registerCoreSections } from '../../../src/core/learning-engine/registry/register-core-sections'
import { registerCorePresenters } from '../../../src/core/learning-engine/registry/register-core-presenters'

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
  registerCorePresenters()
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

  it('presents a topic beat by beat and goes back to reading (Present mode)', async () => {
    render(<ViewerApp />)
    const two = {
      topicId: 'two',
      files: {
        'topic.oui': 'root = Topic("Two Sections", "Architecture", "", [SectionRef("words"), SectionRef("check")])\n',
        'sections/words.oui': 'root = Text("Words", ["First paragraph.", "Second paragraph."])\n',
        'sections/check.oui': 'root = Bullets("Points", [Bullet("One"), Bullet("Two", [Bullet("Two a")])])\n',
      },
    }
    fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
    fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: createTopicSource([two]) } })
    fireEvent.click(screen.getByTestId('viewer-paste-open'))
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('viewer-mode-present'))
    expect(screen.getByTestId('present-stage')).toBeInTheDocument()
    expect(screen.queryByTestId('viewer-topic')).toBeNull()
    expect(screen.getByTestId('present-where').textContent).toBe('Text · 1 of 2')
    await waitFor(() => expect(document.querySelector('[data-testid="present-region-0"] .present-paragraph')?.textContent).toBe('First paragraph.\n'))

    const next = screen.getByTestId('present-next')
    const step = async (where: string) => {
      fireEvent.click(next)
      if (screen.getByTestId('present-where').textContent !== where) fireEvent.click(next)
      await waitFor(() => expect(screen.getByTestId('present-where').textContent).toBe(where))
    }
    await step('Text · 2 of 2')
    await step('Bullets · 1 of 2')
    await step('Bullets · 2 of 2')
    await step('Topic complete')
    expect(screen.getByTestId('present-complete')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('present-prev'))
    await waitFor(() => expect(screen.getByTestId('present-where').textContent).toBe('Bullets · 2 of 2'))
    fireEvent.click(screen.getByTestId('viewer-mode-read'))
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    expect(screen.queryByTestId('present-stage')).toBeNull()
  })

  it('plays the narration steps of a section in Present (sections/<name>.narrate.oui)', async () => {
    render(<ViewerApp />)
    const narrated = {
      topicId: 'narrated',
      files: {
        'topic.oui': 'root = Topic("Narrated", "Architecture", "", [SectionRef("words")])\n',
        'sections/words.oui': 'root = Text("Words", ["First paragraph.", "Second paragraph."])\n',
        'sections/words.narrate.oui': 'root = Narration([s1])\ns1 = NarrationStep("p2", "Both paragraphs say one thing.")\n',
      },
    }
    fireEvent.click(screen.getByTestId('viewer-paste-toggle'))
    fireEvent.change(screen.getByTestId('viewer-paste-input'), { target: { value: createTopicSource([narrated]) } })
    fireEvent.click(screen.getByTestId('viewer-paste-open'))
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    expect(screen.queryByTestId('viewer-error-summary')).toBeNull()

    fireEvent.click(screen.getByTestId('viewer-mode-present'))
    const where = () => screen.getByTestId('present-where').textContent
    // The step plays on the beat it names, adding no stop to the rail (decisions 96, 108)
    expect(where()).toBe('Text · 1 of 2')
    expect(screen.queryByTestId('present-caption')).toBeNull()
    fireEvent.click(screen.getByTestId('present-next'))
    if (where() !== 'Text · 2 of 2') fireEvent.click(screen.getByTestId('present-next'))
    await waitFor(() => expect(where()).toBe('Text · 2 of 2'))
    expect((await screen.findByTestId('present-caption')).textContent).toBe('Both paragraphs say one thing.')
  })

  it('keeps the place in Present across a Refresh while the section is still there', async () => {
    const files = (sections: string[]) => ({
      topicId: 'two',
      files: {
        'topic.oui': `root = Topic("Refreshing", "Architecture", "", [${sections.map((n) => `SectionRef("${n}")`).join(', ')}])\n`,
        'sections/words.oui': 'root = Text("Words", ["First paragraph.", "Second paragraph."])\n',
        'sections/added.oui': 'root = Text("Added", ["New."])\n',
        'sections/check.oui': 'root = Bullets("Points", [Bullet("One"), Bullet("Two")])\n',
      },
    })
    let source = createTopicSource([files(['words', 'check'])])
    const file = { name: 'r.loom.oui', arrayBuffer: async () => new TextEncoder().encode(source).buffer }
    render(<ViewerApp />)
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('viewer-mode-present'))
    const where = () => screen.getByTestId('present-where').textContent
    for (const target of ['Text · 2 of 2', 'Bullets · 1 of 2', 'Bullets · 2 of 2']) {
      fireEvent.click(screen.getByTestId('present-next'))
      if (where() !== target) fireEvent.click(screen.getByTestId('present-next'))
      await waitFor(() => expect(where()).toBe(target))
    }

    // A section added before it: same section and beat
    source = createTopicSource([files(['words', 'added', 'check'])])
    fireEvent.click(screen.getByTestId('viewer-refresh'))
    await waitFor(() => expect(screen.getByTestId('viewer-status').textContent).toBe('Refreshed'))
    await waitFor(() => expect(where()).toBe('Bullets · 2 of 2'))
    expect(document.querySelector('[data-testid="present-region-2"].is-current')).not.toBeNull()

    // The section removed: back to the start
    source = createTopicSource([files(['words', 'added'])])
    fireEvent.click(screen.getByTestId('viewer-refresh'))
    await waitFor(() => expect(where()).toBe('Text · 1 of 2'))
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
      expect(screen.getByTestId('pick-composer').getAttribute('placeholder')).toContain('Click part of a section')

      fireEvent.click(await screen.findByText(/Hello from the viewer/))
      fireEvent.click(screen.getByRole('heading', { level: 2 }))
      fireEvent.click(screen.getByText(/Hello from the viewer/))
      // Chips are in reading order: topic.oui, then the sections.
      const entries = screen.getAllByTestId('pick-entry')
      expect(entries).toHaveLength(2)
      expect(entries[0].textContent).toContain('whole section')
      expect(entries[1].textContent).toContain('root.paragraphs[0]')
      // A chip opens to show its full pointer and a comment box.
      fireEvent.click(screen.getAllByTestId('pick-row')[1])
      expect(screen.getByTestId('pick-editor').textContent).toContain('kafka/sections/intro.oui:2 #root.paragraphs[0]')

      fireEvent.change(screen.getByTestId('pick-entry-note'), { target: { value: 'Say why logs matter.' } })
      // With the assistant on the page, Copy for agent is in the ⋯ menu.
      fireEvent.click(screen.getByTestId('pick-more'))
      fireEvent.click(screen.getByTestId('pick-copy'))
      await waitFor(() => expect(writeText).toHaveBeenCalled())
      expect((writeText.mock.calls[0] as unknown as [string])[0]).toBe(
        'Comments on the Loom topic "kafka":\n'
        + '- kafka/topic.oui:1 #root (from pasted text)\n'
        + '- kafka/sections/intro.oui:2 #root.paragraphs[0] (from pasted text)\n  Say why logs matter.\n',
      )

      fireEvent.keyDown(window, { key: 'Escape' })
      expect(toggle.getAttribute('aria-pressed')).toBe('false')
      // The picks are kept for the next visit.
      expect(screen.getAllByTestId('pick-entry')).toHaveLength(2)
      unmount()
      render(<ViewerApp />)
      await openPasted(pickTopic())
      expect(screen.getAllByTestId('pick-entry')).toHaveLength(2)
      fireEvent.click(screen.getAllByTestId('pick-row')[1])
      expect((screen.getByTestId('pick-entry-note') as HTMLTextAreaElement).value).toBe('Say why logs matter.')
      localStorage.clear()
    })

    it('picks with Alt+click outside Pick mode, toggles with P and marks entries stale after a refresh', async () => {
      localStorage.clear()
      render(<ViewerApp />)
      await openPasted(pickTopic())
      expect(screen.queryByTestId('pick-entry')).toBeNull()

      fireEvent.click(await screen.findByText(/Hello from the viewer/))
      expect(screen.queryByTestId('pick-entry')).toBeNull()
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
      fireEvent.click(screen.getByTestId('pick-row'))
      expect(screen.getByTestId('pick-editor').textContent).toContain('No longer in the topic')
      localStorage.clear()
    })
  })
})
