/**
 * Finding what a narration target points at in a rendered section (decision 92): elements whose
 * Pick anchor is the target, else the outermost ones inside it (`noCache.…`, `noCache[…`).
 */
import type { Size } from './camera'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export function targetElements(root: Element, target: string): Element[] {
  const tagged = Array.from(root.querySelectorAll('[data-oui-anchor]'))
  const exact = tagged.filter((el) => el.getAttribute('data-oui-anchor') === target)
  const hits = exact.length
    ? exact
    : tagged.filter((el) => {
      const anchor = el.getAttribute('data-oui-anchor') ?? ''
      return anchor.startsWith(`${target}.`) || anchor.startsWith(`${target}[`)
    })
  return hits.filter((el) => !hits.some((other) => other !== el && other.contains(el)))
}

/**
 * The derived beat that reveals the first of these elements: the latest `data-beat` on each one's
 * way up to the region (0 when nothing hides it), the earliest over the elements. Undefined when
 * there are none.
 */
export function revealingBeat(elements: Element[], region: Element): number | undefined {
  if (!elements.length) return undefined
  return Math.min(...elements.map((el) => {
    let beat = 0
    for (let n: Element | null = el; n && n !== region; n = n.parentElement) {
      const value = n.getAttribute('data-beat')
      if (value !== null) beat = Math.max(beat, Number(value))
    }
    return beat
  }))
}

/** An element's box in region (stage) coordinates, whatever the camera zoom and stage scale. */
export function boxOf(el: Element, region: Element, stage: Size): Box {
  const r = region.getBoundingClientRect()
  const k = r.width / stage.w || 1
  const e = el.getBoundingClientRect()
  return { x: (e.left - r.left) / k, y: (e.top - r.top) / k, w: e.width / k, h: e.height / k }
}

export function unionBox(boxes: Box[]): Box | null {
  const real = boxes.filter((b) => b.w > 0 || b.h > 0)
  if (!real.length) return null
  const x = Math.min(...real.map((b) => b.x))
  const y = Math.min(...real.map((b) => b.y))
  return { x, y, w: Math.max(...real.map((b) => b.x + b.w)) - x, h: Math.max(...real.map((b) => b.y + b.h)) - y }
}

/**
 * What the stage lights while a beat plays (decision 105): the elements its section marked with
 * `focus()`, else the outermost elements the beat brings on screen.
 */
export function focusElements(region: HTMLElement, beat: number): HTMLElement[] {
  const body = region.querySelector<HTMLElement>('.present-region-body') ?? region
  const visible = (el: HTMLElement) => !el.closest('[data-beat]:not([data-shown])')
  const marked = Array.from(body.querySelectorAll<HTMLElement>('[data-focus]')).filter(visible)
  if (marked.length) return marked
  const els = Array.from(body.querySelectorAll<HTMLElement>(`[data-beat="${beat}"]`)).filter(visible)
  // A Read section standing in for a missing renderer is the whole region: nothing to point at
  return els.filter((el) => !els.some((o) => o !== el && o.contains(el)) && !el.classList.contains('present-fallback'))
}
