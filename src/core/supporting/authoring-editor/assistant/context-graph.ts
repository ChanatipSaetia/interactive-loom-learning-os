/** Bounded structural index derived from OUI source. No persistent server state. */
import { fileStatements } from './statements'

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

import { z } from 'zod'
import { textHash } from './statements'

/** Sources must be explicitly obtained by the assistant using its authorized connector. */
export const TopicContextInput = z.object({
  files: z.record(z.string().regex(/^(topic\.oui|sections\/[\w-]+(?:\.narrate)?\.oui)$/), z.string().max(32768))
    .refine((files) => Object.keys(files).length <= 100 && Object.values(files).reduce((n, s) => n + s.length, 0) <= 131072, 'At most 100 files and 128 KiB of source'),
  roots: z.array(z.string().max(240)).max(40).default([]),
  maxNodes: z.number().int().min(1).max(200).default(100),
  maxChars: z.number().int().min(2048).max(32768).default(16384),
  expectedHash: z.string().max(120).optional(),
}).strict()
export type TopicContextRequest = z.input<typeof TopicContextInput>

export function resolveTopicContext(input: TopicContextRequest) {
  const { files, roots, maxNodes, maxChars, expectedHash } = TopicContextInput.parse(input)
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b))
  const hash = `context-v1:${textHash(JSON.stringify(entries))}`
  const result = {
    schemaVersion: 1, hash, truncated: false,
    overview: entries.map(([file]) => file),
    sources: [] as Array<{ id: string; file: string; statement: string; line: number; text: string }>,
    components: [] as string[],
    diagnostics: [] as Array<{ code: string; reference: string }>,
  }
  if (expectedHash && expectedHash !== hash) {
    result.diagnostics.push({ code: 'STALE_CONTEXT', reference: expectedHash })
    return result
  }
  const graph = buildContextGraph(files)
  // SectionRef uses string IDs, not expression references; connect those explicit topic edges.
  for (const match of (files['topic.oui'] ?? '').matchAll(/\bSectionRef\("([\w-]+)"\)/g)) {
    graph.edges.push({ from: 'topic.oui#root', to: `sections/${match[1]}.oui#root`, kind: 'references' })
  }
  const ids = new Set(graph.nodes.map((n) => n.id))
  const pending = roots.map((root) => root.includes('#') ? root : `${root}#root`)
  const visited = new Set<string>()
  const links = new Map<string, string[]>()
  for (const edge of graph.edges) if (edge.kind !== 'contains') links.set(edge.from, [...(links.get(edge.from) ?? []), edge.to])
  const statements = new Map(entries.flatMap(([file, source]) => fileStatements(source).map((s) => [`${file}#${s.name}`, { file, statement: s.name, line: s.line, text: s.text }] as const)))
  while (pending.length && visited.size < maxNodes) {
    const id = pending.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    if (!ids.has(id)) result.diagnostics.push({ code: 'MISSING_REFERENCE', reference: id })
    const source = statements.get(id)
    if (source) result.sources.push({ id, ...source })
    else if (id.startsWith('component:')) result.components.push(id.slice(10))
    pending.push(...(links.get(id) ?? []).filter((next) => !visited.has(next)))
  }
  if (pending.some((id) => !visited.has(id))) result.truncated = true
  result.diagnostics = result.diagnostics.slice(0, 20)
  // Budget the complete JSON response, never cut a statement in half.
  while (JSON.stringify(result).length > maxChars && (result.sources.length || result.overview.length || result.components.length || result.diagnostics.length)) {
    result.truncated = true
    if (result.sources.length) result.sources.pop()
    else if (result.overview.length) result.overview.pop()
    else if (result.components.length) result.components.pop()
    else result.diagnostics.pop()
  }
  if (result.truncated && JSON.stringify(result).length + 80 < maxChars) result.diagnostics.push({ code: 'CONTEXT_TRUNCATED', reference: 'Increase budget or request fewer roots' })
  return result
}
