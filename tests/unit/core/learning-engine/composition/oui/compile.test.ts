/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import {
  compileOUISection,
  compileOUITopic,
  compileOUICatalog,
  indexStatementLines,
} from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { OUI_SECTION_TYPES, getLoomOUIJSONSchema, loomOUILibrary } from '../../../../../../src/core/learning-engine/composition/oui/library'
import { KNOWN_SECTION_TYPES } from '../../../../../../src/core/learning-engine/validation/gateway'
import { validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'
import { deriveSchema } from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/derive'
import { SECTION_FIXTURES } from './fixtures'

describe('Loom OpenUI library', () => {
  it('has one section component for every known section type except directive-based openui', () => {
    expect(new Set([...OUI_SECTION_TYPES.values(), 'openui'])).toEqual(KNOWN_SECTION_TYPES)
    expect([...OUI_SECTION_TYPES.values()]).not.toContain('openui')
  })

  it('exposes a JSON schema covering every component', () => {
    const schema = getLoomOUIJSONSchema() as { properties: Record<string, unknown> }
    expect(Object.keys(schema.properties)).toEqual(expect.arrayContaining(['Quiz', 'Flowchart', 'Topic', 'Catalog', 'Lead']))
  })

  it('generates an authoring prompt with positional signatures', () => {
    const prompt = loomOUILibrary.prompt()
    expect(prompt).toContain('QuizChoice(id: string, text: string, correct: boolean, explanation: string)')
  })
})

describe('compileOUISection — every section type', () => {
  for (const [type, source] of Object.entries(SECTION_FIXTURES)) {
    it(`compiles and validates ${type}`, () => {
      const result = validateOUISection(source)
      expect(result.diagnostics).toEqual([])
      expect(result.status).toBe('valid')
      expect(result.payload?.meta.type).toBe(type)
      expect(result.payload?.data.type).toBe(type)
    })
  }
})

describe('compileOUISection — mapping details', () => {
  it('maps quiz questions and choices', () => {
    const { value } = compileOUISection(SECTION_FIXTURES.quiz)
    expect(value?.meta).toEqual({ type: 'quiz', title: 'Knowledge Check', resource: '.' })
    expect(value?.data).toEqual({
      type: 'quiz',
      questions: [{
        id: 'q1',
        question: 'What is an agent?',
        hint: 'Think loops',
        choices: [
          { id: 'a', text: 'A goal-directed loop', correct: true, explanation: 'Correct.' },
          { id: 'b', text: 'A database', correct: false, explanation: 'No.' },
        ],
      }],
    })
  })

  it('maps flowchart references to abstract-flow refs that deriveSchema accepts', () => {
    const { value } = compileOUISection(SECTION_FIXTURES.flowchart)
    const flow = (value?.data as { flow: any }).flow
    expect(flow.actors).toEqual({ buyer: { title: 'Buyer', desc: 'Person placing the order' } })
    expect(flow.systems.orders).toEqual({ title: 'Order Service', desc: 'Owns orders', type: 'aggregate' })
    expect(flow.steps[0]).toMatchObject({
      type: 'linear',
      id: 'place-order',
      initiatedBy: { _tag: 'ref', id: 'buyer' },
      handledBy: { _tag: 'ref', id: 'orders' },
      resultEvents: [{ id: 'order-placed', title: 'Order Placed' }],
    })
    expect(flow.steps[1].branches[1]).toMatchObject({ id: 'declined', dashed: true })
    expect(flow.journeys[0].steps.map((s: { stepId: string }) => s.stepId)).toEqual(['place-order', 'ok'])
    expect(() => deriveSchema(flow)).not.toThrow()
  })

  it('maps record-shaped sections and string-or-reference props', () => {
    const concept = compileOUISection(SECTION_FIXTURES['concept-map']).value?.data as any
    expect(Object.keys(concept.nodes)).toEqual(['agent', 'tool'])
    expect(concept.edges).toEqual([{ from: 'agent', to: 'tool', label: 'uses' }, { from: 'tool', to: 'agent' }])

    const pillar = compileOUISection(SECTION_FIXTURES['pillar-layer']).value?.data as any
    expect(pillar.matrix_blocks[0]).toMatchObject({ id: 'b-web', layer_id: 'l-clients', col_offset: 0, col_span: 1, depends_on: ['b-db'] })
    expect(pillar.layers[0].blocks).toEqual([{ title: 'SPA' }])

    const sequence = compileOUISection(SECTION_FIXTURES['reflection-sequence']).value?.data as any
    expect(sequence.challenges[0].solution).toEqual(['plan', 'act'])
  })

  it('treats null as an omitted optional argument', () => {
    const data = compileOUISection(SECTION_FIXTURES.flashcards).value?.data as any
    expect(data.terms[0]).not.toHaveProperty('image')
    expect(data.terms[0].dialogue).toEqual({ user: 'Hi', aiThoughts: 'Hmm', aiQuestion: 'Why?' })
  })

  it('collects heading, lead and ordered into section meta', () => {
    const { value } = compileOUISection(`root = Bullets("List", [Bullet("a")], false, "Heading", Lead("What", "Why", "Next"))`)
    expect(value?.meta).toEqual({
      type: 'bullets',
      title: 'List',
      resource: '.',
      heading: 'Heading',
      ordered: false,
      intro: { what: 'What', why: 'Why', next: 'Next' },
    })
  })

  it('evaluates $state defaults, builtins and ternaries', () => {
    const { value, issues } = compileOUISection(`
$level = "beginner"
root = Text("Level: " + $level, [$level == "beginner" ? "Start slow." : "Go deep.", "" + @Count([1, 2, 3]) + " parts"])
`)
    expect(issues).toEqual([])
    expect(value?.meta.title).toBe('Level: beginner')
    expect(value?.data).toEqual({ type: 'text', paragraphs: ['Start slow.', '3 parts'] })
  })
})

describe('compileOUISection — issues', () => {
  it('reports a non-section root', () => {
    const result = compileOUISection(`root = QuizChoice("a", "A", true, "e")`)
    expect(result.value).toBeNull()
    expect(result.issues).toEqual([expect.objectContaining({ tier: 1, code: 'wrong-root', line: 1 })])
  })

  it('reports unknown components with their line', () => {
    const result = compileOUISection(`root = Quiz("Q", [q1])\n\nq1 = Questoin("q1")`)
    expect(result.issues).toContainEqual(expect.objectContaining({ tier: 1, code: 'unknown-component', statementId: 'q1', line: 3 }))
  })

  it('reports missing required arguments as tier 2', () => {
    const result = compileOUISection(`root = Quiz("Q", [q1])\nq1 = QuizQuestion("q1", "Why?", [c])\nc = QuizChoice("a", "A", true)`)
    expect(result.issues).toContainEqual(expect.objectContaining({ tier: 2, code: 'missing-required', statementId: 'c', line: 3, path: '/explanation' }))
  })

  it('reports unfinished statements and unresolved references', () => {
    const codes = compileOUISection(`root = Quiz("Q", [q1]`).issues.map((i) => i.code)
    expect(codes).toEqual(expect.arrayContaining(['incomplete', 'unresolved-reference']))
  })

  it('reports unused statements as tier 3', () => {
    const result = compileOUISection(`root = Text("T", ["a"])\nleftover = Text("x", [])`)
    expect(result.issues).toEqual([expect.objectContaining({ tier: 3, code: 'unused-statement', statementId: 'leftover', line: 2 })])
  })

  it('rejects Query() as unsupported', () => {
    const result = compileOUISection(`root = Text("T", ["a"])\ndata = Query("tool", {}, {rows: []})`)
    expect(result.issues).toContainEqual(expect.objectContaining({ tier: 1, code: 'unsupported-feature', statementId: 'data' }))
  })
})

describe('topic and catalog manifests', () => {
  it('compiles a topic manifest', () => {
    const { value, issues } = compileOUITopic(`
root = Topic("AI Agents", "Architecture", "How agents work", [SectionRef("intro"), SectionRef("quiz")], ["ai"], "beginner")
`)
    expect(issues).toEqual([])
    expect(value).toEqual({
      title: 'AI Agents',
      category: 'Architecture',
      description: 'How agents work',
      sections: ['intro', 'quiz'],
      tags: ['ai'],
      difficulty: 'beginner',
    })
  })

  it('compiles a catalog', () => {
    expect(compileOUICatalog(`root = Catalog([TopicRef("demo"), TopicRef("mtls")])`).value).toEqual({ topics: ['demo', 'mtls'] })
  })

  it('rejects the wrong root kind', () => {
    expect(compileOUITopic(`root = Catalog([])`).issues).toContainEqual(expect.objectContaining({ code: 'wrong-root' }))
  })
})

describe('indexStatementLines', () => {
  it('finds multi-line statements and ignores strings and comments', () => {
    const lines = indexStatementLines([
      '// header = Text("x")',
      'root = Text(',
      '  "a = b",',
      '  [',
      '    "c",',
      '  ]',
      ')',
      '$flag = true',
      'next = Text("y", [])',
    ].join('\n'))
    expect([...lines.entries()]).toEqual([['root', 2], ['$flag', 8], ['next', 9]])
  })
})

describe('compileOUISection — standard OpenUI sections (// @openui)', () => {
  it('compiles the directive into meta and keeps the program verbatim', () => {
    const { value, issues, rootComponent } = compileOUISection(SECTION_FIXTURES.openui)
    expect(issues).toEqual([])
    expect(rootComponent).toBe('Card')
    expect(value?.meta).toEqual({ type: 'openui', title: 'Plans', heading: 'Pick one', resource: '.' })
    expect((value?.data as any).source).toMatch(/^root = Card\(\[header, tabs\]\)\n/)
    expect((value?.data as any).source).not.toContain('@openui')
  })

  it('accepts a directive with only a title', () => {
    const { value } = compileOUISection(`// @openui "Just a title"\nroot = Card([TextContent("hi")])`)
    expect(value?.meta).toEqual({ type: 'openui', title: 'Just a title', resource: '.' })
  })

  it('validates against the standard library, not the Loom one', () => {
    const loomOnly = validateOUISection(`// @openui "X"\nroot = Quiz("Q", [])`)
    expect(loomOnly.status).toBe('error')
    expect(loomOnly.diagnostics).toContainEqual(expect.objectContaining({ tier: 1, line: 2, fixHint: expect.stringContaining('standard OpenUI library') }))
    expect(loomOnly.payload).toBeNull()
  })

  it('reports missing required arguments with their line', () => {
    const result = validateOUISection(`// @openui "X"\nroot = Card([t])\nt = TextContent()`)
    expect(result.status).toBe('error')
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ tier: 2, line: 3 }))
  })

  it('rejects Query()/Mutation() since content is static', () => {
    const result = validateOUISection(`// @openui "X"\nroot = Card([TextContent(data)])\ndata = Query("get_data", {}, "")`)
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ tier: 1, line: 3, message: expect.stringContaining('Query()/Mutation()') }))
  })

  it('treats a plain comment as a Loom section', () => {
    expect(compileOUISection(`// openui is great\nroot = Text("T", ["p"])`).value?.meta.type).toBe('text')
  })
})
