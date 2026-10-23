import { describe, expect, it } from 'vitest'
import { compileOUISection } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import {
  capResult,
  contentTreeOf,
  listParts,
  renderElement,
  sectionTitle,
} from '../../../../../../src/core/learning-engine/composition/oui/content-tree'

const QUIZ = `root = Quiz("Check", [q2, QuizQuestion("q3", "Third?", [QuizChoice("a", "Yes", true, "Right.")])])
q2 = QuizQuestion("q2", "Why?", [QuizChoice("a", "A", true, "Because"), c2], "Think.")
c2 = QuizChoice("b", "B", false, "No")
`

describe('content tree (decisions 121–123)', () => {
  it('addresses elements by the same anchors as the compiler source map', () => {
    const tree = contentTreeOf(QUIZ, 'sections/quiz.oui')!
    const { value, sourceMap } = compileOUISection(QUIZ)
    const questions = (value!.data as unknown as { questions: Array<{ choices: object[] }> }).questions
    const anchor = (a: { statement: string; path: string } | undefined) => `${a!.statement}${a!.path}`
    expect(tree.find(anchor(sourceMap.anchorOf(questions[0])))?.props.question).toBe('Why?')
    expect(tree.find(anchor(sourceMap.anchorOf(questions[0].choices[0])))?.props.text).toBe('A')
    expect(tree.find(anchor(sourceMap.anchorOf(questions[0].choices[1])))?.props.text).toBe('B')
    expect(tree.find(anchor(sourceMap.anchorOf(questions[1])))?.props.question).toBe('Third?')
    expect(tree.find('root.questions[1].choices[0]')?.props.text).toBe('Yes')
    expect(tree.find('nope')).toBeUndefined()
  })

  it('lists parts with parts of their own, and writes leaf parts out inline', () => {
    const tree = contentTreeOf(QUIZ, 'sections/quiz.oui')!
    expect(listParts(tree.root, tree)).toEqual([
      '- sections/quiz.oui #q2 QuizQuestion "Why?" (2 choices)',
      '- sections/quiz.oui #root.questions[1] QuizQuestion "Third?" (1 choices)',
    ])
    const section = renderElement(tree.root, tree)
    expect(section).toContain('title: Check')
    expect(section).toContain('  - → sections/quiz.oui #q2 QuizQuestion "Why?" (2 choices)')
    expect(section).not.toContain('Because')
    const question = renderElement(tree.find('q2')!, tree)
    expect(question).toContain('question: Why?')
    expect(question).toContain('correct: true')
    expect(question).toContain('explanation: No')
    expect(question).toContain('hint: Think.')
  })

  it('describes a drawing instead of its markup, and reads standard OpenUI sections', () => {
    const source = `// @openui "Airflow"
root = Card([Svg('<svg viewBox="0 0 10 10"><rect id="door" /><text x="1">Air in</text></svg>', "The path of air")])
`
    const tree = contentTreeOf(source)!
    const text = renderElement(tree.root, tree)
    expect(text).toContain('(drawing); labels: Air in; shapes: door')
    expect(text).not.toContain('<rect')
    expect(sectionTitle(source)).toBe('Airflow')
    expect(sectionTitle(QUIZ)).toBe('Check')
  })

  it('caps long results at a line break and says so', () => {
    const text = Array.from({ length: 50 }, (_, i) => `line ${i}`).join('\n')
    const capped = capResult(text, 40, 'read less')
    expect(capped.split('\n').slice(0, -1).join('\n').length).toBeLessThanOrEqual(40)
    expect(capped).toMatch(/… \(truncated; read less\)$/)
    expect(capResult('short', 40)).toBe('short')
  })
})
