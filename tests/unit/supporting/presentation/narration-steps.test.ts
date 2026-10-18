import { describe, it, expect } from 'vitest'
import { stepsByBeat } from '../../../../src/core/supporting/presentation/narration-steps'
import { focusElements, targetElements, unionBox } from '../../../../src/core/supporting/presentation/narration-targets'
import { focusCamera, regionOrigin, STAGE_LANDSCAPE } from '../../../../src/core/supporting/presentation/camera'
import { answer, show } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'

describe('narration steps play on the beat they name (decision 108)', () => {
  const beats = [show('q1'), answer('wrong', 'q1.wrong'), answer('right', 'q1.right')]

  it('group under their beat, in written order, adding no beats', () => {
    expect(stepsByBeat(beats, [{ beat: 'q1.right' }, { beat: 'q1' }, { beat: 'q1.right' }])).toEqual([[1], [], [0, 2]])
  })

  it('drop steps that name no beat of the section', () => {
    expect(stepsByBeat(beats, [{ beat: 'q9' }])).toEqual([[], [], []])
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

  it('light what a beat marks with focus, else the outermost elements it shows', () => {
    const region = document.createElement('section')
    region.innerHTML = '<div class="present-region-body"><p data-beat="0" data-shown>a</p><div data-beat="1"><p data-beat="1">b</p></div></div>'
    expect(focusElements(region, 0).map((e) => e.textContent)).toEqual(['a'])
    expect(focusElements(region, 1)).toEqual([])
    region.querySelector('p')?.setAttribute('data-focus', '')
    expect(focusElements(region, 1).map((e) => e.textContent)).toEqual(['a'])
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
