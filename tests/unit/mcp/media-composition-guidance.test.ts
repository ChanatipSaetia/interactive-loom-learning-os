import { expect, it } from 'vitest'
import { readReference, referencePaths } from '../../../src/core/learning-engine/composition/oui/reference-navigation'
import { AUTHORING_WORKFLOW_STAGES } from '../../../src/core/learning-engine/composition/oui/authoring-workflow'
import { MEDIA_COMPOSITION_GUIDE } from '../../../src/core/learning-engine/composition/oui/media-composition-guide'
import { getWriterSkillReferences } from '../../../src/core/learning-engine/composition/oui/skill-references'
import { validateOUISection } from '../../../src/core/learning-engine/validation/oui-gateway'

it('surfaces media composition during selection without changing progressive stages', () => {
  expect(AUTHORING_WORKFLOW_STAGES.map((stage) => stage.id)).toEqual(['understand', 'discover', 'plan', 'validate-plan', 'references', 'generate', 'verify', 'deliver'])
  const selection = readReference('capabilities/selection.md')
  expect(selection).toHaveProperty('content', expect.stringContaining('proactively compose informative images'))
  expect(selection).toHaveProperty('next', expect.arrayContaining([expect.objectContaining({ path: 'contracts/media-composition.md' })]))
  expect(referencePaths()).toContain('contracts/media-composition.md')
  expect(readReference('contracts/media-composition.md')).toHaveProperty('content', expect.stringContaining(MEDIA_COMPOSITION_GUIDE))
  expect(readReference('components/Card.md')).toHaveProperty('content', expect.stringContaining('complementary cards, images, text, charts and reference links'))
  expect(readReference('index.md')).toHaveProperty('content', expect.not.stringContaining(MEDIA_COMPOSITION_GUIDE))
})

it('keeps a worked current-framework example consistent across installed skills and MCP', () => {
  const references = getWriterSkillReferences()
  expect(references['references/planning/media-composition.md']).toContain(MEDIA_COMPOSITION_GUIDE)
  expect(references['references/planning/mental-models.md']).toContain(MEDIA_COMPOSITION_GUIDE)
  expect(references['references/planning/visuals.md']).toContain('images alongside cards, text and comparisons')
  expect(MEDIA_COMPOSITION_GUIDE).toContain('focus on 2026 and compare popularity')
  expect(MEDIA_COMPOSITION_GUIDE).toContain('frameworks, component libraries and design styles')
  expect(MEDIA_COMPOSITION_GUIDE).toContain('observation date, sample/window and units')
  expect(MEDIA_COMPOSITION_GUIDE).toContain('do not invent per-topic theme/CSS/blur props')
  expect(MEDIA_COMPOSITION_GUIDE).toContain('not a real product screenshot or adoption evidence')
  expect(readReference('capabilities/index.md')).toHaveProperty('content', expect.stringContaining('capabilities/ImageBlock.md'))
})

it('composes a visual example and a rich reference inside a standard card', () => {
  // Contract example only; it makes no image availability or popularity claim.
  const text = JSON.stringify('[Official documentation](https://example.test/docs "Read the component API and its examples.")')
  const source = `root = Page("Framework example", Card([heading, body]))
heading = CardHeader("What to notice", "Visual example and documentation")
body = Stack([image, explanation, reference])
image = ImageBlock("https://example.test/example.png", "A labelled interface example")
explanation = TextContent("Compare the hierarchy and contrast in the example.")
reference = TextContent(${text})`
  expect(validateOUISection(source).diagnostics).toEqual([])
})
