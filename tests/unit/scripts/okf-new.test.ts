import { describe, it, expect } from 'vitest'
import {
  parseArgs,
  buildSectionStub,
  buildHexMapYaml,
  buildTopicIndexMd,
  buildTopicIndexYaml,
  registerTopicInRootIndex,
  generateTopic,
  humanize,
  HEX_NODE_TYPE_BY_SECTION,
  type ScaffoldOptions,
} from '../../../scripts/okf-new'
import { KNOWN_SECTION_TYPES } from '../../../src/core/learning-engine/validation/gateway'

function makeOptions(overrides: Partial<ScaffoldOptions> = {}): ScaffoldOptions {
  return {
    topicId: 'unit-topic',
    title: 'Unit Topic',
    description: 'A topic used by unit tests.',
    category: 'Testing',
    tags: ['unit'],
    sections: ['intro'],
    ...overrides,
  }
}

describe('parseArgs', () => {
  it('parses the documented invocation', () => {
    const args = parseArgs(['http-basics', '--category', 'Architecture', '--sections', 'intro,text,quiz', '--tags', 'http,basics'])
    expect(args.topicId).toBe('http-basics')
    expect(args.category).toBe('Architecture')
    expect(args.sections).toEqual(['intro', 'text', 'quiz'])
    expect(args.tags).toEqual(['http', 'basics'])
    expect(args.title).toBe('Http Basics')
  })

  it('supports --flag=value syntax and always includes intro for the capital hub', () => {
    const args = parseArgs(['t1', '--category=Architecture', '--sections=quiz'])
    expect(args.category).toBe('Architecture')
    expect(args.sections).toEqual(['intro', 'quiz'])
  })

  it('rejects a missing topic slug or missing --sections', () => {
    expect(() => parseArgs([])).toThrow(/topic-slug/)
    expect(() => parseArgs(['t1'])).toThrow(/--sections is required/)
  })

  it('rejects invalid slugs, unknown types, and duplicates', () => {
    expect(() => parseArgs(['Bad_Slug', '--sections', 'text'])).toThrow(/Invalid topic slug/)
    expect(() => parseArgs(['t1', '--sections', 'text,not-a-type'])).toThrow(/Unknown section type/)
    expect(() => parseArgs(['t1', '--sections', 'quiz,quiz'])).toThrow(/Duplicate section type/)
  })
})

describe('buildSectionStub', () => {
  const opts = makeOptions()

  it('produces a section.md with type + resource for every known section type', () => {
    for (const type of KNOWN_SECTION_TYPES) {
      const files = buildSectionStub(type, opts)
      const sectionMd = files['section.md']
      expect(sectionMd, `section.md for ${type}`).toBeDefined()
      expect(sectionMd).toContain(`type: ${type}`)
      expect(sectionMd).toMatch(/^resource: \S+$/m)
      const dataFiles = Object.keys(files).filter((f) => f !== 'section.md')
      expect(dataFiles.length, `data files for ${type}`).toBeGreaterThan(0)
    }
  })

  it('throws for unknown types', () => {
    expect(() => buildSectionStub('nope', opts)).toThrow(/Unknown section type/)
  })
})

describe('generateTopic — Validation Gateway integrity', () => {
  it('each single section type generates with zero diagnostics', () => {
    for (const type of KNOWN_SECTION_TYPES) {
      const { files, diagnostics } = generateTopic(makeOptions({ topicId: `t-${type}`, sections: ['intro', type] }), '')
      expect(diagnostics, `${type}: ${JSON.stringify(diagnostics)}`).toEqual([])
      expect(files.has(`public/okf/t-${type}/sections/${type}/section.md`)).toBe(true)
    }
  })

  it('the full 16-type topic generates with zero diagnostics and all expected artifacts', () => {
    const { files, diagnostics } = generateTopic(
      makeOptions({ topicId: 'kitchen-sink', sections: [...KNOWN_SECTION_TYPES] }),
      '# Root\n\n## Testing\n* [Existing](existing/index.md — keep me\n'
    )
    expect(diagnostics).toEqual([])
    expect(files.has('public/okf/kitchen-sink/index.md')).toBe(true)
    expect(files.has('public/okf/kitchen-sink/index.yaml')).toBe(true)
    expect(files.has('public/hexmaps/kitchen-sink.yaml')).toBe(true)
    const rootIndex = files.get('public/okf/index.md') ?? ''
    expect(rootIndex).toContain('[Unit Topic](kitchen-sink/index.md)')
    expect(rootIndex).toContain('keep me')
  })

  it('reports a diagnostic when the topic is already registered in the root index', () => {
    const { diagnostics } = generateTopic(makeOptions(), '## Testing\n* [Dupe](unit-topic/index.md) — old\n')
    expect(diagnostics.some((d) => /already registered/.test(d.message))).toBe(true)
  })
})

describe('buildHexMapYaml', () => {
  it('capital binds intro, every section gets a node, boss requires all relics', () => {
    const yamlText = buildHexMapYaml(makeOptions({ sections: ['intro', 'text', 'quiz', 'flowchart'] }))
    expect(yamlText).toContain('sectionRef: "intro"')
    expect(HEX_NODE_TYPE_BY_SECTION['intro']).toBe('capital')
    for (const section of ['text', 'quiz', 'flowchart']) {
      expect(yamlText).toContain(`sectionRef: "${section}"`)
      expect(yamlText).toContain(`- "${section}-relic"`)
    }
    expect(yamlText).toContain('type: "quiz_encounter"')
    expect(yamlText).toContain('name: "Knowledge Guardian"')
    expect(yamlText).toContain('type: "boss_lair"')
    expect(yamlText).toContain('name: "The Failure Mode"')
  })

  it('intro-only topics still produce a solvable capital + boss campaign', () => {
    const { diagnostics } = generateTopic(makeOptions({ sections: ['intro'] }), '')
    expect(diagnostics).toEqual([])
  })
})

describe('registerTopicInRootIndex', () => {
  it('inserts under an existing category heading, keeping other categories intact', () => {
    const root = '---\nokf_version: "0.1"\n---\n# OKF\n\n## Architecture\n* [A](a/index.md) — a\n\n## Frontend\n* [B](b/index.md) — b\n'
    const out = registerTopicInRootIndex(root, 'Architecture', '* [New](new/index.md) — new')
    expect(out).toBe('---\nokf_version: "0.1"\n---\n# OKF\n\n## Architecture\n* [A](a/index.md) — a\n* [New](new/index.md) — new\n\n## Frontend\n* [B](b/index.md) — b\n')
  })

  it('creates a missing category heading at the end', () => {
    const root = '## Architecture\n* [A](a/index.md) — a\n'
    const out = registerTopicInRootIndex(root, 'Testing', '* [N](n/index.md) — n')
    expect(out).toBe('## Architecture\n* [A](a/index.md) — a\n\n## Testing\n* [N](n/index.md) — n\n')
  })
})

describe('topic index builders', () => {
  it('index.md links every section folder', () => {
    const md = buildTopicIndexMd(makeOptions({ sections: ['intro', 'quiz'] }))
    expect(md).toContain('# Unit Topic')
    expect(md).toContain('* [Intro](sections/intro/section.md)')
    expect(md).toContain('* [Quiz](sections/quiz/section.md)')
  })

  it('index.yaml carries category and tags', () => {
    const yamlText = buildTopicIndexYaml(makeOptions({ category: 'Architecture', tags: ['http'] }))
    expect(yamlText).toContain('category: Architecture')
    expect(yamlText).toContain('  - http')
  })

  it('humanize title-cases dashed slugs', () => {
    expect(humanize('taxonomy-browser')).toBe('Taxonomy Browser')
  })
})
