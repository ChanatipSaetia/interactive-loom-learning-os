import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { migrateSectionSource, migrateProseNarration } from '../../../../src/core/learning-engine/composition/oui/page-source'
import { compileOUISection } from '../../../../src/core/learning-engine/composition/oui/compile'
import { sectionBeatsOf, validateOUINarration } from '../../../../src/core/learning-engine/validation/oui-gateway'
import PresentOpenUI from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/openui/PresentOpenUI'

it('migrates prose metadata and preserves paragraph narration, including long passages', () => {
  const legacy = `root = Page("P", LessonText("P", paragraphs, "Heading", Lead("What", "Why", "Next")))\nparagraphs = ["Short.", "${'A sentence with enough context to read. '.repeat(16)}"]`
  const source = migrateSectionSource(legacy)
  expect(source).not.toContain('LessonText(')
  expect(source).toContain('TextContent(')
  expect(migrateSectionSource(source)).toBe(source)
  const compiled = compileOUISection(source)
  expect(compiled.issues).toEqual([])
  expect(compiled.value?.meta).toMatchObject({ heading: 'Heading', intro: { what: 'What', why: 'Why', next: 'Next' } })
  const beats = sectionBeatsOf(source)!
  expect(beats.map((beat) => beat.id)).toEqual(expect.arrayContaining(['title', 'p1', 'p2', 'p2.part2']))
  const narration = migrateProseNarration('root = Narration([NarrationStep("p2", "Explain this.", [Highlight("root.body.paragraphs[1]")])])')
  expect(narration).toContain('root.body.children[1].text')
  expect(validateOUINarration(narration, source).diagnostics).toEqual([])
})

it('renders standard prose with stable authored effect anchors in Present', () => {
  const source = 'root = Page("P", Stack([TextContent("First."), TextContent("Second.")]))'
  const compiled = compileOUISection(source).value!
  if (compiled.data.type !== 'openui') throw new Error('Expected a composed page')
  const { container } = render(<PresentOpenUI data={compiled.data} beats={sectionBeatsOf(source)!.slice(1)} beat={1} sectionIndex={0} active />)
  expect(container.querySelector('[data-oui-anchor="root.body.children[0].text"]')).not.toBeNull()
  expect(container.querySelector('[data-oui-anchor="root.body.children[1].text"]')).not.toBeNull()
})

it('does not transform prose-looking strings and reports unsupported metadata explicitly', () => {
  const source = 'root = Page("P", TextContent("LessonText( is an old example."))'
  expect(migrateSectionSource(source)).toBe(source)
  expect(() => migrateSectionSource('root = Page("P", Card([LessonText("T", ["p"], "Inner heading")]))')).toThrow(/metadata/)
})

it('preserves a named prose body through rendering, narration and saving', async () => {
  const source = 'root = Page("P", explanation)\nexplanation = Stack([TextContent("First."), TextContent("Second.")])'
  const compiled = compileOUISection(source).value!
  if (compiled.data.type !== 'openui') throw new Error('Expected a composed page')
  const { container } = render(<PresentOpenUI data={compiled.data} beats={sectionBeatsOf(source)!.slice(1)} beat={1} sectionIndex={0} active />)
  expect(container.querySelector('[data-oui-anchor="explanation.children[1].text"]')).not.toBeNull()
  const narration = 'root = Narration([NarrationStep("p2", "The second point.", [Highlight("explanation.children[1].text")])])'
  expect(validateOUINarration(narration, source).diagnostics).toEqual([])
  const { printOUISection } = await import('../../../../src/core/learning-engine/composition/oui/print')
  const saved = printOUISection(compiled.meta, compiled.data)
  expect(saved).toContain('Page("P", explanation)')
  expect(validateOUINarration(narration, saved).diagnostics).toEqual([])
})
