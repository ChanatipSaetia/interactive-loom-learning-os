import { expect, it } from 'vitest'
import { readReference } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { getWriterSkillReferences } from '../../../src/core/learning-engine/composition/oui/skill-references'
import { FLASHCARD_TEACHING_GUIDE, PROCEDURE_TEACHING_GUIDE, TAXONOMY_TEACHING_GUIDE } from '../../../src/core/learning-engine/composition/oui/mental-model-guide'

it.each([
  ['Steps', PROCEDURE_TEACHING_GUIDE],
  ['Bullets', PROCEDURE_TEACHING_GUIDE],
  ['Flowchart', PROCEDURE_TEACHING_GUIDE],
  ['ReflectionSequence', PROCEDURE_TEACHING_GUIDE],
  ['TaxonomyBrowser', TAXONOMY_TEACHING_GUIDE],
  ['Flashcards', FLASHCARD_TEACHING_GUIDE],
])('serves relevant teaching guidance in the focused %s contract without loading sibling guidance', (name, guide) => {
  const result = readReference(`components/${name}.md`)
  expect(result).toHaveProperty('content', expect.stringContaining(guide))
  const siblings = [PROCEDURE_TEACHING_GUIDE, TAXONOMY_TEACHING_GUIDE, FLASHCARD_TEACHING_GUIDE].filter((candidate) => candidate !== guide)
  for (const sibling of siblings) expect(result).toHaveProperty('content', expect.not.stringContaining(sibling))
})

it('keeps planning and installed skill guidance aligned with the same teaching purposes', () => {
  const refs = getWriterSkillReferences()
  for (const [path, guide] of [
    ['sections/flowchart', PROCEDURE_TEACHING_GUIDE],
    ['sections/bullets', PROCEDURE_TEACHING_GUIDE],
    ['openui/layouts', PROCEDURE_TEACHING_GUIDE],
    ['sections/taxonomy-browser', TAXONOMY_TEACHING_GUIDE],
    ['sections/flashcards', FLASHCARD_TEACHING_GUIDE],
  ]) {
    expect(refs[`references/${path}.md`]).toContain(guide)
    expect(refs['references/planning/mental-models.md']).toContain(guide)
  }
  const selection = readReference('capabilities/selection.md')
  expect(selection).toHaveProperty('content', expect.stringContaining('overlapping categories'))
  expect(selection).toHaveProperty('content', expect.stringContaining('executing instructions'))
  expect(selection).toHaveProperty('content', expect.stringContaining('one focused idea'))
})
