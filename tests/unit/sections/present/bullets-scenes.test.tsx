import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import PresentBullets from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/bullets/PresentBullets'
import { bulletScenes, bulletsBeats, type BulletsPresentData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { beatSpeech } from '../../../../src/core/supporting/presentation/narration'

const data: BulletsPresentData = {
  ordered: true,
  items: [
    { text: 'Store a copy', children: [
      { text: 'Choose a location', children: [{ text: 'Use memory' }, { text: 'Use disk' }] },
      { text: 'Set an expiry' },
    ] },
    { text: 'Reuse the copy' },
  ],
}

const draw = (beat: number) => <PresentBullets data={data} beats={bulletsBeats(data)} beat={beat} sectionIndex={0} active />
const page = (root: HTMLElement) => root.querySelector('.present-bullet-page:not([hidden])')
const shown = (root: HTMLElement) => page(root)?.querySelectorAll('.present-bullet-row[data-shown]') ?? []
const speech = (root: HTMLElement, beat: number) => beatSpeech(root, beat).map((part) => part.text).join(' ')

describe('bullet presentation pages', () => {
  it('retains stable narration IDs and visits every descendant', () => {
    expect(bulletsBeats(data).map((b) => b.id)).toEqual([
      'item1', 'item1.child1', 'item1.child1.child1', 'item1.child1.child2', 'item1.child2', 'item2',
    ])
    expect(bulletScenes(data).map((s) => s.item.text)).toEqual([
      'Store a copy', 'Choose a location', 'Use memory', 'Use disk', 'Set an expiry', 'Reuse the copy',
    ])
    expect(bulletsBeats({ items: [] })).toEqual([])
  })

  it('keeps the bottom agenda for sections spanning multiple pages', () => {
    const many = { items: Array.from({ length: 15 }, (_, i) => ({ text: `Point ${i + 1}` })) }
    const { container } = render(<PresentBullets data={many} beats={bulletsBeats(many)} beat={0} sectionIndex={0} active />)
    expect(container.querySelectorAll('.present-bullet-page').length).toBeGreaterThan(1)
    expect(container.querySelector('.present-agenda [aria-current="step"]')).toHaveTextContent('Point 1')
  })

  it('keeps parent and sub-items together, progressively reveals them and narrates only the current point', () => {
    const { container, rerender } = render(draw(0))
    expect(shown(container)).toHaveLength(1)
    const firstPage = page(container)
    rerender(draw(2))
    expect(page(container)).toBe(firstPage)
    expect(shown(container)).toHaveLength(3)
    expect(page(container)?.querySelector('.is-parent')).toHaveTextContent('Store a copy')
    expect(page(container)?.querySelector('.is-current')).toHaveTextContent('Use memory')
    expect(page(container)?.querySelectorAll('.is-child svg').length).toBeGreaterThan(0)
    expect(speech(container, 2)).toBe('Use memory.')
    expect(container.querySelector('.present-agenda')).toBeNull()
    rerender(draw(5))
    expect(container.querySelector('.present-agenda')).toBeNull()
    rerender(draw(1))
    expect(shown(container)).toHaveLength(2)
    expect(speech(container, 1)).toBe('Choose a location.')
    rerender(draw(-1))
    expect(page(container)).toBeNull()
  })
})
