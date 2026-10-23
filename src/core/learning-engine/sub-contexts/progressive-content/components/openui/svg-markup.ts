/**
 * SVG markup for the `Svg` component of standard OpenUI sections (decision 118): a drawing written
 * inline as SVG, made safe to put in the page and themed.
 *
 * Only drawing elements and attributes stay: no scripts, event handlers, `foreignObject`, external
 * links or images. IDs are scoped to the drawing (two drawings may both define `#arrow`) and every
 * element with an ID keeps it in `data-svg-id`, which Present mode turns into the Pick anchor
 * `<statement>.<id>` so narration can point at one shape. A Loom palette name as a color (`fill="blue"`,
 * `stroke="overlay1"`) becomes that theme color, so drawings follow the active theme.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

const ELEMENTS = new Set([
  'svg', 'g', 'defs', 'symbol', 'use', 'title', 'desc',
  'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'textPath',
  'marker', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'clipPath', 'mask',
  'filter', 'feGaussianBlur', 'feDropShadow', 'feOffset', 'feBlend', 'feMerge', 'feMergeNode', 'feFlood', 'feComposite', 'feColorMatrix',
  'animate', 'animateTransform', 'animateMotion', 'mpath', 'set',
])

/** Loom palette tokens a drawing can name as a color (Catppuccin names, redefined by every theme). */
export const SVG_THEME_COLORS = [
  'rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender',
  'text', 'subtext1', 'subtext0', 'overlay2', 'overlay1', 'overlay0', 'surface2', 'surface1', 'surface0', 'base', 'mantle', 'crust',
] as const

const THEME_COLORS = new Set<string>(SVG_THEME_COLORS)
const COLOR_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color'])
const LINK_ATTRS = new Set(['href', 'xlink:href'])

/** The IDs of the elements of a drawing, in order, read from its markup (no DOM needed). */
export function svgShapeIds(markup: string): string[] {
  const ids = [...markup.matchAll(/<[A-Za-z][^>]*?\sid\s*=\s*(["'])([^"']+)\1/g)].map((m) => m[2])
  return [...new Set(ids)]
}

export type SanitizedSvg = { svg: string; ids: string[] } | { error: string }

const scoped = (scope: string, id: string) => `${scope}-${id}`

/** `url(#id)` and `#id` references pointed at the drawing's scoped IDs. */
function rescope(value: string, ids: Set<string>, scope: string): string {
  return value.replace(/url\(\s*#([^)\s]+)\s*\)/g, (m, id: string) => (ids.has(id) ? `url(#${scoped(scope, id)})` : m))
}

function unsafeValue(value: string): boolean {
  return /javascript:|data:|expression\s*\(/i.test(value) || /url\(\s*(?!#)/i.test(value)
}

function cleanElement(el: Element, ids: Set<string>, scope: string): void {
  // SMIL may not rewrite links or handlers into the drawing
  if (/^(animate|set)$/.test(el.localName) && /href|^on/i.test(el.getAttribute('attributeName') ?? '')) {
    el.remove()
    return
  }
  let style = el.getAttribute('style') ?? ''
  for (const { name, value } of Array.from(el.attributes)) {
    const lower = name.toLowerCase()
    if (lower.startsWith('on') || lower === 'style' || (unsafeValue(value) && !LINK_ATTRS.has(lower))) {
      if (lower !== 'style') el.removeAttribute(name)
      continue
    }
    if (LINK_ATTRS.has(lower)) {
      const target = value.trim().startsWith('#') ? value.trim().slice(1) : null
      if (target && ids.has(target)) el.setAttribute(name, `#${scoped(scope, target)}`)
      else el.removeAttribute(name)
      continue
    }
    if (lower === 'id') {
      el.setAttribute('data-svg-id', value)
      el.setAttribute('id', scoped(scope, value))
      continue
    }
    if (COLOR_ATTRS.has(lower) && THEME_COLORS.has(value.trim())) {
      el.removeAttribute(name)
      style = `${name}: var(--ctp-${value.trim()});${style}`
      continue
    }
    el.setAttribute(name, rescope(value, ids, scope))
  }
  if (style && !unsafeValue(style.replace(/url\(\s*#/g, ''))) el.setAttribute('style', rescope(style, ids, scope))
  else el.removeAttribute('style')
}

/**
 * Safe, themed markup for a drawing, or why it cannot be drawn. `scope` prefixes its IDs; `label`
 * names the drawing for screen readers.
 */
export function sanitizeSvgMarkup(markup: string, scope: string, label?: string): SanitizedSvg {
  if (typeof DOMParser === 'undefined') return { error: 'SVG drawings need a browser.' }
  const doc = new DOMParser().parseFromString(markup.trim(), 'image/svg+xml')
  const root = doc.documentElement
  const parseError = doc.getElementsByTagName('parsererror')[0]
  if (parseError) return { error: `The SVG markup is not well-formed XML: ${parseError.textContent?.trim().split('\n')[0] ?? 'parse error'}` }
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS) {
    return { error: 'The markup must be one <svg xmlns="http://www.w3.org/2000/svg" viewBox="…"> element.' }
  }

  const all = [root, ...Array.from(root.getElementsByTagName('*'))]
  for (const el of all) {
    if (el.namespaceURI !== SVG_NS || !ELEMENTS.has(el.localName)) el.remove()
  }
  const kept = [root, ...Array.from(root.getElementsByTagName('*'))]
  const ids = new Set(kept.map((el) => el.getAttribute('id')).filter((id): id is string => !!id))
  for (const el of kept) cleanElement(el, ids, scope)

  // The drawing scales to the width it is given, keeping its proportions
  const width = parseFloat(root.getAttribute('width') ?? '')
  const height = parseFloat(root.getAttribute('height') ?? '')
  if (!root.getAttribute('viewBox') && width > 0 && height > 0) root.setAttribute('viewBox', `0 0 ${width} ${height}`)
  root.removeAttribute('width')
  root.removeAttribute('height')
  // Shapes and text without a color of their own draw in the theme's text color
  if (!root.getAttribute('fill') && !/(^|;)\s*fill\s*:/.test(root.getAttribute('style') ?? '')) root.setAttribute('fill', 'currentColor')
  root.setAttribute('role', 'img')
  if (label) root.setAttribute('aria-label', label)

  return { svg: new XMLSerializer().serializeToString(root), ids: [...ids] }
}
