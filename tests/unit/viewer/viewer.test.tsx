import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ViewerApp } from '../../../src/viewer/ViewerApp'
import { createTopicBundle } from '../../../src/core/supporting/authoring-editor/workspace'
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
  it('opens a single-file bundle and switches between its topics', async () => {
    render(<ViewerApp />)
    expect(screen.getByTestId('viewer-landing')).toBeInTheDocument()
    const bundle = createTopicBundle([topic('one', 'First Topic'), topic('two', 'Second Topic')])
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [pickedFile('all.loom.json', bundle)] } })

    await waitFor(() => expect(screen.getByTestId('viewer-topic')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('First Topic')
    expect(await screen.findByText(/Hello from the viewer/)).toBeInTheDocument()
    expect(screen.getByTestId('viewer-section-error').textContent).toContain('sections/broken.oui')

    fireEvent.change(screen.getByTestId('viewer-topic-select'), { target: { value: '1' } })
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Second Topic')

    fireEvent.click(screen.getByTestId('viewer-open-another'))
    expect(screen.getByTestId('viewer-landing')).toBeInTheDocument()
  })

  it('shows an error for a file that is not a topic archive', async () => {
    render(<ViewerApp />)
    fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [pickedFile('notes.json', '{}')] } })
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/not a Loom topic bundle/))
  })
})
