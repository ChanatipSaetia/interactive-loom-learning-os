import { describe, expect, it } from 'vitest'
import {
  applyEditBlock,
  applyOrder,
  checkProposal,
  diffLines,
  parseEditBlocks,
} from '../../../../../../src/core/supporting/authoring-editor/assistant'

const QUIZ = `root = Quiz("Check", [q1, q2])
q1 = QuizQuestion("q1", "First?", [QuizChoice("a", "Yes", true, "Right."), QuizChoice("b", "No", false, "Wrong.")])
q2 = QuizQuestion("q2", "Second?", [QuizChoice("a", "Yes", true, "Right."), QuizChoice("b", "No", false, "Wrong.")])
`
const TOPIC = 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz")])\n'
const files = { 'topic.oui': TOPIC, 'sections/quiz.oui': QUIZ }

const reply = (...blocks: string[]) => `Here you go.\n\n${blocks.join('\n\n')}\n\nDone.`
const block = (info: string, body: string) => `\`\`\`oui-edit ${info}\n${body}\n\`\`\``

describe('parseEditBlocks', () => {
  it('reads every oui-edit block in order, also inside lists, and normalises paths', () => {
    const blocks = parseEditBlocks(`${block('file=sections/quiz.oui', 'q1 = QuizQuestion("q1", "New?", [])')}\n\n1. Then:\n\n   \`\`\`oui-edit file="demo/topic.oui"\n   root = Topic("D", "T", "d", [])\n   \`\`\`\n\n\`\`\`oui\nnot = AnEdit()\n\`\`\``)
    expect(blocks.map((b) => [b.index, b.file, b.create, b.statements.map((s) => s.name)])).toEqual([
      [0, 'sections/quiz.oui', false, ['q1']],
      [1, 'topic.oui', false, ['root']],
    ])
  })

  it('flags blocks it cannot use', () => {
    const [noFile, badPath, empty, createTopic] = parseEditBlocks(
      reply(block('', 'q = A()'), block('file=../etc/passwd', 'q = A()'), block('file=sections/quiz.oui', '// nothing'), block('file=topic.oui mode=create', 'root = Topic()')),
    )
    expect(noFile.error).toMatch(/no file=/)
    expect(badPath.error).toMatch(/is not topic.oui or sections/)
    expect(empty.error).toMatch(/no `name = …` statements/)
    expect(createTopic.error).toMatch(/already exists/)
  })

  it('marks DELETE statements', () => {
    const [b] = parseEditBlocks(block('file=sections/quiz.oui', 'q2 = DELETE'))
    expect(b.statements).toEqual([{ name: 'q2', text: 'q2 = DELETE', remove: true }])
  })
})

describe('applyEditBlock', () => {
  it('replaces by name whatever the line numbers, adds new names after the last change, deletes', () => {
    const [b] = parseEditBlocks(block('file=sections/quiz.oui', 'q1 = QuizQuestion("q1", "Better?", [c1])\nc1 = QuizChoice("a", "Yes", true, "Right.")\nq2 = DELETE'))
    const result = applyEditBlock(QUIZ, b)
    expect(result.ok).toBe(true)
    expect(result.source).toBe(`root = Quiz("Check", [q1, q2])
q1 = QuizQuestion("q1", "Better?", [c1])
c1 = QuizChoice("a", "Yes", true, "Right.")
`)
    expect(result.changes.map((c) => [c.kind, c.name])).toEqual([['replace', 'q1'], ['add', 'c1'], ['delete', 'q2']])
  })

  it('adds new statements at the end when nothing else changed', () => {
    const [b] = parseEditBlocks(block('file=sections/quiz.oui', 'q3 = QuizQuestion("q3", "Third?", [])'))
    expect(applyEditBlock(QUIZ, b).source).toBe(`${QUIZ}q3 = QuizQuestion("q3", "Third?", [])\n`)
  })

  it('creates files, and refuses to create one that exists or change one that does not', () => {
    const [create] = parseEditBlocks(block('file=sections/extra.oui mode=create', 'root = Text("Extra", ["Hi."])'))
    expect(applyEditBlock(undefined, create)).toMatchObject({ ok: true, source: 'root = Text("Extra", ["Hi."])\n' })
    expect(applyEditBlock('x', create)).toMatchObject({ ok: false, error: expect.stringMatching(/already exists/) })
    const [change] = parseEditBlocks(block('file=sections/extra.oui', 'root = Text("Extra", [])'))
    expect(applyEditBlock(undefined, change)).toMatchObject({ ok: false, error: expect.stringMatching(/mode=create/) })
  })

  it('fails when deleting a statement that is not there', () => {
    const [b] = parseEditBlocks(block('file=sections/quiz.oui', 'nope = DELETE'))
    expect(applyEditBlock(QUIZ, b)).toMatchObject({ ok: false, error: expect.stringMatching(/no statement "nope"/) })
  })
})

describe('checkProposal', () => {
  it('passes edits that apply and validate', () => {
    const blocks = parseEditBlocks(block('file=sections/quiz.oui', 'q1 = QuizQuestion("q1", "Better?", [QuizChoice("a", "Yes", true, "Right.")])'))
    expect(checkProposal('demo', blocks, files).problems).toEqual([])
  })

  it('reports references that no longer resolve, failed blocks and unlisted new sections', () => {
    const blocks = parseEditBlocks(reply(
      block('file=sections/quiz.oui', 'q1 = DELETE'),
      block('file=sections/quiz.oui', 'gone = DELETE'),
      block('file=sections/extra.oui mode=create', 'root = Text("Extra", ["Hi."])'),
    ))
    const { problems } = checkProposal('demo', blocks, files)
    expect(problems.some((p) => p.startsWith('sections/quiz.oui') && /q1/.test(p))).toBe(true)
    expect(problems).toContain('sections/quiz.oui: sections/quiz.oui has no statement "gone" to delete.')
    expect(problems.some((p) => /extra.oui is new but topic.oui does not list/.test(p))).toBe(true)
  })

  it('applies new files before topic.oui, so a new SectionRef finds its file', () => {
    const blocks = parseEditBlocks(reply(
      block('file=topic.oui', 'root = Topic("Demo", "Test", "A demo.", [SectionRef("quiz"), SectionRef("extra")])'),
      block('file=sections/extra.oui mode=create', 'root = Text("Extra", ["Hi."])'),
    ))
    expect(applyOrder(blocks).map((b) => b.file)).toEqual(['sections/extra.oui', 'topic.oui'])
    expect(checkProposal('demo', blocks, files).problems).toEqual([])
  })

  it('does not count errors a file already had', () => {
    const broken = { ...files, 'sections/quiz.oui': `${QUIZ}x = Missing(\n` }
    const blocks = parseEditBlocks(block('file=sections/quiz.oui', 'q2 = QuizQuestion("q2", "Still?", [QuizChoice("a", "Yes", true, "Right.")])'))
    expect(checkProposal('demo', blocks, broken).problems).toEqual([])
  })
})

describe('diffLines', () => {
  it('keeps common lines and marks the rest', () => {
    expect(diffLines('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'remove', text: 'b' },
      { kind: 'add', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'add', text: 'd' },
    ])
  })
})
