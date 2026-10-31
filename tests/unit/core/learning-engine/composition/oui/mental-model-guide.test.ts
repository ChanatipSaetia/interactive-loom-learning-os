import { describe, expect, it } from 'vitest'
import { MENTAL_MODEL_GUIDE, SECTION_MENTAL_MODELS } from '../../../../../../src/core/learning-engine/composition/oui/mental-model-guide'
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
    for (const { type } of SECTION_MENTAL_MODELS) expect(getLoomSkill()).toContain(`references/sections/${type}.md`)
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
    expect(MENTAL_MODEL_GUIDE).toContain('### Choosing an OpenUI visual')
  })
})
