import { beforeEach, describe, expect, it } from 'vitest'
import {
  historyForRequest,
  historyMessages,
  historyStart,
  knownContext,
  loadThread,
  saveThread,
  threadPointers,
  userMessageContent,
  type ThreadMessage,
  type ToolStep,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

const user = (id: string, text: string, extra: Partial<ThreadMessage> = {}): ThreadMessage => ({ id, role: 'user', text, picks: [], mode: 'comment', at: 0, ...extra })
const reply = (id: string, text: string, extra: Partial<ThreadMessage> = {}): ThreadMessage => ({ id, role: 'assistant', text, status: 'done', at: 0, ...extra })

beforeEach(() => localStorage.clear())

describe('assistant thread', () => {
  it('writes picks with their comments, then the message', () => {
    const message = user('1', 'Shorter, please.', {
      picks: [
        { file: 'sections/quiz.oui', anchor: 'q2.explanation', label: 'Quiz › q2.explanation', note: 'Too long.\nOne sentence.' },
        { file: 'sections/quiz.oui', anchor: 'q5', label: 'Quiz › q5', note: '' },
      ],
    })
    expect(userMessageContent(message)).toBe(
      'Comments on these places:\n- sections/quiz.oui #q2.explanation\n  Too long.\n  One sentence.\n- sections/quiz.oui #q5\n\nShorter, please.',
    )
    expect(userMessageContent(user('2', 'Why?', { mode: 'ask', picks: [{ file: 'topic.oui', anchor: 'root', label: 'Topic', note: '' }] }))).toBe(
      'About these places:\n- topic.oui #root\n\nWhy?\n\n(This is a question: answer it, do not propose changes unless asked.)',
    )
    // Viewer: a learner's picks are questions, never change requests
    const noted = user('3', 'Hm', { mode: 'comment', picks: [{ file: 'sections/quiz.oui', anchor: 'q1', label: 'Q1', note: 'Why B?' }] })
    expect(userMessageContent(noted, 'viewer')).toBe('About these places:\n- sections/quiz.oui #q1\n  Why B?\n\nHm')
    expect(userMessageContent({ ...noted, mode: 'ask' }, 'viewer')).not.toContain('propose changes')
  })

  it('keeps the newest turns within the budget, always the last user message, and leaves out failed replies', () => {
    const long = 'x'.repeat(400) // ~100 tokens
    const thread = [user('1', long), reply('2', long), user('3', long), reply('4', 'oops', { status: 'error' }), user('5', long)]
    const all = historyForRequest(thread, 10_000)
    expect(all.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'user'])
    expect(all.firstSent).toBe(0)

    // Over the budget, the history is cut to half of it in one step.
    const cut = historyForRequest(thread, 250)
    expect(cut.messages).toHaveLength(1)
    expect(cut.firstSent).toBe(4)

    const tiny = historyForRequest(thread, 1)
    expect(tiny.messages).toEqual([{ role: 'user', content: long }])
    expect(tiny.firstSent).toBe(4)
  })

  it('never starts the history with a reply', () => {
    const long = 'y'.repeat(400)
    const history = historyForRequest([user('1', long), reply('2', long), user('3', 'short')], 120)
    expect(history.messages.map((m) => m.role)).toEqual(['user'])
    expect(history.firstSent).toBe(2)
  })

  it('keeps where the history starts while it fits, so the prefix does not shift each turn', () => {
    const long = 'z'.repeat(400) // ~100 tokens each
    const thread = [user('1', long), reply('2', long), user('3', long), reply('4', long), user('5', long)]
    // Everything fits: no cut.
    expect(historyStart(thread, 600)).toBe(0)
    // Too long: cut in one step, to the turn from which the rest fits half the budget.
    expect(historyStart(thread, 500)).toBe(4)
    // Once the thread starts later, it stays there while the rest fits, rather than moving back.
    const next = [...thread, reply('6', 'ok'), user('7', 'more')]
    expect(historyStart(next, 600, '3')).toBe(2)
    expect(historyStart(next, 600)).toBe(0)
  })

  it('sends a user message with the topic context it was sent with', () => {
    const message = user('1', 'Why?', { context: '<topic-context topic="t">\n## Outline\n</topic-context>', sent: ['outline:1'] })
    expect(userMessageContent(message)).toBe('<topic-context topic="t">\n## Outline\n</topic-context>\n\nWhy?')
    expect([...knownContext([message, reply('2', 'Because.'), user('3', 'Ok', { sent: ['src:a#q1:x'] })])]).toEqual(['outline:1', 'src:a#q1:x'])
    saveThread('t', { messages: [message], start: '1' })
    expect(loadThread('t')).toEqual({ messages: [{ ...message, picks: [], mode: 'comment' }], start: '1' })
  })

  it('marks a stopped reply', () => {
    const history = historyForRequest([user('1', 'Hi'), reply('2', 'Half', { status: 'stopped' }), user('3', 'Go on')], 1000)
    expect(history.messages[1].content).toBe('Half\n\n(stopped before the end)')
  })

  it('sends proposed edits back as one line each with their outcome', () => {
    const text = 'Two fixes.\n\n```oui-edit file=sections/quiz.oui\nq1 = QuizQuestion("q1", "?", [])\n```\n\n```oui-edit file=sections/new.oui mode=create\nroot = Text("New", [])\n```\n\n```oui-edit file=topic.oui\nroot = Topic()\n```'
    const message = reply('2', text, { edits: [{ state: 'applied' }, { state: 'failed', error: 'nope' }] })
    const history = historyForRequest([user('1', 'Fix it'), message], 1000)
    expect(history.messages[1].content).toBe(
      'Two fixes.\n\n[Proposed edit to sections/quiz.oui: applied]\n\n[Proposed edit to sections/new.oui: failed: nope]\n\n[Proposed edit to topic.oui: pending]',
    )
  })

  it('collects every picked place once', () => {
    const pick = { file: 'a.oui', anchor: 'q1', label: '', note: '' }
    expect(threadPointers([user('1', '', { picks: [pick] }), reply('2', 'ok'), user('3', '', { picks: [pick, { ...pick, anchor: 'q2' }] })])).toEqual([
      { file: 'a.oui', anchor: 'q1' },
      { file: 'a.oui', anchor: 'q2' },
    ])
  })

  it('saves per topic and turns a reply that was streaming into a stopped one', () => {
    saveThread('demo', { messages: [user('1', 'Hi'), reply('2', 'Hal', { status: 'streaming', via: { host: 'h', model: 'm' } })] })
    const loaded = loadThread('demo')
    expect(loaded.messages[1]).toMatchObject({ status: 'stopped', text: 'Hal', via: { host: 'h', model: 'm' } })
    expect(loadThread('other')).toEqual({ messages: [] })
    saveThread('demo', { messages: [] })
    expect(localStorage.getItem('loom-ai-thread:demo')).toBeNull()
  })
})

describe('tool rounds in the thread (decision 124)', () => {
  const steps: ToolStep[] = [{ text: 'Let me look.', calls: [{ id: 'c1', name: 'read', args: '{"address":"quiz"}', result: 'title: Check', label: 'Check', file: 'sections/quiz.oui', anchor: 'root' }] }]
  const thread = [user('1', 'What is covered?'), reply('2', 'Caching.', { steps })]

  it('sends the rounds as tool messages when the request has the tools', () => {
    expect(historyMessages(thread, 0, { app: 'viewer', tools: true })).toEqual([
      { role: 'user', content: 'What is covered?' },
      { role: 'assistant', content: 'Let me look.', tool_calls: [{ id: 'c1', type: 'function', function: { name: 'read', arguments: '{"address":"quiz"}' } }] },
      { role: 'tool', tool_call_id: 'c1', content: 'title: Check' },
      { role: 'assistant', content: 'Caching.' },
    ])
  })

  it('sends them as "Looked at" lines without the tools, and drops them with a failed reply', () => {
    expect(historyMessages(thread, 0, { app: 'viewer' })[1]).toEqual({ role: 'assistant', content: '[Looked at read({"address":"quiz"}): Check]\n\nCaching.' })
    expect(historyMessages([thread[0], { ...thread[1], status: 'error' }], 0, { tools: true })).toHaveLength(1)
  })

  it('keeps the rounds when the thread is saved and loaded', () => {
    saveThread('t', { messages: thread })
    expect(loadThread('t').messages[1].steps).toEqual(steps)
  })
})

describe('thinking in the thread (decision 128)', () => {
  it('keeps the thinking for the panel but never sends it to the model', () => {
    const steps: ToolStep[] = [{ text: '', thinking: 'Which section?', calls: [{ id: 'c1', name: 'navigate', args: '{}', result: 'Topic', label: 'Topic outline' }] }]
    const thread = [user('1', 'Hi'), reply('2', 'Hello.', { thinking: 'Greet back.', thoughtMs: 2400, steps })]
    const sent = JSON.stringify(historyMessages(thread, 0, { tools: true }))
    expect(sent).not.toContain('Greet back.')
    expect(sent).not.toContain('Which section?')
    saveThread('t', { messages: thread })
    const loaded = loadThread('t').messages[1]
    expect(loaded).toMatchObject({ thinking: 'Greet back.', thoughtMs: 2400 })
    expect(loaded.steps?.[0].thinking).toBe('Which section?')
  })
})
