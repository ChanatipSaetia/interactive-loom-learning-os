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
    expect(block.text).toContain('- sections/intro.oui (Text)')
    expect(block.text).toContain('- sections/quiz.oui (Quiz): root Quiz, q1 QuizQuestion, a1 QuizChoice, q2 QuizQuestion')
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
    expect(block.text).toContain('- sections/intro.oui (standard OpenUI)')
  })
})
