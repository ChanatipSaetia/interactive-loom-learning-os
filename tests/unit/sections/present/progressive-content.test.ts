import { describe, it, expect } from 'vitest'
import {
  bulletsBeats,
  galleryBeats,
  introBeats,
  openuiBeats,
  openuiParts,
  pillarLayerBeats,
  taxonomyBeats,
  textBeats,
} from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import { content, ids, kinds, propsOf } from './helpers'

const worldHistoryLayers = content('world-history/sections/pillar-layer.oui')
const monkGallery = content('poe2-flicker-monk/sections/image-gallery.oui')
const cachingDirectives = content('http-caching/sections/directives.oui')

describe('progressive-content beats', () => {
  it('intro: title, What, Why, then the roadmap when there is one', () => {
    const withRoadmap = propsOf<Parameters<typeof introBeats>[0]>(`root = Intro("HTTP Caching", what, why, [RoadmapStep("Directives", "taxonomy-browser", "Compare them.", "directives")])
what = IntroWhat("Caches keep copies.")
why = IntroWhy("Origin requests cost time.")
`)
    expect(ids(introBeats(withRoadmap))).toEqual(['title', 'what', 'why', 'roadmap'])
    const without = propsOf<Parameters<typeof introBeats>[0]>(`root = Intro("HTTP Caching", what, why)
what = IntroWhat("Caches keep copies.")
why = IntroWhy("Origin requests cost time.")
`)
    expect(introBeats(without)).toHaveLength(3)
  })

  it('text: one beat per paragraph', () => {
    const props = propsOf<Parameters<typeof textBeats>[0]>('root = Text("What a cache keeps", ["First **paragraph**.", "Second.", "Third."])\n')
    expect(kinds(textBeats(props))).toEqual(['show', 'show', 'show'])
    expect(textBeats(props)[0]).toEqual({ id: 'p1', about: 'Paragraph 1: First paragraph.' })
  })

  it('bullets: each nested point gets a beat before the next top-level point', () => {
    const props = propsOf<Parameters<typeof bulletsBeats>[0]>(`root = Bullets("Where copies live", [Bullet("Private caches", [Bullet("Memory"), Bullet("Disk")]), Bullet("Shared caches")])
`)
    expect(ids(bulletsBeats(props))).toEqual(['item1', 'item1.child1', 'item1.child2', 'item2'])
  })

  it('openui: a single beat when the root is not a Card or Stack of several children', () => {
    expect(ids(openuiBeats())).toEqual(['all'])
    expect(ids(openuiBeats({ source: 'root = Tabs([TabItem("a", "A", [x]), TabItem("b", "B", [y])])' }))).toEqual(['all'])
    expect(ids(openuiBeats({ source: 'root = Card([table])\ntable = Table([])' }))).toEqual(['all'])
  })

  it('openui: one beat per child of a Card or Stack root (decision 116)', () => {
    const source = '// @openui "Steep Guide"\nroot = Card([header, Table([Col("Tea", ["a, b]", "c"])]), tip])\nheader = CardHeader("x")\ntip = Callout("info", "T", "D")'
    expect(openuiParts(source)).toEqual([{ name: 'header' }, { component: 'Table' }, { name: 'tip' }])
    expect(ids(openuiBeats({ source }))).toEqual(['part1', 'part2', 'part3'])
    expect(openuiBeats({ source })[1].about).toBe('Part 2: Table')
    expect(openuiParts('root = Stack(\n  [a, b],\n  "row"\n)')).toEqual([{ name: 'a' }, { name: 'b' }])
    expect(openuiParts('root = Stack(a)')).toBeNull()
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

  it('taxonomy-browser: the cards, then each card opened in turn', () => {
    const props = propsOf<Parameters<typeof taxonomyBeats>[0]>(cachingDirectives)
    const beats = taxonomyBeats(props)
    expect(beats).toHaveLength(1 + props.categories.length)
    expect(ids(beats)).toEqual(['cards', ...props.categories.map((_, i) => `card${i + 1}`)])
    expect(kinds(taxonomyBeats({ categories: [] }))).toEqual(['show'])
  })
})
