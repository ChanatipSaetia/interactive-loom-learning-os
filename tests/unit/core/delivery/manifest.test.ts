import { describe, it, expect } from 'vitest'
import { isSectionFile, parseTopicIndexSections } from '../../../../src/core/delivery/manifest'

describe('OKF manifest helpers', () => {
  it('keeps markdown and YAML files, dropping disabled and hidden ones', () => {
    expect(['section.md', '01-a.yaml', 'b.yml', '_draft.yaml', '.yaml', 'image.png'].filter(isSectionFile)).toEqual([
      'section.md',
      '01-a.yaml',
      'b.yml',
    ])
  })

  it('lists section folders in index.md link order', () => {
    const indexMd = [
      '# Topic',
      '## Track 1',
      '* [Intro](sections/intro/section.md)',
      '* [Map](./sections/audience-map/section.md) — 🗝️ Lens of Empathy',
      '* [Elsewhere](../other/index.md)',
      'Not a link: sections/nope/section.md',
    ].join('\n')

    expect(parseTopicIndexSections(indexMd)).toEqual(['intro', 'audience-map'])
  })
})
