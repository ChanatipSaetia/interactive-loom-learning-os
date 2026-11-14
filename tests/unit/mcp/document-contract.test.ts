import { expect, it } from 'vitest'
import { MINIMAL_TOPIC_EXAMPLE } from '../../../src/core/learning-engine/composition/oui/document-contract'
import { readReference } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { checkTopic } from '../../../src/mcp/check'

function content(path: string) {
  const result = readReference(path)
  if (!('content' in result)) throw new Error(result.error)
  return result.content
}
it('provides a compilable complete example and diagnoses the uploaded bare-call failure pattern', () => {
  expect(checkTopic(MINIMAL_TOPIC_EXAMPLE).report).toBeNull()
  const bare = MINIMAL_TOPIC_EXAMPLE.replace(/^root = /gm, '')
  expect(checkTopic(bare)).toMatchObject({ ok: false })
  expect(checkTopic(bare).report).toContain('No `root =')
  expect(content('contracts/syntax.md')).toContain(MINIMAL_TOPIC_EXAMPLE)
})
it('keeps syntax and composition decisions behind progressive references', () => {
  const entry = content('index.md')
  expect(entry).not.toContain('TradeoffSandbox(')
  expect(entry).not.toContain('FormulaSandbox(')
  expect(content('workflow/references.md')).toContain('contracts/syntax.md')
  expect(content('workflow/generate.md')).toContain('root = Topic(')
  expect(content('workflow/verify.md')).toContain('compiler checks')
  expect(content('contracts/topic.md')).not.toContain('Page rules:')
  const selection = content('capabilities/selection.md')
  for (const name of ['TradeoffSandbox', 'ConceptMap', 'TaxonomyBrowser', 'Scenario', 'DecisionTree', 'ReflectionSequence', 'FormulaSandbox']) expect(selection).toContain(name)
  expect(selection).toContain('not execution or benchmarking')
  expect(selection).toContain('existing plan rationale')
  expect(selection).toContain('only for the selected components')
})
