import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PickMode, sourceResolver } from '../../../../../../src/core/supporting/authoring-editor/pick'
import {
  AssistantDock,
  AssistantToggle,
  createProfile,
  pickBridgeOf,
  saveAssistantSettings,
  useAssistant,
  type AssistantTopicContext,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

const files = {
  'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz")])\n',
  'sections/quiz.oui': 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "Yes", true, "Right.")])\n',
}
const resolve = sourceResolver(files)
const context = (): AssistantTopicContext => ({ topicId: 'demo', files, fileOrder: ['topic.oui', 'sections/quiz.oui'], diagnostics: {} })

function Harness({ fetchImpl }: { fetchImpl: typeof fetch }) {
  const assistant = useAssistant({ topicId: 'demo', app: 'viewer', getContext: context, fetchImpl })
  return (
    <>
      <AssistantToggle assistant={assistant} className="pill" />
      <PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={resolve} assistant={pickBridgeOf(assistant)} />
      <AssistantDock assistant={assistant} resolve={resolve} fetchImpl={fetchImpl} />
    </>
  )
}

const enc = new TextEncoder()
function streamOf(...pieces: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`))
      controller.enqueue(enc.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return new Response(body, { headers: { 'content-type': 'text/event-stream' } })
}

function mockFetch() {
  return vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.endsWith('/models')) return new Response(JSON.stringify({ data: [{ id: 'm1' }] }), { headers: { 'content-type': 'application/json' } })
    return streamOf('Fair ', 'enough.')
  })
}

function seed(baseUrl: string) {
  const profile = { ...createProfile('custom'), name: 'Mine', baseUrl, model: 'm1' }
  saveAssistantSettings({ profiles: [profile], activeId: profile.id })
  localStorage.setItem('loom-pick-tray:demo', JSON.stringify({
    mode: 'comment',
    question: '',
    entries: [{ file: 'sections/quiz.oui', anchor: 'q1', label: 'Check › q1', section: 'Check', note: 'Too easy?' }],
  }))
  return profile
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('AssistantDock with the Pick tray', () => {
  it('sends the tray, clears it and streams the reply into the panel', async () => {
    seed('http://localhost:11434/v1')
    const fetchImpl = mockFetch()
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)

    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(screen.getByTestId('ai-reply')).toHaveTextContent('Fair enough.')
    expect(screen.getByTestId('ai-chip')).toHaveTextContent('Check › q1')
    expect(screen.queryByTestId('pick-entry')).toBeNull()

    const chat = fetchImpl.mock.calls.find(([url]) => String(url).endsWith('/chat/completions'))!
    const body = JSON.parse(chat[1]!.body as string)
    expect(body.model).toBe('m1')
    expect(body.messages[0].content).toContain('### sections/quiz.oui: q1 (line 2)')
    expect(body.messages[1].content).toBe('Comments on these places:\n- sections/quiz.oui #q1\n  Too easy?')
    expect(JSON.parse(localStorage.getItem('loom-ai-thread:demo')!).messages).toHaveLength(2)

    // New chat clears the thread.
    fireEvent.click(screen.getByTestId('ai-new-chat'))
    expect(screen.queryByTestId('ai-reply')).toBeNull()
  })

  it('asks once before the first send to a remote server', async () => {
    const profile = seed('https://openrouter.ai/api/v1')
    const fetchImpl = mockFetch()
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)

    fireEvent.click(screen.getByTestId('pick-send'))
    expect(await screen.findByTestId('ai-remote-notice')).toHaveTextContent('openrouter.ai')
    expect(fetchImpl).not.toHaveBeenCalledWith(expect.stringContaining('/chat/completions'), expect.anything())
    await act(async () => fireEvent.click(screen.getByTestId('ai-remote-ok')))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(localStorage.getItem(`loom-ai-remote-ok:${profile.id}`)).toBe('1')
  })

  it('keeps the tray when the notice is declined', async () => {
    seed('https://openrouter.ai/api/v1')
    render(<Harness fetchImpl={mockFetch() as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await screen.findByTestId('ai-remote-notice')
    await act(async () => fireEvent.click(screen.getByText('Cancel')))
    expect(screen.getAllByTestId('pick-entry')).toHaveLength(1)
    expect(screen.queryByTestId('ai-reply')).toBeNull()
  })

  it('opens the connection settings when no profile is set up, keeping the tray', async () => {
    seed('http://localhost:1/v1')
    localStorage.removeItem('loom-ai-profiles')
    render(<Harness fetchImpl={mockFetch() as unknown as typeof fetch} />)
    expect(screen.queryByTestId('ai-panel')).toBeNull()
    fireEvent.click(screen.getByTestId('pick-send'))
    expect(await screen.findByTestId('ai-settings')).toBeInTheDocument()
    expect(screen.getAllByTestId('pick-entry')).toHaveLength(1)
  })

  it('shows a failed request with its fix hint and retries it', async () => {
    seed('http://localhost:11434/v1')
    let fail = true
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith('/models')) return new Response('{"data":[]}', { headers: { 'content-type': 'application/json' } })
      if (fail) throw new TypeError('Failed to fetch')
      return streamOf('Back.')
    })
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'error'))
    expect(screen.getByTestId('ai-reply')).toHaveTextContent('Could not reach the server')
    fail = false
    fireEvent.click(screen.getByTestId('ai-retry'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(screen.getAllByTestId('ai-reply')).toHaveLength(1)
  })
})
