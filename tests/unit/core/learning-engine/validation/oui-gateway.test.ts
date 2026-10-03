import { describe, it, expect } from 'vitest'
import { validateOUISection } from '../../../../../src/core/learning-engine/validation/oui-gateway'

const context = { topicId: 'demo', sectionName: 'quiz', file: 'demo/sections/quiz.oui' }

describe('validateOUISection', () => {
  it('returns tier 1 errors and a null payload when the source cannot compile', () => {
    const result = validateOUISection(`root = Quizz("Q", [])`, context)
    expect(result.status).toBe('error')
    expect(result.payload).toBeNull()
    expect(result.diagnostics[0]).toMatchObject({ tier: 1, line: 1, file: 'demo/sections/quiz.oui' })
    expect(result.diagnostics[0].fixHint).toBeTruthy()
  })

  it('reports OpenUI type mismatches as tier 2 at the offending statement', () => {
    const result = validateOUISection([
      'root = Quiz("Q", [q1])',
      'q1 = QuizQuestion("q1", "Why?", [c])',
      'c = QuizChoice("a", "A", "yes", "e")',
    ].join('\n'), context)
    expect(result.status).toBe('error')
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ tier: 2, line: 3, field: 'c (QuizChoice/correct)' }))
  })

  it('runs the subdomain Zod schema (tier 2) and points at the producing line', () => {
    const result = validateOUISection([
      'root = PillarLayer("Stack", [l1], [a, b])',
      'l1 = Layer("l1", "Layer 1")',
      'a = MatrixBlock("a", "A", l1, 0)',
      'b = MatrixBlock("b", "B", "missing-layer", 1)',
    ].join('\n'), context)
    expect(result.status).toBe('error')
    expect(result.payload).not.toBeNull()
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      tier: 2,
      line: 4,
      message: expect.stringContaining('INVALID_LAYER_REF'),
    }))
  })

  it('runs subdomain tier 3 checks and maps bracket paths to lines', () => {
    const result = validateOUISection([
      'root = ConceptMap("Map", [a], [link])',
      'a = Concept("a", "A")',
      'link = ConceptLink(a, "ghost")',
    ].join('\n'), context)
    expect(result.status).toBe('warning')
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ tier: 3, line: 3, message: expect.stringContaining('ghost') }))
  })

  it('reports unused statements as warnings', () => {
    const result = validateOUISection('root = Bullets("T", [Bullet("a")])\nunused = Bullets("U", [])', context)
    expect(result.status).toBe('warning')
    expect(result.payload?.data).toEqual({ type: 'bullets', items: [{ text: 'a' }] })
  })
})
