import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { openuiBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import PresentOpenUI from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/PresentOpenUI'

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

describe('openui renderer (decision 116)', () => {
  const data = {
    source: 'root = Card([header, table, tip])\nheader = CardHeader("Water by tea", "Starting points")\ntable = Table([Col("Tea", ["Sencha", "Gyokuro"]), Col("Water (°C)", [75, 60], "number")])\ntip = Callout("info", "Adjust", "Bitter? Cooler water.")',
  }
  const draw = (beat: number) => render(<PresentOpenUI data={data} beats={openuiBeats(data)} beat={beat} sectionIndex={0} active />)
  const parts = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[data-oui-anchor]')]

  it('marks each child of the root with its beat and its statement, showing the ones reached', () => {
    const { container, rerender } = draw(0)
    expect(parts(container).map((el) => [el.dataset.ouiAnchor, el.dataset.beat, el.hasAttribute('data-shown')])).toEqual([
      ['header', '0', true],
      ['table', '1', false],
      ['tip', '2', false],
    ])
    rerender(<PresentOpenUI data={data} beats={openuiBeats(data)} beat={1} sectionIndex={0} active />)
    expect(parts(container).map((el) => el.hasAttribute('data-shown'))).toEqual([true, true, false])
    expect(container.querySelector('[data-oui-anchor="table"]')?.textContent).toContain('Sencha')
  })
})
