import { afterEach, expect, it, vi } from 'vitest'
import { reviewRenderedLayout } from '../../../../src/core/supporting/presentation/layout-review'

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals() })
const box = (width: number, height: number, left = 0, top = 0) => ({ width, height, left, top, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) })
it('reports real geometry limits while excluding text and retaining intentional scrolling', () => {
  const root = document.createElement('main')
  root.innerHTML = '<div style="overflow-x:auto"><p style="font-size:9px" data-oui-file="sections/argument.oui" data-oui-anchor="argument">private prose</p></div>'
  document.body.append(root)
  const scroll = root.firstElementChild as HTMLElement, text = scroll.firstElementChild as HTMLElement
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(500, 500) as DOMRect)
  vi.spyOn(scroll, 'getBoundingClientRect').mockReturnValue(box(400, 100) as DOMRect)
  vi.spyOn(text, 'getBoundingClientRect').mockReturnValue(box(1200, 50) as DOMRect)
  Object.defineProperty(scroll, 'scrollWidth', { value: 1200 })
  Object.defineProperty(scroll, 'clientWidth', { value: 400 })
  const result = reviewRenderedLayout(root)
  expect(result.measured).toBe(true)
  expect(result.intentionalScrollRegions).toBe(1)
  expect(result.diagnostics.map((d) => d.code)).toEqual(['SMALL_TEXT'])
  expect(result.diagnostics[0]).toMatchObject({ file: 'sections/argument.oui', sectionId: 'argument', repairTarget: 'sections/argument.oui#argument' })
  expect(JSON.stringify(result)).not.toContain('private prose')
  scroll.style.overflowX = 'hidden'
  expect(reviewRenderedLayout(root).diagnostics.some((d) => d.code === 'CLIPPED_CONTENT')).toBe(true)
})
it('does not claim geometry in jsdom without layout and bounds traversal', () => {
  const root = document.createElement('main')
  root.innerHTML = '<span>Hidden</span><span>More</span>'
  expect(reviewRenderedLayout(root).measured).toBe(false)
  expect(reviewRenderedLayout(root, { maxElements: 1 }).truncated).toBe(true)
})
it('accounts for transformed presentation text rather than accepting its unscaled CSS size', () => {
  const root = document.createElement('main')
  root.innerHTML = '<p style="font-size:24px" data-oui-anchor="caption">Scaled text</p>'
  const text = root.firstElementChild as HTMLElement
  document.body.append(root)
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(300, 300) as DOMRect)
  vi.spyOn(text, 'getBoundingClientRect').mockReturnValue(box(100, 30) as DOMRect)
  text.style.transform = 'scale(0.3)'
  vi.stubGlobal('DOMMatrixReadOnly', class { m21 = 0; m22 = 0.3; m23 = 0 })
  expect(reviewRenderedLayout(root).diagnostics).toContainEqual(expect.objectContaining({ code: 'SMALL_TEXT', target: 'caption', fontPixels: 7.2 }))
})
it('does not infer a scale from rounded line boxes or flag structural virtual canvases', () => {
  const root = document.createElement('main')
  root.innerHTML = '<div><span style="font-size:12px">A label</span></div>'
  document.body.append(root)
  const world = root.firstElementChild as HTMLElement, text = world.firstElementChild as HTMLElement
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(300, 300) as DOMRect)
  vi.spyOn(world, 'getBoundingClientRect').mockReturnValue(box(5000, 300) as DOMRect)
  vi.spyOn(text, 'getBoundingClientRect').mockReturnValue(box(100, 13.47) as DOMRect)
  Object.defineProperty(text, 'offsetHeight', { value: 14 })
  expect(reviewRenderedLayout(root).diagnostics).toEqual([])
})

it.each(['read', 'present'] as const)('attaches bounded geometry and repairs to %s clipping reports', (viewMode) => {
  const root = document.createElement('main')
  root.innerHTML = '<section style="overflow-x:hidden" data-oui-file="sections/cost.oui"><h2 data-oui-anchor="cost-title">A technical title</h2></section>'
  document.body.append(root)
  const section = root.firstElementChild as HTMLElement, title = section.firstElementChild as HTMLElement
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(768, 572) as DOMRect)
  vi.spyOn(section, 'getBoundingClientRect').mockReturnValue(box(600, 200) as DOMRect)
  vi.spyOn(title, 'getBoundingClientRect').mockReturnValue(box(900, 60) as DOMRect)
  const result = reviewRenderedLayout(root, { viewMode })
  expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'CLIPPED_CONTENT', viewMode, sectionId: 'cost', target: 'cost-title', bounds: { left: 0, top: 0, width: 900, height: 60 }, containerBounds: { left: 0, top: 0, width: 600, height: 200 }, overflowPixels: { left: 0, right: 300, top: 0, bottom: 0 }, repairCategory: 'reachable-scroll-or-resize' }))
})
