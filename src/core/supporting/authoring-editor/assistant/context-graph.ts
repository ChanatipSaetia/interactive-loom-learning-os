/** Bounded structural index derived from OUI source. No persistent server state. */
import { fileStatements } from './context'

export interface ContextGraphNode { id: string; kind: 'file' | 'statement' | 'component' }
export interface ContextGraphEdge { from: string; to: string; kind: 'contains' | 'references' | 'calls-component' }
export interface ContextGraph { nodes: ContextGraphNode[]; edges: ContextGraphEdge[] }

export function buildContextGraph(files: Record<string, string>): ContextGraph {
  const nodes: ContextGraphNode[] = []
  const edges: ContextGraphEdge[] = []
  const componentIds = new Set<string>()
  for (const [file, source] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    nodes.push({ id: file, kind: 'file' })
    for (const statement of fileStatements(source)) {
      const id = `${file}#${statement.name}`
      nodes.push({ id, kind: 'statement' })
      edges.push({ from: file, to: id, kind: 'contains' })
      for (const ref of statement.refs) edges.push({ from: id, to: `${file}#${ref}`, kind: 'references' })
      for (const component of statement.calls) {
        const target = `component:${component}`
        if (!componentIds.has(target)) { componentIds.add(target); nodes.push({ id: target, kind: 'component' }) }
        edges.push({ from: id, to: target, kind: 'calls-component' })
      }
    }
  }
  return { nodes, edges }
}

/** Recursively resolve structural dependencies with a hard node budget. */
export function dependencyClosure(graph: ContextGraph, roots: readonly string[], maxNodes = 100): string[] {
  const visited = new Set<string>(), pending = [...roots]
  const links = new Map<string, string[]>()
  for (const edge of graph.edges) if (edge.kind !== 'contains') links.set(edge.from, [...(links.get(edge.from) ?? []), edge.to])
  while (pending.length && visited.size < maxNodes) {
    const id = pending.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    for (const to of links.get(id) ?? []) if (!visited.has(to)) pending.push(to)
  }
  return [...visited]
}
