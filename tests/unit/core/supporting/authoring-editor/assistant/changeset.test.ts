import { describe, expect, it } from 'vitest'
import {
  changesetNote,
  decide,
  fileView,
  newErrors,
  stageSection,
  stageStatements,
  stageTopic,
  stagedContext,
  stagedFiles,
  type Changeset,
} from '../../../../../../src/core/supporting/authoring-editor/assistant/changeset'
import { EditToolRunner } from '../../../../../../src/core/supporting/authoring-editor/assistant/edit-tools'
import { ContentToolRunner } from '../../../../../../src/core/supporting/authoring-editor/assistant/content-tools'

const files: Record<string, string> = {
  'topic.oui': 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz")])\n',
  'sections/quiz.oui': 'root = Quiz("Check", [q1])\nq1 = QuizQuestion("q1", "Why?", [QuizChoice("a", "Yes", true, "Right.")])\n',
}
const q1 = 'q1 = QuizQuestion("q1", "Why, exactly?", [QuizChoice("a", "Yes", true, "Right.")])'
const q2 = 'q2 = QuizQuestion("q2", "And then?", [QuizChoice("a", "No", true, "Fine.")])'
const root2 = 'root = Quiz("Check", [q1, q2])'

describe('stageStatements', () => {
  it('stages replaced and added statements without touching the files', () => {
    const { changeset, error, staged } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'root', text: root2 }, { name: 'q1', text: q1 }, { name: 'q2', text: q2 }], [], 'Harder quiz')
    expect(error).toBeUndefined()
    expect(staged).toEqual(['replace root', 'replace q1', 'add q2'])
    expect(changeset[0].changes.map((c) => `${c.kind}:${c.name}`)).toEqual(['replace:root', 'replace:q1', 'add:q2'])
    const view = stagedFiles(files, changeset)['sections/quiz.oui']
    expect(view).toBe(`${root2}\n${q1}\n${q2}\n`)
    expect(files['sections/quiz.oui']).not.toContain('exactly')
    expect(newErrors('demo', 'sections/quiz.oui', files, changeset)).toEqual([])
  })

  it('reports new errors of the staged file', () => {
    const { changeset } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'root', text: 'root = Quiz("Check", [q1, q9])' }], [], 'x')
    expect(newErrors('demo', 'sections/quiz.oui', files, changeset).join('\n')).toMatch(/q9/)
  })

  it('refuses a file that does not exist and topic.oui', () => {
    expect(stageStatements([], files, 'sections/nope.oui', [{ name: 'root', text: root2 }], [], 'x').error).toMatch(/create_section/)
    expect(stageStatements([], files, 'topic.oui', [{ name: 'root', text: 'root = 1' }], [], 'x').error).toMatch(/edit_topic/)
  })

  it('creates a narration script for an existing section', () => {
    const narration = 'root = Narration([NarrationStep("q1", "First question.")])'
    const { changeset, error } = stageStatements([], files, 'sections/quiz.narrate.oui', [{ name: 'root', text: narration }], [], 'Narrate')
    expect(error).toBeUndefined()
    expect(stagedFiles(files, changeset)['sections/quiz.narrate.oui']).toBe(`${narration}\n`)
  })

  it('a later call replaces the pending change of the same statement; a delete drops a staged add', () => {
    let { changeset } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'q2', text: q2 }], [], 'a')
    ;({ changeset } = stageStatements(changeset, files, 'sections/quiz.oui', [{ name: 'q2', text: q2.replace('And then', 'Then') }], [], 'b'))
    expect(changeset[0].changes).toHaveLength(1)
    expect(changeset[0].changes[0].text).toContain('Then?')
    ;({ changeset } = stageStatements(changeset, files, 'sections/quiz.oui', [], ['q2'], 'c'))
    expect(changeset).toEqual([])
  })
})

describe('re-basing and conflicts', () => {
  it('re-applies staged statements onto an edited buffer and flags a statement both changed', () => {
    const { changeset } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'q1', text: q1 }, { name: 'q2', text: q2 }], [], 'x')
    const edited = { ...files, 'sections/quiz.oui': '// mine\n' + files['sections/quiz.oui'] }
    expect(fileView(edited['sections/quiz.oui'], changeset[0]).source).toContain('// mine')
    expect(fileView(edited['sections/quiz.oui'], changeset[0]).conflicts.size).toBe(0)

    const clash = { ...files, 'sections/quiz.oui': files['sections/quiz.oui'].replace('Why?', 'How?') }
    const view = fileView(clash['sections/quiz.oui'], changeset[0])
    expect([...view.conflicts]).toEqual(['q1'])
    expect(view.source).toContain('How?')
    expect(view.source).toContain('And then?')
  })

  it('applies only the named changes', () => {
    const { changeset } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'q1', text: q1 }, { name: 'q2', text: q2 }], [], 'x')
    const view = fileView(files['sections/quiz.oui'], changeset[0], new Set(['q1']))
    expect(view.source).toContain('exactly')
    expect(view.source).not.toContain('And then')
  })
})

describe('stageSection and stageTopic', () => {
  const section = 'root = Flashcards("Words", [f1])\nf1 = Flashcard("Term", ["Meaning"])'

  it('stages a new file and its SectionRef in place', () => {
    const { changeset, error } = stageSection([], files, 'words', section, undefined, 'Vocabulary')
    expect(error).toBeUndefined()
    const view = stagedFiles(files, changeset)
    expect(view['sections/words.oui']).toBe(`${section}\n`)
    expect(view['topic.oui']).toContain('SectionRef("words")')
    const context = stagedContext({ topicId: 'demo', files, fileOrder: ['topic.oui', 'sections/quiz.oui'], diagnostics: {} }, changeset)
    expect(context.fileOrder).toEqual(['topic.oui', 'sections/quiz.oui', 'sections/words.oui'])
    expect(stageSection(changeset, files, 'words', section, undefined, 'again').error).toMatch(/already exists/)
    expect(stageSection([], files, 'Bad Name', section, undefined, 'x').error).toMatch(/not a section name/)
  })

  it('edits to a staged new file change its text', () => {
    let { changeset } = stageSection([], files, 'words', section, undefined, 'Vocabulary')
    ;({ changeset } = stageStatements(changeset, files, 'sections/words.oui', [{ name: 'f1', text: 'f1 = Flashcard("Word", ["Meaning"])' }], [], 'rename'))
    expect(stagedFiles(files, changeset)['sections/words.oui']).toContain('"Word"')
    expect(changeset.find((s) => s.file === 'sections/words.oui')!.changes).toHaveLength(1)
  })

  it('stages metadata fields and flags one the author changed meanwhile', () => {
    const { changeset } = stageTopic([], files, { title: 'Better demo', tags: ['a', 'b'] }, 'Retitle')
    expect(stagedFiles(files, changeset)['topic.oui']).toMatch(/"Better demo"[\s\S]*"a"/)
    const edited = { ...files, 'topic.oui': files['topic.oui'].replace('"Demo"', '"Mine"') }
    expect([...fileView(edited['topic.oui'], changeset[0]).conflicts]).toEqual(['title'])
    expect(stageTopic([], files, { title: 3 }, 'x').error).toMatch(/string/)
  })
})

describe('changesetNote', () => {
  it('tells the model once what the author decided', () => {
    let { changeset } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'q1', text: q1 }, { name: 'q2', text: q2 }], [], 'x')
    changeset = decide(decide(changeset, 'sections/quiz.oui', new Set(['q1']), 'applied'), 'sections/quiz.oui', new Set(['q2']), 'rejected')
    const first = changesetNote(changeset)
    expect(first.note).toContain('- sections/quiz.oui: applied q1; rejected q2')
    expect(changesetNote(first.changeset).note).toBe('')
    expect(changesetNote([] as Changeset).note).toBe('')
  })
})

describe('EditToolRunner and Studio reads', () => {
  const context = { topicId: 'demo', files, fileOrder: ['topic.oui', 'sections/quiz.oui'], diagnostics: {} }

  it('stages through the tool and answers with the verdict', () => {
    const runner = new EditToolRunner(context, [])
    const ok = runner.run('edit_section', JSON.stringify({ file: 'quiz', statements: `${q1}\n${q2}`, summary: 'Two questions' }))
    expect(ok.content).toMatch(/^Staged replace q1, add q2 in sections\/quiz.oui\. No new errors/)
    expect(ok.label).toBe('Two questions')
    const bad = runner.run('edit_section', JSON.stringify({ file: 'sections/quiz.oui', statements: 'root = Quiz("Check", [q1, q9])', summary: 'x' }))
    expect(bad.content).toMatch(/new errors[\s\S]*q9/)
    expect(runner.run('edit_section', '{nope').content).toMatch(/not valid JSON/)
    expect(runner.run('create_section', JSON.stringify({ name: 'quiz', source: 'root = Quiz("x", [])', summary: 'x' })).content).toMatch(/^Not staged: .*already exists/)
    expect(runner.run('describe_components', JSON.stringify({ names: ['Flashcards', 'Nope'] })).content).toMatch(/Flashcard\([\s\S]*Unknown components: Nope/)
  })

  it('reads source by default in Studio, over the staged view', () => {
    const { changeset } = stageStatements([], files, 'sections/quiz.oui', [{ name: 'q1', text: q1 }], [], 'x')
    const runner = new ContentToolRunner(stagedContext(context, changeset), true)
    expect(runner.run('read', JSON.stringify({ address: 'sections/quiz.oui #q1' })).content).toContain('Why, exactly?')
    expect(runner.run('read', JSON.stringify({ address: 'sections/quiz.oui #q1', source: false })).content).not.toContain('QuizQuestion(')
  })
})
