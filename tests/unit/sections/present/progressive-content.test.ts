import { describe, it, expect } from 'vitest'
import { validateOUISection } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { bundleToSections } from '../../../../src/core/learning-engine/composition/okf/sections'
import {
  bulletsBeats,
  galleryBeats,
  introBeats,
  openuiBeats,
  pillarLayerBeats,
  taxonomyBeats,
  textBeats,
} from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore Node's fs has no types in this project; tests read content fixtures like layout-metrics.ts
import { readFileSync } from 'fs'

const content = (path: string): string => readFileSync(`public/content/${path}`, 'utf8')
const worldHistoryLayers = content('world-history/sections/pillar-layer.oui')
const monkGallery = content('poe2-flicker-monk/sections/image-gallery.oui')
const cachingDirectives = content('http-caching/sections/directives.oui')

/** Compile a section the way Loom Viewer does and return its props. */
function propsOf<T>(source: string): T {
  const result = validateOUISection(source, { topicId: 't', sectionName: 's', file: 'sections/s.oui' })
  if (!result.payload) throw new Error(JSON.stringify(result.diagnostics))
  return bundleToSections([result.payload])[0].props as T
}

const kinds = (beats: Array<{ kind: string }>) => beats.map((b) => b.kind)

describe('progressive-content beats', () => {
  it('intro: title, What, Why, then the roadmap when there is one', () => {
    const withRoadmap = propsOf<Parameters<typeof introBeats>[0]>(`root = Intro("HTTP Caching", what, why, [RoadmapStep("Directives", "taxonomy-browser", "Compare them.", "directives")])
what = IntroWhat("Caches keep copies.")
why = IntroWhy("Origin requests cost time.")
`)
    expect(kinds(introBeats(withRoadmap))).toEqual(['show', 'show', 'show', 'show'])
    const without = propsOf<Parameters<typeof introBeats>[0]>(`root = Intro("HTTP Caching", what, why)
what = IntroWhat("Caches keep copies.")
why = IntroWhy("Origin requests cost time.")
`)
    expect(introBeats(without)).toHaveLength(3)
  })

  it('text: one beat per paragraph', () => {
    const props = propsOf<Parameters<typeof textBeats>[0]>('root = Text("What a cache keeps", ["First **paragraph**.", "Second.", "Third."])\n')
    expect(kinds(textBeats(props))).toEqual(['show', 'show', 'show'])
  })

  it('bullets: one beat per top-level bullet, children included', () => {
    const props = propsOf<Parameters<typeof bulletsBeats>[0]>(`root = Bullets("Where copies live", [Bullet("Private caches", [Bullet("Memory"), Bullet("Disk")]), Bullet("Shared caches")])
`)
    expect(bulletsBeats(props)).toHaveLength(2)
  })

  it('openui: a single beat', () => {
    expect(kinds(openuiBeats())).toEqual(['show'])
  })

  it('pillar-layer: one beat per layer', () => {
    const props = propsOf<Parameters<typeof pillarLayerBeats>[0]>(worldHistoryLayers)
    const layers = props.section?.layers ?? []
    expect(layers.length).toBeGreaterThan(1)
    expect(pillarLayerBeats(props)).toHaveLength(layers.length)
  })

  it('image-gallery: one beat per image', () => {
    const props = propsOf<Parameters<typeof galleryBeats>[0]>(monkGallery)
    expect(props.items.length).toBeGreaterThan(1)
    expect(galleryBeats(props)).toHaveLength(props.items.length)
  })

  it('taxonomy-browser: the cards, then free browsing', () => {
    const props = propsOf<Parameters<typeof taxonomyBeats>[0]>(cachingDirectives)
    expect(kinds(taxonomyBeats(props))).toEqual(['show', 'explore'])
    expect(kinds(taxonomyBeats({ categories: [] }))).toEqual(['show'])
  })
})
