import { describe, expect, it } from 'vitest'
import { buildContextGraph, dependencyClosure } from '../../../../../../src/core/supporting/authoring-editor/assistant/context-graph'

describe('context graph', () => {
  it('indexes statements and references without server state', () => {
    const graph = buildContextGraph({ 'topic.oui': 'root = Topic("Example", [])' })
    expect(graph.nodes.some((n) => n.id === 'topic.oui#root')).toBe(true)
    expect(dependencyClosure(graph, ['topic.oui#root'])).toContain('topic.oui#root')
  })
})

import { resolveTopicContext } from '../../../../../../src/core/supporting/authoring-editor/assistant/context-graph'
const files = { 'topic.oui': 'root = Topic("T", "C", "D", [SectionRef("quiz")])', 'sections/quiz.oui': 'root = Quiz("T", [q])\nq = QuizQuestion("q", label, [c])\nlabel = "Why?"\nc = QuizChoice("a", "A", true, "Yes")' }
it('resolves transitive dependencies including topic section references', () => {
  const result = resolveTopicContext({ files, roots: ['topic.oui#root'] })
  expect(result.sources.map((s) => s.statement)).toEqual(expect.arrayContaining(['root', 'q', 'label', 'c']))
  expect(result.truncated).toBe(false)
})
it('bounds cycles, missing references, output and stale sources', () => {
  const cyclic = { 'sections/quiz.oui': 'root = Quiz("T", [a])\na = b\nb = a\nc = missing' }
  expect(resolveTopicContext({ files: cyclic, roots: ['sections/quiz.oui#a'] }).sources).toHaveLength(2)
  expect(resolveTopicContext({ files: cyclic, roots: ['sections/quiz.oui#c'] }).diagnostics[0].code).toBe('MISSING_REFERENCE')
  expect(resolveTopicContext({ files, roots: ['topic.oui#root'], maxNodes: 1 }).truncated).toBe(true)
  const result = resolveTopicContext({ files, expectedHash: 'old' })
  expect(result.sources).toEqual([])
  expect(result.diagnostics[0].code).toBe('STALE_CONTEXT')
  expect(resolveTopicContext({ files: { ...files, 'sections/quiz.oui': files['sections/quiz.oui'] + '\nextra = "Unsaved"' } }).hash).not.toBe(result.hash)
  const large = { 'sections/quiz.oui': `root = Text("T", ["${'x'.repeat(5000)}"])` }
  const bounded = resolveTopicContext({ files: large, roots: ['sections/quiz.oui'], maxChars: 2048 })
  expect(JSON.stringify(bounded).length).toBeLessThanOrEqual(2048)
  expect(bounded.truncated).toBe(true)
})
it('rejects arbitrary paths and oversized sources', () => {
  expect(() => resolveTopicContext({ files: { '../secret': 'x' } })).toThrow()
  expect(() => resolveTopicContext({ files: { 'topic.oui': 'x'.repeat(32769) } })).toThrow()
})

it('does not treat comments or quoted prose as manifest section references', () => {
  const result = resolveTopicContext({ files: { 'topic.oui': '// SectionRef("missing")\nroot = Topic("T", "C", "D", [])' }, roots: ['topic.oui'] })
  expect(result.diagnostics).toEqual([])
})
