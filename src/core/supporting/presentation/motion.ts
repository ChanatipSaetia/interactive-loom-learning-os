/**
 * Plays a beat's entrance: every element its section marked for the beat enters with its motion
 * (Motion Rules and decision 87 in grill-log-presenting-mode.md). One anime.js timeline per beat;
 * finishing it early jumps to the end state, and the elements are then left to their CSS
 * (`data-shown`), so going back never has to undo an animation.
 */
import { createTimeline, cubicBezier, type Timeline } from 'animejs'
import { PRESENT_MOTION as P, type SoundEffect } from '../../ui-system'
import { PRESENT_WORD_CLASS, type BeatMotion } from '../../learning-engine/sub-contexts/present-kernel'

const curve = (b: readonly number[]) => cubicBezier(b[0], b[1], b[2], b[3])
const OUT = curve(P.ease.out)
const IN = curve(P.ease.in)
const IN_OUT = curve(P.ease.inOut)

/** Inline styles a beat may leave behind; cleared when it ends. */
const TOUCHED = ['opacity', 'transform', 'clip-path', 'background-size', 'stroke-dasharray', 'stroke-dashoffset']

export interface BeatEntrance {
  timeline: Timeline
  /** Ends the entrance now, at its end state. */
  finish: () => void
  /** Resolves once the entrance has ended, played out or finished early. */
  done: Promise<void>
}

export interface EnterOptions {
  reduced: boolean
  /** Wait before the entrance starts, in ms (e.g. while the camera arrives). */
  delay?: number
  onSound?: (effect: SoundEffect) => void
}

const marked = (root: HTMLElement, attr: string, value: number) =>
  Array.from(root.querySelectorAll<HTMLElement>(`[${attr}="${value}"]`))

/** Unset rises enter one after another among their marked siblings. */
function staggerIndex(el: HTMLElement): number {
  if (el.dataset.delay !== undefined || (el.dataset.motion ?? 'rise') !== 'rise' || !el.parentElement) return 0
  const peers = Array.from(el.parentElement.children).filter(
    (x): x is HTMLElement => x instanceof HTMLElement && x.dataset.beat === el.dataset.beat && (x.dataset.motion ?? 'rise') === 'rise' && x.dataset.delay === undefined,
  )
  return Math.max(0, peers.indexOf(el))
}

export function enterBeat(root: HTMLElement, beat: number, options: EnterOptions): BeatEntrance {
  const { reduced, onSound } = options
  const start = options.delay ?? 0
  const tl = createTimeline({ autoplay: false })
  const targets = new Set<HTMLElement>()
  const hide = (el: HTMLElement) => {
    targets.add(el)
    el.style.opacity = '0'
  }

  // Leaving first, and quicker than arriving
  const leaving = marked(root, 'data-until', beat - 1)
  leaving.forEach((el) => {
    el.setAttribute('data-leaving', '')
    targets.add(el)
    tl.add(el, reduced
      ? { opacity: [1, 0], duration: P.reduced / 2 }
      : { opacity: [1, 0], translateY: [0, -8], duration: P.exit, ease: IN }, start)
  })
  const at0 = start + (leaving.length && !reduced ? Math.round(P.exit * 0.64) : 0)

  for (const el of marked(root, 'data-beat', beat)) {
    const motion = (el.dataset.motion ?? 'rise') as BeatMotion
    const t = at0 + (reduced ? 0 : Number(el.dataset.delay ?? 0) + staggerIndex(el) * P.stagger)
    // A marked sound plays as the element lands, not as it starts moving
    const sound = el.dataset.sound as SoundEffect | undefined
    if (sound && onSound) tl.call(() => onSound(sound), reduced ? at0 : t + Math.round(P.element * 0.6))
    if (reduced) {
      if (motion === 'draw') continue
      hide(el)
      tl.add(el, { opacity: [0, 1], duration: P.reduced, ease: OUT }, at0)
      continue
    }
    switch (motion) {
      case 'fade':
        hide(el)
        tl.add(el, { opacity: [0, 1], duration: P.element, ease: OUT }, t)
        break
      case 'rise':
        hide(el)
        tl.add(el, { opacity: [0, 1], translateY: [P.rise, 0], duration: P.element, ease: OUT }, t)
        break
      case 'unfold':
        hide(el)
        tl.add(el, { opacity: [0, 1], translateX: [-P.rise, 0], translateY: [-10, 0], duration: P.element, ease: OUT }, t)
        break
      case 'stack':
        hide(el)
        tl.add(el, { opacity: [0, 1], translateY: [-28, 0], duration: P.element + 100, ease: OUT }, t)
        break
      case 'pop':
        hide(el)
        tl.add(el, { opacity: [0, 1], scale: [0.7, 1], duration: P.pop, ease: OUT }, t)
        if (onSound) tl.call(() => onSound('click'), t + P.pop / 2)
        break
      case 'draw': {
        targets.add(el)
        if (typeof SVGGeometryElement !== 'undefined' && (el as Element) instanceof SVGGeometryElement) {
          // An SVG line strokes itself along its path (pathLength="1")
          el.style.strokeDasharray = '1'
          el.style.strokeDashoffset = '1'
          tl.add(el, { strokeDashoffset: ['1', '0'], duration: P.draw, ease: IN_OUT }, t)
          if (onSound) tl.call(() => onSound('draw'), t)
          break
        }
        const vertical = getComputedStyle(el).getPropertyValue('--present-dir').trim() === 'v'
        el.style.clipPath = vertical ? 'inset(0% 0% 100% 0%)' : 'inset(0% 100% 0% 0%)'
        tl.add(el, { clipPath: [el.style.clipPath, 'inset(0% 0% 0% 0%)'], duration: P.draw, ease: IN_OUT }, t)
        if (onSound) tl.call(() => onSound('draw'), t)
        break
      }
      case 'children': {
        // Step into single wrappers (an OpenUI program's root Stack) to reach the real children
        let parent: Element = el
        for (let depth = 0; depth < 3 && parent.children.length === 1; depth++) parent = parent.children[0]
        Array.from(parent.children).forEach((child, i) => {
          if (!(child instanceof HTMLElement)) return
          hide(child)
          tl.add(child, { opacity: [0, 1], translateY: [P.rise / 2, 0], duration: P.element, ease: OUT }, t + i * P.stagger * 2)
        })
        break
      }
      case 'words': {
        let w = t
        el.querySelectorAll<HTMLElement>(`.${PRESENT_WORD_CLASS}`).forEach((word) => {
          hide(word)
          tl.add(word, { opacity: [0, 1], translateY: ['0.35em', '0em'], duration: 380, ease: OUT }, w)
          w += /[,.;:?!]$/.test(word.textContent ?? '') ? P.phrasePause : P.word
        })
        el.querySelectorAll<HTMLElement>('strong, mark').forEach((mark, i) => {
          targets.add(mark)
          mark.style.backgroundSize = '0% 46%'
          tl.add(mark, { backgroundSize: ['0% 46%', '100% 46%'], duration: P.highlight, ease: IN_OUT }, w + 80 + i * 120)
        })
        break
      }
    }
  }

  revealBeat(root, beat, !reduced)

  let ended = false
  let resolve: () => void = () => {}
  const done = new Promise<void>((r) => { resolve = r })
  const end = () => {
    if (ended) return
    ended = true
    targets.forEach((el) => {
      TOUCHED.forEach((prop) => el.style.removeProperty(prop))
      el.removeAttribute('data-leaving')
    })
    resolve()
  }
  tl.then(end)
  if (tl.duration <= 0) queueMicrotask(end)
  else tl.play()

  return {
    timeline: tl,
    finish: () => {
      if (ended) return
      tl.complete()
      end()
    },
    done,
  }
}

function offsetWithin(el: HTMLElement, ancestor: HTMLElement): number {
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== ancestor) {
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return y
}

/**
 * Scroll a region's body so the elements of `beat` are in view, for sections taller than the
 * stage (long text, long lists). The body is the offset parent of the section's content.
 */
export function revealBeat(root: HTMLElement, beat: number, smooth: boolean): void {
  const body = root.querySelector<HTMLElement>('.present-region-body')
  if (!body || body.scrollHeight <= body.clientHeight) return
  const els = Array.from(root.querySelectorAll<HTMLElement>(`[data-beat="${beat}"]`))
  if (!els.length) return
  const top = Math.min(...els.map((el) => offsetWithin(el, body)))
  const bottom = Math.max(...els.map((el) => offsetWithin(el, body) + el.offsetHeight))
  const pad = 24
  let next = body.scrollTop
  if (bottom + pad > body.scrollTop + body.clientHeight) next = bottom + pad - body.clientHeight
  if (top - pad < next) next = Math.max(0, top - pad)
  if (next !== body.scrollTop) body.scrollTo({ top: next, behavior: smooth ? 'smooth' : 'auto' })
}
