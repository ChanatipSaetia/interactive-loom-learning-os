import { describe, it, expect } from 'vitest'
import {
  paragraphsToStandardProgram,
  parseStandardProgram,
  printStandardProgram,
  standardParamOrder,
} from '../../../../../../src/core/learning-engine/composition/oui/standard'

describe('standard OpenUI programs ↔ call trees', () => {
  it('knows positional parameter order from the standard library', () => {
    expect(standardParamOrder('Callout')).toEqual(['variant', 'title', 'description', 'visible'])
    expect(standardParamOrder('Stack')[0]).toBe('children')
  })

  it('converts text paragraphs to a stack of TextContent blocks', () => {
    const program = paragraphsToStandardProgram(['First **bold**.', 'Second "quoted".'])
    expect(program).toBe('root = Stack([TextContent("First **bold**."), TextContent("Second \\"quoted\\".")])')
    const tree = parseStandardProgram(program)
    expect(tree.editable).toBe(true)
    expect((tree.root!.props.children as Array<{ props: { text: string } }>).map((c) => c.props.text)).toEqual(['First **bold**.', 'Second "quoted".'])
  })

  it('round-trips nested programs and keeps statement names', () => {
    const program = [
      'root = Card([header, tabs])',
      'header = CardHeader("Plans", "Pick one")',
      'tabs = Tabs([TabItem("a", "A", [TextContent("x"), Callout("info", "T", "D")])])',
    ].join('\n')
    const tree = parseStandardProgram(program)
    expect(tree.editable).toBe(true)
    const printed = printStandardProgram(tree.root!)
    expect(printed).toContain('header = CardHeader("Plans", "Pick one")')
    expect(parseStandardProgram(printed).root).toEqual(tree.root)
  })

  it('marks programs that cannot round-trip as source-only', () => {
    expect(parseStandardProgram('$n = 1\nroot = TextContent("" + $n)')).toMatchObject({ editable: false, reason: expect.stringContaining('$state') })
    expect(parseStandardProgram('// note\nroot = TextContent("x")')).toMatchObject({ editable: false, reason: expect.stringContaining('comments') })
    expect(parseStandardProgram('root = Buttons([Button("Go", Action([@OpenUrl("https://x.y")]))])').editable).toBe(false)
    expect(parseStandardProgram('root = Nope()')).toMatchObject({ editable: false, root: null })
    expect(parseStandardProgram('root = TextContent("x")\nextra = TextContent("y")')).toMatchObject({ editable: false })
  })

  it('does not mistake // inside strings for comments', () => {
    expect(parseStandardProgram('root = TextContent("see https://example.com")').editable).toBe(true)
  })
})
