import { useEffect, type RefObject } from 'react'

/** Keep delivered wheel/touch gestures in the embedded reader even if host listeners
 * suppress native nested scrolling. Diagram gestures, pinch zoom and form controls stay native. */
export function useReadingScroll(ref: RefObject<HTMLElement>, active: boolean) {
  useEffect(() => {
    const element = ref.current
    if (!active || !element) return
    const ownsGesture = (target: EventTarget | null) => target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="dialog"], svg, canvas')
    const move = (delta: number) => {
      const before = element.scrollTop
      element.scrollTop = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, before + delta))
      return element.scrollTop !== before
    }
    const wheel = (event: WheelEvent) => {
      if (!event.cancelable || event.ctrlKey || event.metaKey || ownsGesture(event.target) || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
      if (move(event.deltaY * unit)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    let touch: { x: number; y: number; last: number } | null = null
    const start = (event: TouchEvent) => {
      const point = event.touches[0]
      touch = event.touches.length === 1 && !ownsGesture(event.target) && point ? { x: point.clientX, y: point.clientY, last: point.clientY } : null
    }
    const drag = (event: TouchEvent) => {
      const point = event.touches[0]
      if (!touch || !point || event.touches.length !== 1 || !event.cancelable) return
      const dy = point.clientY - touch.y
      if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(point.clientX - touch.x)) return
      if (move(touch.last - point.clientY)) {
        event.preventDefault()
        event.stopPropagation()
      }
      touch.last = point.clientY
    }
    const end = () => { touch = null }
    element.addEventListener('wheel', wheel, { capture: true, passive: false })
    element.addEventListener('touchstart', start, { passive: true })
    element.addEventListener('touchmove', drag, { capture: true, passive: false })
    element.addEventListener('touchend', end)
    element.addEventListener('touchcancel', end)
    return () => {
      element.removeEventListener('wheel', wheel, true)
      element.removeEventListener('touchstart', start)
      element.removeEventListener('touchmove', drag, true)
      element.removeEventListener('touchend', end)
      element.removeEventListener('touchcancel', end)
    }
  }, [ref, active])
}
