import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { flashcardsBeats, quizBeats, quizPlan } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/present'
import { filledTemplate, sequenceBeats, startingOrder, templateBeats } from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/present'
import PresentQuiz from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/quiz/PresentQuiz'
import PresentSequence from '../../../../src/core/learning-engine/sub-contexts/reflection-synthesis/components/reflection-sequence/PresentSequence'
import { content, kinds, propsOf } from './helpers'

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

describe('performed answers (decision 103)', () => {
  it('quiz: per question, ask it, try a wrong choice, then give the right one', () => {
    const props = propsOf<Parameters<typeof quizBeats>[0]>(content('http-caching/sections/quiz.oui'))
    const questions = props.questions ?? []
    expect(questions.length).toBeGreaterThan(1)
    expect(kinds(quizBeats(props))).toEqual(questions.flatMap(() => ['show', 'wrong', 'right']))
    const [ask, wrong, right] = quizBeats(props)
    expect(ask.say).toBeUndefined()
    expect(wrong.say).toBe(`Suppose we answer “${questions[0].choices.find((c) => !c.correct)?.text}”.`)
    expect(right.say).toBe(`The right answer is “${questions[0].choices.find((c) => c.correct)?.text}”.`)
  })

  it('quiz: a question with no wrong choice skips the wrong try; one with no right choice is only asked', () => {
    const q = (id: string, correct: boolean[]) => ({ id, question: id, choices: correct.map((c, i) => ({ id: `${id}${i}`, text: `${i}`, correct: c, explanation: '' })) })
    expect(quizPlan({ questions: [q('a', [true]), q('b', [false, false])] }).map((s) => `${s.question}:${s.step}`)).toEqual(['0:ask', '0:right', '1:ask'])
  })

  it('flashcards: per card, its front, then its definition', () => {
    const props = propsOf<Parameters<typeof flashcardsBeats>[0]>(content('pixijs/sections/flashcards.oui'))
    expect(flashcardsBeats(props)).toHaveLength(2 * (props.terms?.length ?? 0))
    expect(kinds(flashcardsBeats({ terms: [] }))).toEqual(['show'])
  })

  it('reflection sequence and template: the prompt, then the stage solves it, per challenge', () => {
    const seq = propsOf<Parameters<typeof sequenceBeats>[0]>(content('pixijs/sections/reflection-transforms.oui'))
    expect(kinds(sequenceBeats(seq))).toEqual((seq.challenges ?? []).flatMap(() => ['show', 'right']))
    const tpl = propsOf<Parameters<typeof templateBeats>[0]>(content('kamado-beef/sections/reflection-template.oui'))
    const beats = templateBeats(tpl)
    expect(kinds(beats)).toEqual((tpl.challenges ?? []).flatMap(() => ['show', 'right']))
    expect(beats[1].say).toContain(filledTemplate((tpl.challenges ?? [])[0]).split(' ')[0])
  })

  it('fills a template with the right chips', () => {
    expect(filledTemplate({
      prompt: 'p',
      template: 'Heat {a} the {b}.',
      chips: [{ id: 'x', text: 'rises to' }, { id: 'y', text: 'dome' }, { id: 'z', text: 'grate' }],
      solution: { a: 'x', b: 'y' },
    })).toBe('Heat rises to the dome.')
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

  it('shows empty slots, then the items placed in the right order', () => {
    const { rerender } = render(<PresentSequence data={data} beats={sequenceBeats(data)} beat={0} sectionIndex={0} active />)
    expect(document.querySelectorAll('.sequence-placed-text')).toHaveLength(0)
    rerender(<PresentSequence data={data} beats={sequenceBeats(data)} beat={1} sectionIndex={0} active />)
    expect([...document.querySelectorAll('.sequence-placed-text')].map((e) => e.textContent)).toEqual(['First', 'Second'])
  })
})
