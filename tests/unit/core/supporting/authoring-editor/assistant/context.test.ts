import { describe, expect, it } from 'vitest'
import { buildTopicContext, fileStatements, type AssistantTopicContext } from '../../../../../../src/core/supporting/authoring-editor/assistant'

const QUIZ = `root = Quiz("Check", [q1, q2])
q1 = QuizQuestion("q1", "First?", [a1, QuizChoice("b", "No", false, "Because.")])
a1 = QuizChoice("a", "Yes", true, "Right.")
q2 = QuizQuestion(
  "q2",
  "Second?",
  [QuizChoice("a", "Maybe", true, "Fine.")],
)
`

const context = (extra: Partial<AssistantTopicContext> = {}): AssistantTopicContext => ({
  topicId: 'demo',
  files: {
    'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("intro"), SectionRef("quiz")])\n',
    'sections/intro.oui': 'root = Text("Intro", ["Hello."])\n',
    'sections/quiz.oui': QUIZ,
  },
  fileOrder: ['topic.oui', 'sections/intro.oui', 'sections/quiz.oui'],
  diagnostics: {},
  ...extra,
})

describe('fileStatements', () => {
  it('lists statements with their lines, components and references', () => {
    const statements = fileStatements(QUIZ)
    expect(statements.map((s) => [s.name, s.line, s.component])).toEqual([
      ['root', 1, 'Quiz'],
      ['q1', 2, 'QuizQuestion'],
      ['a1', 3, 'QuizChoice'],
      ['q2', 4, 'QuizQuestion'],
    ])
    expect(statements[1].refs).toEqual(['a1'])
    expect(statements[1].calls).toEqual(['QuizQuestion', 'QuizChoice'])
    expect(statements[3].text).toMatch(/^q2 = QuizQuestion\([\s\S]*\)$/)
  })
})

describe('buildTopicContext', () => {
  it('sends a picked statement and what it references, with an outline of the topic', () => {
    const block = buildTopicContext(context(), [{ file: 'sections/quiz.oui', anchor: 'q1.choices[1].text' }])
    expect(block.files).toEqual(['sections/quiz.oui'])
    expect(block.components.sort()).toEqual(['QuizChoice', 'QuizQuestion'])
    expect(block.text).toContain('- sections/intro.oui (Text "Intro")')
    expect(block.text).toContain('- sections/quiz.oui (Quiz "Check"): root Quiz, q1 QuizQuestion, a1 QuizChoice, q2 QuizQuestion')
    expect(block.text).toContain('### sections/quiz.oui: q1 (line 2), a1 (line 3)')
    expect(block.text).not.toContain('Second?')
    expect(block.text.startsWith('<topic-context topic="demo">')).toBe(true)
    expect(block.text.endsWith('</topic-context>')).toBe(true)
  })

  it('sends the whole file for a section pick and marks unsaved files', () => {
    const block = buildTopicContext(context({ unsaved: new Set(['sections/quiz.oui']) }), [{ file: 'sections/quiz.oui', anchor: 'root' }])
    expect(block.text).toContain('### sections/quiz.oui (whole file) (unsaved edits)')
    expect(block.text).toContain('Second?')
    expect(block.components).toContain('Quiz')
  })

  it('reads the current source, so picks follow edits; vanished statements are skipped', () => {
    const edited = context()
    edited.files['sections/quiz.oui'] = QUIZ.replace('First?', 'First, edited?')
    const block = buildTopicContext(edited, [{ file: 'sections/quiz.oui', anchor: 'q1' }, { file: 'sections/quiz.oui', anchor: 'gone' }])
    expect(block.text).toContain('First, edited?')
    expect(block.text).not.toContain('gone')
  })

  it('lists errors for the files in context, or for the whole topic with nothing picked', () => {
    const diagnostics = { 'sections/intro.oui': ['line 1: broken'], 'sections/quiz.oui': ['line 2: also broken'] }
    const picked = buildTopicContext(context({ diagnostics }), [{ file: 'sections/quiz.oui', anchor: 'q1' }])
    expect(picked.text).toContain('- line 2: also broken')
    expect(picked.text).not.toContain('line 1: broken')
    const none = buildTopicContext(context({ diagnostics }), [])
    expect(none.text).toContain('- line 1: broken')
    expect(none.text).toContain('- line 2: also broken')
    expect(none.text).not.toContain('## Current Source')
  })

  it('notes where the topic was opened from and standard OpenUI sections', () => {
    const ctx = context({ source: { kind: 'archive', name: 'demo.loom.oui' } })
    ctx.files['sections/intro.oui'] = '// @openui "Intro"\nroot = Card([])\n'
    const block = buildTopicContext(ctx, [])
    expect(block.text).toContain('Opened in demo.loom.oui.')
    expect(block.text).toContain('- sections/intro.oui (standard OpenUI "Intro")')
  })
})

describe('buildTopicContext with earlier blocks in the history', () => {
  const q1 = [{ file: 'sections/quiz.oui', anchor: 'q1' }]

  it('leaves out what the earlier blocks already carry', () => {
    const first = buildTopicContext(context(), q1, { reference: true })
    expect(first.text).toContain('## Outline')
    expect(first.text).toContain('### sections/quiz.oui: q1 (line 2), a1 (line 3)')
    expect(first.text).toContain('## Components')
    expect(first.text).toContain('QuizQuestion(id: string')
    expect(first.keys.some((k) => k.startsWith('component:QuizQuestion'))).toBe(true)

    const again = buildTopicContext(context(), q1, { reference: true, known: new Set(first.keys) })
    expect(again).toMatchObject({ text: '', keys: [] })
  })

  it('sends a statement again once it changed, and says when errors are gone', () => {
    const errors = context({ diagnostics: { 'sections/quiz.oui': ['line 2: broken'] } })
    const first = buildTopicContext(errors, q1)
    expect(first.text).toContain('- line 2: broken')

    const files = { ...errors.files, 'sections/quiz.oui': QUIZ.replace('"First?"', '"First, really?"') }
    const next = buildTopicContext(context({ files }), q1, { known: new Set(first.keys) })
    expect(next.text).not.toContain('## Outline')
    expect(next.text).toContain('### sections/quiz.oui: q1 (line 2)\n```oui\nq1 = QuizQuestion("q1", "First, really?"')
    expect(next.text).not.toContain('a1 = QuizChoice')
    expect(next.text).toContain('## Current Errors\n\nNone.')
  })

  it('repeats nothing from a whole file that was sent and has not changed', () => {
    const whole = buildTopicContext(context(), [{ file: 'sections/quiz.oui', anchor: 'root' }])
    const next = buildTopicContext(context(), [{ file: 'sections/quiz.oui', anchor: 'root' }, ...q1], { known: new Set(whole.keys) })
    expect(next.text).toBe('')
  })
})

describe('buildTopicContext in Viewer', () => {
  it('says where the learner is and sends the section in view whole, once', () => {
    const first = buildTopicContext(context({ view: { mode: 'present', file: 'sections/quiz.oui' } }), [], { reference: true })
    expect(first.text).toContain('## On Screen\n\nPresent mode')
    expect(first.text).toContain('at sections/quiz.oui (Quiz "Check").')
    expect(first.text).toContain('### sections/quiz.oui (whole file)')
    expect(first.text).toContain('QuizQuestion(id: string')
    const again = buildTopicContext(context({ view: { mode: 'present', file: 'sections/quiz.oui' } }), [], { reference: true, known: new Set(first.keys) })
    expect(again.text).toBe('')
    const moved = buildTopicContext(context({ view: { mode: 'read', file: 'sections/intro.oui' } }), [], { known: new Set(first.keys) })
    expect(moved.text).toContain('Read mode, at sections/intro.oui (Text "Intro").')
    expect(moved.text).toContain('### sections/intro.oui (whole file)')
  })
})
