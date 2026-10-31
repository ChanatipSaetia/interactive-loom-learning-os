import { describe, it, expect, beforeEach } from 'vitest'
import { answer, beatMarks, brief, plain, show, splitWords, wordsHtml, PRESENT_WORD_CLASS } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'
import { PresentRegistry, beatsOf } from '../../../../src/core/learning-engine/registry/present-registry'
import { CORE_PRESENTERS, coreBeatsOf, registerCorePresenters } from '../../../../src/core/learning-engine/registry/register-core-presenters'
import { BEAT_IDS } from '../../../../src/core/learning-engine/composition/oui/narration'

describe('present kernel', () => {
  it('marks elements with their beat and shows them from that beat on', () => {
    const mark = beatMarks(1)
    expect(mark(1, { motion: 'words', delay: 200 })).toEqual({ 'data-beat': 1, 'data-motion': 'words', 'data-delay': 200, 'data-shown': '' })
    expect(mark(2)).toEqual({ 'data-beat': 2, 'data-motion': 'rise' })
    expect(beatMarks(3)(1, { until: 2 })).toEqual({ 'data-beat': 1, 'data-motion': 'rise', 'data-until': 2 })
    expect(beatMarks(-1)(0)['data-shown']).toBeUndefined()
    expect(beatMarks(0)(0, { sound: 'success' })['data-sound']).toBe('success')
  })

  it('makes beats with an ID, what they show and the answer they perform', () => {
    expect(show('map')).toEqual({ id: 'map' })
    expect(show('map', 'The whole map')).toEqual({ id: 'map', about: 'The whole map' })
    expect(answer('wrong', 'q1.wrong', 'Tries “A”')).toEqual({ id: 'q1.wrong', answer: 'wrong', about: 'Tries “A”' })
  })

  it('turns markdown into plain words for a beat description', () => {
    expect(plain('Use **max-age** and `no-cache`, see [docs](https://x.y).\n- Item')).toBe('Use max-age and no-cache, see docs. Item')
    expect(plain('bleed_dps + poison_dps')).toBe('bleed_dps + poison_dps')
    expect(brief('x'.repeat(80))).toHaveLength(60)
  })

  it('splits text into words with the space after each', () => {
    expect(splitWords('  Fresh: reuse it.\nStale ')).toEqual([
      { word: 'Fresh:', space: ' ' },
      { word: 'reuse', space: ' ' },
      { word: 'it.', space: '\n' },
      { word: 'Stale', space: ' ' },
    ])
  })

  it('wraps the words of rendered markdown, keeping tags and inline code whole', () => {
    const html = wordsHtml('<p>Use <strong>max age</strong> and <code>no-cache</code> here</p>')
    const div = document.createElement('div')
    div.innerHTML = html
    const words = [...div.querySelectorAll(`.${PRESENT_WORD_CLASS}`)].map((w) => w.textContent)
    expect(words).toEqual(['Use', 'max', 'age', 'and', 'no-cache', 'here'])
    expect(div.querySelector('strong')?.textContent).toBe('max age')
    expect(div.textContent).toBe('Use max age and no-cache here')
  })
})

describe('present registry', () => {
  beforeEach(() => {
    PresentRegistry.clear()
    registerCorePresenters()
  })

  it('registers the section types that have a Present renderer', () => {
    expect(PresentRegistry.list().sort()).toEqual(['bullets', 'concept-map', 'decision-tree', 'flashcards', 'flowchart', 'formula-sandbox', 'image-gallery', 'intro', 'openui', 'pillar-layer', 'quiz', 'reflection-sequence', 'reflection-template', 'scenario', 'taxonomy-browser', 'text', 'timeline', 'tradeoff-sandbox'])
  })

  it('gives a type without a presenter one beat, all, after its title beat', () => {
    const all = [{ id: 'title', about: 'The section title and what it is about' }, { id: 'all', about: 'The whole section' }]
    expect(beatsOf({ type: 'unknown-type', props: {} })).toEqual(all)
    expect(beatsOf({ type: 'text', props: { paragraphs: [] } })).toEqual(all)
  })

  it('opens every section but the intro on a title beat (decision 114)', () => {
    expect(coreBeatsOf({ type: 'text', props: { paragraphs: ['A', 'B'] } }).map((b) => b.id)).toEqual(['title', 'p1', 'p2'])
    const intro = coreBeatsOf({ type: 'intro', props: { title: 'T', what: { summary: 'S' }, why: { summary: 'W' } } }).map((b) => b.id)
    expect(intro.filter((id) => id === 'title')).toHaveLength(1)
  })

  it('documents the beat IDs of every type with a presenter (decision 108)', () => {
    expect(Object.keys(BEAT_IDS).sort()).toEqual(Object.keys(CORE_PRESENTERS).sort())
  })
})
