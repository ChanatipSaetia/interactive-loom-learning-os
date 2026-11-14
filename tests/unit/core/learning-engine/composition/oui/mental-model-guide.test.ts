import { COMPONENT_PURPOSES } from '../../../../../../src/core/learning-engine/composition/oui/component-purpose'
import { describe, expect, it } from 'vitest'
import { MENTAL_MODEL_GUIDE, REPRESENTATION_SELECTION_OVERVIEW, SECTION_MENTAL_MODELS } from '../../../../../../src/core/learning-engine/composition/oui/mental-model-guide'
import { getWriterSkillReferences } from '../../../../../../src/core/learning-engine/composition/oui/skill-references'
import { getLoomSkill } from '../../../../../../src/core/learning-engine/composition/oui/skill'
import { getTutorAppSkill, getTutorViewerSkill } from '../../../../../../src/core/learning-engine/composition/oui/tutor-skills'
import { getLoomAuthoringPrompt } from '../../../../../../src/core/learning-engine/composition/oui/authoring-prompt'
import { getAuthoringGuide } from '../../../../../../src/core/learning-engine/composition/oui/authoring-guide'
import { KNOWN_SECTION_TYPES } from '../../../../../../src/core/learning-engine/validation/gateway'

describe('mental model table of contents', () => {
  it('covers each supported section type exactly once', () => {
    const types = SECTION_MENTAL_MODELS.map((entry) => entry.type)
    expect(new Set(types)).toEqual(KNOWN_SECTION_TYPES)
    expect(types.length).toBe(KNOWN_SECTION_TYPES.size)
  })

  it('guides writers and both tutors from the same catalogue', () => {
    for (const skill of [getWriterSkillReferences()['references/planning/mental-models.md'], getTutorAppSkill(), getTutorViewerSkill()]) expect(skill).toContain(MENTAL_MODEL_GUIDE)
    for (const group of COMPONENT_PURPOSES) for (const name of group.components) expect(getLoomSkill()).toContain(`references/components/${name}.md`)
  })

  it('keeps the catalogue available before signatures in full and scoped authoring guides', () => {
    for (const guide of [getLoomAuthoringPrompt(), getAuthoringGuide(['quiz'])]) {
      expect(guide).toContain(MENTAL_MODEL_GUIDE)
      expect(guide.indexOf(MENTAL_MODEL_GUIDE)).toBeLessThan(guide.indexOf('## Component Signatures'))
    }
  })

  it('includes defining meaning and comparing options in the appropriate section roles', () => {
    expect(SECTION_MENTAL_MODELS.find((entry) => entry.type === 'flashcards')!.model).toMatch(/definitions.*meaning/i)
    expect(SECTION_MENTAL_MODELS.find((entry) => entry.type === 'tradeoff-sandbox')!.model).toMatch(/options.*comparing alternatives/i)
    expect(MENTAL_MODEL_GUIDE).toContain('### Choosing views within a Flowchart')
    expect(MENTAL_MODEL_GUIDE).toContain('### Choosing a visual composition')
  })
})

it('selects by learning value and capabilities without ranking representations', async () => {
  const { REPRESENTATION_SELECTION_GUIDE } = await import('../../../../../../src/core/learning-engine/composition/oui/mental-model-guide')
  const { getCapabilityCatalog } = await import('../../../../../../src/core/learning-engine/composition/oui/capability-catalog')
  for (const guide of [getTutorAppSkill(), getTutorViewerSkill(), getAuthoringGuide(), getAuthoringGuide(['text'])]) {
    expect(guide).toContain(REPRESENTATION_SELECTION_GUIDE)
    expect(guide).toContain('no section ranking, visual quota or mandatory sequence')
    expect(guide).toContain('knowledge fidelity')
    expect(guide).toContain('Bullets teach numbered linear procedures')
    expect(guide).toContain('never invent benchmark results')
  }
  expect(getLoomSkill()).toContain(REPRESENTATION_SELECTION_OVERVIEW)
  const catalog = getCapabilityCatalog()
  expect(catalog.selectionGuidance).toBe(REPRESENTATION_SELECTION_GUIDE)
  expect(catalog.visualChoices.some((visual) => visual.components.includes('Table'))).toBe(true)
  for (const name of ['TextContent', 'Flowchart', 'Quiz', 'Flashcards', 'Scenario', 'TradeoffSandbox', 'FormulaSandbox', 'Table']) expect(catalog.components.some((component) => component.component === name)).toBe(true)
  expect(getAuthoringGuide(['openui'])).not.toContain('When no Loom section fits')
  expect(getAuthoringGuide(['openui'])).not.toContain('Prefer a Loom section when')
})
