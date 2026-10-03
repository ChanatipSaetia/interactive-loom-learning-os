import { describe, it, expect } from 'vitest'
import {
  identifierFrom,
  printOUICatalog,
  printOUIProgram,
  printOUISection,
  printOUITopic,
} from '../../../../../../src/core/learning-engine/composition/oui/print'
import { compileOUICatalog, compileOUISection, compileOUITopic } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { SECTION_FIXTURES } from './fixtures'

describe('printOUISection', () => {
  it('round-trips every fixture section', () => {
    for (const [type, source] of Object.entries(SECTION_FIXTURES)) {
      const compiled = compileOUISection(source).value!
      const reprinted = compileOUISection(printOUISection(compiled.meta, compiled.data))
      expect(reprinted.issues, type).toEqual([])
      expect(reprinted.value, type).toEqual(compiled)
    }
  })

  it('hoists named children and prints references by statement name', () => {
    const { meta, data } = compileOUISection(SECTION_FIXTURES.flowchart).value!
    const source = printOUISection(meta, data)
    expect(source).toMatch(/^root = Flowchart\("Checkout", \[buyer\], \[orders, pay\], \[placeOrder, payBranch\], \[happy\]\)\n/)
    expect(source).toContain('\nbuyer = Actor("buyer", "Buyer", "Person placing the order")\n')
    // A referenced branch option is hoisted so the journey can point at it.
    expect(source).toContain('\nok = BranchOption("ok", "Approved", "When order placed", "Charge", pay, [Event("paid", "Paid")])\n')
    expect(source).toContain('JourneyStep(ok, "Pay", "Card is charged")')
  })

  it('breaks long calls one argument per line', () => {
    const source = printOUISection(
      { type: 'quiz', title: 'Q', resource: '.' },
      { type: 'quiz', questions: [{ id: 'q1', question: 'A fairly long question that will not fit on one line?', choices: [], hint: 'h' }] },
      { width: 60 },
    )
    expect(source).toBe([
      'root = Quiz("Q", [q1])',
      '',
      'q1 = QuizQuestion(',
      '  "q1",',
      '  "A fairly long question that will not fit on one line?",',
      '  [],',
      '  "h",',
      ')',
      '',
    ].join('\n'))
  })

  it('prints null for skipped optional arguments and escapes strings', () => {
    const source = printOUISection(
      { type: 'flashcards', title: 'Cards', resource: '.' },
      { type: 'flashcards', terms: [{ id: 't', word: 'say "hi"\nnow', pronunciation: 'p', category: 'c', shortDefinition: 's', detailedDefinition: 'd', whyItMatters: 'w', dialogue: { user: 'u', aiThoughts: 'a', aiQuestion: 'q' } }] },
    )
    expect(source).toContain('"say \\"hi\\"\\nnow"')
    expect(source).toContain('"w", null, Dialogue("u", "a", "q"))')
    expect(compileOUISection(source).value?.data).toMatchObject({ terms: [{ word: 'say "hi"\nnow' }] })
  })

  it('quotes object keys that are not identifiers', () => {
    const source = printOUISection(
      { type: 'reflection-template', title: 'R', resource: '.' },
      { type: 'reflection-template', challenges: [{ prompt: 'p', template: '{zone-1}', chips: [], solution: { 'zone-1': 'c' } }] },
    )
    expect(source).toContain('{"zone-1": "c"}')
  })

  it('includes heading, lead and header comments', () => {
    const source = printOUISection(
      { type: 'bullets', title: 'T', heading: 'H', resource: '.', intro: { what: 'W' } },
      { type: 'bullets', items: [{ text: 'p' }] },
      { header: ['Generated'] },
    )
    expect(source).toBe('// Generated\nroot = Bullets("T", [Bullet("p")], null, "H", Lead("W"))\n')
  })

  it('prints openui sections as directive lines followed by the program', () => {
    const source = printOUISection(
      { type: 'openui', title: 'T', heading: 'H', resource: '.', intro: { what: 'W', next: 'N' } },
      { type: 'openui', source: 'root = Stack([TextContent("p")])' },
    )
    expect(source).toBe('// @openui "T" "H"\n// @lead "W" "" "N"\nroot = Stack([TextContent("p")])\n')
    expect(compileOUISection(source).value?.meta).toEqual({ type: 'openui', title: 'T', heading: 'H', resource: '.', intro: { what: 'W', why: undefined, next: 'N' } })
  })

  it('keeps a call with one long primitive argument on one line', () => {
    const long = 'x'.repeat(150)
    expect(printOUIProgram({ kind: 'call', component: 'SectionRef', props: { name: long } })).toBe(`root = SectionRef("${long}")\n`)
  })
})

describe('printOUIProgram', () => {
  it('rejects props the component does not have', () => {
    expect(() => printOUIProgram({ kind: 'call', component: 'Text', props: { title: 'T', paragraphs: [], nope: 1 } })).toThrow(/nope/)
  })
})

describe('manifests', () => {
  it('round-trips topic and catalog files', () => {
    const manifest = { title: 'Demo', category: 'Architecture', description: 'D', sections: ['intro', 'quiz'], tags: ['ai'] }
    expect(compileOUITopic(printOUITopic(manifest)).value).toEqual(manifest)
    expect(compileOUICatalog(printOUICatalog(['demo', 'mtls'])).value).toEqual({ topics: ['demo', 'mtls'] })
  })
})

describe('identifierFrom', () => {
  it('builds camelCase statement names', () => {
    expect(identifierFrom('place-order', 'Step')).toBe('placeOrder')
    expect(identifierFrom('RAG pipeline', 'Step')).toBe('ragPipeline')
    expect(identifierFrom('1st', 'Step')).toBe('step1st')
    expect(identifierFrom('ภาษาไทย', 'TaxonomyCategory')).toBe('taxonomyCategory')
    expect(identifierFrom(undefined, 'IntroWhat')).toBe('introWhat')
  })
})
