import { describe, it, expect } from 'vitest'
import { parseAndValidateYAML } from '../../../../src/core/okf/validate'

describe('parseAndValidateYAML', () => {
  // --- Syntax errors ---

  it('returns syntax error for invalid YAML', () => {
    const result = parseAndValidateYAML('invalid: yaml: [')
    expect(result.data).toBeNull()
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]?.kind).toBe('syntax')
  })

  it('extracts line number from js-yaml error when available', () => {
    const result = parseAndValidateYAML('a: 1\n  b: [\nc: 3')
    expect(result.errors.length).toBeGreaterThan(0)
    const syntaxErr = result.errors.find((e) => e.kind === 'syntax')
    expect(syntaxErr).toBeTruthy()
    if (syntaxErr?.kind === 'syntax') {
      // js-yaml may or may not include line info depending on error type
      if (syntaxErr.line != null) {
        expect(typeof syntaxErr.line).toBe('number')
      }
    }
  })

  // --- Schema validation ---

  it('returns no errors for valid text section', () => {
    const result = parseAndValidateYAML('type: text\nparagraphs:\n  - Hello world')
    expect(result.errors.length).toBe(0)
    expect(result.data).toBeTruthy()
  })

  it('returns schema error for missing required field', () => {
    const result = parseAndValidateYAML('type: text')
    expect(result.errors.length).toBeGreaterThan(0)
    const schemaErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'paragraphs')
    expect(schemaErr).toBeTruthy()
  })

  it('returns schema error for wrong field type', () => {
    const result = parseAndValidateYAML('type: text\nparagraphs: "not an array"')
    expect(result.errors.length).toBeGreaterThan(0)
    const schemaErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'paragraphs')
    expect(schemaErr).toBeTruthy()
    if (schemaErr?.kind === 'schema') {
      expect(schemaErr.message).toContain('array')
    }
  })

  it('returns schema error for unknown type', () => {
    const result = parseAndValidateYAML('type: unknown-type\nfoo: bar')
    expect(result.errors.length).toBeGreaterThan(0)
    const typeErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'type')
    expect(typeErr).toBeTruthy()
    if (typeErr?.kind === 'schema') {
      expect(typeErr.message).toContain('unknown-type')
    }
  })

  it('returns schema error for missing type field', () => {
    const result = parseAndValidateYAML('paragraphs:\n  - Hello')
    expect(result.errors.length).toBeGreaterThan(0)
    const typeErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'type')
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
    const result = parseAndValidateYAML(validQuiz)
    expect(result.errors.length).toBe(0)
  })

  it('returns error for quiz missing questions', () => {
    const result = parseAndValidateYAML('type: quiz')
    const qErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'questions')
    expect(qErr).toBeTruthy()
  })

  it('validates concept-map section schema', () => {
    const validCM = `type: concept-map
nodes:
  n1:
    id: n1
    title: Node 1
    category: A
edges:
  - from: n1
    to: n2`
    const result = parseAndValidateYAML(validCM)
    expect(result.errors.length).toBe(0)
  })

  it('returns errors for concept-map missing nodes and edges', () => {
    const result = parseAndValidateYAML('type: concept-map')
    const nodeErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'nodes')
    const edgeErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'edges')
    expect(nodeErr).toBeTruthy()
    expect(edgeErr).toBeTruthy()
  })

  it('validates scenario section schema', () => {
    const validScenario = `type: scenario
id: sc1
title: Test
nodes:
  start:
    id: start
startNode: start`
    const result = parseAndValidateYAML(validScenario)
    expect(result.errors.length).toBe(0)
  })

  it('validates decision-tree section schema', () => {
    const validDT = `type: decision-tree
id: dt1
title: Test
root: root
nodes:
  root:
    id: root`
    const result = parseAndValidateYAML(validDT)
    expect(result.errors.length).toBe(0)
  })

  it('validates formula-sandbox section schema', () => {
    const validFS = `type: formula-sandbox
variables: []
metrics: []`
    const result = parseAndValidateYAML(validFS)
    expect(result.errors.length).toBe(0)
  })

  it('uses metaType fallback when type field missing', () => {
    const result = parseAndValidateYAML('paragraphs:\n  - Hello', 'text')
    // Should not report missing type error since metaType provided
    const typeErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'type')
    expect(typeErr).toBeFalsy()
    // Should still validate against text schema
    expect(result.errors.length).toBe(0)
  })

  it('returns error for non-object YAML root', () => {
    const result = parseAndValidateYAML('- item1\n- item2')
    expect(result.errors.length).toBeGreaterThan(0)
    const rootErr = result.errors.find((e) => e.kind === 'schema' && e.field === 'root')
    expect(rootErr).toBeTruthy()
  })
})
