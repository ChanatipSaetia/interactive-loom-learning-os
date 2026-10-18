import { describe, it, expect, beforeEach } from 'vitest'
import { answer, beatMarks, listOf, plain, show, splitWords, wordsHtml, PRESENT_WORD_CLASS } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'
import { PresentRegistry, beatsOf } from '../../../../src/core/learning-engine/registry/present-registry'
import { registerCorePresenters } from '../../../../src/core/learning-engine/registry/register-core-presenters'

describe('present kernel', () => {
  it('marks elements with their beat and shows them from that beat on', () => {
    const mark = beatMarks(1)
    expect(mark(1, { motion: 'words', delay: 200 })).toEqual({ 'data-beat': 1, 'data-motion': 'words', 'data-delay': 200, 'data-shown': '' })
    expect(mark(2)).toEqual({ 'data-beat': 2, 'data-motion': 'rise' })
    expect(beatMarks(3)(1, { until: 2 })).toEqual({ 'data-beat': 1, 'data-motion': 'rise', 'data-until': 2 })
    expect(beatMarks(-1)(0)['data-shown']).toBeUndefined()
    expect(beatMarks(0)(0, { sound: 'success' })['data-sound']).toBe('success')
  })

  it('makes beats with a narrator line and the answer they perform', () => {
    expect(show()).toEqual({})
    expect(show('Here is the map.')).toEqual({ say: 'Here is the map.' })
    expect(answer('wrong', 'Suppose we answer “A”.')).toEqual({ say: 'Suppose we answer “A”.', answer: 'wrong' })
  })

  it('turns markdown into plain words for a narrator line', () => {
    expect(plain('Use **max-age** and `no-cache`, see [docs](https://x.y).\n- Item')).toBe('Use max-age and no-cache, see docs. Item')
    expect(plain('bleed_dps + poison_dps')).toBe('bleed_dps + poison_dps')
    expect(listOf(['a', 'b', 'c'])).toBe('a, b and c')
    expect(listOf(['a'])).toBe('a')
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
    expect(PresentRegistry.list().sort()).toEqual(['bullets', 'concept-map', 'decision-tree', 'flashcards', 'flowchart', 'formula-sandbox', 'image-gallery', 'intro', 'openui', 'pillar-layer', 'quiz', 'reflection-sequence', 'reflection-template', 'scenario', 'taxonomy-browser', 'text', 'tradeoff-sandbox'])
  })

  it('gives a type without a presenter one show beat', () => {
    expect(beatsOf({ type: 'unknown-type', props: {} })).toEqual([{}])
    expect(beatsOf({ type: 'text', props: { paragraphs: [] } })).toEqual([{}])
  })
})
