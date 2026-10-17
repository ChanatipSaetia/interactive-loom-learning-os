import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PickMode, sourceResolver, type PickAssistantBridge } from '../../../../../../src/core/supporting/authoring-editor/pick'

const files = {
  'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz")])\n',
  'sections/quiz.oui': 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "Yes", true, "Right.")])\n',
}
const resolve = sourceResolver(files)

function seed() {
  localStorage.setItem('loom-pick-tray:demo', JSON.stringify({
    mode: 'comment',
    question: '',
    entries: [{ file: 'sections/quiz.oui', anchor: 'q1', label: 'Check › q1', section: 'Check', note: '' }],
  }))
}

beforeEach(() => localStorage.clear())

describe('Pick message bar', () => {
  it('starts Pick mode from ⌖ in the bar', () => {
    const onActiveChange = vi.fn()
    render(<PickMode topicId="demo" active={false} onActiveChange={onActiveChange} resolve={resolve} />)
    fireEvent.click(screen.getByTestId('pick-toggle'))
    expect(onActiveChange).toHaveBeenCalledWith(true)
  })

  it('copies with Enter when there is no assistant, including the typed message', async () => {
    const writeText = vi.fn(async () => {})
    Object.assign(navigator, { clipboard: { writeText } })
    seed()
    render(<PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={resolve} />)
    expect(screen.queryByTestId('pick-send')).toBeNull()
    fireEvent.change(screen.getByTestId('pick-composer'), { target: { value: 'Harder, please.' } })
    fireEvent.keyDown(screen.getByTestId('pick-composer'), { key: 'Enter' })
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('demo/sections/quiz.oui:2 #q1\n\nHarder, please.\n'))
  })

  it('sends picks, comment and message to the assistant, with Answer only from the ⋯ menu, then clears', async () => {
    seed()
    const send = vi.fn(async () => true)
    const assistant: PickAssistantBridge = { panelOpen: false, busy: false, unread: false, send, stop: vi.fn(), togglePanel: vi.fn() }
    render(<PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={resolve} assistant={assistant} />)

    fireEvent.click(screen.getByTestId('pick-row'))
    fireEvent.change(screen.getByTestId('pick-entry-note'), { target: { value: 'Too easy?' } })
    fireEvent.click(screen.getByTestId('pick-more'))
    fireEvent.click(screen.getByTestId('pick-answer-only'))
    expect(screen.getByTestId('pick-answer-only')).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(screen.getByTestId('pick-composer'), { target: { value: 'Is it fair?' } })
    fireEvent.click(screen.getByTestId('pick-send'))

    await waitFor(() => expect(send).toHaveBeenCalled())
    const draft = (send.mock.calls[0] as unknown as [{ mode: string; message: string; entries: Array<{ anchor: string; note: string }> }])[0]
    expect(draft).toMatchObject({ mode: 'ask', message: 'Is it fair?' })
    expect(draft.entries.map((e) => [e.anchor, e.note])).toEqual([['q1', 'Too easy?']])
    await waitFor(() => expect(screen.queryByTestId('pick-entry')).toBeNull())
    expect(screen.getByTestId('pick-composer')).toHaveValue('')
  })

  it('shows Stop while a reply streams', () => {
    const stop = vi.fn()
    render(<PickMode topicId="demo" active={false} onActiveChange={() => {}} resolve={resolve} assistant={{ panelOpen: true, busy: true, unread: false, send: vi.fn(), stop, togglePanel: vi.fn() }} />)
    fireEvent.click(screen.getByTestId('pick-stop'))
    expect(stop).toHaveBeenCalled()
  })
})
