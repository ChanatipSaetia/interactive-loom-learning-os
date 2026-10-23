/**
 * Pick anchors on the data of a standard OpenUI chart or table in Present mode (decision 117), so a
 * narration step can point at one bar, point, slice or cell by the path of its value in the
 * statement, as Pick pointers do: `bars.series[0].values[4]`, `pie.values[2]`,
 * `table.columns[2].data[4]`. Every value at one label also answers to `<name>.labels[i]`.
 *
 * Read from the rendered DOM: recharts draws each chart twice (its y axis alone, then the plot), so
 * the widest surface is the plot. Line and area charts draw no element per point, so a small marker
 * is added on each vertex of the curve.
 */

const ALIAS = 'data-oui-alias'
const POINTS = 'loom-data-points'
const SVG_NS = 'http://www.w3.org/2000/svg'

function tag(el: Element, anchor: string, ...aliases: string[]) {
  el.setAttribute('data-oui-anchor', anchor)
  if (aliases.length) el.setAttribute(ALIAS, aliases.join(' '))
}

function plotSurface(part: Element): SVGSVGElement | null {
  const surfaces = Array.from(part.querySelectorAll<SVGSVGElement>('svg.recharts-surface'))
  return surfaces.reduce<SVGSVGElement | null>((best, s) => (!best || s.getBoundingClientRect().width > best.getBoundingClientRect().width ? s : best), null)
}

/** The data points of a curve's path: its start and the end of each segment (`M x,y L/C … x,y`). */
export function curveVertices(d: string): Array<[number, number]> {
  // A step curve (H, V) or anything else has corners that are not data points
  if (!/^\s*M/.test(d) || /[^MLC\d\s,.eE+-]/.test(d)) return []
  const points: Array<[number, number]> = []
  for (const [, args] of d.matchAll(/[MLC]([^MLC]*)/g)) {
    const n = args.split(/[\s,]+/).filter(Boolean).map(Number)
    if (n.length < 2 || n.some(Number.isNaN)) return []
    points.push([n[n.length - 2], n[n.length - 1]])
  }
  return points
}

function tagBars(surface: Element, name: string) {
  surface.querySelectorAll('.recharts-bar').forEach((layer, s) => {
    layer.querySelectorAll('.recharts-bar-rectangle').forEach((bar, i) => tag(bar, `${name}.series[${s}].values[${i}]`, `${name}.labels[${i}]`))
  })
}

function tagCurves(surface: SVGSVGElement, name: string) {
  const curves = Array.from(surface.querySelectorAll('.recharts-line-curve, .recharts-area-curve'))
  const key = curves.map((c) => c.getAttribute('d')).join('|')
  const existing = surface.querySelector(`g.${POINTS}`)
  if (existing?.getAttribute('data-key') === key) return
  existing?.remove()
  const group = document.createElementNS(SVG_NS, 'g')
  group.setAttribute('class', POINTS)
  group.setAttribute('data-key', key)
  curves.forEach((curve, s) => {
    curveVertices(curve.getAttribute('d') ?? '').forEach(([x, y], i) => {
      const dot = document.createElementNS(SVG_NS, 'circle')
      dot.setAttribute('class', 'loom-data-point')
      dot.setAttribute('cx', String(x))
      dot.setAttribute('cy', String(y))
      dot.setAttribute('r', '5')
      tag(dot, `${name}.series[${s}].values[${i}]`, `${name}.labels[${i}]`)
      group.appendChild(dot)
    })
  })
  surface.appendChild(group)
}

function tagTable(part: Element, name: string) {
  part.querySelectorAll('.openui-table-header .openui-table-head').forEach((head, c) => tag(head, `${name}.columns[${c}].label`))
  part.querySelectorAll('.openui-table-body .openui-table-row').forEach((row, r) => {
    row.querySelectorAll('.openui-table-cell').forEach((cell, c) => tag(cell, `${name}.columns[${c}].data[${r}]`))
  })
}

/** Tag the bars, points, slices or cells of one part of a standard OpenUI section, named `name`. */
export function tagDataAnchors(part: Element, name: string) {
  if (part.querySelector('.openui-table-body')) return tagTable(part, name)
  const surface = plotSurface(part)
  if (!surface) return
  // The plot is only known once laid out: tags put on another surface before then come off
  part.querySelectorAll('svg.recharts-surface').forEach((other) => {
    if (other === surface) return
    other.querySelectorAll(`g.${POINTS}`).forEach((g) => g.remove())
    other.querySelectorAll('[data-oui-anchor]').forEach((el) => el.removeAttribute('data-oui-anchor'))
  })
  const sectors = surface.querySelectorAll('.recharts-pie-sector')
  if (sectors.length) return sectors.forEach((sector, i) => tag(sector, `${name}.values[${i}]`, `${name}.labels[${i}]`))
  if (surface.querySelector('.recharts-bar')) return tagBars(surface, name)
  if (surface.querySelector('.recharts-line-curve, .recharts-area-curve')) tagCurves(surface, name)
}
