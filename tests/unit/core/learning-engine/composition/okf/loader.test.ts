import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadOKFBundle, loadSection, getCachedOKFBundle, clearOKFCache } from '../../../../../../src/core/learning-engine/composition/okf/loader'
import { toSectionConfig } from '../../../../../../src/core/learning-engine/composition/okf/section-config'
import type { OKFBundledSection } from '../../../../../../src/core/learning-engine/composition/okf/types'
import { createMemoryStorage } from '../../../../helpers/storage'

const textSection = (title: string, body: string) => ({ 'section.md': `---\ntype: text\ntitle: ${title}\n---\n${body}` })

describe('loadSection / loadOKFBundle', () => {
  beforeEach(() => clearOKFCache())

  it('loads sections in index order through the Validation Gateway', async () => {
    const storage = createMemoryStorage({
      demo: { sections: { b: textSection('B', 'Second'), a: textSection('A', 'First') }, order: ['a', 'b'] },
    })

    const bundle = await loadOKFBundle('demo', storage)

    expect(bundle.map((s) => s.sectionFolder)).toEqual(['a', 'b'])
    expect(bundle[0]).toMatchObject({
      meta: { type: 'text', title: 'A' },
      data: { type: 'text', paragraphs: ['First'] },
      validation: { status: 'valid', diagnostics: [] },
    })
  })

  it('keeps the slot of a section that fails, with diagnostics, without failing the topic', async () => {
    const storage = createMemoryStorage({
      demo: {
        sections: { ok: textSection('Ok', 'Fine'), broken: { 'section.md': '---\ntype: quiz\n---' } },
        order: ['ok', 'missing', 'broken'],
      },
    })

    const bundle = await loadOKFBundle('demo', storage)

    expect(bundle.map((s) => [s.sectionFolder, s.validation?.status])).toEqual([
      ['ok', 'valid'],
      ['missing', 'error'],
      ['broken', 'error'],
    ])
    expect(bundle[1].validation?.diagnostics[0].message).toContain('Section "missing" not found')
    expect(bundle[2].validation?.diagnostics[0]).toMatchObject({ tier: 1, file: 'demo/sections/broken/questions.yaml' })
  })

  it('caches bundles per storage adapter', async () => {
    const storage = createMemoryStorage({ demo: { sections: { a: textSection('A', 'x') } } })
    const spy = vi.spyOn(storage, 'listSections')

    const first = await loadOKFBundle('demo', storage)
    const second = await loadOKFBundle('demo', storage)

    expect(second).toBe(first)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(getCachedOKFBundle('demo', storage)).toBe(first)
    expect(getCachedOKFBundle('demo', createMemoryStorage())).toBeUndefined()
  })

  it('loadSection never throws', async () => {
    const section = await loadSection(createMemoryStorage(), 'nope', 'intro')
    expect(section.validation?.status).toBe('error')
  })
})

describe('toSectionConfig', () => {
  const section = (overrides: Partial<OKFBundledSection>): OKFBundledSection => ({
    meta: { type: 'text', resource: '.' },
    data: { type: 'text', paragraphs: [] },
    ...overrides,
  })

  it('layers payload fields over section.md props', () => {
    const config = toSectionConfig(section({
      meta: { type: 'scenario', title: 'From md', intro: { what: 'w' }, resource: '.' },
      data: { type: 'scenario', id: 's', title: 'From data', intro: 'Scenario intro', nodes: {}, startNode: 'start' },
    }))

    expect(config).toEqual({
      type: 'scenario',
      props: { title: 'From data', intro: 'Scenario intro', id: 's', nodes: {}, startNode: 'start' },
    })
  })

  it('keeps the section.md title for pillar-layer', () => {
    const config = toSectionConfig(section({
      meta: { type: 'pillar-layer', title: 'Display title', resource: 'matrix.yaml' },
      data: { type: 'pillar-layer', title: 'Matrix title', layers: [], matrix_blocks: [] },
    }))

    expect(config.props.title).toBe('Display title')
  })

  it('passes non-valid validation outcomes to the host', () => {
    const diagnostics = [{ tier: 3 as const, message: 'm' }]
    expect(toSectionConfig(section({ validation: { status: 'valid', diagnostics: [] } })).validation).toBeUndefined()
    expect(toSectionConfig(section({ validation: { status: 'warning', diagnostics } })).validation).toEqual({
      status: 'warning',
      diagnostics,
    })
  })
})
