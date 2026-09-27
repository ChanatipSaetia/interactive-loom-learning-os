import { describe, it, expect } from 'vitest'
import { validateSectionFiles } from '../../../../../src/core/learning-engine/validation/gateway'
import { parseParagraphs } from '../../../../../src/core/learning-engine/validation/layout'

const sectionMd = (frontmatter: string, body = '') => `---\n${frontmatter}\n---\n${body}`

const category = (title: string) => `icon: Box
title: ${title}
subtitle: s
description: d
details: d
analogy: a
primaryFocus: p
inScope: [a]
outOfScope: [b]
color: blue`

const ctx = { file: 'demo/sections/x' }

describe('validateSectionFiles', () => {
  it('assembles a single-file section and returns meta, data, and body', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: quiz\ntitle: Check\nresource: questions.yaml', 'Body text'),
      'questions.yaml': '- id: q1\n  question: Why?\n  choices:\n    - { id: a, text: Because, correct: true, explanation: Yes }',
    }, ctx)

    expect(result.status).toBe('valid')
    expect(result.payload.meta).toMatchObject({ type: 'quiz', title: 'Check', resource: 'questions.yaml' })
    expect(result.payload.data).toMatchObject({ type: 'quiz', questions: [{ id: 'q1' }] })
    expect(result.payload.body.trim()).toBe('Body text')
  })

  it('reports YAML syntax errors per file with 1-based positions', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: quiz\nresource: questions.yaml'),
      'questions.yaml': '- id: q1\n  question: [unclosed',
    }, ctx)

    expect(result.status).toBe('error')
    expect(result.diagnostics[0]).toMatchObject({ tier: 1, file: 'demo/sections/x/questions.yaml', line: 2, column: 22 })
  })

  it('requires section.md and a known type', () => {
    expect(validateSectionFiles({ 'items.yaml': '[]' }, ctx).diagnostics[0]).toMatchObject({
      tier: 1,
      message: 'Missing section.md.',
    })
    expect(validateSectionFiles({ 'section.md': sectionMd('title: No type') }, ctx).diagnostics[0]).toMatchObject({
      tier: 2,
      field: 'type',
    })
    expect(validateSectionFiles({ 'section.md': sectionMd('type: carousel') }, ctx).diagnostics[0].message).toContain(
      'Unknown section type "carousel"',
    )
  })

  it('names each missing file of a fixed-file layout', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: flowchart'),
      'actors.yaml': 'user: { title: User, desc: d }',
    }, ctx)

    expect(result.status).toBe('error')
    expect(result.diagnostics.map((d) => d.file)).toEqual([
      'demo/sections/x/systems.yaml',
      'demo/sections/x/steps.yaml',
      'demo/sections/x/journeys.yaml',
    ])
  })

  it('collects one item per file in filename order, skipping disabled `_` files', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: taxonomy-browser'),
      '02-second.yaml': category('Second'),
      '01-first.yaml': category('First'),
      '_draft.yaml': category('Draft'),
    }, ctx)

    expect(result.status).toBe('valid')
    const categories = result.payload.data.categories as Array<{ title: string }>
    expect(categories.map((c) => c.title)).toEqual(['First', 'Second'])
  })

  it('reads a collection from a single resource file holding an array', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: taxonomy-browser\nresource: categories.yaml'),
      'categories.yaml': `- ${category('Only').split('\n').join('\n  ')}`,
    }, ctx)

    expect((result.payload.data.categories as unknown[]).length).toBe(1)
  })

  it('turns markdown into paragraphs, falling back to the section.md body', () => {
    const fromFile = validateSectionFiles({
      'section.md': sectionMd('type: text'),
      'content.md': '# Heading\n\nFirst\n- Second',
    }, ctx)
    expect(fromFile.payload.data.paragraphs).toEqual(['First', 'Second'])

    const fromBody = validateSectionFiles({ 'section.md': sectionMd('type: text', 'Inline body') }, ctx)
    expect(fromBody.payload.data.paragraphs).toEqual(['Inline body'])
  })

  it('runs Tier 3 on the transformed output and reports warnings', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: scenario'),
      'scenarios.yaml': `id: s
title: S
nodes:
  start:
    prompt: Go?
    choices:
      - { id: c1, text: Yes, next: nowhere }`,
    }, ctx)

    expect(result.status).toBe('warning')
    expect(result.payload.data.startNode).toBe('start')
    expect(result.diagnostics[0]).toMatchObject({ tier: 3, field: 'nodes.start.choices[0].next' })
  })

  it('returns empty data when Tier 2 fails', () => {
    const result = validateSectionFiles({
      'section.md': sectionMd('type: quiz'),
      'questions.yaml': '- id: q1',
    }, ctx)

    expect(result.status).toBe('error')
    expect(result.payload.data).toEqual({})
    expect(result.diagnostics.every((d) => d.tier === 2)).toBe(true)
  })
})

describe('parseParagraphs', () => {
  it('skips headings and blank lines and strips list markers', () => {
    expect(parseParagraphs('# Title\n\n1. One\n-- Two\n  Three  ')).toEqual(['One', 'Two', 'Three'])
  })
})
