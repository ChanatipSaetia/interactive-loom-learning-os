import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SPOKEN_CLASS, beatSpeech, createNarrator, frameSpeech, mentions, notSaidIn } from '../../../../src/core/supporting/presentation/narration'

class FakeUtterance {
  text: string
  voice: unknown = null
  lang = ''
  onboundary: ((e: { charIndex: number; name: string }) => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) { this.text = text }
}

let spoken: FakeUtterance[] = []
const synth = {
  voices: [{ lang: 'en-US' }, { lang: 'th-TH' }],
  getVoices() { return this.voices },
  speak(u: FakeUtterance) { spoken.push(u) },
  cancel: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

function region(html: string): HTMLElement {
  const el = document.createElement('section')
  el.innerHTML = html
  return el
}

describe('narration', () => {
  beforeEach(() => {
    spoken = []
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  })
  afterEach(() => vi.unstubAllGlobals())

  it("collects a beat's words in order, word spans one by one", () => {
    const r = region(`
      <h3 data-beat="0"><span class="present-w">Cache</span> <span class="present-w">hits</span></h3>
      <p data-beat="1">Not yet</p>
      <div data-beat="0"><p data-beat="0">Inner</p> card</div>`)
    const parts = beatSpeech(r, 0)
    expect(parts.map((p) => p.text)).toEqual(['Cache', 'hits', 'Inner card.'])
    expect(parts[0].el?.textContent).toBe('Cache')
  })

  it('leaves unread what the narrator line already says (QUIET)', () => {
    const r = region(`
      <svg data-beat="0" data-quiet><text>Node</text></svg>
      <div data-beat="0"><span data-quiet>01</span> Step one</div>
      <p data-beat="0"><span class="present-w">Said</span> <span data-quiet><span class="present-w">skipped</span></span></p>`)
    expect(beatSpeech(r, 0).map((p) => p.text)).toEqual(['Step one.', 'Said'])
  })

  it("reads a beat's frame lines, but not what the caption already says", () => {
    const r = region(`
      <p data-beat="0" data-present-frame>An example: one path through this tree</p>
      <p data-beat="0">Is the data shared?</p>
      <p data-beat="3" data-present-frame>The result of these decisions</p>`)
    expect(frameSpeech(r, 0)).toEqual([{ text: 'An example: one path through this tree.' }])
    expect(notSaidIn('Here is an example: one path through this tree!', frameSpeech(r, 0))).toEqual([])
    expect(notSaidIn('Is the data shared?', frameSpeech(r, 3))).toEqual([{ text: 'The result of these decisions.' }])
    expect(mentions('Welcome to Caching Basics.', 'caching basics')).toBe(true)
    expect(mentions('', 'caching')).toBe(false)
  })

  it('speaks the parts rewritten for speech and lights the word being spoken', async () => {
    const r = region('<p data-beat="0"><span class="present-w">Serve</span> <span class="present-w">/app.3f9a.js</span></p>')
    const narrator = createNarrator()
    expect(narrator.available()).toBe(true)
    const done = narrator.speak(beatSpeech(r, 0))
    const u = spoken[0]
    expect(u.text).toBe('Serve app dot j s')
    u.onboundary?.({ charIndex: 6, name: 'word' })
    const second = r.querySelectorAll('.present-w')[1]
    expect(second.classList.contains(SPOKEN_CLASS)).toBe(true)
    u.onend?.()
    await done
    expect(second.classList.contains(SPOKEN_CLASS)).toBe(false)
  })

  it('picks a voice for the script the text is written in', () => {
    void createNarrator().speak([{ text: 'สวัสดี' }])
    expect(spoken[0].lang).toBe('th-TH')
  })

  it('resolves a cut-off reading and ignores the stopped voice afterwards', async () => {
    const narrator = createNarrator()
    const first = narrator.speak([{ text: 'One' }])
    const second = narrator.speak([{ text: 'Two' }])
    await first
    spoken[0].onend?.()
    expect(spoken).toHaveLength(2)
    narrator.cancel()
    await second
  })

  it('is unavailable without voices', () => {
    synth.voices = []
    expect(createNarrator().available()).toBe(false)
    synth.voices = [{ lang: 'en-US' }, { lang: 'th-TH' }]
  })
})
