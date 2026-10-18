import { describe, it, expect } from 'vitest'
import {
  bulletsBeats,
  galleryBeats,
  introBeats,
  openuiBeats,
  pillarLayerBeats,
  taxonomyBeats,
  textBeats,
} from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { content, kinds, propsOf } from './helpers'

const worldHistoryLayers = content('world-history/sections/pillar-layer.oui')
const monkGallery = content('poe2-flicker-monk/sections/image-gallery.oui')
const cachingDirectives = content('http-caching/sections/directives.oui')

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

  it('taxonomy-browser: the cards with a line naming them, then each card opened in turn', () => {
    const props = propsOf<Parameters<typeof taxonomyBeats>[0]>(cachingDirectives)
    const beats = taxonomyBeats(props)
    expect(beats).toHaveLength(1 + props.categories.length)
    expect(beats[0].say).toContain(props.categories[0].title)
    expect(beats.slice(1).every((b) => !b.say && !b.answer)).toBe(true)
    expect(kinds(taxonomyBeats({ categories: [] }))).toEqual(['show'])
  })
})
