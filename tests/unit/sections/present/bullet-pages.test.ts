import { describe, it, expect } from 'vitest'
import { paginateBullets } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/bullet-pages'
import { bulletScenes, type BulletsPresentData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { propsOf } from './helpers'
import { printOUISection } from '../../../../src/core/learning-engine/composition/oui/print'
import { validateOUISection } from '../../../../src/core/learning-engine/validation/oui-gateway'

const scenes = bulletScenes({ items: [
  { text: 'A', children: [{ text: 'A.1' }, { text: 'A.2' }] },
  { text: 'B', children: [{ text: 'B.1' }] },
] })

describe('measured bullet pagination', () => {
  it('packs a full hierarchy when it fits, instead of making a page per item', () => {
    expect(paginateBullets(scenes, [60, 40, 40, 60, 40], 300)).toEqual([{ from: 0, to: 4 }])
    expect(paginateBullets(scenes, [60, 40, 40, 60, 40], 180)).toEqual([{ from: 0, to: 2 }, { from: 3, to: 4 }])
  })
  it('reserves repeated ancestor context when a large group continues', () => {
    expect(paginateBullets(scenes, [60, 80, 80, 60, 40], 150, [0, 50, 50, 0, 50])).toEqual([
      { from: 0, to: 1 }, { from: 2, to: 2 }, { from: 3, to: 4 },
    ])
    expect(paginateBullets([], [], 0)).toEqual([])
  })
  it('reflows when less room is available, without losing or duplicating a point', () => {
    const small = paginateBullets(scenes, [70, 70, 70, 70, 70], 150, [0, 30, 30, 0, 30])
    const large = paginateBullets(scenes, [70, 70, 70, 70, 70], 400)
    expect(small.length).toBeGreaterThan(large.length)
    expect(small.flatMap((p) => Array.from({ length: p.to - p.from + 1 }, (_, i) => i + p.from))).toEqual([0, 1, 2, 3, 4])
  })
})

describe('author-selected bullet icons', () => {
  it('rejects unsupported icon names', () => {
    expect(validateOUISection('root = Bullets("Access", [Bullet("Prepare", [], "unknown-icon")])').diagnostics.length).toBeGreaterThan(0)
  })
  it('compiles and round-trips icons on parents and nested points', () => {
    const source = 'root = Bullets("Access", [Bullet("Prepare", [Bullet("Before Monday", [], "clock")], "key")])'
    const data = propsOf<BulletsPresentData>(source)
    expect(data.items[0].icon).toBe('key')
    expect(data.items[0].children[0].icon).toBe('clock')
    const result = validateOUISection(source)
    expect(result.payload).toBeTruthy()
    const printed = printOUISection(result.payload!.meta, result.payload!.data)
    const back = propsOf<BulletsPresentData>(printed)
    expect(back.items[0].icon).toBe('key')
    expect(back.items[0].children[0].icon).toBe('clock')
    expect(back.items[0].children[0].text).toBe('Before Monday')
  })
})
