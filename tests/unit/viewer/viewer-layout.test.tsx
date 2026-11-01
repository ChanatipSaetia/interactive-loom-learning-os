import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ViewerApp } from '../../../src/viewer/ViewerApp'
import { registerCoreSections } from '../../../src/core/learning-engine/registry/register-core-sections'
import { registerCorePresenters } from '../../../src/core/learning-engine/registry/register-core-presenters'
import { createTopicSource } from '../../../src/core/supporting/authoring-editor/workspace'

beforeAll(() => { registerCoreSections(); registerCorePresenters() })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

const source = createTopicSource([{ topicId: 'demo', files: {
  'topic.oui': 'root = Topic("A topic", "Demo", "", [SectionRef("intro")])',
  'sections/intro.oui': 'root = Text("Intro", ["Read this content."])',
} }])
const open = async () => {
  fireEvent.change(screen.getByTestId('viewer-file-input'), { target: { files: [{ name: 'demo.loom.oui', arrayBuffer: async () => new TextEncoder().encode(source).buffer }] } })
  await screen.findByTestId('viewer-topic')
}
const compact = () => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query === '(max-width: 1199px)', addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
}

describe('Viewer toolbar and composer clearance', () => {
  it('moves Read and Present into More on compact screens and closes the menu after selection', async () => {
    compact()
    render(<ViewerApp />)
    await open()
    expect(document.querySelector('.viewer')).toHaveClass('viewer-has-ai-bar')
    expect(screen.queryByTestId('viewer-mode')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('viewer-more'))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByTestId('viewer-mode-read')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(menu).getByTestId('viewer-mode-present'))
    await screen.findByTestId('present-mode')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.querySelector('.viewer')).not.toHaveClass('viewer-has-ai-bar')
    fireEvent.click(screen.getByTestId('viewer-more'))
    fireEvent.click(within(screen.getByRole('menu')).getByTestId('viewer-mode-read'))
    await screen.findByTestId('viewer-topic')
    expect(document.querySelector('.viewer')).toHaveClass('viewer-has-ai-bar')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps the complete domain name accessible while rendering an ellipsis-ready breadcrumb', async () => {
    compact()
    render(<ViewerApp />)
    const title = 'Business, Sales & Marketing Mastery for Small Business Owners'
    const files = [
      ['domain.oui', `root = Domain("${title}", "Domain description", [TopicRef("demo")])`],
      ['topics/demo.loom.oui', source],
    ].map(([path, text]) => ({ name: path.split('/').pop(), webkitRelativePath: `business/${path}`, text: async () => text }))
    fireEvent.change(screen.getByTestId('viewer-folder-input'), { target: { files } })
    const domain = await screen.findByTestId('viewer-domain')
    fireEvent.click(within(domain).getByRole('button', { name: 'Open' }))
    await screen.findByTestId('viewer-topic')
    const back = screen.getByTestId('viewer-back-to-domain')
    expect(back).toHaveAccessibleName(`Back to domain: ${title}`)
    expect(back).toHaveAttribute('title', title)
    expect(back.querySelector('.viewer-domain-title')).toHaveTextContent(title)
    expect(screen.queryByTestId('viewer-mode')).not.toBeInTheDocument()
    fireEvent.click(back)
    await waitFor(() => expect(screen.getByTestId('viewer-domain')).toBeInTheDocument())
    expect(document.querySelector('.viewer')).not.toHaveClass('viewer-has-ai-bar')
  })
})
