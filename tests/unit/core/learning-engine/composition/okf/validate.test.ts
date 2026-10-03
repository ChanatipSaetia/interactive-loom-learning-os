/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { validateOKFSection } from '../../../../../../src/core/learning-engine/validation/gateway'

describe('validateOKFSection (3-Tier Validation Gateway)', () => {
  // --- Tier 1 (Syntax) ---

  it('returns syntax error for invalid YAML', () => {
    const result = validateOKFSection('invalid: yaml: [')
    expect(result.status).toBe('error')
    expect(result.diagnostics.length).toBeGreaterThan(0)
    expect(result.diagnostics[0]?.tier).toBe(1)
  })

  it('extracts line number from js-yaml error when available', () => {
    const result = validateOKFSection('a: 1\n  b: [\nc: 3')
    expect(result.diagnostics.length).toBeGreaterThan(0)
    const syntaxErr = result.diagnostics.find((e: any) => e.tier === 1)
    expect(syntaxErr).toBeTruthy()
  })

  // --- Tier 2 (Schema) ---

  it('returns no errors for valid bullets section', () => {
    const result = validateOKFSection('type: bullets\nitems:\n  - text: Hello world')
    expect(result.status).toBe('valid')
    expect(result.payload).toBeTruthy()
  })

  it('returns schema error for missing required field', () => {
    const result = validateOKFSection('type: bullets')
    expect(result.status).toBe('error')
    const schemaErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'items')
    expect(schemaErr).toBeTruthy()
  })

  it('returns schema error for wrong field type', () => {
    const result = validateOKFSection('type: bullets\nitems: "not an array"')
    expect(result.status).toBe('error')
    const schemaErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'items')
    expect(schemaErr).toBeTruthy()
  })

  it('returns schema error for unknown type', () => {
    const result = validateOKFSection('type: unknown-type\nfoo: bar')
    expect(result.status).toBe('error')
    const typeErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'type')
    expect(typeErr).toBeTruthy()
  })

  it('returns schema error for missing type field', () => {
    const result = validateOKFSection('items:\n  - text: Hello')
    expect(result.status).toBe('error')
    const typeErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'type')
    expect(typeErr).toBeTruthy()
  })

  it('validates quiz section schema', () => {
    const validQuiz = `type: quiz
questions:
  - id: q1
    question: What is X?
    choices:
      - id: a
        text: Option A
        correct: true
        explanation: Correct`
    const result = validateOKFSection(validQuiz)
    expect(result.status).toBe('valid')
  })

  it('returns error for quiz missing questions', () => {
    const result = validateOKFSection('type: quiz')
    const qErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'questions')
    expect(qErr).toBeTruthy()
  })

  it('validates concept-map section schema', () => {
    const validCM = `type: concept-map
nodes:
  n1:
    id: n1
    title: Node 1
    category: A
  n2:
    id: n2
    title: Node 2
    category: B
edges:
  - from: n1
    to: n2`
    const result = validateOKFSection(validCM)
    expect(result.status).toBe('valid')
  })

  it('returns errors for concept-map missing nodes and edges', () => {
    const result = validateOKFSection('type: concept-map')
    const nodeErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'nodes')
    const edgeErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'edges')
    expect(nodeErr).toBeTruthy()
    expect(edgeErr).toBeTruthy()
  })

  it('uses metaType fallback when type field missing', () => {
    const result = validateOKFSection('items:\n  - text: Hello', 'bullets')
    const typeErr = result.diagnostics.find((e: any) => e.tier === 2 && e.field === 'type')
    expect(typeErr).toBeFalsy()
    expect(result.status).toBe('valid')
  })
})
