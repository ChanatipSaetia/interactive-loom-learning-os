import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { textScenes } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/text-scenes'
import { textBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import PresentText from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/text/PresentText'
import { beatSpeech } from '../../../../src/core/supporting/presentation/narration'

const sentences = Array.from({ length: 8 }, (_, i) => `Sentence ${i + 1} explains a different detail about the cache and why it matters.`)
const data = { paragraphs: ['**Caching** — ' + sentences.join(' '), '**Expiry** — A short explanation.'] }

describe('short text presentation scenes', () => {
  it('keeps short paragraph IDs and splits dense prose without dropping its words', () => {
    const scenes = textScenes(data)
    expect(scenes.length).toBeGreaterThan(2)
    expect(scenes[0].id).toBe('p1')
    expect(scenes[1].id).toBe('p1.part2')
    expect(scenes[scenes.length - 1]?.id).toBe('p2')
    for (const sentence of sentences) expect(scenes.map((s) => s.source).join(' ')).toContain(sentence)
    expect(textBeats(data).map((b) => b.id)).toEqual(scenes.map((s) => s.id))
    expect(textScenes({ paragraphs: [] })).toEqual([])
  })

  it('preserves inline Markdown constructs and complete code blocks', () => {
    const link = '[cache policy](https://example.com/a/long/path)'
    const code = '```js\n' + 'const value = 123;\n'.repeat(20) + '```'
    const scenes = textScenes({ paragraphs: ['A sentence. '.repeat(25) + link + ' with **bold words** and `inline code`.', code] })
    expect(scenes.some((s) => s.source.includes(link))).toBe(true)
    expect(scenes.some((s) => s.source.includes('**bold words**'))).toBe(true)
    expect(scenes.some((s) => s.source.includes('`inline code`'))).toBe(true)
    expect(scenes[scenes.length - 1]?.source).toBe(code)
  })

  it('shows one chunk, retains the paragraph agenda, and does not repeat the headline in continuation speech', () => {
    const draw = (beat: number) => <PresentText data={data} beats={textBeats(data)} beat={beat} sectionIndex={0} active />
    const { container, rerender } = render(draw(1))
    const shown = () => container.querySelectorAll('.present-text-scene[data-shown]')
    expect(shown()).toHaveLength(1)
    expect(shown()[0].querySelector('.present-headline')).toHaveTextContent('Caching')
    expect(container.querySelector('.present-agenda .is-now')).toHaveTextContent('Caching')
    expect(beatSpeech(container, 1).map((p) => p.text).join(' ')).not.toContain('Caching')
    rerender(draw(0))
    expect(shown()).toHaveLength(1)
    expect(shown()[0].textContent).not.toContain('Sentence 8')
    rerender(draw(-1))
    expect(shown()).toHaveLength(0)
  })
})
