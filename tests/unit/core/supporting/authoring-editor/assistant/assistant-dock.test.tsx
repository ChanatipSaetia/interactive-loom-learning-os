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
  return vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
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
    expect(body.messages[0].content).not.toContain('<topic-context topic=')
    expect(body.messages[1].content).toMatch(/^<topic-context topic="demo">/)
    expect(body.messages[1].content).toContain('### sections/quiz.oui: q1 (line 2)')
    expect(body.messages[1].content).toContain('QuizQuestion(id: string')
    expect(body.messages[1].content).toMatch(/<\/topic-context>\n\nAbout these places:\n- sections\/quiz.oui #q1\n {2}Too easy\?$/)
    expect(JSON.parse(localStorage.getItem('loom-ai-thread:demo')!).messages).toHaveLength(2)

    // New chat clears the thread.
    fireEvent.click(screen.getByTestId('ai-new-chat'))
    expect(screen.queryByTestId('ai-reply')).toBeNull()
  })

  it('keeps asking from the message bar, repeating the earlier turns unchanged so the server can reuse its cache', async () => {
    seed('http://localhost:11434/v1')
    const fetchImpl = mockFetch()
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)

    // The bar sends its picks with the message.
    fireEvent.click(screen.getByTestId('ai-toggle'))
    fireEvent.change(screen.getByTestId('pick-composer'), { target: { value: 'Is it fair?' } })
    fireEvent.keyDown(screen.getByTestId('pick-composer'), { key: 'Enter' })
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(screen.queryByTestId('pick-entry')).toBeNull()
    expect(screen.getByTestId('pick-composer')).toHaveValue('')
    // While a reply streams the bar shows Stop; it is Send again after.
    expect(screen.getByTestId('ai-chip')).toHaveTextContent('Check › q1')

    // A follow-up: Shift+Enter is a new line, Enter sends.
    fireEvent.change(screen.getByTestId('pick-composer'), { target: { value: 'And q2?' } })
    fireEvent.keyDown(screen.getByTestId('pick-composer'), { key: 'Enter', shiftKey: true })
    expect(fetchImpl.mock.calls.filter(([u]) => u.endsWith('/chat/completions'))).toHaveLength(1)
    fireEvent.keyDown(screen.getByTestId('pick-composer'), { key: 'Enter' })
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')[1]).toHaveAttribute('data-status', 'done'))

    const [first, second] = fetchImpl.mock.calls
      .filter(([u]) => u.endsWith('/chat/completions'))
      .map(([, init]) => JSON.parse(init!.body as string).messages as Array<{ role: string; content: string }>)
    expect(first[1].content).toContain('About these places:\n- sections/quiz.oui #q1\n  Too easy?\n\nIs it fair?')
    // Same system prompt, same first turn: the prefix is unchanged.
    expect(second.slice(0, 2)).toEqual(first)
    expect(second.map((m) => m.role)).toEqual(['system', 'user', 'assistant', 'user'])
    // Nothing changed in the topic, so the follow-up carries no new context.
    expect(second[3].content).toBe('And q2?')
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

describe('Studio edits', () => {
  const edit = (body: string, info = 'file=sections/quiz.oui') => `Changed it.\n\n\`\`\`oui-edit ${info}\n${body}\n\`\`\``

  function StudioHarness({ fetchImpl, buffers, revealed }: { fetchImpl: typeof fetch; buffers: Record<string, string>; revealed: string[] }) {
    const assistant = useAssistant({
      topicId: 'demo',
      app: 'studio',
      getContext: () => ({ topicId: 'demo', files: { ...buffers }, fileOrder: Object.keys(buffers), diagnostics: {} }),
      editor: {
        write: (file, source) => {
          buffers[file] = source
          return null
        },
        reveal: (file, statement) => revealed.push(`${file}#${statement}`),
      },
      fetchImpl,
    })
    return (
      <>
        <PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={sourceResolver(buffers)} assistant={pickBridgeOf(assistant)} />
        <AssistantDock assistant={assistant} resolve={sourceResolver(buffers)} fetchImpl={fetchImpl} />
      </>
    )
  }

  function replies(...texts: string[]) {
    const queue = [...texts]
    return vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
      if (url.endsWith('/models')) return new Response('{"data":[{"id":"m1"}]}', { headers: { 'content-type': 'application/json' } })
      return streamOf(queue.shift() ?? 'No more.')
    })
  }

  it('shows a proposed edit as a diff and applies it to the buffer', async () => {
    seed('http://localhost:11434/v1')
    const buffers = { ...files }
    const revealed: string[] = []
    const fetchImpl = replies(edit('q1 = QuizQuestion("q1", "Why, exactly?", [QuizChoice("a", "Yes", true, "Right.")])'))
    render(<StudioHarness fetchImpl={fetchImpl as unknown as typeof fetch} buffers={buffers} revealed={revealed} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-edit')).toBeInTheDocument())

    const system = JSON.parse(fetchImpl.mock.calls.find(([u]) => u.endsWith('/chat/completions'))![1]!.body as string).messages[0].content
    expect(system).toContain('```oui-edit file=')
    expect(screen.getByTestId('ai-edit-diff')).toHaveTextContent('+ q1 = QuizQuestion("q1", "Why, exactly?"')
    expect(screen.getByTestId('ai-proposal')).toHaveTextContent('The edits apply and validate.')
    expect(fetchImpl.mock.calls.filter(([u]) => u.endsWith('/chat/completions'))).toHaveLength(1)

    fireEvent.click(screen.getByTestId('ai-edit-apply'))
    expect(screen.getByTestId('ai-edit')).toHaveAttribute('data-state', 'applied')
    expect(buffers['sections/quiz.oui']).toContain('"Why, exactly?"')
    expect(revealed).toEqual(['sections/quiz.oui#q1'])
  })

  it('rejects an edit without touching the buffer', async () => {
    seed('http://localhost:11434/v1')
    const buffers = { ...files }
    render(<StudioHarness fetchImpl={replies(edit('q1 = QuizQuestion("q1", "Other?", [QuizChoice("a", "Yes", true, "Right.")])')) as unknown as typeof fetch} buffers={buffers} revealed={[]} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-edit')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('ai-edit-reject'))
    expect(screen.getByTestId('ai-edit')).toHaveAttribute('data-state', 'rejected')
    expect(buffers['sections/quiz.oui']).toBe(files['sections/quiz.oui'])
  })

  it('sends the problems back once when a proposal does not validate', async () => {
    seed('http://localhost:11434/v1')
    const fetchImpl = replies(edit('q1 = DELETE'), edit('q1 = QuizQuestion("q1", "Fixed?", [QuizChoice("a", "Yes", true, "Right.")])'))
    render(<StudioHarness fetchImpl={fetchImpl as unknown as typeof fetch} buffers={{ ...files }} revealed={[]} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')).toHaveLength(2))
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')[1]).toHaveAttribute('data-status', 'done'))

    const chats = fetchImpl.mock.calls.filter(([u]) => u.endsWith('/chat/completions'))
    expect(chats).toHaveLength(2)
    const second = JSON.parse(chats[1][1]!.body as string).messages
    expect(second.at(-1).content).toMatch(/^Your proposed edits do not check out:\n- sections\/quiz.oui /)
    expect(second.at(-2).content).toBe('Changed it.\n\n[Proposed edit to sections/quiz.oui: pending]')
    expect(screen.getAllByTestId('ai-user-message')[1]).toHaveTextContent('Sent by Studio')
    expect(screen.getAllByTestId('ai-proposal')[1]).toHaveTextContent('The edits apply and validate.')
  })
})
