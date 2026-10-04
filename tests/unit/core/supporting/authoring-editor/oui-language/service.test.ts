import { describe, it, expect } from 'vitest'
import {
  getCompletions,
  getSignatureHelp,
  getHover,
  getDefinition,
  getDocumentSymbols,
  getDiagnostics,
  componentSnippet,
  fileKindFromPath,
  getOUILanguageSpec,
  scan,
  cursorContext,
  offsetToPosition,
  positionToOffset,
} from '../../../../../../src/core/supporting/authoring-editor/oui-language'

/** Split a source containing a `‸` cursor marker into [source, offset]. */
function at(withCursor: string): [string, number] {
  const offset = withCursor.indexOf('‸')
  return [withCursor.replace('‸', ''), offset]
}

const labels = (items: { label: string }[]) => items.map((i) => i.label)

const FLOW = `root = Flowchart("Checkout", [buyer], [orders], [place], [happy])
buyer = Actor("buyer", "Buyer", "Person")
orders = System("orders", "Orders", "Owns orders", "aggregate")
place = Step("place", "When submitted", "PlaceOrder", orders, [Event("placed", "Placed")], buyer)
happy = Journey("happy", "Happy", "Works", [JourneyStep(place, "Place", "Buyer submits")])
`

describe('language spec', () => {
  it('derives positional params, kinds and accepted components from the library', () => {
    const step = getOUILanguageSpec().components.get('Step')!
    expect(step.params.map((p) => p.name)).toEqual(['id', 'policy', 'command', 'handledBy', 'events', 'initiatedBy', 'delegatesTo', 'continuesAs', 'description', 'sendsTo', 'async'])
    const handledBy = step.params[3]
    expect(handledBy).toMatchObject({ type: 'string | System', optional: false, components: ['System'] })
    expect(handledBy.kinds).toEqual(expect.arrayContaining(['string', 'component']))
    expect(step.params[4]).toMatchObject({ type: 'Event[]', elementComponents: ['Event'] })
    expect(getOUILanguageSpec().components.get('System')!.params[3].enumValues).toEqual(['aggregate', 'service', 'database', 'external'])
  })

  it('knows the section components and builtins', () => {
    const spec = getOUILanguageSpec()
    expect(spec.sectionComponents).toContain('Quiz')
    expect(spec.sectionComponents).not.toContain('QuizChoice')
    expect(spec.builtins.get('Count')?.signature).toBe('@Count(array) → number')
    expect(spec.builtins.has('Each')).toBe(true)
  })

  it('builds snippets with required params only', () => {
    const quizChoice = getOUILanguageSpec().components.get('QuizChoice')!
    expect(componentSnippet(quizChoice)).toBe('QuizChoice("${1:id}", "${2:text}", ${3:false}, "${4:explanation}")')
    expect(componentSnippet(getOUILanguageSpec().components.get('Lead')!)).toBe('Lead($0)')
  })
})

describe('scanner', () => {
  it('tracks call frames and argument indexes', () => {
    const [source, offset] = at('root = Quiz("T", [QuizQuestion("q1", "Why?", [‸')
    const ctx = cursorContext(source, scan(source), offset)
    expect(ctx.frames.map((f) => [f.kind, f.name, f.index])).toEqual([
      ['call', 'Quiz', 1],
      ['array', undefined, 0],
      ['call', 'QuizQuestion', 2],
      ['array', undefined, 0],
    ])
  })

  it('ignores brackets and commas inside strings and comments', () => {
    const [source, offset] = at('root = Text("a, (b", [ // [x,\n "c", ‸')
    const ctx = cursorContext(source, scan(source), offset)
    expect(ctx.frames.map((f) => [f.kind, f.index])).toEqual([['call', 1], ['array', 1]])
  })

  it('converts between offsets and positions', () => {
    const source = 'a = 1\nbb = 2\n'
    expect(offsetToPosition(source, 8)).toEqual({ line: 1, character: 2 })
    expect(positionToOffset(source, { line: 1, character: 2 })).toBe(8)
  })
})

describe('completions', () => {
  it('offers only accepted components inside a typed array', () => {
    const [source, offset] = at('root = Quiz("T", [‸])')
    const items = getCompletions(source, offset)
    expect(labels(items.filter((i) => i.kind === 'component'))).toEqual(['QuizQuestion'])
    expect(items.find((i) => i.label === 'QuizQuestion')?.insertText).toBe('QuizQuestion("${1:id}", "${2:question}", [${3}])')
  })

  it('offers references of compatible component type', () => {
    const [source, offset] = at(FLOW.replace('[place]', '[place, ‸]'))
    const items = getCompletions(source, offset)
    expect(labels(items.filter((i) => i.kind === 'reference'))).toEqual(['place'])
    expect(labels(items.filter((i) => i.kind === 'component'))).toEqual(['Step', 'Branch'])
  })

  it('offers system references and declared IDs for handledBy', () => {
    const [refSource, refOffset] = at(FLOW.replace('"PlaceOrder", orders,', '"PlaceOrder", ‸'))
    expect(labels(getCompletions(refSource, refOffset).filter((i) => i.kind === 'reference'))).toEqual(['orders'])

    const [idSource, idOffset] = at(FLOW.replace('"PlaceOrder", orders,', '"PlaceOrder", "or‸",'))
    const ids = getCompletions(idSource, idOffset)
    expect(ids).toEqual([expect.objectContaining({ label: 'orders', kind: 'id', detail: 'System' })])
    expect(ids[0].replace).toEqual({ start: idOffset - 2, end: idOffset })
  })

  it('offers enum values inside strings', () => {
    const [source, offset] = at('root = Flowchart("F", [], [System("s", "S", "d", "‸")], [], [])')
    expect(labels(getCompletions(source, offset))).toEqual(['aggregate', 'service', 'database', 'external'])
  })

  it('offers node IDs for scenario `next`', () => {
    const [source, offset] = at('root = Scenario("S", "s", [start, end])\nstart = ScenarioNode("start", "Go?", [ScenarioChoice("a", "Yes", "‸")])\nend = ScenarioNode("end")')
    expect(labels(getCompletions(source, offset))).toEqual(['start', 'end'])
  })

  it('offers metric IDs as TradeoffChoice metrics keys', () => {
    const [source, offset] = at('m = TradeoffMetric("perf", "Perf", 1)\nc = TradeoffChoice("a", "A", "d", {‸})')
    expect(getCompletions(source, offset)).toEqual([expect.objectContaining({ label: 'perf', insertText: 'perf: ' })])
  })

  it('offers section names supplied by the host', () => {
    const [source, offset] = at('root = Topic("T", "C", "D", [SectionRef("‸")])')
    expect(labels(getCompletions(source, offset, 'topic', { sectionNames: ['intro', 'quiz'] }))).toEqual(['intro', 'quiz'])
  })

  it('offers root snippets in an empty file, by file kind', () => {
    const sectionItems = getCompletions('', 0, 'section')
    expect(labels(sectionItems)).toContain('root = Quiz(…)')
    expect(labels(getCompletions('', 0, 'topic'))).toEqual(['root = Topic(…)'])
    expect(getCompletions('root = Text("a", [])\n', 21)).toEqual([])
  })

  it('offers literals, state and builtins for primitive params', () => {
    const [source, offset] = at('$n = 1\nroot = Bullets("B", [], ‸')
    const items = labels(getCompletions(source, offset))
    expect(items).toEqual(expect.arrayContaining(['true', 'false', 'null', '$n', '@Count']))
    expect(items).not.toContain('Quiz')
  })

  it('offers nothing in comments', () => {
    const [source, offset] = at('// Qu‸')
    expect(getCompletions(source, offset)).toEqual([])
  })
})

describe('signature help', () => {
  it('highlights the active positional parameter', () => {
    const [source, offset] = at('x = Step("id", "policy", ‸')
    const help = getSignatureHelp(source, offset)!
    expect(help.activeParameter).toBe(2)
    expect(help.parameters[2].name).toBe('command')
    const [start, end] = help.parameters[3].label
    expect(help.label.slice(start, end)).toBe('handledBy: string | System')
  })

  it('stays on the enclosing call inside arrays and nested calls', () => {
    const [source, offset] = at('root = Quiz("T", [q1, ‸')
    expect(getSignatureHelp(source, offset)).toMatchObject({ activeParameter: 1, parameters: expect.any(Array) })
    const [nested, nestedOffset] = at('root = Quiz("T", [QuizQuestion("q", ‸')
    expect(getSignatureHelp(nested, nestedOffset)?.label).toMatch(/^QuizQuestion\(/)
  })

  it('supports builtins', () => {
    const [source, offset] = at('x = Text(@Round(1.5, ‸')
    expect(getSignatureHelp(source, offset)).toMatchObject({ label: '@Round(number, decimals?) → number', activeParameter: 1 })
  })
})

describe('hover and definition', () => {
  it('documents components', () => {
    const offset = FLOW.indexOf('System(') + 2
    expect(getHover(FLOW, offset)?.contents).toContain('System(id: string, title: string, desc: string')
  })

  it('lists described parameters in component docs', () => {
    const offset = FLOW.indexOf('System(') + 2
    expect(getHover(FLOW, offset)?.contents).toContain('- `kind?` — Optional "aggregate"')
  })

  it('names the positional parameter an argument fills', () => {
    const offset = FLOW.indexOf('"PlaceOrder"') + 3
    const contents = getHover(FLOW, offset)?.contents
    expect(contents).toContain('**Step › command**')
    expect(contents).toContain('Command the policy issues')
  })

  it('previews referenced statements with the parameter they fill', () => {
    const offset = FLOW.indexOf('orders, [Event') + 1
    const contents = getHover(FLOW, offset)!.contents
    expect(contents).toContain('orders = System("orders"')
    expect(contents).toContain('Defined on line 3')
    expect(contents).toContain('Step › handledBy')
  })

  it('goes to statement and ID definitions', () => {
    const refOffset = FLOW.indexOf('orders, [Event') + 1
    expect(getDefinition(FLOW, refOffset)).toEqual({ start: FLOW.indexOf('orders ='), end: FLOW.indexOf('orders =') + 6 })

    const source = 'root = Scenario("S", "s", [start])\nstart = ScenarioNode("start", "Go?", [ScenarioChoice("a", "Yes", "start")])'
    const target = getDefinition(source, source.lastIndexOf('"start"') + 2)
    expect(source.slice(target!.start, target!.end)).toBe('"start"')
    expect(target!.start).toBe(source.indexOf('"start"'))
  })

  it('lists statements as symbols', () => {
    expect(getDocumentSymbols(FLOW).map((s) => [s.name, s.component])).toEqual([
      ['root', 'Flowchart'], ['buyer', 'Actor'], ['orders', 'System'], ['place', 'Step'], ['happy', 'Journey'],
    ])
  })
})

describe('diagnostics', () => {
  it('maps gateway diagnostics to statement ranges', () => {
    const source = 'root = Quiz("Q", [q1])\nq1 = QuizQuestion("q1", "Why?", [c])\nc = QuizChoice("a", "A", true)'
    const [diag] = getDiagnostics(source)
    expect(diag).toMatchObject({ severity: 'error', tier: 2 })
    expect(source.slice(diag.range.start, diag.range.end)).toBe('c = QuizChoice("a", "A", true)')
  })

  it('reports unused statements as warnings', () => {
    const source = 'root = Text("T", [])\nextra = Text("x", [])'
    expect(getDiagnostics(source)).toEqual([expect.objectContaining({ severity: 'warning', tier: 3 })])
  })

  it('validates topic and catalog files by kind', () => {
    expect(getDiagnostics('root = Topic("T", "C", "D", [SectionRef("intro")])', 'topic')).toEqual([])
    expect(getDiagnostics('root = Text("x", [])', 'topic')).toEqual([expect.objectContaining({ message: expect.stringContaining('Topic') })])
    expect(fileKindFromPath('/x/public/content/index.oui')).toBe('catalog')
    expect(fileKindFromPath('C:\\content\\demo\\topic.oui')).toBe('topic')
    expect(fileKindFromPath('demo/sections/quiz.oui')).toBe('section')
  })
})

describe('tokenAt', () => {
  it('prefers the word starting at the cursor over punctuation ending there', async () => {
    const { tokenAt } = await import('../../../../../../src/core/supporting/authoring-editor/oui-language/scanner')
    const source = 'root = Text("T", [p])'
    expect(tokenAt(scan(source), source.indexOf('p]'))?.text).toBe('p')
    expect(tokenAt(scan(source), source.indexOf('p]') + 1)?.text).toBe('p')
    expect(tokenAt(scan(source), source.indexOf('[') )?.text).toBe('[')
  })
})

describe('completion noise', () => {
  it('does not offer builtins where a component reference is expected', () => {
    const [source, offset] = at(FLOW.replace('"PlaceOrder", orders,', '"PlaceOrder", ‸'))
    expect(getCompletions(source, offset).some((i) => i.kind === 'builtin')).toBe(false)
  })
})

describe('standard OpenUI files (// @openui)', () => {
  const STANDARD = `// @openui "Plans"\nroot = Card([‸])\n`

  it('uses the standard library spec', () => {
    const spec = getOUILanguageSpec('// @openui "X"\nroot = Card([])')
    expect(spec.components.has('Tabs')).toBe(true)
    expect(spec.components.has('Quiz')).toBe(false)
    expect(spec.sectionComponents[0]).toBe('Card')
    expect(getOUILanguageSpec().components.has('Quiz')).toBe(true)
  })

  it('completes standard child components', () => {
    const items = labels(getCompletions(...at(STANDARD)))
    expect(items).toEqual(expect.arrayContaining(['TextContent', 'CardHeader', 'Tabs']))
    expect(items).not.toContain('Quiz')
  })

  it('offers standard roots for a new statement', () => {
    const items = labels(getCompletions(...at(`// @openui "Plans"\n‸`)))
    expect(items).toContain('root = Card(…)')
    expect(items).not.toContain('root = Quiz(…)')
  })

  it('reports standard diagnostics on the right line', () => {
    const diagnostics = getDiagnostics(`// @openui "Plans"\nroot = Card([x])\nx = Nope()`)
    expect(diagnostics).toContainEqual(expect.objectContaining({ severity: 'error', tier: 1 }))
  })
})
