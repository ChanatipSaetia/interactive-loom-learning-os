import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import {
  parseArgs,
  parseFromArg,
  briefFromArgs,
  buildBriefYaml,
  buildSectionStub,
  buildHexMapYaml,
  buildTopicIndexMd,
  buildTopicIndexYaml,
  registerTopicInRootIndex,
  planTopic,
  humanize,
  HEX_NODE_TYPE_BY_SECTION,
  type RepoView,
  type StubContext,
} from '../../../scripts/okf-new'
import { KNOWN_SECTION_TYPES, validateSectionFiles, validateHexCampaign } from '../../../src/core/learning-engine/validation/gateway'
import {
  validateTopicBrief,
  validateTopicAgainstBrief,
  type TopicBrief,
} from '../../../src/core/learning-engine/validation/topic-brief'

const ROOT_INDEX = '# Root\n\n## Testing\n* [Existing](existing/index.md) — keep me\n'

function makeBrief(overrides: Partial<TopicBrief> = {}): TopicBrief {
  return {
    id: 'unit-topic',
    title: 'Unit Topic',
    description: 'A topic used by unit tests.',
    category: 'Testing',
    tags: ['unit'],
    boss: { title: 'The Stale Cache Wraith', failureMode: 'Serving outdated data.' },
    tracks: [
      {
        id: 'directives',
        title: 'Directives',
        sections: [
          {
            name: 'directives',
            type: 'taxonomy-browser',
            title: 'Cache Directives',
            keyItem: true,
            teaches: [{ id: 'max-age', point: 'max-age sets freshness in seconds' }],
          },
          { name: 'directives-quiz', type: 'quiz', title: 'Directive Check', keyItem: false, teaches: [] },
        ],
      },
      {
        id: 'revalidation',
        title: 'Revalidation',
        sections: [
          { name: 'etags', type: 'text', title: 'ETags', keyItem: true, teaches: [] },
          { name: 'etags-quiz', type: 'quiz', title: 'ETag Check', keyItem: false, teaches: [] },
        ],
      },
    ],
    ...overrides,
  }
}

/** In-memory repo: repo-relative path → content. */
function memoryRepo(files: Map<string, string> = new Map([['public/okf/index.md', ROOT_INDEX]])): RepoView & { files: Map<string, string> } {
  return { files, read: (p) => files.get(p) }
}

function apply(repo: { files: Map<string, string> }, planned: Map<string, string>): void {
  for (const [p, c] of planned) repo.files.set(p, c)
}

/** Validate the topic in the repo against its brief, the same way okf:validate does. */
function diskCheck(brief: TopicBrief, repo: { files: Map<string, string> }) {
  const topicDir = `public/okf/${brief.id}`
  const bySection = new Map<string, Record<string, string>>()
  for (const [p, c] of repo.files) {
    const m = p.match(new RegExp(`^${topicDir}/sections/([^/]+)/(.+)$`))
    if (!m) continue
    if (!bySection.has(m[1])) bySection.set(m[1], {})
    bySection.get(m[1])![m[2]] = c
  }
  const sections = [...bySection].map(([name, files]) => {
    const res = validateSectionFiles(files, { file: `${topicDir}/sections/${name}` })
    return { name, type: res.payload.meta.type, data: res.status === 'error' ? undefined : (res.payload.data as Record<string, unknown>) }
  })
  return validateTopicAgainstBrief(brief, {
    topicDir,
    sections,
    indexYaml: repo.files.get(`${topicDir}/index.yaml`),
    rootIndexMd: repo.files.get('public/okf/index.md') ?? '',
    hexMapExists: repo.files.has(`public/hexmaps/${brief.id}.yaml`),
  })
}

describe('parseArgs / parseFromArg', () => {
  it('parses the documented flag invocation', () => {
    const args = parseArgs(['http-basics', '--category', 'Architecture', '--sections', 'intro,text,quiz', '--tags', 'http,basics'])
    expect(args.topicId).toBe('http-basics')
    expect(args.category).toBe('Architecture')
    expect(args.sections).toEqual(['intro', 'text', 'quiz'])
    expect(args.tags).toEqual(['http', 'basics'])
    expect(args.title).toBe('Http Basics')
  })

  it('supports --flag=value syntax and always includes intro for the capital hub', () => {
    const args = parseArgs(['t1', '--category=Architecture', '--sections=text,quiz'])
    expect(args.category).toBe('Architecture')
    expect(args.sections).toEqual(['intro', 'text', 'quiz'])
  })

  it('rejects missing slug/sections, invalid slugs, unknown types, duplicates, and < 2 content sections', () => {
    expect(() => parseArgs([])).toThrow(/topic-slug/)
    expect(() => parseArgs(['t1'])).toThrow(/--sections is required/)
    expect(() => parseArgs(['Bad_Slug', '--sections', 'text,quiz'])).toThrow(/Invalid topic slug/)
    expect(() => parseArgs(['t1', '--sections', 'text,not-a-type'])).toThrow(/Unknown section type/)
    expect(() => parseArgs(['t1', '--sections', 'quiz,quiz'])).toThrow(/Duplicate section type/)
    expect(() => parseArgs(['t1', '--sections', 'intro,quiz'])).toThrow(/at least 2 section types/)
  })

  it('parses --from', () => {
    expect(parseFromArg(['--from', 'public/okf/x/brief.yaml'])).toBe('public/okf/x/brief.yaml')
    expect(parseFromArg(['--from=public/okf/x/brief.yaml'])).toBe('public/okf/x/brief.yaml')
    expect(parseFromArg(['x', '--sections', 'a'])).toBeUndefined()
    expect(() => parseFromArg(['--from'])).toThrow(/needs a path/)
  })
})

describe('starter brief (flag form)', () => {
  it('splits sections into two tracks, last of each a key item, and round-trips through the brief validator', () => {
    const args = parseArgs(['http-basics', '--category', 'Architecture', '--sections', 'taxonomy-browser,flowchart,quiz'])
    const brief = briefFromArgs(args)
    expect(brief.tracks.map((t) => t.sections.map((s) => s.name))).toEqual([['taxonomy-browser', 'flowchart'], ['quiz']])
    expect(brief.tracks.map((t) => t.sections.map((s) => s.keyItem))).toEqual([[false, true], [true]])

    const result = validateTopicBrief(buildBriefYaml(brief))
    expect(result.diagnostics).toEqual([])
    expect(result.payload).toEqual(brief)
  })

  it('buildBriefYaml round-trips teaches', () => {
    const brief = makeBrief()
    expect(validateTopicBrief(buildBriefYaml(brief)).payload).toEqual(brief)
  })
})

describe('buildSectionStub', () => {
  const ctx: StubContext = { topicId: 'unit-topic', title: 'Unit Topic', tags: ['unit'] }

  it('produces a section.md with type + resource for every known section type', () => {
    for (const type of KNOWN_SECTION_TYPES) {
      const files = buildSectionStub(type, ctx, 'Custom Title')
      expect(files['section.md'], `section.md for ${type}`).toContain(`type: ${type}`)
      expect(files['section.md']).toContain('title: "Custom Title"')
      expect(files['section.md']).toMatch(/^resource: \S+$/m)
      expect(Object.keys(files).filter((f) => f !== 'section.md').length, `data files for ${type}`).toBeGreaterThan(0)
      expect(validateSectionFiles(files).diagnostics, type).toEqual([])
    }
  })

  it('writes groundedIn into quiz and reflection-sequence stubs', () => {
    const quiz = validateSectionFiles(buildSectionStub('quiz', { ...ctx, groundedIn: 'max-age' }))
    expect((quiz.payload.data as { questions: { groundedIn?: string }[] }).questions[0].groundedIn).toBe('max-age')
    const seq = validateSectionFiles(buildSectionStub('reflection-sequence', { ...ctx, groundedIn: 'max-age' }))
    expect((seq.payload.data as { challenges: { groundedIn?: string }[] }).challenges[0].groundedIn).toBe('max-age')
  })

  it('throws for unknown types', () => {
    expect(() => buildSectionStub('nope', ctx)).toThrow(/Unknown section type/)
  })
})

describe('planTopic — fresh topic', () => {
  it('scaffolds a topic that validates clean and matches its brief', () => {
    const brief = makeBrief()
    const repo = memoryRepo()
    const plan = planTopic(brief, repo)
    expect(plan.diagnostics).toEqual([])
    for (const name of ['intro', 'directives', 'directives-quiz', 'etags', 'etags-quiz']) {
      expect(plan.files.has(`public/okf/unit-topic/sections/${name}/section.md`), name).toBe(true)
    }
    expect(plan.files.has('public/okf/unit-topic/brief.yaml')).toBe(false) // the brief is the input, never generated here
    const rootIndex = plan.files.get('public/okf/index.md') ?? ''
    expect(rootIndex).toContain('[Unit Topic](unit-topic/index.md)')
    expect(rootIndex).toContain('keep me')

    apply(repo, plan.files)
    expect(diskCheck(brief, repo)).toEqual([])
  })

  it('grounds scaffolded quizzes in the prerequisite teach point', () => {
    const plan = planTopic(makeBrief(), memoryRepo())
    expect(plan.files.get('public/okf/unit-topic/sections/directives-quiz/questions.yaml')).toContain('groundedIn: max-age')
    expect(plan.files.get('public/okf/unit-topic/sections/etags-quiz/questions.yaml')).not.toContain('groundedIn')
  })

  it('generates the intro roadmap and a topic index.md grouped by track', () => {
    const plan = planTopic(makeBrief(), memoryRepo())
    const intro = yaml.load(plan.files.get('public/okf/unit-topic/sections/intro/content.yaml')!) as { roadmap: { sectionId: string }[] }
    expect(intro.roadmap.map((r) => r.sectionId)).toEqual(['directives', 'directives-quiz', 'etags', 'etags-quiz'])
    const md = plan.files.get('public/okf/unit-topic/index.md')!
    expect(md).toContain('## Directives\n* [Cache Directives](sections/directives/section.md)')
    expect(md).toContain('## Revalidation')
  })

  it('every known section type scaffolds clean (types may repeat under different names)', () => {
    const types = [...KNOWN_SECTION_TYPES].filter((t) => t !== 'intro')
    const section = (type: string, i: number) => ({ name: `${type}-${i}`, type, title: humanize(type), keyItem: i === 0, teaches: [] })
    const brief = makeBrief({
      tracks: [
        { id: 'a', title: 'A', sections: types.map((t) => section(t, 0)) },
        { id: 'b', title: 'B', sections: types.map((t) => section(t, 1)) },
      ],
    })
    expect(validateTopicBrief(buildBriefYaml(brief)).diagnostics).toEqual([])
    const repo = memoryRepo()
    const plan = planTopic(brief, repo)
    expect(plan.diagnostics).toEqual([])
    apply(repo, plan.files)
    expect(diskCheck(brief, repo)).toEqual([])
  })
})

describe('planTopic — additive re-run', () => {
  it('re-running an unchanged brief writes nothing', () => {
    const brief = makeBrief()
    const repo = memoryRepo()
    apply(repo, planTopic(brief, repo).files)
    const again = planTopic(brief, repo)
    expect(again.diagnostics).toEqual([])
    expect([...again.files.keys()]).toEqual([])
  })

  it('adds a new section, its hex node at the track tip and its key item, keeping edited content', () => {
    const brief = makeBrief()
    const repo = memoryRepo()
    apply(repo, planTopic(brief, repo).files)
    const edited = 'public/okf/unit-topic/sections/etags/content.md'
    repo.files.set(edited, 'Hand-written lesson.\n')

    const grown = makeBrief()
    grown.tracks[1].sections.push({ name: 'etags-flow', type: 'flowchart', title: 'Revalidation Flow', keyItem: true, teaches: [] })
    const plan = planTopic(grown, repo)
    expect(plan.diagnostics).toEqual([])
    expect(plan.files.has(edited)).toBe(false)
    expect(plan.files.has('public/okf/unit-topic/sections/etags-flow/section.md')).toBe(true)
    expect(plan.files.get('public/okf/unit-topic/index.md')).toContain('(sections/etags-flow/section.md)')

    const hex = yaml.load(plan.files.get('public/hexmaps/unit-topic.yaml')!) as { nodes: { id: string; unlockedBy?: string[]; requiredItems?: string[] }[] }
    expect(hex.nodes.find((n) => n.id === 'etags-flow')?.unlockedBy).toEqual(['etags-quiz'])
    expect(hex.nodes.find((n) => n.id === 'boss-lair')?.requiredItems).toEqual(['directives-relic', 'etags-relic', 'etags-flow-relic'])
    expect(validateHexCampaign(plan.files.get('public/hexmaps/unit-topic.yaml')!).diagnostics).toEqual([])

    apply(repo, plan.files)
    expect(diskCheck(grown, repo)).toEqual([])
  })

  it('re-syncs index.yaml when the brief category changes', () => {
    const brief = makeBrief()
    const repo = memoryRepo()
    apply(repo, planTopic(brief, repo).files)
    const plan = planTopic({ ...brief, tags: ['unit', 'http'] }, repo)
    expect([...plan.files.keys()]).toEqual(['public/okf/unit-topic/index.yaml'])
    expect(plan.files.get('public/okf/unit-topic/index.yaml')).toContain('  - http')
  })
})

describe('buildHexMapYaml', () => {
  it('chains each track from the capital; only key-item sections drop relics; boss gates on them', () => {
    const text = buildHexMapYaml(makeBrief())
    const hex = yaml.load(text) as { nodes: { id: string; type: string; unlockedBy?: string[]; rewards?: unknown[]; requiredItems?: string[]; description?: string; monster?: { name: string } }[] }
    const node = (id: string) => hex.nodes.find((n) => n.id === id)!
    expect(HEX_NODE_TYPE_BY_SECTION['intro']).toBe('capital')
    expect(node('directives').unlockedBy).toEqual(['capital'])
    expect(node('directives-quiz').unlockedBy).toEqual(['directives'])
    expect(node('etags').unlockedBy).toEqual(['capital'])
    expect(node('directives').rewards).toHaveLength(1)
    expect(node('directives-quiz').rewards).toBeUndefined()
    expect(node('directives-quiz').type).toBe('quiz_encounter')
    expect(node('boss-lair').unlockedBy).toEqual(['directives-quiz', 'etags-quiz'])
    expect(node('boss-lair').requiredItems).toEqual(['directives-relic', 'etags-relic'])
    expect(node('boss-lair').description).toBe('Serving outdated data.')
    expect(node('boss-lair').monster?.name).toBe('The Stale Cache Wraith')
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
  it('index.md links the intro and every brief section', () => {
    const md = buildTopicIndexMd(makeBrief())
    expect(md).toContain('# Unit Topic')
    expect(md).toContain('* [Unit Topic](sections/intro/section.md)')
    expect(md).toContain('* [Directive Check](sections/directives-quiz/section.md)')
  })

  it('index.yaml carries category and tags', () => {
    const text = buildTopicIndexYaml(makeBrief({ category: 'Architecture', tags: ['http'] }))
    expect(text).toContain('category: Architecture')
    expect(text).toContain('  - http')
  })

  it('humanize title-cases dashed slugs', () => {
    expect(humanize('taxonomy-browser')).toBe('Taxonomy Browser')
  })
})
