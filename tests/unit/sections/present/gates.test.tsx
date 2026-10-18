import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { flashcardsBeats, quizBeats } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/present'
import { sequenceBeats, templateBeats } from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/present'
import { startingOrder, useSlotGate } from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/useSlotGate'
import PresentQuiz from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz/PresentQuiz'
import { content, kinds, propsOf } from './helpers'

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
afterEach(() => vi.useRealTimers())

describe('gate beats', () => {
  it('quiz: question, then answer, for every question', () => {
    const props = propsOf<Parameters<typeof quizBeats>[0]>(content('http-caching/sections/quiz.oui'))
    expect(kinds(quizBeats(props))).toEqual(['show', 'gate', 'show', 'gate'])
  })

  it('flashcards: the deck, then one gate for the whole deck', () => {
    const props = propsOf<Parameters<typeof flashcardsBeats>[0]>(content('pixijs/sections/flashcards.oui'))
    expect(props.terms?.length).toBeGreaterThan(1)
    expect(kinds(flashcardsBeats(props))).toEqual(['show', 'gate'])
  })

  it('reflection sequence and template: prompt, then the learner acts, per challenge', () => {
    const seq = propsOf<Parameters<typeof sequenceBeats>[0]>(content('pixijs/sections/reflection-transforms.oui'))
    expect(kinds(sequenceBeats(seq))).toEqual((seq.challenges ?? []).flatMap(() => ['show', 'gate']))
    const tpl = propsOf<Parameters<typeof templateBeats>[0]>(content('kamado-beef/sections/reflection-template.oui'))
    expect(kinds(templateBeats(tpl))).toEqual((tpl.challenges ?? []).flatMap(() => ['show', 'gate']))
  })
})

describe('slot gate', () => {
  const setup = (solved = false) => {
    const capture = vi.fn()
    const onChecked = vi.fn()
    const hook = renderHook(({ s }) => useSlotGate({ items: ['c', 'a', 'b'], solution: ['a', 'b', 'c'], solved: s, capture, onChecked }), { initialProps: { s: solved } })
    return { ...hook, capture, onChecked }
  }

  it('places items into the next empty slot and takes them back out', () => {
    const { result, capture } = setup()
    act(() => result.current.place('b'))
    act(() => result.current.place('c'))
    expect(result.current.slots).toEqual(['b', 'c', null])
    expect(result.current.pool).toEqual(['a'])
    act(() => result.current.place('b'))
    expect(result.current.slots).toEqual([null, 'c', null])
    expect(capture).toHaveBeenCalledTimes(3)
  })

  it('marks a wrong order, then moves everything to the right slots', () => {
    vi.useFakeTimers()
    const { result, onChecked } = setup()
    for (const id of ['b', 'a', 'c']) act(() => result.current.place(id))
    expect(result.current.full).toBe(true)
    act(() => { result.current.check() })
    expect(onChecked).toHaveBeenCalledWith(false)
    expect(result.current.markOf('c')).toBe('ok')
    expect(result.current.markOf('b')).toBe('off')
    act(() => { vi.advanceTimersByTime(700) })
    expect(result.current.slots).toEqual(['a', 'b', 'c'])
    act(() => { vi.advanceTimersByTime(1100) })
    expect(result.current.done).toBe(true)
    expect(result.current.markOf('b')).toBe('ok')
  })

  it('shows the solution when the gate is already solved', () => {
    const { result } = setup(true)
    expect(result.current.slots).toEqual(['a', 'b', 'c'])
    expect(result.current.done).toBe(true)
  })

  it('never starts with the answer already in place', () => {
    expect(startingOrder(['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
    expect(startingOrder(['c', 'a', 'b'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b'])
  })
})

describe('quiz gate', () => {
  const data = {
    questions: [{
      id: 'q1',
      question: 'Which directive keeps a page out of CDNs?',
      hint: 'Shared versus private.',
      choices: [
        { id: 'a', text: 'max-age', correct: false, explanation: 'Sets a lifetime only.' },
        { id: 'b', text: 'private', correct: true, explanation: 'Only the browser may store it.' },
      ],
    }],
  }

  it('shows why a wrong answer is wrong, then solves the gate on the right one', () => {
    vi.useFakeTimers()
    const solve = vi.fn()
    const onEvent = vi.fn()
    render(<PresentQuiz data={data} beats={[{ kind: 'show' }, { kind: 'gate' }]} beat={1} sectionIndex={0} active gate={{ solved: false, solve }} onEvent={onEvent} />)
    fireEvent.click(screen.getByText('max-age'))
    act(() => { vi.advanceTimersByTime(150) })
    expect(screen.getByText('Sets a lifetime only.')).toBeInTheDocument()
    expect(screen.getByText(/Shared versus private/)).toBeInTheDocument()
    expect(solve).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('private'))
    act(() => { vi.advanceTimersByTime(500) })
    expect(solve).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Only the browser may store it.')).toBeInTheDocument()
    const types = onEvent.mock.calls.map((c) => (c[0] as { type: string }).type)
    expect(types).toEqual(['QuizOptionSelected', 'QuizOptionSelected', 'QuizCompleted'])
    expect(onEvent.mock.calls[2][0]).toMatchObject({ totalQuestions: 1, correctCount: 0, score: 0 })
  })

  it('does not take answers before its gate beat', () => {
    const solve = vi.fn()
    render(<PresentQuiz data={data} beats={[{ kind: 'show' }, { kind: 'gate' }]} beat={0} sectionIndex={0} active gate={{ solved: true, solve }} />)
    expect(screen.getByText('private').closest('button')).toBeDisabled()
  })
})
