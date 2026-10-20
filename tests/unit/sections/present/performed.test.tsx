import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { flashcardsBeats, quizBeats, quizPlan } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/present'
import { challengeStarts, sequenceBeats, startingOrder, templateBeats, templateZones } from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/present'
import PresentQuiz from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz/PresentQuiz'
import PresentSequence from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence/PresentSequence'
import PresentTemplate from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-template/PresentTemplate'
import { decisionTreeBeats } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import PresentDecisionTree from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/components/decision-tree/PresentDecisionTree'
import { content, ids, kinds, propsOf } from './helpers'

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

describe('performed answers (decision 103)', () => {
  it('quiz: per question, ask it, try a wrong choice, then give the right one', () => {
    const props = propsOf<Parameters<typeof quizBeats>[0]>(content('http-caching/sections/quiz.oui'))
    const questions = props.questions ?? []
    expect(questions.length).toBeGreaterThan(1)
    expect(kinds(quizBeats(props))).toEqual(questions.flatMap(() => ['show', 'wrong', 'right']))
    expect(ids(quizBeats(props)).slice(0, 4)).toEqual(['q1', 'q1.wrong', 'q1.right', 'q2'])
    expect(quizBeats(props)[1].about).toContain(`“${questions[0].choices.find((c) => !c.correct)?.text}”`)
  })

  it('quiz: a question with no wrong choice skips the wrong try; one with no right choice is only asked', () => {
    const q = (id: string, correct: boolean[]) => ({ id, question: id, choices: correct.map((c, i) => ({ id: `${id}${i}`, text: `${i}`, correct: c, explanation: '' })) })
    expect(quizPlan({ questions: [q('a', [true]), q('b', [false, false])] }).map((s) => `${s.question}:${s.step}`)).toEqual(['0:ask', '0:right', '1:ask'])
  })

  it('flashcards: per card, its front, then its definition', () => {
    const props = propsOf<Parameters<typeof flashcardsBeats>[0]>(content('pixijs/sections/flashcards.oui'))
    expect(flashcardsBeats(props)).toHaveLength(2 * (props.terms?.length ?? 0))
    expect(ids(flashcardsBeats(props)).slice(0, 3)).toEqual(['card1', 'card1.back', 'card2'])
    expect(kinds(flashcardsBeats({ terms: [] }))).toEqual(['show'])
  })

  it('reflection sequence and template: the prompt, one beat per step of the answer, then solved, per challenge (decision 115)', () => {
    const seq = propsOf<Parameters<typeof sequenceBeats>[0]>(content('pixijs/sections/reflection-transforms.oui'))
    const steps = (seq.challenges ?? []).map((c) => c.solution.length)
    expect(kinds(sequenceBeats(seq))).toEqual(steps.flatMap((n) => ['show', ...Array(n).fill('show'), 'right']))
    expect(ids(sequenceBeats(seq)).slice(0, steps[0] + 2)).toEqual(['c1', ...Array.from({ length: steps[0] }, (_, k) => `c1.step${k + 1}`), 'c1.solved'])
    const tpl = propsOf<Parameters<typeof templateBeats>[0]>(content('kamado-beef/sections/reflection-template.oui'))
    const blanks = (tpl.challenges ?? []).map((c) => templateZones(c.template).length)
    const beats = templateBeats(tpl)
    expect(kinds(beats)).toEqual(blanks.flatMap((n) => ['show', ...Array(n).fill('show'), 'right']))
    expect(ids(beats).slice(0, 2)).toEqual(['c1', 'c1.step1'])
    expect(ids(beats)[blanks[0] + 1]).toBe('c1.solved')
  })

  it('places each challenge after the steps of the ones before', () => {
    expect(challengeStarts([3, 2, 0])).toEqual([0, 5, 9])
  })

  it('never starts with the answer already in place', () => {
    expect(startingOrder(['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
    expect(startingOrder(['c', 'a', 'b'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b'])
  })
})

describe('quiz renderer', () => {
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
  const draw = (beat: number) => render(<PresentQuiz data={data} beats={quizBeats(data)} beat={beat} sectionIndex={0} active />)

  it('asks without answering', () => {
    draw(0)
    expect(screen.queryByText('Sets a lifetime only.')).toBeNull()
    expect(screen.queryByText('Only the browser may store it.')).toBeNull()
    expect(document.querySelector('.quiz-question-text')?.hasAttribute('data-focus')).toBe(true)
  })

  it('tries the wrong choice: marks it, shows the hint and why it is wrong, with the error sound', () => {
    draw(1)
    expect(screen.getByText('max-age').closest('.quiz-choice')).toHaveClass('is-wrong')
    expect(screen.getByText('max-age').closest('[data-focus]')).not.toBeNull()
    expect(screen.getByText(/Shared versus private/)).toBeInTheDocument()
    expect(screen.getByText('Sets a lifetime only.').closest('[data-sound]')?.getAttribute('data-sound')).toBe('error')
  })

  it('gives the right choice over its explanation while the others step back', () => {
    draw(2)
    expect(screen.getByText('private').closest('.quiz-choice')).toHaveClass('quiz-choice-correct')
    expect(screen.getByText('max-age').closest('.quiz-choice')).toHaveClass('is-dim')
    expect(screen.getByText('Only the browser may store it.').closest('[data-sound]')?.getAttribute('data-sound')).toBe('success')
    expect(screen.queryByText('Sets a lifetime only.')).toBeNull()
  })
})

describe('sequence renderer', () => {
  const data = {
    challenges: [{ prompt: 'Order the steps', items: [{ id: 'a', text: 'First' }, { id: 'b', text: 'Second' }], solution: ['a', 'b'] }],
  }

  const draw = (beat: number) => render(<PresentSequence data={data} beats={sequenceBeats(data)} beat={beat} sectionIndex={0} active />)
  const placed = () => [...document.querySelectorAll('.sequence-placed-text')].map((e) => e.textContent)

  it('shows empty slots, then places one item per beat, then marks the order right', () => {
    const { rerender } = draw(0)
    expect(placed()).toEqual([])
    rerender(<PresentSequence data={data} beats={sequenceBeats(data)} beat={1} sectionIndex={0} active />)
    expect(placed()).toEqual(['First'])
    expect(document.querySelectorAll('.sequence-drop-slot')[0].hasAttribute('data-focus')).toBe(true)
    expect(document.querySelector('.is-ok')).toBeNull()
    expect(screen.queryByText('That is the right order.')).toBeNull()
    rerender(<PresentSequence data={data} beats={sequenceBeats(data)} beat={2} sectionIndex={0} active />)
    expect(placed()).toEqual(['First', 'Second'])
    expect(document.querySelectorAll('.sequence-drop-slot')[1].hasAttribute('data-focus')).toBe(true)
    rerender(<PresentSequence data={data} beats={sequenceBeats(data)} beat={3} sectionIndex={0} active />)
    expect(document.querySelectorAll('.sequence-drop-slot.is-ok')).toHaveLength(2)
    expect(screen.getByText('That is the right order.')).toBeInTheDocument()
  })

  it('places each item on the beat that names it', () => {
    draw(1)
    expect(screen.getAllByText('First').find((e) => e.closest('.sequence-placed-wrapper'))?.closest('[data-beat]')?.getAttribute('data-beat')).toBe('1')
  })
})

describe('template renderer', () => {
  const data = {
    challenges: [{
      prompt: 'Fill the blanks',
      template: 'A cache trades {z1} for {z2}.',
      chips: [{ id: 'mem', text: 'memory' }, { id: 'speed', text: 'speed' }, { id: 'cpu', text: 'CPU' }],
      solution: { z1: 'mem', z2: 'speed' },
      explanation: 'Stored copies cost space.',
    }],
  }
  const draw = (beat: number) => render(<PresentTemplate data={data} beats={templateBeats(data)} beat={beat} sectionIndex={0} active />)
  const filled = () => [...document.querySelectorAll('.present-chip.is-placed')].map((e) => e.textContent)

  it('fills one blank per beat in reading order, then explains', () => {
    expect(ids(templateBeats(data))).toEqual(['c1', 'c1.step1', 'c1.step2', 'c1.solved'])
    const { rerender } = draw(1)
    expect(filled()).toEqual(['memory'])
    expect(document.querySelectorAll('.reflection-blank-dropzone')[0].hasAttribute('data-focus')).toBe(true)
    expect(screen.queryByText('Stored copies cost space.')).toBeNull()
    rerender(<PresentTemplate data={data} beats={templateBeats(data)} beat={2} sectionIndex={0} active />)
    expect(filled()).toEqual(['memory', 'speed'])
    expect(document.querySelector('.reflection-blank-dropzone.is-ok')).toBeNull()
    rerender(<PresentTemplate data={data} beats={templateBeats(data)} beat={3} sectionIndex={0} active />)
    expect(document.querySelectorAll('.reflection-blank-dropzone.is-ok')).toHaveLength(2)
    expect(screen.getByText('Stored copies cost space.')).toBeInTheDocument()
  })
})

describe('decision tree renderer (decision 110)', () => {
  const data = {
    root: 'q',
    nodes: {
      q: { prompt: 'What are you building?', choices: [{ id: 'a', text: 'Search', next: 'l1', rationale: 'No LLM needed.' }, { id: 'b', text: 'RAG', next: 'l2', recommended: true, rationale: 'Answers from documents.' }] },
      l1: { leaf: { recommendation: 'BM25 only', explanation: '' } },
      l2: { leaf: { recommendation: 'Hybrid retrieval', explanation: 'Covers both. It is the default. More detail Read keeps.', tradeoffs: ['Costs more'] } },
    },
  }
  const draw = (beat: number) => render(<PresentDecisionTree data={data} beats={decisionTreeBeats(data)} beat={beat} sectionIndex={0} active />)

  it('asks by answer labels only', () => {
    draw(0)
    expect(screen.getByText('RAG')).toBeInTheDocument()
    expect(screen.queryByText('Answers from documents.')).toBeNull()
    expect(document.querySelector('.dt-decision-prompt')?.hasAttribute('data-focus')).toBe(true)
  })

  it('takes the answer on the question card, with its rationale, before moving on', () => {
    draw(1)
    expect(screen.getByText('What are you building?')).toBeInTheDocument()
    expect(screen.getByText('RAG').closest('.dt-choice')).toHaveClass('is-picked')
    expect(screen.getByText('RAG').closest('[data-focus]')).not.toBeNull()
    expect(screen.getByText('Search').closest('.dt-choice')).toHaveClass('is-dim')
    expect(screen.getByText('Answers from documents.')).toBeInTheDocument()
    expect(document.querySelector('.dt-leaf')).toBeNull()
  })

  it('then lands on the recommendation with the opening of its explanation', () => {
    draw(2)
    expect(document.querySelector('.dt-leaf-rec-text')?.textContent).toBe('Hybrid retrieval')
    expect(document.querySelector('.dt-leaf-block-text')?.textContent).toBe('Covers both. It is the default.')
    expect(screen.queryByText('Costs more')).toBeNull()
  })

  it('says the walk is an example, and the recommendation is its result, in lines the voice reads', () => {
    const { unmount } = draw(0)
    const example = screen.getByText('An example: one path through this tree')
    expect(example).toHaveAttribute('data-present-frame')
    expect(example).toHaveAttribute('data-beat', '0')
    unmount()
    draw(2)
    const result = screen.getByText('The result of these decisions')
    expect(result).toHaveAttribute('data-present-frame')
    expect(result).toHaveAttribute('data-beat', '2')
    expect(screen.queryByText('An example: one path through this tree')).toBeNull()
  })
})
