import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Browser column fragmentation keeps the original interactive DOM and all its state. */
export function PaginatedRead({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null)
  const flow = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(0)
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const stride = size + 32
  const go = useCallback((index: number) => {
    const next = Math.max(0, Math.min(pages - 1, index))
    setPage(next)
    viewport.current?.scrollTo({ left: next * stride, top: 0 })
  }, [pages, stride])

  useLayoutEffect(() => {
    const box = viewport.current
    const content = flow.current
    if (!box || !content) return
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const width = box.clientWidth
        if (!width) return
        content.style.setProperty('--read-page-width', `${width}px`)
        content.style.setProperty('--read-page-height', `${box.clientHeight}px`)
        setSize(width)
        setPages(Math.max(1, Math.ceil((content.scrollWidth + 32) / (width + 32))))
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    const changes = new MutationObserver(measure)
    changes.observe(content, { childList: true, subtree: true, characterData: true })
    document.fonts?.addEventListener('loadingdone', measure)
    content.addEventListener('load', measure, true)
    measure()
    return () => {
      observer.disconnect()
      changes.disconnect()
      document.fonts?.removeEventListener('loadingdone', measure)
      content.removeEventListener('load', measure, true)
      cancelAnimationFrame(frame)
    }
  }, [children])

  useLayoutEffect(() => { go(page) }, [go, page])

  const interactive = (target: EventTarget | null) => target instanceof Element && !!target.closest('button, input, select, textarea, a, svg, [role="slider"], [contenteditable="true"]')
  return (
    <div className="mcp-pages" data-testid="mcp-read-pages">
      <div className="mcp-page-viewport" ref={viewport} tabIndex={0} aria-label="Reading pages"
        data-testid="mcp-read-scroll"
        onScroll={() => {
          const box = viewport.current
          if (box) setPage(Math.max(0, Math.min(pages - 1, Math.round(box.scrollLeft / stride))))
        }}
        onKeyDown={(event) => {
          if (interactive(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault()
            go(page + (event.key === 'ArrowRight' ? 1 : -1))
          }
        }}
        onPointerDown={(event) => { swipe.current = event.pointerType === 'touch' && !interactive(event.target) ? { x: event.clientX, y: event.clientY } : null }}
        onPointerUp={(event) => {
          const start = swipe.current
          swipe.current = null
          if (!start) return
          const dx = event.clientX - start.x
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5) go(page + (dx < 0 ? 1 : -1))
        }}
        onPointerCancel={() => { swipe.current = null }}>
        <div className="mcp-page-flow" ref={flow} style={{ '--read-page-width': `${size}px` } as CSSProperties}>{children}</div>
      </div>
      <nav className="mcp-page-controls" aria-label="Reading pagination">
        <button type="button" className="mcp-button mcp-quiet" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page" data-testid="mcp-read-prev"><ChevronLeft size={18} /></button>
        <span role="status" aria-live="polite" data-testid="mcp-read-page">Page {page + 1} of {pages}</span>
        <button type="button" className="mcp-button mcp-quiet" onClick={() => go(page + 1)} disabled={page >= pages - 1} aria-label="Next page" data-testid="mcp-read-next"><ChevronRight size={18} /></button>
      </nav>
    </div>
  )
}
