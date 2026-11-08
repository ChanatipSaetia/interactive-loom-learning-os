import { expect, it } from 'vitest'
import { EditToolRunner, readPlan, buildMessage } from '../../../../../../src/core/supporting/authoring-editor/assistant/edit-tools'

const plan = { schemaVersion: 1, topicId: 'demo', goal: 'Compare evidence', objectives: [{ id: 'compare', description: 'Compare the cases' }], sections: [{ id: 'cases', title: 'Evidence', objectiveRefs: ['compare'], representation: 'openui', library: 'openui', activity: 'Inspect the evidence positions', rationale: 'Spatial comparison' }] }
const runner = () => new EditToolRunner({ topicId: 'demo', files: {}, fileOrder: [], diagnostics: {} }, [])
it('discovers and validates without staging edits, then proposes the shared plan', () => {
  const r = runner()
  const catalog = r.run('get_loom_capabilities', '{}')
  expect(JSON.parse(catalog.content).sections.some((section: { type: string }) => section.type === 'openui')).toBe(true)
  expect(catalog.changeset).toEqual([])
  expect(JSON.parse(r.run('validate_topic_plan', JSON.stringify({ plan })).content).valid).toBe(true)
  expect(JSON.parse(r.run('validate_topic_plan', '{"plan":null}').content).valid).toBe(false)
  expect(r.run('propose_plan', JSON.stringify({ plan })).content).toContain('Shown to the author')
  expect(r.run('propose_plan', JSON.stringify({ plan })).changeset).toEqual([])
  expect(buildMessage(readPlan(JSON.stringify({ plan }))!, [0])).toContain(plan.sections[0].rationale)
})
it('uses library-scoped Studio descriptions and rejects invalid libraries and argument shapes', () => {
  const r = runner()
  const standard = r.run('describe_components', '{"names":["Text"],"library":"openui"}')
  expect(standard.content).toContain('Text(variant?')
  expect(standard.content).not.toContain('paragraphs: string[]')
  expect(r.run('describe_components', '{"names":["Text"]}').content).not.toContain('Ambiguous component names')
  expect(r.run('describe_components', '{"names":["Text"],"library":"unknown"}').content).toContain('Error: library')
  expect(r.run('describe_components', 'null').content).toContain('arguments must be an object')
})
