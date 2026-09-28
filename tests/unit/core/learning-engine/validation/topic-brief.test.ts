import { describe, it, expect } from 'vitest'
import {
  validateTopicBrief,
  validateTopicAgainstBrief,
  prerequisiteTeachIds,
  briefSectionNames,
  type TopicBrief,
  type TopicOnDisk,
} from '../../../../../src/core/learning-engine/validation/topic-brief'

const BRIEF_YAML = `
id: http-caching
title: "HTTP Caching"
description: "Reuse responses safely."
category: Architecture
tags: [http, caching]
boss:
  title: "The Stale Cache Wraith"
  failureMode: "Serving outdated or private data."
tracks:
  - id: directives
    title: "Cache Directives"
    sections:
      - name: directives
        type: taxonomy-browser
        title: "Cache Directives"
        keyItem: true
        teaches:
          - { id: max-age, point: "max-age sets freshness in seconds" }
          - { id: private, point: "private keeps responses out of CDNs" }
      - name: quiz
        type: quiz
        title: "Knowledge Check"
  - id: validation
    title: "Revalidation"
    sections:
      - name: etags
        type: text
        title: "ETags"
        keyItem: true
        teaches:
          - { id: etag, point: "An ETag identifies a response version" }
      - name: order
        type: reflection-sequence
        title: "Revalidation Order"
`

function brief(): TopicBrief {
  const result = validateTopicBrief(BRIEF_YAML)
  expect(result.diagnostics).toEqual([])
  return result.payload!
}

function topic(overrides: Partial<TopicOnDisk> = {}): TopicOnDisk {
  return {
    topicDir: 'public/okf/http-caching',
    sections: [
      { name: 'intro', type: 'intro', data: { roadmap: [{ sectionId: 'directives' }] } },
      { name: 'directives', type: 'taxonomy-browser', data: {} },
      { name: 'quiz', type: 'quiz', data: { questions: [{ id: 'q1', groundedIn: 'private' }] } },
      { name: 'etags', type: 'text', data: {} },
      { name: 'order', type: 'reflection-sequence', data: { challenges: [{ groundedIn: 'etag' }] } },
    ],
    indexYaml: 'category: Architecture\ntags:\n  - http\n  - caching\n',
    rootIndexMd: '## Architecture\n* [HTTP Caching](http-caching/index.md) — x\n',
    hexMapExists: true,
    ...overrides,
  }
}

const messages = (diags: { message: string }[]) => diags.map((d) => d.message).join('\n')

describe('validateTopicBrief', () => {
  it('parses a valid brief with defaults', () => {
    const b = brief()
    expect(b.tracks[0].sections[1].keyItem).toBe(false)
    expect(b.tracks[0].sections[1].teaches).toEqual([])
    expect(briefSectionNames(b)).toEqual(['intro', 'directives', 'quiz', 'etags', 'order'])
  })

  it('Tier 1: reports YAML syntax errors with a line', () => {
    const result = validateTopicBrief('id: [unclosed', 'brief.yaml')
    expect(result.status).toBe('error')
    expect(result.diagnostics[0]).toMatchObject({ tier: 1, file: 'brief.yaml' })
  })

  it('Tier 2: enforces 2–4 tracks, kebab-case names, and known types (intro excluded)', () => {
    const oneTrack = BRIEF_YAML.replace(/ {2}- id: validation[\s\S]*$/, '')
    expect(messages(validateTopicBrief(oneTrack).diagnostics)).toMatch(/2 to 4 exploration tracks/)
    expect(validateTopicBrief(BRIEF_YAML.replace('name: etags', 'name: ETags')).diagnostics[0]).toMatchObject({ tier: 2, field: 'tracks.1.sections.0.name' })
    expect(validateTopicBrief(BRIEF_YAML.replace('type: text', 'type: intro')).diagnostics[0]).toMatchObject({ tier: 2, field: 'tracks.1.sections.0.type' })
  })

  it('Tier 3: duplicate names/teach ids, reserved intro, and no key items', () => {
    const dupName = validateTopicBrief(BRIEF_YAML.replace('name: order', 'name: quiz'))
    expect(messages(dupName.diagnostics)).toMatch(/Duplicate section name "quiz"/)
    const dupTeach = validateTopicBrief(BRIEF_YAML.replace('id: etag,', 'id: max-age,'))
    expect(messages(dupTeach.diagnostics)).toMatch(/Duplicate teaches id "max-age"/)
    const intro = validateTopicBrief(BRIEF_YAML.replace('name: etags', 'name: intro'))
    expect(messages(intro.diagnostics)).toMatch(/reserved for the capital/)
    const noKeys = validateTopicBrief(BRIEF_YAML.replace(/keyItem: true/g, 'keyItem: false'))
    expect(messages(noKeys.diagnostics)).toMatch(/No section is marked keyItem/)
  })
})

describe('prerequisiteTeachIds', () => {
  it('collects teaches of earlier sections in the same track only', () => {
    const b = brief()
    expect(prerequisiteTeachIds(b, 'quiz')).toEqual(['max-age', 'private'])
    expect(prerequisiteTeachIds(b, 'order')).toEqual(['etag'])
    expect(prerequisiteTeachIds(b, 'directives')).toEqual([])
  })
})

describe('validateTopicAgainstBrief', () => {
  it('passes when disk matches the brief', () => {
    expect(validateTopicAgainstBrief(brief(), topic())).toEqual([])
  })

  it('flags drift in both directions and type mismatches', () => {
    const t = topic()
    t.sections = t.sections.filter((s) => s.name !== 'etags')
    t.sections.push({ name: 'stray', type: 'text' })
    t.sections.find((s) => s.name === 'directives')!.type = 'bullets'
    const out = messages(validateTopicAgainstBrief(brief(), t))
    expect(out).toMatch(/"stray" is not declared/)
    expect(out).toMatch(/declares section "etags", but sections\/etags\/ does not exist/)
    expect(out).toMatch(/"directives" has type "bullets"/)
  })

  it('flags ungrounded and wrongly grounded assessment items', () => {
    const t = topic()
    t.sections.find((s) => s.name === 'quiz')!.data = { questions: [{ id: 'q1' }, { id: 'q2', groundedIn: 'etag' }] }
    const out = messages(validateTopicAgainstBrief(brief(), t))
    expect(out).toMatch(/quiz item "q1" has no groundedIn/)
    expect(out).toMatch(/quiz item "q2" is grounded in "etag", which no earlier section in track "directives" teaches/)
  })

  it('grounding is opt-in until a prerequisite section lists teaches', () => {
    const b = brief()
    b.tracks[1].sections[0].teaches = []
    const t = topic()
    t.sections.find((s) => s.name === 'order')!.data = { challenges: [{}] }
    expect(validateTopicAgainstBrief(b, t)).toEqual([])
  })

  it('flags metadata drift, missing registration, wrong category heading, bad roadmap, and missing hex map', () => {
    const out = messages(validateTopicAgainstBrief(brief(), topic({
      indexYaml: 'category: Frontend\ntags: [http]\n',
      rootIndexMd: '## Architecture\n* [Other](other/index.md)\n',
      hexMapExists: false,
    })))
    expect(out).toMatch(/category "Frontend" does not match/)
    expect(out).toMatch(/tags \[http\] do not match/)
    expect(out).toMatch(/not registered in public\/okf\/index.md/)
    expect(out).toMatch(/has no hex campaign map/)

    const wrongHeading = messages(validateTopicAgainstBrief(brief(), topic({ rootIndexMd: '## Frontend\n* [H](http-caching/index.md)\n' })))
    expect(wrongHeading).toMatch(/listed under "## Frontend"/)

    const t = topic()
    t.sections[0].data = { roadmap: [{ sectionId: 'nope' }] }
    expect(messages(validateTopicAgainstBrief(brief(), t))).toMatch(/roadmap points at section "nope"/)
  })
})
