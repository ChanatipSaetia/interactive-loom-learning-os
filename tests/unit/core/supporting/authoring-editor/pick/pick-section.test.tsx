import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { compileOUISection } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { PickLayer, PickSection } from '../../../../../../src/core/supporting/authoring-editor/pick'
import { usePickAnchor } from '../../../../../../src/core/ui-system'

const { value, sourceMap } = compileOUISection(`root = Quiz("Check", [q2])
q2 = QuizQuestion("kafka-offsets", "Why?", [QuizChoice("a", "A", true, "Because")])
`)
const question = (value!.data as unknown as { questions: Array<{ question: string; choices: Array<{ text: string }> }> }).questions[0]

function Question() {
  return (
    <div>
      <p {...usePickAnchor(question, 'question')}>{question.question}</p>
      <button type="button" {...usePickAnchor(question.choices[0])} onClick={() => { throw new Error('reached the section') }}>
        {question.choices[0].text}
      </button>
      <p>{'Untagged'}</p>
    </div>
  )
}

describe('PickSection and usePickAnchor', () => {
  it('tags elements with their anchors and picks the closest one', () => {
    const onPick = vi.fn()
    render(
      <>
        <PickLayer active onActiveChange={() => {}} onPick={onPick} onCopy={() => {}} />
        <PickSection file="sections/quiz.oui" label="Check" sourceMap={sourceMap}><Question /></PickSection>
      </>,
    )
    expect(screen.getByText('Why?').getAttribute('data-oui-anchor')).toBe('q2.question')
    fireEvent.click(screen.getByText('Why?'))
    fireEvent.click(screen.getByText('A'))
    fireEvent.click(screen.getByText('Untagged'))
    expect(onPick.mock.calls.map(([t]) => t)).toEqual([
      { file: 'sections/quiz.oui', anchor: 'q2.question', label: 'Check › q2.question' },
      { file: 'sections/quiz.oui', anchor: 'q2.choices[0]', label: 'Check › q2.choices[0]' },
      { file: 'sections/quiz.oui', anchor: 'root', label: 'Check' },
    ])
  })

  it('lets presses reach a pannable canvas and picks nothing after a drag', () => {
    const onPick = vi.fn()
    const onMouseDown = vi.fn()
    render(
      <>
        <PickLayer active onActiveChange={() => {}} onPick={onPick} onCopy={() => {}} />
        <PickSection file="sections/quiz.oui" label="Check" sourceMap={sourceMap}>
          <div data-pick-pan onMouseDown={onMouseDown}><p>Canvas</p></div>
          <p onMouseDown={onMouseDown}>Plain</p>
        </PickSection>
      </>,
    )
    fireEvent.pointerDown(screen.getByText('Canvas'), { clientX: 0, clientY: 0 })
    fireEvent.mouseDown(screen.getByText('Canvas'))
    expect(onMouseDown).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Canvas'), { clientX: 30, clientY: 0 })
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.pointerDown(screen.getByText('Canvas'), { clientX: 0, clientY: 0 })
    fireEvent.click(screen.getByText('Canvas'), { clientX: 2, clientY: 1 })
    expect(onPick).toHaveBeenCalledTimes(1)
    // Outside a canvas, presses stay blocked.
    fireEvent.mouseDown(screen.getByText('Plain'))
    expect(onMouseDown).toHaveBeenCalledTimes(1)
  })

  it('adds no attributes outside a pick section', () => {
    render(<Question />)
    expect(screen.getByText('Why?').hasAttribute('data-oui-anchor')).toBe(false)
  })
})
