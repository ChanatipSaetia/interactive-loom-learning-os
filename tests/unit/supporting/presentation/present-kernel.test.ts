import { describe, it, expect, beforeEach } from 'vitest'
import { beatMarks, splitWords, wordsHtml, PRESENT_WORD_CLASS } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'
import { PresentRegistry, beatsOf } from '../../../../src/core/learning-engine/registry/present-registry'
import { registerCorePresenters } from '../../../../src/core/learning-engine/registry/register-core-presenters'

describe('present kernel', () => {
  it('marks elements with their beat and shows them from that beat on', () => {
    const mark = beatMarks(1)
    expect(mark(1, { motion: 'words', delay: 200 })).toEqual({ 'data-beat': 1, 'data-motion': 'words', 'data-delay': 200, 'data-shown': '' })
    expect(mark(2)).toEqual({ 'data-beat': 2, 'data-motion': 'rise' })
    expect(beatMarks(3)(1, { until: 2 })).toEqual({ 'data-beat': 1, 'data-motion': 'rise', 'data-until': 2 })
    expect(beatMarks(-1)(0)['data-shown']).toBeUndefined()
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

  it('registers the phase 1 section types', () => {
    expect(PresentRegistry.list().sort()).toEqual(['bullets', 'intro', 'openui', 'text'])
  })

  it('gives a type without a presenter one show beat', () => {
    expect(beatsOf({ type: 'quiz', props: { questions: [] } })).toEqual([{ kind: 'show' }])
    expect(beatsOf({ type: 'text', props: { paragraphs: [] } })).toEqual([{ kind: 'show' }])
  })
})
