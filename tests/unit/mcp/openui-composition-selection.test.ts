import { expect, it } from 'vitest'
import { getAuthoringContract } from '../../../src/core/learning-engine/composition/oui/authoring-contract'
import { getAuthoringGuide } from '../../../src/core/learning-engine/composition/oui/authoring-guide'
import { getCapabilityIndex } from '../../../src/core/learning-engine/composition/oui/capability-catalog'
import { reviewTopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'
import { checkSection } from '../../../src/mcp/check'
import { TEXT_HEAVY_REPRO_PLAN } from '../../fixtures/ai-experience/text-selection'
import { THREE_SPLINE_FILES } from '../../fixtures/ai-experience/three-spline'

it('makes OpenUI tasks visible before selecting a section', () => {
  for (const index of [getCapabilityIndex(), getAuthoringContract({ detail: 'index' })]) {
    expect(index.compositionChoices).toContain('factual attributes')
    expect(index.compositionChoices).toContain('examples')
    expect(index.compositionChoices).toContain('spatial')
    expect(index.compositionChoices).toContain('verified')
  }
})

it('retrieves selected card content without expanding every permitted layout child', () => {
  const components = ['Stack', 'Card', 'CardHeader', 'TextContent']
  const focused = getAuthoringContract({ detail: 'focused', library: 'openui', components })
  const legacy = getAuthoringGuide([], components, undefined, 'all')
  for (const name of components) expect(focused.contracts).toMatch(new RegExp(`^${name}\\(`, 'm'))
  expect(focused.contracts).not.toMatch(/^(Form|BarChart|DatePicker|Table)\(/m)
  expect(legacy).toMatch(/^Form\(/m)
  expect(focused.contracts.split('\n').find((line) => line.startsWith('Card('))).toBe(legacy.split('\n').find((line) => line.startsWith('Card(')))
  expect(focused.measurement.estimatedTokens).toBeLessThan(2000)
  expect(checkSection(THREE_SPLINE_FILES['sections/examples.oui'], 'sections/examples.oui').valid).toBe(true)
})

it('keeps specific required model contracts and native closure intact', () => {
  for (const [root, child] of [['Table', 'Col'], ['BarChart', 'Series'], ['Steps', 'StepsItem'], ['Tabs', 'TabItem']]) {
    expect(getAuthoringContract({ detail: 'focused', library: 'openui', components: [root] }).contracts).toMatch(new RegExp(`^${child}\\(`, 'm'))
  }
  expect(getAuthoringContract({ detail: 'focused', library: 'loom', components: ['Quiz'] }).contracts).toMatch(/^QuizChoice\(/m)
})

it('includes compact OpenUI section rules and beat guidance in focused retrieval', () => {
  const focused = getAuthoringContract({ detail: 'focused', library: 'openui', components: ['Card'] })
  expect(focused.contracts).toContain('Generic children are alternatives')
  expect(focused.contracts).toContain('root = Page(')
  expect(focused.contracts).toContain('Query/Mutation host tools are deferred')
  expect(focused.beats).toHaveProperty('openui')
})

it('reviews flattening a comparison or system interaction into a list, without counting Bullets', () => {
  const plan = { ...TEXT_HEAVY_REPRO_PLAN, sections: TEXT_HEAVY_REPRO_PLAN.sections.map((section) => ({ ...section, components: ['Bullets'], rationale: 'Bullets are simple and clear.' })) }
  expect(reviewTopicPlan(plan).filter((d) => d.code === 'LIST_STRUCTURE_REVIEW')).toHaveLength(2)
})

it.each(['Follow numbered initialization instructions', 'Check prerequisites with a checklist', 'Read a concise summary of the key points', 'Follow a linear procedure', 'Follow step by step setup instructions', 'Review supporting details', 'Read key points'])('preserves appropriate Bullets: %s', (activity) => {
  const plan = { ...TEXT_HEAVY_REPRO_PLAN, sections: TEXT_HEAVY_REPRO_PLAN.sections.map((section) => ({ ...section, components: ['Bullets'], activity, rationale: 'The list structure matches this concrete learner action.' })) }
  expect(reviewTopicPlan(plan).filter((d) => d.code === 'LIST_STRUCTURE_REVIEW')).toEqual([])
})

it('accepts an explicit OpenUI factual comparison composition', () => {
  const plan = { ...TEXT_HEAVY_REPRO_PLAN, objectives: TEXT_HEAVY_REPRO_PLAN.objectives.slice(0, 1), sections: [{ ...TEXT_HEAVY_REPRO_PLAN.sections[0], components: ['Table'], rationale: 'A factual table aligns both tools across the same attributes.', presentation: { target: 'both', strategy: 'composition: Table; compare matching attribute rows in Read and Present' } }] }
  expect(reviewTopicPlan(plan)).toEqual([])
})
