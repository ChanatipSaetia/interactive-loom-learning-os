import { describe, expect, it } from 'vitest'
import { compileOUISection, parseOUIElements } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { migrateSectionSource, pageBodySource } from '../../../../../../src/core/learning-engine/composition/oui/page-source'
import { validateOUISection, sectionBeatsOf } from '../../../../../../src/core/learning-engine/validation/oui-gateway'
import { printOUISection } from '../../../../../../src/core/learning-engine/composition/oui/print'

describe('unified authored pages', () => {
  it('uses upstream content without a library directive', () => {
    const source = 'root = Page("Comparison", Table([Col("Approach", ["A", "B"])]))'
    const checked = validateOUISection(source)
    expect(checked.status).toBe('valid')
    expect(checked.payload?.meta.title).toBe('Comparison')
    expect(checked.payload?.data.type).toBe('openui')
    expect(parseOUIElements(source)?.typeName).toBe('Page')
  })
  it('preserves quiz feedback data and automatic scenes', () => {
    const source = 'root = Page("Practice", Quiz("Practice", [q]))\nq = QuizQuestion("q", "Which?", [QuizChoice("a", "A", true, "Because A."), QuizChoice("b", "B", false, "Try A.")], "Because A.")'
    const checked = validateOUISection(source)
    expect(checked.status).toBe('valid')
    expect(checked.payload?.data.type).toBe('quiz')
    expect(sectionBeatsOf(source)?.map((b) => b.id)).toEqual(['title', 'q1', 'q1.wrong', 'q1.right'])
  })
  it('requires the new envelope instead of a parallel old-format reader', () => {
    const old = 'root = Text("Explanation", ["Hello"])'
    expect(compileOUISection(old).value).toBeNull()
    const converted = migrateSectionSource(old)
    expect(converted).toContain('Page("Explanation", Stack(')
    expect(validateOUISection(converted).status).toBe('valid')
    expect(migrateSectionSource(converted)).toBe(converted)
  })
  it('converts stock OpenUI without renaming its Text building block', () => {
    const converted = migrateSectionSource('// @openui "Facts"\nroot = Card([TextContent("Hello")])\n')
    expect(converted).toBe('root = Page("Facts", Card([TextContent("Hello")]))\n')
    expect(validateOUISection(converted).status).toBe('valid')
  })
  it('prints native pages and exposes named bodies without discarding declarations', () => {
    const source = 'root = Page("Facts", body)\nbody = Stack([text])\ntext = TextContent("Hello")'
    expect(pageBodySource(source)).toContain('root = body')
    const payload = compileOUISection(migrateSectionSource('root = Text("Facts", ["Hello"])')).value!
    expect(printOUISection(payload.meta, payload.data)).toContain('root = Page(')
  })
  it('keeps Query and Mutation outside this release', () => {
    const result = validateOUISection('root = Page("Data", TextContent(data))\ndata = Query("load", {}, "")')
    expect(result.status).toBe('error')
    expect(result.diagnostics.some((d) => d.message.includes('Query()/Mutation()'))).toBe(true)
  })
  it('keeps automatic activity scenes when a layout supplies supporting text', () => {
    const source = 'root = Page("Practice", Stack([instructions, assessment]))\ninstructions = TextContent("Choose an answer.")\nassessment = Quiz("Practice", [q])\nq = QuizQuestion("q", "Which?", [QuizChoice("a", "A", true, "Because A."), QuizChoice("b", "B", false, "Try A.")])'
    expect(validateOUISection(source).status).toBe('valid')
    expect(sectionBeatsOf(source)?.map((beat) => beat.id)).toEqual(['title', 'part1', 'assessment.q1', 'assessment.q1.wrong', 'assessment.q1.right'])
  })
  it('warns about competing visuals without rejecting the page', () => {
    const result = validateOUISection('root = Page("Compare", Stack([Table([Col("A", ["B"])]), Svg(\'<svg viewBox="0 0 10 10"><circle r="3" /></svg>\')]))')
    expect(result.status).toBe('warning')
    expect(result.payload).not.toBeNull()
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ tier: 3, field: 'root.body', message: expect.stringContaining('Page focus review') }))
  })
  it('does not rewrite component-like words inside content during conversion', () => {
    const converted = migrateSectionSource('root = Text("Syntax", ["Text( is a name, not a call here."])')
    expect(converted).toContain('"Text( is a name, not a call here."')
    expect(converted).toContain('TextContent(')
  })
})
