import type { ConceptEdge, ConceptNode } from './index'

export const NODE_HEIGHT = 112
export const getNodeWidth = (title: string) => Math.min(300, Math.max(184, title.length * 10 + 48))

export function wrapConceptText(text: string, limit = 26): string[] {
  const lines: string[] = []
  for (const word of text.split(/\s+/)) {
    if (!lines.length || lines[lines.length - 1].length + word.length + 1 > limit) lines.push(word)
    else lines[lines.length - 1] += ` ${word}`
  }
  return lines
}

export function conceptNodeLines(title: string): string[] {
  const lines = wrapConceptText(title, Math.floor((getNodeWidth(title) - 40) / 11))
  return lines.length > 3 ? [...lines.slice(0, 2), `${lines[2]}…`] : lines
}

export interface ConceptRoute {
  p1: { x: number; y: number }
  p2: { x: number; y: number }
  path: string
  controls: [{ x: number; y: number }, { x: number; y: number }]
  label: { x: number; y: number }
}

/** Route adjacent proximity columns through their free gutter; same-column links bow outside the nodes. */
export function routeConceptEdges(nodes: Record<string, ConceptNode>, edges: ConceptEdge[]): Array<ConceptRoute | null> {
  const routes: Array<ConceptRoute | null> = edges.map((edge, index) => {
    const from = nodes[edge.from]
    const to = nodes[edge.to]
    if (!from || !to) return null
    const fx = from.x ?? 0, fy = from.y ?? 0, tx = to.x ?? 0, ty = to.y ?? 0
    const fw = getNodeWidth(from.title) / 2, tw = getNodeWidth(to.title) / 2
    const peers = edges.map((e, i) => ({ e, i })).filter(({ e }) => (e.from === edge.from && e.to === edge.to) || (e.from === edge.to && e.to === edge.from))
    const offset = (peers.findIndex(({ i }) => i === index) - (peers.length - 1) / 2) * 36
    if (edge.from === edge.to) {
      const p1 = { x: fx + fw, y: fy }
      const p2 = { x: fx - fw, y: fy }
      const top = fy - NODE_HEIGHT - 45 - peers.findIndex(({ i }) => i === index) * 32
      return { p1, p2, controls: [{ x: p1.x + 60, y: top }, { x: p2.x - 60, y: top }], path: `M ${p1.x} ${p1.y} C ${p1.x + 60} ${top} ${p2.x - 60} ${top} ${p2.x} ${p2.y}`, label: { x: fx, y: fy + (top - fy) * 0.75 } }
    }
    const side = Math.abs(tx - fx) < 1
    const direction = tx >= fx ? 1 : -1
    const p1 = { x: fx + (side ? fw : direction * fw), y: fy }
    const p2 = { x: tx + (side ? tw : -direction * tw), y: ty }
    const middle = side ? Math.max(p1.x, p2.x) + 80 + Math.abs(offset) : (p1.x + p2.x) / 2
    const c1 = { x: middle, y: p1.y + offset }
    const c2 = { x: middle, y: p2.y + offset }
    return {
      p1, p2, controls: [c1, c2],
      path: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`,
      label: { x: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8, y: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8 },
    }
  })
  // Place labels on a clear part of their own curve, away from nodes and earlier labels.
  type Box = { x: number; y: number; width: number; height: number }
  const occupied: Box[] = Object.values(nodes).map((n) => ({ x: (n.x ?? 0) - getNodeWidth(n.title) / 2 - 6, y: (n.y ?? 0) - NODE_HEIGHT / 2 - 6, width: getNodeWidth(n.title) + 12, height: NODE_HEIGHT + 12 }))
  const overlaps = (a: Box, b: Box) => a.x < b.x + b.width + 5 && a.x + a.width + 5 > b.x && a.y < b.y + b.height + 5 && a.y + a.height + 5 > b.y
  routes.forEach((route, i) => {
    if (!route || !edges[i].label) return
    const lines = wrapConceptText(edges[i].label!, 26)
    const width = Math.max(...lines.map((line) => line.length)) * 6.5 + 18
    const height = lines.length * 15 + 12
    for (const t of [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85]) {
      const u = 1 - t
      const [a, b] = route.controls
      const x = u ** 3 * route.p1.x + 3 * u ** 2 * t * a.x + 3 * u * t ** 2 * b.x + t ** 3 * route.p2.x
      const y = u ** 3 * route.p1.y + 3 * u ** 2 * t * a.y + 3 * u * t ** 2 * b.y + t ** 3 * route.p2.y
      const box = { x: x - width / 2, y: y - height / 2, width, height }
      if (occupied.some((other) => overlaps(box, other))) continue
      route.label = { x, y }
      occupied.push(box)
      return
    }
    occupied.push({ x: route.label.x - width / 2, y: route.label.y - height / 2, width, height })
  })
  return routes

}

/** Columns encode distance from a useful starting concept, not a fabricated process or causal sequence. */
export function layoutConceptComponent(component: { nodeIds: string[]; edges: ConceptEdge[]; entryPointId: string }, nodes: Record<string, ConceptNode>, cx = 0, cy = 0) {
  const neighbors = new Map(component.nodeIds.map((id) => [id, new Set<string>()]))
  for (const edge of component.edges) {
    neighbors.get(edge.from)?.add(edge.to)
    neighbors.get(edge.to)?.add(edge.from)
  }
  const rank = new Map([[component.entryPointId, 0]])
  const queue = [component.entryPointId]
  for (let i = 0; i < queue.length; i++) {
    for (const other of neighbors.get(queue[i]) ?? []) if (!rank.has(other)) {
      rank.set(other, rank.get(queue[i])! + 1)
      queue.push(other)
    }
  }
  const columns: string[][] = []
  for (const id of component.nodeIds) (columns[rank.get(id) ?? 0] ??= []).push(id)
  const ys = new Map<string, number>()
  for (const column of columns) column.forEach((id, i) => ys.set(id, (i - (column.length - 1) / 2) * (NODE_HEIGHT + 54)))
  for (let sweep = 0; sweep < 6; sweep++) {
    const order = sweep % 2 ? [...columns].reverse() : columns
    for (const column of order) {
      const barycenter = (id: string) => {
        const adjacent = [...neighbors.get(id) ?? []].filter((n) => rank.get(n) !== rank.get(id))
        return adjacent.length ? adjacent.reduce((sum, n) => sum + (ys.get(n) ?? 0), 0) / adjacent.length : ys.get(id) ?? 0
      }
      column.sort((a, b) => barycenter(a) - barycenter(b) || component.nodeIds.indexOf(a) - component.nodeIds.indexOf(b))
      column.forEach((id, i) => ys.set(id, (i - (column.length - 1) / 2) * (NODE_HEIGHT + 54)))
    }
  }
  const widths = columns.map((column) => Math.max(...column.map((id) => getNodeWidth(nodes[id].title))))
  const labelWidth = Math.max(140, ...component.edges.map((e) => Math.min(26, (e.label ?? '').length) * 6.5 + 48))
  const result: Record<string, ConceptNode> = {}
  let x = 0
  columns.forEach((column, i) => {
    if (i) x += widths[i - 1] / 2 + labelWidth + widths[i] / 2
    for (const id of column) result[id] = { ...nodes[id], id, x: cx + x, y: cy + (ys.get(id) ?? 0) }
  })
  const edgeAnchors: Record<string, ConceptRoute> = {}
  routeConceptEdges(result, component.edges).forEach((route, i) => { if (route) edgeAnchors[`${component.edges[i].from}->${component.edges[i].to}`] = route })
  return { nodes: result, edgeAnchors }
}

/** Fit the whole component, including label boxes, instead of zooming into and clipping its starting node. */
export function fitConceptMap(nodes: Record<string, ConceptNode>, edges: ConceptEdge[], width: number, height: number) {
  const values = Object.values(nodes)
  if (!values.length) return { scale: 1, translateX: 0, translateY: 0 }
  const routes = routeConceptEdges(nodes, edges)
  const left = Math.min(...values.map((n) => (n.x ?? 0) - getNodeWidth(n.title) / 2), ...routes.flatMap((r) => r ? [r.label.x - 100] : [])) - 36
  const right = Math.max(...values.map((n) => (n.x ?? 0) + getNodeWidth(n.title) / 2), ...routes.flatMap((r) => r ? [r.label.x + 100] : [])) + 36
  const top = Math.min(...values.map((n) => (n.y ?? 0) - NODE_HEIGHT / 2), ...routes.flatMap((r) => r ? [r.label.y - 30] : [])) - 48
  const bottom = Math.max(...values.map((n) => (n.y ?? 0) + NODE_HEIGHT / 2), ...routes.flatMap((r) => r ? [r.label.y + 30] : [])) + 72
  const scale = Math.min(width / Math.max(1, right - left), height / Math.max(1, bottom - top), 1.5)
  return { scale, translateX: (width - (left + right) * scale) / 2, translateY: (height - (top + bottom) * scale) / 2 }
}
