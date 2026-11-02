import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { useReadingScroll } from '../../../src/mcp-app/reading-scroll'

function Reader({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useReadingScroll(ref, active)
  return <div ref={ref} data-testid="scroll"><p>Ordinary reading text</p><input aria-label="Value" /><svg><rect /></svg></div>
}
function dimensions(element: HTMLElement) {
  Object.defineProperty(element, 'clientHeight', { value: 400 })
  Object.defineProperty(element, 'scrollHeight', { value: 1400 })
}

describe('embedded reading input', () => {
  it('routes delivered wheel input into the reader even if a host suppresses its native default', () => {
    const view = render(<Reader />)
    const element = view.getByTestId('scroll')
    dimensions(element)
    const wheel = new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })
    wheel.preventDefault() // host-level native scrolling suppression
    view.getByText('Ordinary reading text').dispatchEvent(wheel)
    expect(element.scrollTop).toBe(120)
    fireEvent.wheel(element, { deltaY: 2000, cancelable: true })
    expect(element.scrollTop).toBe(1000)
  })

  it('routes a one-finger vertical drag while preserving taps and horizontal gestures', () => {
    const view = render(<Reader />)
    const element = view.getByTestId('scroll')
    dimensions(element)
    fireEvent.touchStart(element, { touches: [{ clientX: 100, clientY: 300 }] })
    fireEvent.touchMove(element, { touches: [{ clientX: 102, clientY: 240 }] })
    expect(element.scrollTop).toBe(60)
    fireEvent.touchEnd(element, { touches: [] })
    fireEvent.touchStart(element, { touches: [{ clientX: 100, clientY: 300 }] })
    fireEvent.touchMove(element, { touches: [{ clientX: 220, clientY: 290 }] })
    expect(element.scrollTop).toBe(60)
  })

  it('leaves zoom, form controls, diagrams and inactive readers to their own handlers', () => {
    const view = render(<Reader />)
    const element = view.getByTestId('scroll')
    dimensions(element)
    fireEvent.wheel(element, { deltaY: 100, cancelable: true, ctrlKey: true })
    fireEvent.wheel(view.getByLabelText('Value'), { deltaY: 100, cancelable: true })
    fireEvent.wheel(element.querySelector('rect')!, { deltaY: 100, cancelable: true })
    expect(element.scrollTop).toBe(0)
    view.rerender(<Reader active={false} />)
    fireEvent.wheel(element, { deltaY: 100, cancelable: true })
    expect(element.scrollTop).toBe(0)
  })
})
