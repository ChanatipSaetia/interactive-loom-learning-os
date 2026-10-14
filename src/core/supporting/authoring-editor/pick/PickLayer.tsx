/**
 * Pick mode events (decision 43): while active, hovering outlines the
 * pickable element under the pointer and a click picks it instead of
 * reaching the section (quiz answers, card flips and sliders are blocked in
 * the capture phase). Inside a pannable canvas (`data-pick-pan`: flowcharts,
 * concept maps) presses still reach the section so it can be dragged, and a
 * click that ends a drag picks nothing (decision 50). Alt/Option+click picks
 * without the mode, `P` toggles it, `Esc` leaves it and Ctrl/Cmd+C copies
 * the tray.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface PickTarget {
  file: string
  anchor: string
  label: string
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
  const { ouiAnchor: anchor, ouiFile: file, ouiSection: section, ouiLabel: own } = element.dataset
  const sectionLabel = section || file!
  return {
    element,
    target: { file: file!, anchor: anchor!, label: anchor === 'root' ? sectionLabel : `${sectionLabel} › ${own || anchor}` },
  }
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

const inPannable = (node: EventTarget | null) => node instanceof Element && !!node.closest('[data-pick-pan]')

interface Outline {
  top: number
  left: number
  width: number
  height: number
  label: string
}

export function PickLayer({ active, onActiveChange, onPick, onCopy }: {
  active: boolean
  onActiveChange: (active: boolean) => void
  onPick: (target: PickTarget) => void
  onCopy: () => void
}) {
  const hovered = useRef<Hit | null>(null)
  const [outline, setOutline] = useState<Outline | null>(null)

  const measure = useCallback(() => {
    const hit = hovered.current
    if (!hit || !hit.element.isConnected) {
      setOutline(null)
      return
    }
    const r = hit.element.getBoundingClientRect()
    setOutline({ top: r.top, left: r.left, width: r.width, height: r.height, label: hit.target.label })
  }, [])

  const hover = useCallback((hit: Hit | null) => {
    if (hit?.element === hovered.current?.element) return
    hovered.current = hit
    measure()
  }, [measure])

  // Keep the latest callbacks without re-binding the listeners.
  const latest = useRef({ active, onActiveChange, onPick, onCopy })
  latest.current = { active, onActiveChange, onPick, onCopy }

  useEffect(() => {
    const picking = (e: MouseEvent) => latest.current.active || e.altKey
    let pressedAt: { x: number; y: number } | null = null

    const onMove = (e: PointerEvent) => hover(picking(e) ? pickTargetOf(e.target) : null)
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
      if (!dragged) latest.current.onPick(hit.target)
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

    window.addEventListener('pointermove', onMove, true)
    for (const type of BLOCKED) window.addEventListener(type, onBlock, true)
    window.addEventListener('click', onClick, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onAltUp)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)
    return () => {
      window.removeEventListener('pointermove', onMove, true)
      for (const type of BLOCKED) window.removeEventListener(type, onBlock, true)
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onAltUp)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  }, [hover, measure])

  useEffect(() => {
    document.documentElement.classList.toggle('loom-picking', active)
    if (!active) hover(null)
    return () => document.documentElement.classList.remove('loom-picking')
  }, [active, hover])

  if (!outline) return null
  return (
    <div
      className="pick-outline"
      style={{ top: outline.top, left: outline.left, width: outline.width, height: outline.height }}
      aria-hidden
      data-testid="pick-outline"
    >
      <span className="pick-outline-label">{outline.label}</span>
    </div>
  )
}
