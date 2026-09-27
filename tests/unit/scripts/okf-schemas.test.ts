/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// Drift test: the committed schemas/*.json must match what the co-located Zod
// SectionSchemas produce. If a Zod schema changes without running
// `npm run okf:schemas`, this suite fails.
import { describe, it, expect } from 'vitest'
// @ts-ignore
import * as fs from 'fs'
// @ts-ignore
import * as path from 'path'

import {
  SCHEMA_TARGETS,
  buildAllSchemas,
  SectionFrontmatterSchema,
} from '../../../scripts/okf-schemas-manifest'
import { KNOWN_SECTION_TYPES } from '../../../src/core/learning-engine/validation/gateway'

// @ts-ignore - Node globals are not in the browser tsconfig types
const ROOT = path.resolve(process.cwd())

const built = buildAllSchemas()

describe('OKF JSON Schema generation (drift)', () => {
  it('generates a schema for every declared target', () => {
    expect(Object.keys(built).sort()).toEqual(SCHEMA_TARGETS.map((t) => t.outPath).sort())
  })

  for (const target of SCHEMA_TARGETS) {
    it(`committed schema is up to date: ${target.outPath}`, () => {
      const abs = path.resolve(ROOT, target.outPath)
      expect(fs.existsSync(abs), `${target.outPath} is missing — run \`npm run okf:schemas\``).toBe(true)
      const committed = JSON.parse(fs.readFileSync(abs, 'utf-8'))
      expect(committed, `${target.outPath} drifted from Zod — run \`npm run okf:schemas\``).toEqual(
        built[target.outPath]
      )
    })
  }
})

describe('OKF JSON Schema coverage', () => {
  it('covers every known section type except markdown-only "text"', () => {
    const covered = new Set(SCHEMA_TARGETS.map((t) => t.sectionType))
    for (const type of KNOWN_SECTION_TYPES) {
      if (type === 'text') continue // paragraphs come from markdown, not YAML
      expect(covered.has(type), `no file schema declared for section type "${type}"`).toBe(true)
    }
  })

  it('covers hex campaign maps and section.md frontmatter', () => {
    const paths = SCHEMA_TARGETS.map((t) => t.outPath)
    expect(paths).toContain('schemas/hexmaps/hex-campaign.schema.json')
    expect(paths).toContain('schemas/okf/section-frontmatter.schema.json')
  })
})

describe('OKF JSON Schema content (editor behavior)', () => {
  it('quiz questions.yaml flags a missing choice explanation', () => {
    const schema = built['schemas/okf/quiz/questions.schema.json'] as any
    expect(schema.type).toBe('array')
    const choice = schema.items.properties.choices.items
    expect(choice.required).toEqual(expect.arrayContaining(['id', 'text', 'correct', 'explanation']))
  })

  it('describes per-file INPUT shapes, not transformed render shapes', () => {
    // flowchart refs stay `string | { id }` in YAML input (no internal `_tag`)
    const steps = built['schemas/okf/flowchart/steps.schema.json'] as any
    const rendered = JSON.stringify(steps)
    expect(rendered).not.toContain('_tag')
    expect(rendered).toContain('"id"')

    // concept-map nodes keys the nodes record by id (input) instead of injecting ids (output)
    const concepts = built['schemas/okf/concept-map/concepts.schema.json'] as any
    expect(concepts.properties.nodes.additionalProperties.type).toBe('object')
  })

  it('hex campaign schema requires the core campaign fields and node type enum', () => {
    const schema = built['schemas/hexmaps/hex-campaign.schema.json'] as any
    expect(schema.required).toEqual(expect.arrayContaining(['topicId', 'topicTitle', 'nodes']))
    const nodeType = schema.properties.nodes.items.properties.type
    expect(nodeType.enum).toEqual(
      expect.arrayContaining(['capital', 'boss_lair', 'quiz_encounter', 'reading_sanctuary'])
    )
  })

  it('section frontmatter schema enumerates known section types', () => {
    const schema = built['schemas/okf/section-frontmatter.schema.json'] as any
    expect(schema.required).toContain('type')
    expect(schema.properties.type.enum).toContain('quiz')
    expect(schema.properties.type.enum.length).toBe(KNOWN_SECTION_TYPES.size)
  })

  it('SectionFrontmatterSchema accepts a canonical section.md frontmatter', () => {
    const result = SectionFrontmatterSchema.safeParse({
      type: 'quiz',
      title: 'Knowledge Check',
      resource: 'questions.yaml',
      intro: { what: 'Practice', why: 'Retention', next: 'Next: flashcards' },
    })
    expect(result.success).toBe(true)
  })
})
