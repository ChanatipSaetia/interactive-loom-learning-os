/**
 * FLIP animations for elements that move when the learner acts (an item flying into a slot, an answer
 * moving up). Measures before a state change, then animates each marked element from where it was.
 * Corrects for scaled ancestors (Present mode's stage), which motion's layout animations do not.
 */
import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react'
import { EASE_IN_OUT, SPRING_PRESS } from './ease'

const FLIP_ATTR = 'data-flip-id'

/** SPRING_PRESS sampled into a CSS linear() easing, with the time it takes to settle. */
export const SPRING_PRESS_EASING = (() => {
  const { stiffness: k, damping: c, mass: m } = SPRING_PRESS
  const dt = 1 / 600
  const samples = [0]
  let x = 0
  let v = 0
  let t = 0
  while (t < 2) {
    v += ((-k * (x - 1) - c * v) / m) * dt
    x += v * dt
    t += dt
    samples.push(x)
    if (t > 0.15 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.02) break
  }
  const points = Array.from({ length: 41 }, (_, i) => samples[Math.round((i / 40) * (samples.length - 1))].toFixed(4))
  points[0] = '0'
  points[40] = '1'
  const supported = typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
  return {
    easing: supported ? `linear(${points.join(', ')})` : `cubic-bezier(${EASE_IN_OUT.join(', ')})`,
    duration: Math.max(420, Math.round(t * 1000)),
  }
})()

export interface FlipOptions {
  /** Lift moving elements along an arc of this height (px) when they travel far. */
  arc?: number
  /** Stagger between moving elements, in ms. */
  stagger?: number
  /** `spring` for the learner's own input, `glide` for moves the lesson makes (decision 73). */
  feel?: 'spring' | 'glide'
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Animate `el` from the box it had (`first`, screen pixels) to where it is now. */
export function playFlip(el: HTMLElement, first: DOMRect, options: FlipOptions & { delay?: number } = {}): Animation | null {
  if (typeof el.animate !== 'function') return null
  const last = el.getBoundingClientRect()
  const scale = el.offsetWidth ? last.width / el.offsetWidth : 1
  const dx = (first.left - last.left) / (scale || 1)
  const dy = (first.top - last.top) / (scale || 1)
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null
  if (reducedMotion()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 })
  const far = Math.hypot(dx, dy) > 60
  const lift = far ? options.arc ?? 0 : 0
  const frames: Keyframe[] = lift
    ? [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx / 2}px, ${dy / 2 - lift}px) scale(1.04)`, offset: 0.5 },
        { transform: 'none' },
      ]
    : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }]
  const spring = (options.feel ?? 'spring') === 'spring'
  el.style.zIndex = '4'
  const a = el.animate(frames, {
    duration: spring ? Math.max(480, SPRING_PRESS_EASING.duration) : 680,
    easing: spring ? SPRING_PRESS_EASING.easing : `cubic-bezier(${EASE_IN_OUT.join(', ')})`,
    delay: options.delay ?? 0,
    fill: 'backwards',
  })
  const done = () => el.style.removeProperty('z-index')
  a.finished.then(done, done)
  return a
}

/**
 * `capture()` before a state change that moves elements marked `data-flip-id` inside `container`;
 * after the change commits, each one animates from where it was.
 */
export function useFlip(container: RefObject<HTMLElement | null>, options: FlipOptions = {}) {
  const pending = useRef<Map<string, DOMRect> | null>(null)
  const opts = useRef(options)
  const override = useRef<FlipOptions>({})
  opts.current = options

  /** Measure now; the next commit animates from here. `feel` overrides the hook's feel for this move. */
  const capture = useCallback((feel?: FlipOptions['feel']) => {
    const root = container.current
    if (!root) return
    override.current = feel ? { feel, ...(feel === 'glide' && { stagger: 80, arc: (opts.current.arc ?? 36) + 18 }) } : {}
    pending.current = new Map(
      Array.from(root.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`)).map((el) => [el.getAttribute(FLIP_ATTR) ?? '', el.getBoundingClientRect()]),
    )
  }, [container])

  useLayoutEffect(() => {
    const before = pending.current
    const root = container.current
    if (!before || !root) return
    pending.current = null
    const o = { ...opts.current, ...override.current }
    let moved = 0
    root.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach((el) => {
      const first = before.get(el.getAttribute(FLIP_ATTR) ?? '')
      if (!first) return
      if (playFlip(el, first, { ...o, delay: moved * (o.stagger ?? 0) })) moved++
    })
  })

  return capture
}

export const flipId = (id: string) => ({ [FLIP_ATTR]: id })
