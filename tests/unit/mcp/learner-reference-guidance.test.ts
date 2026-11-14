import { expect, it } from 'vitest'
import { readReference, referencePaths } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { LEARNER_REFERENCE_GUIDE } from '../../../src/core/learning-engine/composition/oui/learner-reference-guide'
import { getWriterSkillReferences } from '../../../src/core/learning-engine/composition/oui/skill-references'
import { getAuthoringGuide } from '../../../src/core/learning-engine/composition/oui/authoring-guide'
import { validateOUISection } from '../../../src/core/learning-engine/validation/oui-gateway'

it('encourages learner-visible references through planning, focused contracts and installed skills', () => {
  expect(referencePaths()).toContain('contracts/learner-references.md')
  expect(readReference('contracts/learner-references.md')).toHaveProperty('content', expect.stringContaining(LEARNER_REFERENCE_GUIDE))
  expect(readReference('capabilities/selection.md')).toHaveProperty('content', expect.stringContaining('learner-visible source or further-reading links'))
  expect(getAuthoringGuide([], ['TextContent'])).toContain('learner-visible reference links')
  expect(getWriterSkillReferences()['references/core/learner-references.md']).toContain(LEARNER_REFERENCE_GUIDE)
  expect(readReference('contracts/images.md')).toHaveProperty('next', expect.arrayContaining([expect.objectContaining({ path: 'contracts/learner-references.md' })]))
})

it('uses the existing content contract rather than inventing link fields or components', () => {
  // Syntax example only; this test does not verify availability of the external destination.
  const page = 'root = Page("Svelte state", TextContent("Further reading: [Svelte documentation](https://svelte.dev/docs/svelte/overview) explains the framework and its concepts in more detail."))'
  expect(validateOUISection(page).diagnostics).toEqual([])
  expect(LEARNER_REFERENCE_GUIDE).toContain('not automatically rendered links')
  expect(LEARNER_REFERENCE_GUIDE).toContain('outside the SVG markup')
  expect(LEARNER_REFERENCE_GUIDE).toContain('Do not open links automatically')
})

it('supports preview descriptions through the existing Markdown title contract', () => {
  const markdown = '[MDN HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview "Requests, responses and headers.")'
  const source = `root = Page("HTTP", TextContent(${JSON.stringify(markdown)}))`
  expect(validateOUISection(source).diagnostics).toEqual([])
  expect(LEARNER_REFERENCE_GUIDE).toContain('does not fetch external page metadata')
})
