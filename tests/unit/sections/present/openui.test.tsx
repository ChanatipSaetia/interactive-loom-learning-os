import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { openuiBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { DRAWING_EXAMPLE, FACTS_EXAMPLE, HOWTO_EXAMPLE } from '../../../../src/core/learning-engine/composition/oui/authoring-prompt'
import { openUIProgramOf } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/openui-standard'
import { curveVertices } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/data-anchors'
import PresentOpenUI from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/PresentOpenUI'

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

describe('openui renderer (decision 116)', () => {
  const data = {
    source: 'root = Card([header, table, tip])\nheader = CardHeader("Water by tea", "Starting points")\ntable = Table([Col("Tea", ["Sencha", "Gyokuro"]), Col("Water (°C)", [75, 60], "number")])\ntip = Callout("info", "Adjust", "Bitter? Cooler water.")',
  }
  const draw = (beat: number) => render(<PresentOpenUI data={data} beats={openuiBeats(data)} beat={beat} sectionIndex={0} active />)
  const parts = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[data-oui-anchor][data-beat]')]

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

  it('tags each table cell and header with the path of its value (decision 117)', () => {
    const { container } = draw(0)
    expect(container.querySelector('[data-oui-anchor="table.columns[1].data[1]"]')?.textContent).toBe('60')
    expect(container.querySelector('[data-oui-anchor="table.columns[0].label"]')?.textContent).toContain('Tea')
  })

  it('reads the data points of a curve from its path', () => {
    expect(curveVertices('M30,217C149.333,148,268.667,79,388,79L746,148')).toEqual([[30, 217], [388, 79], [746, 148]])
    expect(curveVertices('M30,217H100V50')).toEqual([])
  })

  it('tags each shape of a drawing with its id (decision 118)', () => {
    const program = { source: openUIProgramOf(DRAWING_EXAMPLE) }
    const { container } = render(<PresentOpenUI data={program} beats={openuiBeats(program)} beat={1} sectionIndex={0} active />)
    const bud = container.querySelector('[data-oui-anchor="shoot.bud"]')
    expect(bud?.tagName.toLowerCase()).toBe('path')
    expect(container.querySelector('[data-oui-anchor="shoot.leaf1"]')).not.toBeNull()
    expect(container.querySelector('figcaption')?.textContent).toContain('A tea shoot')
  })

  it.each([['how-to', HOWTO_EXAMPLE, ['header', 'steps', 'recipe', 'warning']], ['facts', FACTS_EXAMPLE, ['header', 'teas', 'faq']], ['drawing', DRAWING_EXAMPLE, ['header', 'shoot', 'why']]])(
    'lines up the parts of the authoring prompt\'s %s example with its rendered children',
    (_, example, names) => {
      const program = { source: openUIProgramOf(example) }
      const { container } = render(<PresentOpenUI data={program} beats={openuiBeats(program)} beat={0} sectionIndex={0} active />)
      expect(parts(container).map((el) => el.dataset.ouiAnchor)).toEqual(names)
    },
  )
})
