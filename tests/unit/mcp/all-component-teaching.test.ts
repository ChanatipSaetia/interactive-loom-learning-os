import { expect, it } from 'vitest'
import { COMPONENT_PURPOSES } from '../../../src/core/learning-engine/composition/oui/component-purpose'
import { componentTeachingGuide, componentTeachingProfile, hasComponentTeachingProfile } from '../../../src/core/learning-engine/composition/oui/component-teaching'
import { getUnifiedOUISpec } from '../../../src/core/learning-engine/composition/oui/library'
import { getWriterSkillReferences } from '../../../src/core/learning-engine/composition/oui/skill-references'
import { readReference } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { getCapabilityCatalog } from '../../../src/core/learning-engine/composition/oui/capability-catalog'

it('gives every discoverable teaching component an explicit purpose, exploration, evidence and limits', () => {
  for (const group of COMPONENT_PURPOSES) for (const name of group.components) {
    expect(hasComponentTeachingProfile(name), name).toBe(true)
    const profile = componentTeachingProfile(name)
    for (const field of ['introduces', 'exploration', 'evidence', 'limits'] as const) expect(profile[field].length, `${name}.${field}`).toBeGreaterThan(30)
    expect(readReference(`capabilities/${name}.md`)).toHaveProperty('content', expect.stringContaining(componentTeachingGuide(name)))
    expect(readReference(`components/${name}.md`)).toHaveProperty('content', expect.stringContaining(componentTeachingGuide(name)))
  }
  for (const component of getCapabilityCatalog().components) expect(component.teaching).toEqual(componentTeachingProfile(component.component))
})

it('keeps exact installed component contracts progressive and resolvable for the entire catalog', () => {
  const files = getWriterSkillReferences()
  for (const name of Object.keys(getUnifiedOUISpec().components)) {
    const focused = files[`references/components/${name}.md`]
    expect(focused, name).toContain(componentTeachingGuide(name))
    const signatures = focused.split('\n').filter((line) => /^[A-Z]\w*\(/.test(line))
    expect(new Set(signatures).size, name).toBe(signatures.length)
  }
  expect(files['references/components/Table.md']).toContain('Col(')
  expect(files['references/components/Table.md']).not.toContain('QuizQuestion(')
  expect(files['references/components/ConceptMap.md']).not.toContain(componentTeachingGuide('Scenario'))
  expect(files['references/planning/component-purposes.md']).not.toContain('QuizQuestion(')
  expect(files['references/planning/component-purposes.md']).toContain('../components/ConceptMap.md')
})

it('states real boundaries for activities, supporting components and document roles', () => {
  expect(componentTeachingProfile('ConceptMap').limits).toContain('not automatically a matching exercise')
  expect(componentTeachingProfile('Scenario').limits).toContain('not a simulation')
  expect(componentTeachingProfile('CodeBlock').limits).toContain('not a runtime')
  expect(componentTeachingProfile('ReflectionTemplate').evidence).toContain('narrower than independently')
  expect(componentTeachingProfile('Narration').evidence).toContain('not count as learner attempts')
  expect(componentTeachingProfile('Topic').limits).toContain('not standalone teaching activities')
  expect(componentTeachingProfile('Col').evidence).toContain('does not independently')
  expect(componentTeachingProfile('Tabs').limits).toContain('Do not assume Present traverses every tab')
})
