import { describe, expect, it } from 'vitest'
import { ContentToolRunner, parseAddress, type AssistantTopicContext } from '../../../../../../src/core/supporting/authoring-editor/assistant'

const files = {
  'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("intro"), SectionRef("quiz"), SectionRef("broken")])\n',
  'sections/intro.oui': 'root = Text("Intro", ["Hello.", "World."])\n',
  'sections/quiz.oui': `root = Quiz("Check", [q1])
q1 = QuizQuestion("q1", "First?", [QuizChoice("a", "Yes", true, "Right.")], "Think.")
`,
  'sections/quiz.narrate.oui': 'root = Narration([NarrationStep("q1", "Here is the first question.")])\n',
  'sections/broken.oui': '// Nothing here yet.\n',
}

const context: AssistantTopicContext = {
  topicId: 'demo',
  files,
  fileOrder: ['topic.oui', 'sections/intro.oui', 'sections/quiz.oui', 'sections/broken.oui'],
  diagnostics: { 'sections/broken.oui': ['No `root = …` statement was found, so nothing can be rendered.'] },
}

const run = (name: string, args: unknown = {}) => new ContentToolRunner(context).run(name, typeof args === 'string' ? args : JSON.stringify(args))

describe('content tools (decisions 120–126)', () => {
  it('parses addresses, with small slips', () => {
    expect(parseAddress('sections/quiz.oui #q1', files)).toEqual({ file: 'sections/quiz.oui', anchor: 'q1' })
    expect(parseAddress('quiz#q1.choices[0]', files)).toEqual({ file: 'sections/quiz.oui', anchor: 'q1.choices[0]' })
    expect(parseAddress('demo/sections/quiz.oui:2 #q1', files)).toEqual({ file: 'sections/quiz.oui', anchor: 'q1' })
    expect(parseAddress('quiz.oui', files)).toEqual({ file: 'sections/quiz.oui', anchor: 'root' })
    expect(parseAddress('nope', files)).toBeNull()
  })

  it('navigate() lists the sections in reading order, with titles and errors', () => {
    const outcome = run('navigate')
    expect(outcome.label).toBe('Topic outline')
    expect(outcome.content).toContain('Topic "Demo": 3 sections')
    expect(outcome.content).toContain('1. sections/intro.oui Text "Intro"\n')
    expect(outcome.content).toContain('2. sections/quiz.oui Quiz "Check" (1 questions)')
    expect(outcome.content).toContain('3. sections/broken.oui does not compile (has errors)')
  })

  it('navigate(address) lists the parts inside, and the narration script', () => {
    const outcome = run('navigate', { address: 'quiz' })
    expect(outcome.content).toContain('- sections/quiz.oui #q1 QuizQuestion "First?" (1 choices)')
    expect(outcome.content).toContain('Narration script for Present mode: sections/quiz.narrate.oui')
    expect(outcome).toMatchObject({ label: 'Check', file: 'sections/quiz.oui', anchor: 'root' })
    expect(run('navigate', { address: 'sections/quiz.oui #q1.choices[0]' }).content).toContain('(no parts inside')
  })

  it('read gives readable content with answers, labelled for the learner', () => {
    const outcome = run('read', { address: 'sections/quiz.oui #q1' })
    expect(outcome.content).toContain('question: First?')
    expect(outcome.content).toContain('correct: true')
    expect(outcome.content).not.toContain('QuizQuestion(')
    expect(outcome).toMatchObject({ label: 'Check › First?', file: 'sections/quiz.oui', anchor: 'q1' })
    expect(run('read', { address: 'sections/quiz.narrate.oui' }).content).toContain('caption: Here is the first question.')
  })

  it('read with source: true gives the statement or the file as written', () => {
    expect(run('read', { address: 'sections/quiz.oui #q1', source: true }).content).toContain('```oui\nq1 = QuizQuestion("q1"')
    expect(run('read', { address: 'intro', source: true }).content).toContain('root = Text("Intro"')
  })

  it('explains what it cannot do', () => {
    expect(run('read', { address: 'sections/quiz.oui #q9' }).content).toContain('there is no place #q9 in sections/quiz.oui')
    expect(run('read', { address: 'nowhere' }).content).toContain('no file in the topic matches "nowhere"')
    expect(run('read').content).toContain('read needs an address')
    expect(run('read', '{not json').content).toContain('not valid JSON')
    expect(run('write').content).toContain('there is no tool "write"')
    const broken = run('read', { address: 'broken' })
    expect(broken.content).toContain('does not compile, so the learner does not see it')
    expect(broken.content).toContain('- No `root = …` statement was found')
    expect(broken.content).toContain('// Nothing here yet.')
  })
})
