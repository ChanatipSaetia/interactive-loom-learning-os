/**
 * Liquid Glass lens: an SVG displacement filter for `backdrop-filter`, so a floating bar bends what
 * lies under its rim inward, like the edge of a thick lens, while its middle stays clear.
 *
 * The displacement map is neutral grey in the middle; red ramps across the left and right edges and
 * green across the top and bottom, stretched over each bar. Where the bend samples past the bar, the
 * displaced image is transparent, so it is laid over the unbent backdrop. Only Chromium draws SVG
 * filters in `backdrop-filter`, so the lens is installed, and `<html data-glass-lens>` set, there only;
 * other browsers keep the plain frosted blur (src/styles/liquid-glass.css). Chromium mis-draws it on
 * small dropdowns (the page shows through unblurred), so the ⋯ menu stays frosted.
 */

export const GLASS_LENS_ID = 'liquid-lens'

const MAP = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
<defs>
<linearGradient id='x' x1='0' x2='1' y1='0' y2='0'><stop offset='0' stop-color='rgb(255,0,0)'/><stop offset='0.12' stop-color='rgb(128,0,0)'/><stop offset='0.88' stop-color='rgb(128,0,0)'/><stop offset='1' stop-color='rgb(0,0,0)'/></linearGradient>
<linearGradient id='y' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='rgb(0,255,0)'/><stop offset='0.25' stop-color='rgb(0,128,0)'/><stop offset='0.75' stop-color='rgb(0,128,0)'/><stop offset='1' stop-color='rgb(0,0,0)'/></linearGradient>
</defs>
<rect width='200' height='200' fill='url(#x)'/>
<rect width='200' height='200' fill='url(#y)' style='mix-blend-mode:screen'/>
</svg>`

/** Chromium is the only engine that renders SVG filter references inside backdrop-filter. */
function rendersBackdropSvgFilters(): boolean {
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands
  return !!brands?.some((b) => b.brand === 'Chromium')
}

/** Adds the lens filter to the page once, where the browser can draw it. */
export function installGlassLens(): void {
  if (typeof document === 'undefined' || document.getElementById(GLASS_LENS_ID) || !rendersBackdropSvgFilters()) return
  const href = `data:image/svg+xml,${encodeURIComponent(MAP)}`
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.innerHTML = `<filter id="${GLASS_LENS_ID}" x="0" y="0" width="100%" height="100%" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feImage href="${href}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>
  <feDisplacementMap in="SourceGraphic" in2="map" scale="36" xChannelSelector="R" yChannelSelector="G" result="bent"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="bent"/></feMerge>
</filter>`
  document.body.appendChild(svg)
  document.documentElement.dataset.glassLens = ''
}
