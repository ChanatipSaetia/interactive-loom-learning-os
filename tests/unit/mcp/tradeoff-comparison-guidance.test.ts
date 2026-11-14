import { expect, it } from 'vitest'
import doc from '../../../docs/sections/tradeoff-sandbox.md?raw'
import { COMPONENT_PURPOSES } from '../../../src/core/learning-engine/composition/oui/component-purpose'
import { getAuthoringGuide } from '../../../src/core/learning-engine/composition/oui/authoring-guide'
import { TRADEOFF_COMPARISON_GUIDE } from '../../../src/core/learning-engine/composition/oui/mental-model-guide'
import { readReference } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { getWriterSkillReferences } from '../../../src/core/learning-engine/composition/oui/skill-references'
import { validateOUISection, sectionBeatsOf } from '../../../src/core/learning-engine/validation/oui-gateway'

it('discovers explained comparisons beside tables and keeps focused guidance consistent', () => {
  const comparison = COMPONENT_PURPOSES.find((group) => group.name === 'Compare and evaluate')!
  expect(comparison.components).toEqual(expect.arrayContaining(['Table', 'TradeoffSandbox']))
  expect(readReference('capabilities/TradeoffSandbox.md')).toHaveProperty('content', expect.stringContaining('capabilities/Table.md'))
  expect(readReference('capabilities/Table.md')).toHaveProperty('content', expect.stringContaining('capabilities/TradeoffSandbox.md'))
  expect(getAuthoringGuide([], ['TradeoffSandbox'])).toContain(TRADEOFF_COMPARISON_GUIDE)
  expect(readReference('components/TradeoffSandbox.md')).toHaveProperty('content', expect.stringContaining(TRADEOFF_COMPARISON_GUIDE))
  expect(getWriterSkillReferences()['references/sections/tradeoff-sandbox.md']).toContain(TRADEOFF_COMPARISON_GUIDE)
})

it('validates the documented qualitative comparison without scores or a recommendation', () => {
  const source = /```oui\n([\s\S]*?)```/.exec(doc)![1]
  const result = validateOUISection(source)
  expect(result.diagnostics).toEqual([])
  expect(result.payload?.data).toMatchObject({ scenarios: [{ metrics: [], steps: [{ choices: [{ metrics: {} }, { metrics: {} }] }] }] })
  expect(sectionBeatsOf(source)?.map((beat) => beat.id)).toEqual(['title', 'situation1', 'step1', 'step1.choice1', 'step1.choice2'])
})
