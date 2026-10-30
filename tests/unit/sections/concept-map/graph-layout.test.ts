import { describe, expect, it } from 'vitest'
import { layoutConceptMap, conceptCategoryColor, type ConceptNode } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map'
import { fitConceptMap, getNodeWidth, NODE_HEIGHT, routeConceptEdges } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map/graph-layout'

const nodes: Record<string, ConceptNode> = {
  c: { id: 'c', title: 'Useful output', category: 'Output' },
  b: { id: 'b', title: 'Renderer with a long readable name', category: 'Implementation' },
  a: { id: 'a', title: 'Application', category: 'Entry point' },
  d: { id: 'd', title: 'Another output', category: 'Output' },
}
const edges = [{ from: 'a', to: 'b', label: 'delegates rendering to' }, { from: 'b', to: 'c', label: 'produces' }, { from: 'b', to: 'd', label: 'can produce' }]

describe('shared concept-map geometry', () => {
  it('finds the useful root independently of input order and places its neighbors to the right', () => {
    const map = layoutConceptMap(nodes, edges)
    expect(map.nodes.a.x).toBeLessThan(map.nodes.b.x!)
    expect(map.nodes.b.x).toBeLessThan(map.nodes.c.x!)
    const all = Object.values(map.nodes)
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j]
      const apartX = Math.abs(a.x! - b.x!) >= (getNodeWidth(a.title) + getNodeWidth(b.title)) / 2
      const apartY = Math.abs(a.y! - b.y!) >= NODE_HEIGHT
      expect(apartX || apartY).toBe(true)
    }
  })

  it('fits every node in the initial viewport instead of clipping the branches', () => {
    const map = layoutConceptMap(nodes, edges)
    for (const [width, height] of [[1400, 900], [700, 1400]]) {
      const fit = fitConceptMap(map.nodes, edges, width, height)
      for (const node of Object.values(map.nodes)) {
        expect((node.x! - getNodeWidth(node.title) / 2) * fit.scale + fit.translateX).toBeGreaterThanOrEqual(0)
        expect((node.x! + getNodeWidth(node.title) / 2) * fit.scale + fit.translateX).toBeLessThanOrEqual(width)
        expect((node.y! - NODE_HEIGHT / 2) * fit.scale + fit.translateY).toBeGreaterThanOrEqual(0)
        expect((node.y! + NODE_HEIGHT / 2) * fit.scale + fit.translateY).toBeLessThanOrEqual(height)
      }
    }
  })

  it('routes parallel, reverse, self and cyclic relations without merging their meanings', () => {
    const links = [...edges, { from: 'b', to: 'a', label: 'belongs to' }, { from: 'a', to: 'b', label: 'configures' }, { from: 'a', to: 'a', label: 'can restart' }, { from: 'a', to: 'a', label: 'can reload' }]
    const map = layoutConceptMap(nodes, links)
    const routes = routeConceptEdges(map.nodes, links)
    expect(routes.every((r) => r && !r.path.includes('NaN') && !r.path.includes('Infinity'))).toBe(true)
    expect(new Set([routes[0]!.path, routes[3]!.path, routes[4]!.path]).size).toBe(3)
    expect(routes[5]!.path).not.toBe(routes[6]!.path)
    expect(routes[0]!.p1.x).toBeCloseTo(map.nodes.a.x! + Math.sign(map.nodes.b.x! - map.nodes.a.x!) * getNodeWidth(nodes.a.title) / 2)
    expect(routeConceptEdges(map.nodes, [{ from: 'absent', to: 'a' }])).toEqual([null])
  })

  it('uses the same distinct colors for custom categories in Read and Present', () => {
    const categories = ['Entry point', 'Implementation', 'Output']
    expect(new Set(categories.map((c) => conceptCategoryColor(c, categories))).size).toBe(3)
    expect(conceptCategoryColor('system', categories)).toBe('var(--ctp-sapphire)')
  })
})
