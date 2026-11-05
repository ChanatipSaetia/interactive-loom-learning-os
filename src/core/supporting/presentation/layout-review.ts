/** Browser-only geometry evidence. Never called from the hosted MCP Worker. */
export interface LayoutDiagnostic {
  code: 'SMALL_TEXT' | 'CLIPPED_CONTENT' | 'HORIZONTAL_OVERFLOW' | 'FOCUS_OUTSIDE_VIEWPORT'
  severity: 'warning'
  target: string
  fontPixels?: number
  repairTarget: string
}
export interface LayoutReview {
  schemaVersion: 1
  measured: boolean
  viewport: { width: number; height: number }
  checkedElements: number
  intentionalScrollRegions: number
  truncated: boolean
  diagnostics: LayoutDiagnostic[]
  teachingQuality: 'not-evaluated'
}

/** Labels/source text never enter the report; only bounded anchor IDs and numbers. */
export function reviewRenderedLayout(root: HTMLElement, options: { maxElements?: number; maxDiagnostics?: number; minFontPixels?: number } = {}): LayoutReview {
  const maxElements = Math.min(1000, Math.max(1, options.maxElements ?? 300))
  const maxDiagnostics = Math.min(30, Math.max(1, options.maxDiagnostics ?? 12))
  const view = root.ownerDocument.defaultView!
  const result: LayoutReview = { schemaVersion: 1, measured: false, viewport: { width: view.innerWidth, height: view.innerHeight }, checkedElements: 0, intentionalScrollRegions: 0, truncated: false, diagnostics: [], teachingQuality: 'not-evaluated' }
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
  const emitted = new Set<string>()
  const add = (code: LayoutDiagnostic['code'], element: HTMLElement, fontPixels?: number) => {
    const raw = element.closest('[data-oui-anchor]')?.getAttribute('data-oui-anchor') ?? element.tagName.toLowerCase()
    const target = /^[\w.[\]-]{1,120}$/.test(raw) ? raw : 'section'
    const key = `${code}:${target}`
    if (emitted.has(key)) return
    emitted.add(key)
    if (result.diagnostics.length >= maxDiagnostics) { result.truncated = true; return }
    result.diagnostics.push({ code, severity: 'warning', target, repairTarget: target, ...(fontPixels ? { fontPixels } : {}) })
  }
  for (const element of elements.slice(0, maxElements)) {
    const rect = element.getBoundingClientRect()
    const style = view.getComputedStyle(element)
    if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden') continue
    let parent: HTMLElement | null = element
    let hidden = false, scrollX = false, clipped = false
    for (let depth = 0; parent && depth < 24; depth++, parent = parent.parentElement) {
      const css = view.getComputedStyle(parent)
      if (css.display === 'none' || css.visibility === 'hidden' || css.opacity === '0' || parent.getAttribute('aria-hidden') === 'true') { hidden = true; break }
      const box = parent.getBoundingClientRect()
      const scrollableX = /^(auto|scroll)$/.test(css.overflowX)
      if (scrollableX) scrollX = true
      // Compare descendants with clipping ancestors; auto/scroll are reachable,
      // even when their contents are deliberately outside the visible region.
      if (parent !== element && ((/^(hidden|clip)$/.test(css.overflowX) && (rect.left < box.left - 2 || rect.right > box.right + 2)) || (/^(hidden|clip)$/.test(css.overflowY) && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2)))) clipped = true
      if (parent === root) break
    }
    if (hidden) continue
    result.checkedElements++
    result.measured = true
    if ((/^(auto|scroll)$/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 2) || (/^(auto|scroll)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2)) result.intentionalScrollRegions++
    if (clipped || (/^(hidden|clip)$/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 2) || (/^(hidden|clip)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2)) add('CLIPPED_CONTENT', element)
    if (!scrollX && (rect.right > view.innerWidth + 2 || rect.left < -2)) add('HORIZONTAL_OVERFLOW', element)
    if (element.hasAttribute('data-focus') && (rect.bottom < 0 || rect.top > view.innerHeight || rect.right < 0 || rect.left > view.innerWidth)) add('FOCUS_OUTSIDE_VIEWPORT', element)
    const hasOwnText = Array.from(element.childNodes).some((node) => node.nodeType === 3 && Boolean(node.textContent?.trim()))
    const font = Number.parseFloat(style.fontSize)
    if (hasOwnText && Number.isFinite(font) && font < (options.minFontPixels ?? 12)) add('SMALL_TEXT', element, Math.round(font * 100) / 100)
  }
  if (elements.length > maxElements) result.truncated = true
  return result
}
