import { describe, it, expect } from 'vitest'
import { defaultAfter, mergeBeats } from '../../../../src/core/supporting/presentation/narration-steps'
import { revealingBeat, targetElements, unionBox } from '../../../../src/core/supporting/presentation/narration-targets'
import { focusCamera, regionOrigin, STAGE_LANDSCAPE } from '../../../../src/core/supporting/presentation/camera'
import { explore, gate, show } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'

const steps = [{ caption: 'a' }, { caption: 'b' }, { caption: 'c' }]

describe('narration steps among derived beats', () => {
  it('play before the first gate or explore beat by default, else at the end', () => {
    expect(defaultAfter([show(), show(), explore()])).toBe(1)
    expect(defaultAfter([show(), gate()])).toBe(0)
    expect(defaultAfter([gate(), show()])).toBe(0)
    expect(defaultAfter([show(), show()])).toBe(1)
  })

  it('follow the derived beat that reveals their target, in written order', () => {
    const merged = mergeBeats([show(), gate(), show()], steps, [2, 0, 0])
    expect(merged.map((b) => [b.kind, b.derived, b.step])).toEqual([
      ['show', 0, undefined],
      ['show', 0, 1],
      ['show', 0, 2],
      ['gate', 1, undefined],
      ['show', 2, undefined],
      ['show', 2, 0],
    ])
    expect(mergeBeats([show(), explore()], steps.slice(0, 1)).map((b) => b.step)).toEqual([undefined, 0, undefined])
  })
})

describe('narration targets', () => {
  const root = document.createElement('section')
  root.innerHTML = `
    <div data-beat="0"><article data-oui-anchor="noCache"><p data-oui-anchor="noCache.description">d</p></article></div>
    <div data-beat="0"><ul data-beat="2"><li data-oui-anchor="root.items[0]">x</li><li data-oui-anchor="root.items[1]">y</li></ul></div>`

  it('match the exact anchor, else the outermost anchors inside it', () => {
    expect(targetElements(root, 'noCache').map((e) => e.tagName)).toEqual(['ARTICLE'])
    expect(targetElements(root, 'noCache.description').map((e) => e.tagName)).toEqual(['P'])
    expect(targetElements(root, 'root').map((e) => e.textContent)).toEqual(['x', 'y'])
    expect(targetElements(root, 'missing')).toEqual([])
  })

  it('are revealed by the latest beat mark above them', () => {
    expect(revealingBeat(targetElements(root, 'noCache'), root)).toBe(0)
    expect(revealingBeat(targetElements(root, 'root'), root)).toBe(2)
    expect(revealingBeat([], root)).toBeUndefined()
  })

  it('frame together, and a spotlight zooms in on them within the region', () => {
    expect(unionBox([{ x: 10, y: 10, w: 10, h: 10 }, { x: 40, y: 0, w: 10, h: 5 }])).toEqual({ x: 10, y: 0, w: 40, h: 20 })
    const cam = focusCamera(1, STAGE_LANDSCAPE, { x: 100, y: 100, w: 200, h: 100 })
    expect(cam.z).toBe(2)
    const o = regionOrigin(1, STAGE_LANDSCAPE)
    expect(cam.x).toBeGreaterThanOrEqual(o.x + STAGE_LANDSCAPE.w / 4)
    expect(focusCamera(0, STAGE_LANDSCAPE, { x: 0, y: 0, w: 1200, h: 675 }).z).toBe(1)
  })
})
