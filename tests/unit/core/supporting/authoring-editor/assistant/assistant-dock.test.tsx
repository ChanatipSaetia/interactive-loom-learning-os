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
  type AssistantProfile,
  type AssistantTopicContext,
  type AssistantView,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

const files = {
  'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz")])\n',
  'sections/quiz.oui': 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "Yes", true, "Right.")])\n',
}
const resolve = sourceResolver(files)
const context = (): AssistantTopicContext => ({ topicId: 'demo', files, fileOrder: ['topic.oui', 'sections/quiz.oui'], diagnostics: {} })

function Harness({ fetchImpl, view }: { fetchImpl: typeof fetch; view?: AssistantView }) {
  const assistant = useAssistant({ topicId: 'demo', app: 'viewer', getContext: () => ({ ...context(), view }), fetchImpl })
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

function seed(baseUrl: string, patch: Partial<AssistantProfile> = {}) {
  const profile = { ...createProfile('custom'), name: 'Mine', baseUrl, model: 'm1', ...patch }
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

describe('Studio edits without the tools (oui-edit blocks)', () => {
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
    seed('http://localhost:11434/v1', { tools: false })
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
    seed('http://localhost:11434/v1', { tools: false })
    const buffers = { ...files }
    render(<StudioHarness fetchImpl={replies(edit('q1 = QuizQuestion("q1", "Other?", [QuizChoice("a", "Yes", true, "Right.")])')) as unknown as typeof fetch} buffers={buffers} revealed={[]} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-edit')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('ai-edit-reject'))
    expect(screen.getByTestId('ai-edit')).toHaveAttribute('data-state', 'rejected')
    expect(buffers['sections/quiz.oui']).toBe(files['sections/quiz.oui'])
  })

  it('sends the problems back once when a proposal does not validate', async () => {
    seed('http://localhost:11434/v1', { tools: false })
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

describe('Content tools in Viewer (decisions 120–125)', () => {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
  const toolCall = (id: string, name: string, args: unknown) => json({ choices: [{ message: { content: '', tool_calls: [{ id, type: 'function', function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: 'tool_calls' }] })
  const chatBodies = (fetchImpl: ReturnType<typeof vi.fn>) =>
    fetchImpl.mock.calls.filter(([url]) => String(url).endsWith('/chat/completions')).map(([, init]) => JSON.parse((init as RequestInit).body as string))

  it('runs the tool calls in the page, sends their results back and shows what it looked at', async () => {
    seed('http://localhost:11434/v1')
    const answers = [toolCall('c1', 'navigate', {}), toolCall('c2', 'read', { address: 'sections/quiz.oui #q1' }), streamOf('Yes is right.')]
    const fetchImpl = vi.fn(async (url: string) => (url.endsWith('/models') ? json({ data: [{ id: 'm1' }] }) : answers.shift()!))
    render(<Harness view={{ mode: 'read', file: 'sections/quiz.oui' }} fetchImpl={fetchImpl as unknown as typeof fetch} />)

    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(screen.getByTestId('ai-reply')).toHaveTextContent('Yes is right.')
    // A pill says how many places; opened, it lists them (section, then the part).
    expect(screen.getByTestId('ai-activity-toggle')).toHaveTextContent('Looked at 2 places')
    expect(screen.queryByTestId('ai-looked-line')).toBeNull()
    fireEvent.click(screen.getByTestId('ai-activity-toggle'))
    expect(screen.getAllByTestId('ai-looked-line').map((l) => l.textContent)).toEqual(['Topic outlineAll sections', 'CheckWhy?'])

    const bodies = chatBodies(fetchImpl)
    expect(bodies).toHaveLength(3)
    expect(bodies[0].tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['navigate', 'read'])
    expect(bodies[0].messages[0].content).toContain('## Looking Things Up')
    // The section in view is not sent whole: the model reads it.
    expect(bodies[0].messages[1].content).toContain('at sections/quiz.oui (Quiz "Check") (not included: read it when you need it).')
    expect(bodies[0].messages[1].content).not.toContain('(whole file)')
    const last = bodies[2].messages
    expect(last.slice(-4).map((m: { role: string }) => m.role)).toEqual(['assistant', 'tool', 'assistant', 'tool'])
    expect(last[last.length - 1]).toMatchObject({ role: 'tool', tool_call_id: 'c2' })
    expect(last[last.length - 1].content).toContain('question: Why?')
    // The rounds are part of the thread: a follow-up sends them again, unchanged.
    const stored = JSON.parse(localStorage.getItem('loom-ai-thread:demo')!)
    expect(stored.messages[1].steps).toHaveLength(2)
  })

  it('stops calling tools after the round limit and asks for an answer', async () => {
    seed('http://localhost:11434/v1')
    let n = 0
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/models')) return json({ data: [{ id: 'm1' }] })
      const body = JSON.parse(init!.body as string)
      return body.tool_choice === 'none' ? streamOf('Done looking.') : toolCall(`c${n++}`, 'navigate', {})
    })
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    const bodies = chatBodies(fetchImpl)
    expect(bodies).toHaveLength(7)
    expect(bodies[6].tool_choice).toBe('none')
    const results = bodies[6].messages.filter((m: { role: string }) => m.role === 'tool')
    // Repeated calls with the same result are answered briefly.
    expect(results[0].content).toContain('Topic "Demo"')
    expect(results.slice(1).every((r: { content: string }) => r.content.startsWith('Unchanged since your earlier call'))).toBe(true)
    expect(results[results.length - 1].content).toContain('Tool limit reached')
    expect(screen.getByTestId('ai-reply')).toHaveTextContent('Done looking.')
  })

  it('asks again without tools when the server refuses them, then turns the switch off', async () => {
    seed('http://localhost:11434/v1')
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/models')) return json({ data: [{ id: 'm1' }] })
      const body = JSON.parse(init!.body as string)
      return body.tools ? json({ error: 'tools are not supported by this model' }, 400) : streamOf('Plain answer.')
    })
    render(<Harness view={{ mode: 'read', file: 'sections/quiz.oui' }} fetchImpl={fetchImpl as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(screen.getByTestId('ai-reply')).toHaveTextContent('Plain answer.')
    const last = chatBodies(fetchImpl).pop()
    expect(last.messages[0].content).not.toContain('## Looking Things Up')
    // Without tools, the section in view goes whole again.
    expect(last.messages[1].content).toContain('(whole file)')
    expect(JSON.parse(localStorage.getItem('loom-ai-profiles')!).profiles[0].tools).toBe(false)
  })
})

describe('Thinking (decision 128)', () => {
  it('shows the reasoning in the activity pill, apart from the answer, and does not send it back', async () => {
    seed('http://localhost:11434/v1')
    const reasoning = (text: string) => `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: text } }] })}\n\n`
    const answer = (text: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const piece of [reasoning('The learner asks '), reasoning('about q1.'), answer('Yes is right.'), 'data: [DONE]\n\n']) controller.enqueue(enc.encode(piece))
        controller.close()
      },
    })
    let chatsSent = 0
    const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) =>
      url.endsWith('/models')
        ? new Response(JSON.stringify({ data: [{ id: 'm1' }] }), { headers: { 'content-type': 'application/json' } })
        : chatsSent++ === 0
          ? new Response(body, { headers: { 'content-type': 'text/event-stream' } })
          : streamOf('Sure.'),
    )
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    expect(screen.getByTestId('ai-reply')).toHaveTextContent('Yes is right.')
    expect(screen.getByTestId('ai-reply')).not.toHaveTextContent('The learner asks')
    expect(screen.getByTestId('ai-activity-toggle')).toHaveTextContent(/^Thought/)
    fireEvent.click(screen.getByTestId('ai-activity-toggle'))
    expect(screen.getByTestId('ai-thought')).toHaveTextContent('The learner asks about q1.')

    // A follow-up does not carry the thinking.
    fireEvent.change(screen.getByTestId('pick-composer'), { target: { value: 'Thanks' } })
    fireEvent.keyDown(screen.getByTestId('pick-composer'), { key: 'Enter' })
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')).toHaveLength(2))
    const chats = fetchImpl.mock.calls.filter(([u]) => String(u).endsWith('/chat/completions'))
    expect(chats).toHaveLength(2)
    expect(String((chats[1][1] as RequestInit).body)).not.toContain('The learner asks')
  })
})

describe('Tools and staged edits in Studio (decisions 129–136)', () => {
  const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
  const toolCalls = (...calls: Array<[string, string, unknown]>) => json({
    choices: [{ message: { content: '', tool_calls: calls.map(([id, name, args]) => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } })) }, finish_reason: 'tool_calls' }],
  })
  const chatBodies = (fetchImpl: ReturnType<typeof vi.fn>) =>
    fetchImpl.mock.calls.filter(([url]) => String(url).endsWith('/chat/completions')).map(([, init]) => JSON.parse((init as RequestInit).body as string))
  const q1 = 'q1 = QuizQuestion("q1", "Why, exactly?", [QuizChoice("a", "Yes", true, "Right.")])'
  const words = 'root = Flashcards("Words", [f1])\nf1 = Flashcard("Term", ["Meaning"])'

  function StudioHarness({ fetchImpl, buffers }: { fetchImpl: typeof fetch; buffers: Record<string, string> }) {
    const assistant = useAssistant({
      topicId: 'demo',
      app: 'studio',
      getContext: () => ({ topicId: 'demo', files: { ...buffers }, fileOrder: Object.keys(buffers), diagnostics: {} }),
      editor: {
        write: (file, source) => {
          buffers[file] = source
          return null
        },
        reveal: () => {},
      },
      fetchImpl,
    })
    return (
      <>
        <AssistantToggle assistant={assistant} className="pill" />
        <PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={sourceResolver(buffers)} assistant={pickBridgeOf(assistant)} />
        <AssistantDock assistant={assistant} resolve={sourceResolver(buffers)} fetchImpl={fetchImpl} />
      </>
    )
  }

  it('stages edits across sections, applies them statement by statement and tells the model what was decided', async () => {
    seed('http://localhost:11434/v1')
    const buffers: Record<string, string> = { ...files }
    const answers = [
      toolCalls(['c1', 'read', { address: 'sections/quiz.oui' }]),
      toolCalls(
        ['c2', 'edit_section', { file: 'sections/quiz.oui', statements: q1, summary: 'Sharper question' }],
        ['c3', 'create_section', { name: 'words', source: words, summary: 'Vocabulary' }],
      ),
      streamOf('Staged two changes.'),
      streamOf('Thanks.'),
    ]
    const fetchImpl = vi.fn(async (url: string) => (url.endsWith('/models') ? json({ data: [{ id: 'm1' }] }) : answers.shift()!))
    render(<StudioHarness fetchImpl={fetchImpl as unknown as typeof fetch} buffers={buffers} />)

    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    const bodies = chatBodies(fetchImpl)
    expect(bodies[0].tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['navigate', 'read', 'edit_section', 'create_section', 'edit_topic', 'describe_components', 'propose_plan'])
    expect(bodies[0].messages[0].content).toContain('## Changing the Topic')
    expect(bodies[0].messages[0].content).not.toContain('```oui-edit file=')
    expect(bodies[1].messages.at(-1).content).toContain('QuizQuestion("q1", "Why?"')
    expect(bodies[2].messages.at(-2).content).toMatch(/^Staged replace q1 in sections\/quiz.oui\. No new errors/)
    expect(screen.getByTestId('ai-activity')).toHaveTextContent('Looked at 1 place · Staged 2 edits')

    // Nothing reached the buffers yet.
    expect(buffers['sections/quiz.oui']).toBe(files['sections/quiz.oui'])
    const cards = screen.getAllByTestId('ai-staged-file')
    expect(cards.map((c) => c.getAttribute('data-file'))).toEqual(['sections/quiz.oui', 'sections/words.oui', 'topic.oui'])

    fireEvent.click(cards[0].querySelector('[data-testid="ai-staged-apply"]')!)
    expect(buffers['sections/quiz.oui']).toContain('Why, exactly?')
    fireEvent.click(screen.getByTestId('ai-staged-reject-all'))
    expect(buffers['sections/words.oui']).toBeUndefined()
    expect(screen.queryByTestId('ai-staged')).not.toBeInTheDocument()

    const input = screen.getByTestId('pick-composer')
    fireEvent.change(input, { target: { value: 'Thanks' } })
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')[1]).toHaveAttribute('data-status', 'done'))
    const sent = chatBodies(fetchImpl)
    const last = sent[sent.length - 1].messages.at(-1).content
    expect(last).toContain('- sections/quiz.oui: applied q1')
    expect(last).toContain('- sections/words.oui: rejected sections/words.oui')
    expect(last).toContain('- topic.oui: rejected words')
  })

  it('applies a new section with its SectionRef where the model put it, and keeps the changeset after a reload', async () => {
    seed('http://localhost:11434/v1')
    const buffers: Record<string, string> = { ...files, 'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz"), SectionRef("end")])\n', 'sections/end.oui': 'root = Text("End", ["Bye."])\n' }
    const answers = [toolCalls(['c1', 'create_section', { name: 'words', source: words, after: 'quiz', summary: 'Vocabulary' }]), streamOf('Done.')]
    const fetchImpl = vi.fn(async (url: string) => (url.endsWith('/models') ? json({ data: [{ id: 'm1' }] }) : answers.shift()!))
    const { unmount } = render(<StudioHarness fetchImpl={fetchImpl as unknown as typeof fetch} buffers={buffers} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    unmount()

    render(<StudioHarness fetchImpl={fetchImpl as unknown as typeof fetch} buffers={buffers} />)
    fireEvent.click(screen.getByTestId('ai-toggle'))
    await waitFor(() => expect(screen.getByTestId('ai-staged')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('ai-staged-apply-all'))
    expect(buffers['sections/words.oui']).toContain('Flashcards("Words"')
    expect(buffers['topic.oui']).toMatch(/SectionRef\("quiz"\),\s*SectionRef\("words"\),\s*SectionRef\("end"\)/)
  })
})

describe('Plan card in Studio (decisions 138–139)', () => {
  const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
  const toolCall = (id: string, name: string, args: unknown) => json({
    choices: [{ message: { content: '', tool_calls: [{ id, type: 'function', function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: 'tool_calls' }],
  })
  const plan = {
    goal: 'Choose a cache policy for each kind of response.',
    items: [
      { action: 'create', name: 'words', type: 'Flashcards', title: 'Key terms', idea: 'max-age, no-store, private.' },
      { action: 'edit', name: 'quiz', type: 'Quiz', title: 'Knowledge Check', idea: 'Add a question on private.' },
    ],
  }

  it('shows the plan, lets the model say a word, and Build these sends the ticked items', async () => {
    seed('http://localhost:11434/v1')
    const buffers: Record<string, string> = { ...files }
    const answers = [toolCall('p1', 'propose_plan', plan), streamOf('Tick what to build.'), streamOf('Building.')]
    const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => (url.endsWith('/models') ? json({ data: [{ id: 'm1' }] }) : answers.shift()!))
    function Studio() {
      const assistant = useAssistant({
        topicId: 'demo',
        app: 'studio',
        getContext: () => ({ topicId: 'demo', files: { ...buffers }, fileOrder: Object.keys(buffers), diagnostics: {} }),
        editor: { write: () => null, reveal: () => {} },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
      return (
        <>
          <PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={sourceResolver(buffers)} assistant={pickBridgeOf(assistant)} />
          <AssistantDock assistant={assistant} resolve={sourceResolver(buffers)} fetchImpl={fetchImpl as unknown as typeof fetch} />
        </>
      )
    }
    render(<Studio />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    const bodies = fetchImpl.mock.calls.filter(([u]) => String(u).endsWith('/chat/completions')).map(([, init]) => JSON.parse((init as RequestInit).body as string))
    expect(bodies[1].tool_choice).toBe('none')
    expect(screen.getByTestId('ai-activity')).toHaveTextContent('Proposed a plan')
    expect(screen.getAllByTestId('ai-plan-item')).toHaveLength(2)

    fireEvent.click(screen.getAllByTestId('ai-plan-tick')[1])
    fireEvent.click(screen.getByTestId('ai-plan-build'))
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')).toHaveLength(2))
    await waitFor(() => expect(screen.getAllByTestId('ai-reply')[1]).toHaveAttribute('data-status', 'done'))
    const sent = fetchImpl.mock.calls.filter(([u]) => String(u).endsWith('/chat/completions')).map(([, init]) => JSON.parse((init as RequestInit).body as string))
    const message = sent[sent.length - 1].messages.at(-1).content as string
    expect(message).toContain('Build this section from the plan (goal: Choose a cache policy')
    expect(message).toContain('1. Create sections/words.oui (Flashcards) "Key terms"')
    expect(message).not.toContain('Knowledge Check')
    expect(screen.getByTestId('ai-plan')).toHaveAttribute('data-state', 'built')
  })
})

describe('Web search (decisions 140–142)', () => {
  const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })

  it('offers the web tools with a key, runs them against Tavily and links the page it read', async () => {
    seed('http://localhost:11434/v1')
    localStorage.setItem('loom-ai-web', JSON.stringify({ enabled: true }))
    sessionStorage.setItem('loom-ai-tavily-key', 'tvly-1')
    const answers = [
      json({ choices: [{ message: { content: '', tool_calls: [{ id: 'w1', type: 'function', function: { name: 'web_extract', arguments: '{"urls":["https://developer.mozilla.org/cc"]}' } }] }, finish_reason: 'tool_calls' }] }),
      streamOf('Beyond the topic: see MDN.'),
    ]
    const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) => {
      if (url.endsWith('/models')) return json({ data: [{ id: 'm1' }] })
      if (url === 'https://api.tavily.com/extract') return json({ results: [{ url: 'https://developer.mozilla.org/cc', raw_content: 'Cache-Control directives.' }] })
      return answers.shift()!
    })
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))

    const chats = fetchImpl.mock.calls.filter(([u]) => u.endsWith('/chat/completions')).map(([, init]) => JSON.parse(init!.body as string))
    expect(chats[0].tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['navigate', 'read', 'web_search', 'web_extract'])
    expect(chats[0].messages[0].content).toContain('## Web Search')
    expect(chats[1].messages.at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'w1' })
    expect(chats[1].messages.at(-1).content).toContain('Cache-Control directives.')
    expect(screen.getByTestId('ai-activity')).toHaveTextContent('Searched the web')
    fireEvent.click(screen.getByTestId('ai-activity-toggle'))
    expect(screen.getByTestId('ai-looked-line')).toHaveAttribute('href', 'https://developer.mozilla.org/cc')
    expect(screen.getByTestId('ai-looked-line')).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('leaves the web tools out without a key', async () => {
    seed('http://localhost:11434/v1')
    localStorage.setItem('loom-ai-web', JSON.stringify({ enabled: true }))
    const fetchImpl = mockFetch()
    render(<Harness fetchImpl={fetchImpl as unknown as typeof fetch} />)
    fireEvent.click(screen.getByTestId('pick-send'))
    await waitFor(() => expect(screen.getByTestId('ai-reply')).toHaveAttribute('data-status', 'done'))
    const body = JSON.parse(fetchImpl.mock.calls.find(([u]) => u.endsWith('/chat/completions'))![1]!.body as string)
    expect(body.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['navigate', 'read'])
    expect(body.messages[0].content).not.toContain('## Web Search')
  })
})
