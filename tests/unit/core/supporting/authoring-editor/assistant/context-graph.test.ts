import { describe, expect, it } from 'vitest'
import { buildContextGraph, dependencyClosure } from '../../../../../../../src/core/supporting/authoring-editor/assistant/context-graph'

describe('context graph', () => {
  it('indexes statements and references without server state', () => {
    const graph = buildContextGraph({ 'topic.oui': 'root = Topic("Example", [])' })
    expect(graph.nodes.some((n) => n.id === 'topic.oui#root')).toBe(true)
    expect(dependencyClosure(graph, ['topic.oui#root'])).toContain('topic.oui#root')
  })
})
