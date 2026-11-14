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
const files = { 'topic.oui': 'root = Topic("T", "C", "D", [SectionRef("quiz")])', 'sections/quiz.oui': "root = Page(\"T\", Quiz(\"T\", [q]))\nq = QuizQuestion(\"q\", label, [c])\nlabel = \"Why?\"\nc = QuizChoice(\"a\", \"A\", true, \"Yes\")" }
const design = { schemaVersion: 1 as const, topicId: 'demo', goal: 'Explain why', objectives: [{ id: 'explain', description: 'Explain why' }], sections: [{ id: 'quiz', title: 'Check', components: ['Quiz'], activity: 'Submit an answer', rationale: 'Observe an explicit answer', presentation: { target: 'both' as const, strategy: 'Read for attempts; Present demonstrates' }, objectiveRefs: ['explain'] }] }
it('includes only relevant versioned design decisions and reports stale or budget-omitted plans', () => {
  const current = resolveTopicContext({ files, roots: ['sections/quiz.oui#q'], plan: design })
  expect(current.designContext?.sections[0].activity).toBe('Submit an answer')
  expect(current.designContext?.sections[0].presentation?.target).toBe('both')
  expect(current.designContext?.sourceHash).toBe(current.hash)
  expect(resolveTopicContext({ files, roots: ['sections/quiz.oui'], plan: design, expectedPlanRevision: 'old' }).diagnostics.some((d) => d.code === 'STALE_PLAN')).toBe(true)
  const bounded = resolveTopicContext({ files, roots: ['sections/quiz.oui'], maxChars: 2048, plan: { ...design, goal: 'x'.repeat(4000) } })
  expect(bounded.designContext).toBeNull()
  expect(bounded.truncated).toBe(true)
  expect(bounded.diagnostics.some((d) => d.code === 'DESIGN_CONTEXT_OMITTED')).toBe(true)
  expect(JSON.stringify(bounded).length).toBeLessThanOrEqual(2048)
})
it('resolves transitive dependencies including topic section references', () => {
  const result = resolveTopicContext({ files, roots: ['topic.oui#root'] })
  expect(result.sources.map((s) => s.statement)).toEqual(expect.arrayContaining(['root', 'q', 'label', 'c']))
  expect(result.truncated).toBe(false)
})
it('bounds cycles, missing references, output and stale sources', () => {
  const cyclic = { 'sections/quiz.oui': "root = Page(\"T\", Quiz(\"T\", [a]))\na = b\nb = a\nc = missing" }
  expect(resolveTopicContext({ files: cyclic, roots: ['sections/quiz.oui#a'] }).sources).toHaveLength(2)
  expect(resolveTopicContext({ files: cyclic, roots: ['sections/quiz.oui#c'] }).diagnostics[0].code).toBe('MISSING_REFERENCE')
  expect(resolveTopicContext({ files, roots: ['topic.oui#root'], maxNodes: 1 }).truncated).toBe(true)
  const result = resolveTopicContext({ files, expectedHash: 'old' })
  expect(result.sources).toEqual([])
  expect(result.diagnostics[0].code).toBe('STALE_CONTEXT')
  expect(resolveTopicContext({ files: { ...files, 'sections/quiz.oui': files['sections/quiz.oui'] + '\nextra = "Unsaved"' } }).hash).not.toBe(result.hash)
  const large = { 'sections/quiz.oui': `root = Page("T", TextContent("${'x'.repeat(5000)}"))` }
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

it('returns actionable frontier addresses when a node budget omits dependencies', () => {
  const partial = resolveTopicContext({ files, roots: ['sections/quiz.oui#q'], maxNodes: 1 })
  expect(partial.truncated).toBe(true)
  expect(partial.omittedReferences).toContain('sections/quiz.oui#label')
  expect(partial.omittedReferenceCount).toBe(partial.omittedReferences.length)
  expect(partial.omissionScope).toBe('dependency-frontier')
  const expanded = resolveTopicContext({ files, roots: ['sections/quiz.oui#label'], expectedHash: partial.hash })
  expect(expanded.sources[0].text).toBe('label = "Why?"')
  expect(expanded.omittedReferences).toEqual([])
})

it('accounts for whole statements removed by the character budget', () => {
  const result = resolveTopicContext({
    files: { 'sections/prose.oui': `root = Page("Argument", TextContent("${'x'.repeat(5000)}"))` },
    roots: ['sections/prose.oui'], maxChars: 2048,
  })
  expect(result.omittedReferences).toContain('sections/prose.oui#root')
  expect(result.omittedReferenceCount).toBeGreaterThan(0)
  expect(JSON.stringify(result).length).toBeLessThanOrEqual(2048)
})

it('bounds omission metadata and discloses when expansion addresses cannot all fit', () => {
  const names = Array.from({ length: 100 }, (_, i) => `missing_${i}_${'x'.repeat(80)}`)
  const result = resolveTopicContext({ files: { 'sections/many.oui': `root = Page("T", Stack([${names.map((name) => `TextContent(${name})`).join(', ')}]))` }, roots: ['sections/many.oui'], maxNodes: 1, maxChars: 2048 })
  expect(result.truncated).toBe(true)
  expect(result.omittedReferenceCount).toBeGreaterThan(100)
  expect(result.omittedReferencesTruncated).toBe(true)
  expect(JSON.stringify(result).length).toBeLessThanOrEqual(2048)
})


it('returns distinct component library metadata for mixed source files', () => {
  const result = resolveTopicContext({ files: {
    'sections/native.oui': "root = Page(\"T\", Stack([TextContent(\"Native prose\")]))",
    'sections/standard.oui': "root = Page(\"Standard\", Text(\"text\", \"Standard value\"))",
  }, roots: ['sections/native.oui', 'sections/standard.oui'] })
  expect(result.componentReferences).toEqual(expect.arrayContaining([{ name: 'TextContent' }, { name: 'Text' }]))
  expect(result.components).toEqual(expect.arrayContaining(['Page', 'TextContent', 'Text']))
})
