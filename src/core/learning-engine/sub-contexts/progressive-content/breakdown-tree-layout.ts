import { breakdownModel, type BreakdownNode, type BreakdownTreeSectionData } from './breakdown-tree'

export const BREAKDOWN_GEOMETRY = { cardWidth: 246, cardHeight: 132, column: 274, row: 194, padding: 20 } as const

/** Equal card sizes; only the explicit share bars encode quantitative size. */
export function layoutBreakdownTree(data: BreakdownTreeSectionData, rootId?: string, depthLimit = Infinity) {
  const model = breakdownModel(data)
  const root = rootId ? model.nodes.get(rootId) : model.root
  const { cardWidth, column, padding } = BREAKDOWN_GEOMETRY
  const cardHeight = Math.max(BREAKDOWN_GEOMETRY.cardHeight, ...data.nodes.map((n) => Math.ceil(Array.from(n.title).length / 18) * 26 + 100))
  const row = cardHeight + 62
  const placed: Array<{ node: BreakdownNode; x: number; y: number; depth: number }> = []
  const edges: Array<{ from: string; to: string }> = []
  const seen = new Set<string>()
  let nextLeaf = 0, deepest = 0
  const visit = (node: BreakdownNode, depth: number): number => {
    if (seen.has(node.id)) return padding + cardWidth / 2
    seen.add(node.id)
    deepest = Math.max(deepest, depth)
    const children = depth < depthLimit ? model.children(node.id) : []
    const positions = children.map((child) => {
      edges.push({ from: node.id, to: child.id })
      return visit(child, depth + 1)
    })
    const center = positions.length ? (positions[0] + positions[positions.length - 1]) / 2 : padding + nextLeaf++ * column + cardWidth / 2
    placed.push({ node, x: center - cardWidth / 2, y: padding + depth * row, depth })
    return center
  }
  if (root) visit(root, 0)
  const width = Math.max(1, nextLeaf) * column - (column - cardWidth) + padding * 2
  placed.sort((a, b) => a.depth - b.depth || a.x - b.x)
  return { placed, edges, width, cardHeight, height: padding * 2 + deepest * row + cardHeight, model }
}
