/** Browser-only geometry evidence. Never called from the hosted MCP Worker. */
export interface LayoutDiagnostic {
  code: 'SMALL_TEXT' | 'CLIPPED_CONTENT' | 'HORIZONTAL_OVERFLOW' | 'FOCUS_OUTSIDE_VIEWPORT'
  severity: 'warning'
  target: string
  file?: string
  sectionId?: string
  fontPixels?: number
  domPath: string
  viewMode?: 'read' | 'present'
  bounds: { left: number; top: number; width: number; height: number }
  containerBounds: { left: number; top: number; width: number; height: number }
  overflowPixels: { left: number; right: number; top: number; bottom: number }
  repairCategory: 'wrap-or-responsive-width' | 'reachable-scroll-or-resize' | 'readable-scale' | 'bring-focus-into-view'
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
export function reviewRenderedLayout(root: HTMLElement, options: { maxElements?: number; maxDiagnostics?: number; minFontPixels?: number; viewMode?: 'read' | 'present' } = {}): LayoutReview {
  const maxElements = Math.min(1000, Math.max(1, options.maxElements ?? 300))
  const maxDiagnostics = Math.min(30, Math.max(1, options.maxDiagnostics ?? 12))
  const view = root.ownerDocument.defaultView!
  const result: LayoutReview = { schemaVersion: 1, measured: false, viewport: { width: view.innerWidth, height: view.innerHeight }, checkedElements: 0, intentionalScrollRegions: 0, truncated: false, diagnostics: [], teachingQuality: 'not-evaluated' }
  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
  const emitted = new Set<string>()
  const add = (code: LayoutDiagnostic['code'], element: HTMLElement, fontPixels?: number) => {
    const raw = element.closest('[data-oui-anchor]')?.getAttribute('data-oui-anchor') ?? element.tagName.toLowerCase()
    const target = /^[\w.[\]-]{1,120}$/.test(raw) ? raw : 'section'
    const sourceFile = element.closest('[data-oui-file]')?.getAttribute('data-oui-file') ?? ''
    const file = /^(topic\.oui|sections\/[\w-]{1,120}\.oui)$/.test(sourceFile) ? sourceFile : undefined
    const sectionId = file ? /^sections\/(.+)\.oui$/.exec(file)?.[1] : undefined
    const key = `${file ?? ''}:${code}:${target}`
    if (emitted.has(key)) return
    emitted.add(key)
    if (result.diagnostics.length >= maxDiagnostics) { result.truncated = true; return }
    const segments: string[] = []
    for (let node: Element | null = element; node && node !== root && segments.length < 8; node = node.parentElement) {
      const siblings = node.parentElement ? Array.from(node.parentElement.children) : [node]
      segments.unshift(`${node.tagName.toLowerCase()}:nth-child(${siblings.indexOf(node) + 1})`)
    }
    const rect = element.getBoundingClientRect()
    let container = element.parentElement ?? root
    for (let parent = element.parentElement; parent && root.contains(parent); parent = parent.parentElement) {
      const css = view.getComputedStyle(parent)
      if (/hidden|clip/.test(`${css.overflowX} ${css.overflowY}`)) { container = parent; break }
    }
    const box = container.getBoundingClientRect()
    const round = (n: number) => Math.round(n * 100) / 100
    const bounds = (b: DOMRect) => ({ left: round(b.left), top: round(b.top), width: round(b.width), height: round(b.height) })
    result.diagnostics.push({ code, severity: 'warning', target, domPath: segments.join(' > '),
      ...(options.viewMode ? { viewMode: options.viewMode } : {}), bounds: bounds(rect), containerBounds: bounds(box),
      overflowPixels: { left: round(Math.max(0, Math.max(0, box.left) - rect.left)), right: round(Math.max(0, rect.right - Math.min(view.innerWidth, box.right))), top: round(Math.max(0, box.top - rect.top)), bottom: round(Math.max(0, rect.bottom - box.bottom)) },
      repairCategory: code === 'SMALL_TEXT' ? 'readable-scale' : code === 'FOCUS_OUTSIDE_VIEWPORT' ? 'bring-focus-into-view' : code === 'CLIPPED_CONTENT' ? 'reachable-scroll-or-resize' : 'wrap-or-responsive-width', ...(file ? { file, sectionId } : {}), repairTarget: file ? `${file}#${target}` : target, ...(fontPixels ? { fontPixels } : {}) })
  }
  for (const element of elements.slice(0, maxElements)) {
    const rect = element.getBoundingClientRect()
    const style = view.getComputedStyle(element)
    if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden') continue
    let parent: HTMLElement | null = element
    let hidden = false, scrollX = false, clipped = false, paintedScaleY = 1
    for (let depth = 0; parent && depth < 24; depth++, parent = parent.parentElement) {
      const css = view.getComputedStyle(parent)
      if (css.display === 'none' || css.visibility === 'hidden' || css.opacity === '0' || parent.getAttribute('aria-hidden') === 'true') { hidden = true; break }
      const box = parent.getBoundingClientRect()
      const scrollableX = /^(auto|scroll)$/.test(css.overflowX)
      if (css.transform && css.transform !== 'none' && typeof DOMMatrixReadOnly !== 'undefined') {
        const matrix = new DOMMatrixReadOnly(css.transform)
        paintedScaleY *= Math.hypot(matrix.m21, matrix.m22, matrix.m23)
      }
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
    const hasOwnText = Array.from(element.childNodes).some((node) => node.nodeType === 3 && Boolean(node.textContent?.trim()))
    const meaningful = hasOwnText || /^(IMG|TABLE|SVG|CANVAS|BUTTON|INPUT|SELECT|TEXTAREA)$/i.test(element.tagName) || element.hasAttribute('data-oui-anchor') || element.hasAttribute('data-focus')
    if (meaningful && (clipped || (/^(hidden|clip)$/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 2) || (/^(hidden|clip)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2))) add('CLIPPED_CONTENT', element)
    if (meaningful && !scrollX && (rect.right > view.innerWidth + 2 || rect.left < -2)) add('HORIZONTAL_OVERFLOW', element)
    if (element.hasAttribute('data-focus') && (rect.bottom < 0 || rect.top > view.innerHeight || rect.right < 0 || rect.left > view.innerWidth)) add('FOCUS_OUTSIDE_VIEWPORT', element)
    const font = Number.parseFloat(style.fontSize)
    // Present scales a design canvas. Computed CSS pixels alone would incorrectly
    // call 24px text readable when an ancestor paints it at 0.3x. Compare the
    // ancestor transform chain. offsetHeight is rounded to integer pixels and
    // creates false small-text warnings for fractional, unscaled line boxes.
    const svgMatrix = (element as unknown as SVGGraphicsElement).getScreenCTM?.()
    const scaleY = svgMatrix ? Math.hypot(svgMatrix.c, svgMatrix.d) : paintedScaleY
    const paintedFont = font * scaleY
    if (hasOwnText && Number.isFinite(paintedFont) && paintedFont + 0.1 < (options.minFontPixels ?? 12)) add('SMALL_TEXT', element, Math.round(paintedFont * 100) / 100)
  }
  if (elements.length > maxElements) result.truncated = true
  return result
}
