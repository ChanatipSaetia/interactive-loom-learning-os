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
      { file: 'sections/quiz.oui', anchor: 'q2.question', section: 'Check', label: 'Check › q2.question' },
      { file: 'sections/quiz.oui', anchor: 'q2.choices[0]', section: 'Check', label: 'Check › q2.choices[0]' },
      { file: 'sections/quiz.oui', anchor: 'root', section: 'Check', label: 'Check' },
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

  it('picks a tap when the touch ends, without letting the section see it', () => {
    const onPick = vi.fn()
    const onTouchEnd = vi.fn()
    render(
      <>
        <PickLayer active onActiveChange={() => {}} onPick={onPick} onCopy={() => {}} />
        <PickSection file="sections/quiz.oui" label="Check" sourceMap={sourceMap}>
          <p onTouchEnd={onTouchEnd}><Question /></p>
        </PickSection>
      </>,
    )
    const why = screen.getByText('Why?')
    fireEvent.touchStart(why, { touches: [{ clientX: 10, clientY: 10 }] })
    const end = fireEvent.touchEnd(why, { touches: [], changedTouches: [{ clientX: 11, clientY: 10 }] })
    expect(end).toBe(false) // cancelled, so no click follows
    expect(onTouchEnd).not.toHaveBeenCalled()
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ anchor: 'q2.question' }))

    // A swipe is not a tap.
    fireEvent.touchStart(why, { touches: [{ clientX: 10, clientY: 10 }] })
    fireEvent.touchEnd(why, { touches: [], changedTouches: [{ clientX: 80, clientY: 10 }] })
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onTouchEnd).toHaveBeenCalledTimes(1)
  })

  it('adds no attributes outside a pick section', () => {
    render(<Question />)
    expect(screen.getByText('Why?').hasAttribute('data-oui-anchor')).toBe(false)
  })
})
