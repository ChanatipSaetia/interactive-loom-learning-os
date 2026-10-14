/**
 * Pick mode events (decision 43): while active, hovering outlines the
 * pickable element under the pointer and a click picks it instead of
 * reaching the section (quiz answers, card flips and sliders are blocked in
 * the capture phase). Inside a pannable canvas (`data-pick-pan`: flowcharts,
 * concept maps) presses still reach the section so it can be dragged, and a
 * click that ends a drag picks nothing (decision 50). Alt/Option+click picks
 * without the mode, `P` toggles it, `Esc` leaves it and Ctrl/Cmd+C copies
 * the tray.
 *
 * Touch (decision 52): a tap is picked when the touch ends, and that event
 * stops there, so sections that act on touchend (flowchart lines) or cancel
 * touchstart (concept-map lines, which then get no click) still pick right.
 * Every pick flashes the picked element, since touch has no hover outline.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface PickTarget {
  file: string
  anchor: string
  label: string
  /** Section title alone. */
  section: string
}

interface Hit {
  element: Element
  target: PickTarget
}

/**
 * The closest pickable element: tagged with `data-oui-anchor`, `data-oui-file`
 * and `data-oui-section` (by `PickSection` or `usePickAnchor`). An optional
 * `data-oui-label` names it for people. Elements outside the topic (the
 * tray) opt out with `data-pick-ignore`.
 */
export function pickTargetOf(node: EventTarget | null): Hit | null {
  if (!(node instanceof Element) || node.closest('[data-pick-ignore]')) return null
  const element = node.closest<HTMLElement | SVGElement>('[data-oui-anchor][data-oui-file]')
  if (!element) return null
  const { ouiAnchor: anchor, ouiFile: file, ouiSection: sectionLabel, ouiLabel: own } = element.dataset
  const section = sectionLabel || file!
  return {
    element,
    target: { file: file!, anchor: anchor!, section, label: anchor === 'root' ? section : `${section} › ${own || anchor}` },
  }
}

/** The element a picked place is drawn by (the first, when several share it). */
export function findPickElement(file: string, anchor: string): Element | null {
  for (const el of document.querySelectorAll('[data-oui-anchor][data-oui-file]')) {
    if (el.getAttribute('data-oui-file') === file && el.getAttribute('data-oui-anchor') === anchor && !el.closest('[data-pick-ignore]')) return el
  }
  return null
}

function isEditable(node: EventTarget | null): boolean {
  if (!(node instanceof HTMLElement)) return false
  return node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName)
}

// Pointer and mouse events a section could react to before the click.
const BLOCKED = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick', 'auxclick'] as const
const PRESS = new Set(['pointerdown', 'pointerup', 'mousedown', 'mouseup'])
/** A press that moves further than this is a drag, not a pick. */
const DRAG_DISTANCE = 4
const FLASH_MS = 1100

const inPannable = (node: EventTarget | null) => node instanceof Element && !!node.closest('[data-pick-pan]')

interface Outline {
  top: number
  left: number
  width: number
  height: number
  label: string
}

const outlineOf = (element: Element, label: string): Outline | null => {
  if (!element.isConnected) return null
  const r = element.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, label }
}

export function PickLayer({ active, onActiveChange, onPick, onCopy, focus }: {
  active: boolean
  onActiveChange: (active: boolean) => void
  onPick: (target: PickTarget) => void
  onCopy: () => void
  /** Scroll to a picked place and flash it (a tray row was tapped); a new object flashes again. */
  focus?: { file: string; anchor: string; label: string } | null
}) {
  const hovered = useRef<Hit | null>(null)
  const flashed = useRef<{ element: Element; label: string } | null>(null)
  const [outline, setOutline] = useState<Outline | null>(null)
  const [flash, setFlash] = useState<Outline | null>(null)

  const measure = useCallback(() => {
    const hit = hovered.current
    setOutline(hit ? outlineOf(hit.element, hit.target.label) : null)
    const f = flashed.current
    setFlash(f ? outlineOf(f.element, f.label) : null)
  }, [])

  const hover = useCallback((hit: Hit | null) => {
    if (hit?.element === hovered.current?.element) return
    hovered.current = hit
    measure()
  }, [measure])

  const flashTimer = useRef<ReturnType<typeof setTimeout>>()
  const flashElement = useCallback((element: Element, label: string) => {
    flashed.current = { element, label }
    measure()
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => {
      flashed.current = null
      measure()
    }, FLASH_MS)
  }, [measure])
  useEffect(() => () => clearTimeout(flashTimer.current), [])

  // Keep the latest callbacks without re-binding the listeners.
  const latest = useRef({ active, onActiveChange, onPick, onCopy })
  latest.current = { active, onActiveChange, onPick, onCopy }

  useEffect(() => {
    const picking = (e: MouseEvent | TouchEvent) => latest.current.active || e.altKey
    let pressedAt: { x: number; y: number } | null = null
    let touchedAt: { x: number; y: number } | null = null

    const pick = (hit: Hit) => {
      latest.current.onPick(hit.target)
      flashElement(hit.element, hit.target.label)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      hover(picking(e) ? pickTargetOf(e.target) : null)
    }
    const onBlock = (e: Event) => {
      if (e.type === 'pointerdown' || e.type === 'mousedown') pressedAt = { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
      if (!picking(e as MouseEvent) || !pickTargetOf(e.target)) return
      // Let canvases see presses so they can still be panned.
      if (PRESS.has(e.type) && inPannable(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }
    const onClick = (e: MouseEvent) => {
      if (!picking(e)) return
      const hit = pickTargetOf(e.target)
      if (!hit) return
      e.preventDefault()
      e.stopPropagation()
      const dragged = pressedAt && Math.hypot(e.clientX - pressedAt.x, e.clientY - pressedAt.y) > DRAG_DISTANCE
      pressedAt = null
      if (!dragged) pick(hit)
    }
    const onTouchStart = (e: TouchEvent) => {
      touchedAt = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchedAt
      touchedAt = null
      const touch = e.changedTouches[0]
      if (!latest.current.active || !start || !touch || e.touches.length > 0) return
      if (Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > DRAG_DISTANCE) return
      const hit = pickTargetOf(e.target)
      if (!hit) return
      e.preventDefault() // no click follows, so the tap is picked once
      // A tap on a canvas's background still ends the canvas's pan gesture.
      if (!(hit.target.anchor === 'root' && inPannable(e.target))) e.stopPropagation()
      pick(hit)
    }
    const onKey = (e: KeyboardEvent) => {
      const { active, onActiveChange, onCopy } = latest.current
      if (isEditable(e.target)) return
      if (e.key === 'Escape' && active) {
        onActiveChange(false)
      } else if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        onActiveChange(!active)
      } else if (active && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && window.getSelection()?.isCollapsed !== false) {
        e.preventDefault()
        onCopy()
      }
    }
    const onAltUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && !latest.current.active) hover(null)
    }
    const onViewportChange = () => measure()

    const capture = { capture: true }
    const activeCapture = { capture: true, passive: false }
    window.addEventListener('pointermove', onMove, capture)
    for (const type of BLOCKED) window.addEventListener(type, onBlock, capture)
    window.addEventListener('click', onClick, capture)
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
    window.addEventListener('touchend', onTouchEnd, activeCapture)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onAltUp)
    window.addEventListener('scroll', onViewportChange, capture)
    window.addEventListener('resize', onViewportChange)
    return () => {
      window.removeEventListener('pointermove', onMove, capture)
      for (const type of BLOCKED) window.removeEventListener(type, onBlock, capture)
      window.removeEventListener('click', onClick, capture)
      window.removeEventListener('touchstart', onTouchStart, capture)
      window.removeEventListener('touchend', onTouchEnd, capture)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onAltUp)
      window.removeEventListener('scroll', onViewportChange, capture)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [hover, measure, flashElement])

  useEffect(() => {
    document.documentElement.classList.toggle('loom-picking', active)
    if (!active) hover(null)
    return () => document.documentElement.classList.remove('loom-picking')
  }, [active, hover])

  useEffect(() => {
    if (!focus) return
    const element = findPickElement(focus.file, focus.anchor)
    if (!element) return
    element.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
    flashElement(element, focus.label)
  }, [focus, flashElement])

  return (
    <>
      {outline && (
        <div
          className="pick-outline"
          style={{ top: outline.top, left: outline.left, width: outline.width, height: outline.height }}
          aria-hidden
          data-testid="pick-outline"
        >
          <span className="pick-outline-label">{outline.label}</span>
        </div>
      )}
      {flash && (
        <div
          className="pick-outline pick-outline--flash"
          style={{ top: flash.top, left: flash.left, width: flash.width, height: flash.height }}
          aria-hidden
          data-testid="pick-flash"
        >
          <span className="pick-outline-label">{flash.label}</span>
        </div>
      )}
    </>
  )
}
