import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Globe, X } from 'lucide-react'
import './reference-links.css'

function reference(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href') ?? ''
  if (!href || href.startsWith('#') || anchor.hasAttribute('download')) return null
  try {
    const url = new URL(href, document.baseURI)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    return {
      href: url.href,
      title: anchor.textContent?.trim() || url.hostname,
      description: anchor.getAttribute('title')?.trim(),
      domain: url.hostname,
      destination: `${url.pathname}${url.search}${url.hash}`,
      external: url.origin !== window.location.origin,
    }
  } catch { return null }
}

const referenceKey = (details: ReturnType<typeof reference>) => details ? `${details.href}\n${details.title}\n${details.description ?? ''}` : ''

/** Enhance rendered Markdown without replacing its parser, citations or math support. */
export function useReferenceLinks(scope: RefObject<HTMLElement>, contentKey: unknown) {
  const id = useId()
  const [, refresh] = useState(0)
  const [anchor, setAnchor] = useState<HTMLAnchorElement | null>(null)
  const restoringFocus = useRef(false)
  const dismissed = useRef<HTMLAnchorElement | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const openAction = useRef<HTMLAnchorElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()
  const [position, setPosition] = useState({ left: 12, top: 12 })
  const details = anchor?.isConnected ? reference(anchor) : null
  const previewKey = referenceKey(details)
  const currentPreview = useRef({ anchor, key: previewKey })
  currentPreview.current = { anchor, key: previewKey }
  const cancelClose = () => clearTimeout(closeTimer.current)
  const close = () => { cancelClose(); dismissed.current = anchor; setAnchor(null) }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => {
      if (!card.current?.contains(document.activeElement)) setAnchor(null)
    }, 180)
  }

  useEffect(() => {
    const root = scope.current
    if (!root) return
    root.classList.add('loom-reference-scope')
    const enhanced = new Map<HTMLAnchorElement, { target: string | null; rel: string | null }>()
    const owns = (link: HTMLAnchorElement) => link.closest('.loom-reference-scope') === root
    const scan = () => {
      root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
        if (!owns(link)) return
        const info = reference(link)
        link.classList.toggle('loom-reference-link', !!info)
        link.toggleAttribute('data-loom-external', !!info?.external)
        if (!enhanced.has(link) && info) enhanced.set(link, { target: link.getAttribute('target'), rel: link.getAttribute('rel') })
        const original = enhanced.get(link)
        if (!original) return
        for (const key of ['target', 'rel'] as const) {
          if (original[key] === null) link.removeAttribute(key)
          else link.setAttribute(key, original[key])
        }
        if (info?.external) {
          link.target = '_blank'
          link.rel = [...new Set([...link.rel.split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ')
        }
      })
      const current = currentPreview.current
      if (current.anchor && (!root.contains(current.anchor) || !reference(current.anchor))) setAnchor(null)
      else if (current.anchor && referenceKey(reference(current.anchor)) !== current.key) refresh((value) => value + 1)
    }
    const linkAt = (target: EventTarget | null) => {
      const link = target instanceof Element ? target.closest<HTMLAnchorElement>('a.loom-reference-link') : null
      return link && owns(link) ? link : null
    }
    const show = (event: Event) => {
      const link = linkAt(event.target)
      if (event.type === 'focusin' && !restoringFocus.current) dismissed.current = null
      if (link && dismissed.current !== link) { cancelClose(); setAnchor(link) }
    }
    const leave = (event: Event) => {
      const link = linkAt(event.target)
      const next = (event as MouseEvent | FocusEvent).relatedTarget
      if (link && !(next instanceof Node && (link.contains(next) || card.current?.contains(next)))) {
        dismissed.current = null
        scheduleClose()
      }
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey && linkAt(event.target) && card.current) {
        event.preventDefault()
        openAction.current?.focus()
      }
    }
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'title'] })
    root.addEventListener('mouseover', show)
    root.addEventListener('focusin', show)
    root.addEventListener('mouseout', leave)
    root.addEventListener('focusout', leave)
    root.addEventListener('keydown', keydown)
    return () => {
      cancelClose()
      observer.disconnect()
      root.removeEventListener('mouseover', show)
      root.removeEventListener('focusin', show)
      root.removeEventListener('mouseout', leave)
      root.removeEventListener('focusout', leave)
      root.removeEventListener('keydown', keydown)
      root.classList.remove('loom-reference-scope')
      enhanced.forEach((original, link) => {
        link.classList.remove('loom-reference-link')
        link.removeAttribute('data-loom-external')
        for (const key of ['target', 'rel'] as const) {
          if (original[key] === null) link.removeAttribute(key)
          else link.setAttribute(key, original[key])
        }
      })
    }
  // The scope and content key control the lifetime of delegated listeners.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, contentKey])

  useLayoutEffect(() => {
    if (!anchor || !previewKey) return
    const originalControls = anchor.getAttribute('aria-controls')
    const originalExpanded = anchor.getAttribute('aria-expanded')
    anchor.setAttribute('aria-controls', id)
    anchor.setAttribute('aria-expanded', 'true')
    const place = () => {
      if (!anchor.isConnected) { setAnchor(null); return }
      const rect = anchor.getBoundingClientRect()
      const height = card.current?.offsetHeight ?? 240
      const width = card.current?.offsetWidth ?? 360
      setPosition({
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        top: Math.max(12, rect.bottom + height + 20 <= window.innerHeight ? rect.bottom + 10 : rect.top - height - 10),
      })
    }
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        dismissed.current = anchor
        if (card.current?.contains(document.activeElement)) {
          restoringFocus.current = true
          anchor.focus()
          restoringFocus.current = false
        }
        setAnchor(null)
      }
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !anchor.contains(event.target) && !card.current?.contains(event.target)) setAnchor(null)
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('keydown', dismiss, true)
    document.addEventListener('pointerdown', outside)
    return () => {
      if (originalControls === null) anchor.removeAttribute('aria-controls')
      else anchor.setAttribute('aria-controls', originalControls)
      if (originalExpanded === null) anchor.removeAttribute('aria-expanded')
      else anchor.setAttribute('aria-expanded', originalExpanded)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('keydown', dismiss, true)
      document.removeEventListener('pointerdown', outside)
    }
  }, [anchor, id, previewKey])

  if (!details) return null
  return createPortal(
    <div ref={card} id={id} role="dialog" aria-label={`Reference: ${details.title}`} className="loom-reference-preview" data-quiet
      style={position} onMouseEnter={cancelClose} onMouseLeave={scheduleClose} onFocus={cancelClose}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose() }}>
      <div className="loom-reference-site"><Globe size={16} aria-hidden="true" /><span>{details.domain}</span><span className="loom-reference-kind">{details.external ? 'External website' : 'Reference'}</span></div>
      <button className="loom-reference-close" aria-label="Close reference preview" onClick={() => { dismissed.current = anchor; restoringFocus.current = true; anchor?.focus(); restoringFocus.current = false; close() }}><X size={16} /></button>
      <h3>{details.title}</h3>
      <p>{details.description || 'Open this reference for more information on the website.'}</p>
      <div className="loom-reference-destination" title={details.href}>{details.domain}{details.destination === '/' ? '' : details.destination}</div>
      <a ref={openAction} className="loom-reference-open" href={details.href} target={details.external ? '_blank' : undefined} rel={details.external ? 'noopener noreferrer' : undefined}
        onKeyDown={(event) => { if (event.key === 'Tab' && event.shiftKey) { event.preventDefault(); anchor?.focus() } }}>
        Open reference <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    </div>, document.body,
  )
}

/** Keep preview state separate from the lesson renderer and its learner inputs. */
export function ReferenceLinks({ scope, contentKey }: { scope: RefObject<HTMLElement>; contentKey: unknown }) {
  return <>{useReferenceLinks(scope, contentKey)}</>
}
