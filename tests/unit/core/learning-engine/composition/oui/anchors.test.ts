import { describe, it, expect } from 'vitest'
import { compileOUISection, sourceMapOf } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { validateOUISection } from '../../../../../../src/core/learning-engine/validation/oui-gateway'

const source = `root = Quiz("Check", [q2])
q2 = QuizQuestion("kafka-offsets", "Why?", [QuizChoice("a", "A", true, "Because"), c2])
c2 = QuizChoice("b", "B", false, "No")
`

interface QuizData { questions: Array<{ choices: object[] }> }

describe('OpenUI anchors', () => {
  it('maps compiled objects to their nearest statement and prop path', () => {
    const { value, sourceMap } = compileOUISection(source)
    const data = value!.data as unknown as QuizData
    const question = data.questions[0]
    expect(sourceMap.anchorOf(data)).toEqual({ statement: 'root', path: '' })
    expect(sourceMap.anchorOf(question)).toEqual({ statement: 'q2', path: '' })
    expect(sourceMap.anchorOf(question.choices[0])).toEqual({ statement: 'q2', path: '.choices[0]' })
    expect(sourceMap.anchorOf(question.choices[1])).toEqual({ statement: 'c2', path: '' })
    expect(sourceMap.statementOf(question.choices[0])).toBe('q2')
    expect(sourceMap.lineOf('q2')).toBe(2)
    expect(sourceMap.anchorOf('not an object')).toBeUndefined()
  })

  it('finds the source map from a payload, also through the Validation Gateway', () => {
    const compiled = compileOUISection(source)
    expect(sourceMapOf(compiled.value)).toBe(compiled.sourceMap)
    const validated = validateOUISection(source)
    const map = sourceMapOf(validated.payload)
    expect(map?.anchorOf((validated.payload!.data as unknown as QuizData).questions[0])).toEqual({ statement: 'q2', path: '' })
    expect(sourceMapOf(null)).toBeUndefined()
    expect(sourceMapOf({ meta: { type: 'text', title: '', resource: '.' }, data: { type: 'text' } } as never)).toBeUndefined()
  })
})
