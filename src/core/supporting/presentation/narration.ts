/**
 * Narration for Present mode (decision 79 in grill-log-presenting-mode.md): the browser's Web Speech
 * voice reads what a beat shows, words rewritten for speech by `speechText`. When the voice reports
 * word boundaries, the word being spoken lights up.
 */
import { PRESENT_WORD_CLASS } from '../../learning-engine/sub-contexts/present-kernel'
import { speechText } from './speech-text'

export const SPOKEN_CLASS = 'present-spoken'

/** A stretch of narration; `el` is the word span to light while it is spoken. */
export interface SpeechPart {
  text: string
  el?: HTMLElement
}

/** What the beat shows, in reading order: word spans one by one, other marked elements whole. */
export function beatSpeech(region: HTMLElement, beat: number): SpeechPart[] {
  const els = Array.from(region.querySelectorAll<HTMLElement>(`[data-beat="${beat}"]`))
  const top = els.filter((el) => !els.some((o) => o !== el && o.contains(el)) && !el.closest('[aria-hidden="true"]:not([data-present-region])'))
  return top.flatMap((el) => partsOf(el))
}

/** The elements a solved gate wants read, skipping those already read. */
export function saySpeech(region: HTMLElement, said: WeakSet<Element>): SpeechPart[] {
  return Array.from(region.querySelectorAll<HTMLElement>('[data-say]')).flatMap((el) => {
    if (said.has(el)) return []
    said.add(el)
    return partsOf(el)
  })
}

/** A narration step's words (decision 94): the stage's caption, then each callout of the current section. */
export function stepSpeech(root: HTMLElement | null): SpeechPart[] {
  if (!root) return []
  const caption = root.querySelector<HTMLElement>('.present-caption')
  const callouts = Array.from(root.querySelectorAll<HTMLElement>('.present-region.is-current .present-callout-text'))
  return [...(caption ? partsOf(caption) : []), ...callouts.flatMap(partsOf)]
}

function partsOf(el: HTMLElement): SpeechPart[] {
  const words = Array.from(el.querySelectorAll<HTMLElement>(`.${PRESENT_WORD_CLASS}`))
  if (words.length) return words.map((w) => ({ text: w.textContent ?? '', el: w }))
  // Each line of a card or list ends as a sentence, so the voice pauses between them
  const text = (el.innerText ?? el.textContent ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/[.!?:;,]$/.test(line) ? line : `${line}.`))
    .join(' ')
  return text ? [{ text }] : []
}

/** Script-specific voices, for topics written in a language the default voice cannot read. */
const SCRIPTS: Array<[RegExp, string]> = [
  [/[฀-๿]/, 'th'],
  [/[぀-ヿ]/, 'ja'],
  [/[가-힯]/, 'ko'],
  [/[一-鿿]/, 'zh'],
  [/[Ѐ-ӿ]/, 'ru'],
  [/[؀-ۿ]/, 'ar'],
]

export interface Narrator {
  /** A voice exists in this browser. */
  available: () => boolean
  /** Calls back when the voice list changes; returns the unsubscribe. */
  onVoices: (cb: () => void) => () => void
  /** Reads the parts; resolves when the voice finishes, is cancelled or fails. */
  speak: (parts: SpeechPart[]) => Promise<void>
  cancel: () => void
}

export function createNarrator(): Narrator {
  const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined
  let lit: HTMLElement | null = null
  let finish: (() => void) | null = null
  const light = (el: HTMLElement | null) => {
    lit?.classList.remove(SPOKEN_CLASS)
    lit = el
    lit?.classList.add(SPOKEN_CLASS)
  }
  // Ends the utterance in progress (resolving its promise) before the voice is stopped
  const cancel = () => {
    finish?.()
    synth?.cancel()
    light(null)
  }
  return {
    available: () => !!synth && synth.getVoices().length > 0,
    onVoices: (cb) => {
      if (!synth) return () => {}
      synth.addEventListener('voiceschanged', cb)
      return () => synth.removeEventListener('voiceschanged', cb)
    },
    cancel,
    speak: (parts) => {
      cancel()
      if (!synth || !parts.length) return Promise.resolve()
      // Each part's place in the spoken text, to find the word a boundary event names
      let text = ''
      const spans: Array<{ start: number; end: number; el?: HTMLElement }> = []
      for (const part of parts) {
        const said = speechText(part.text)
        if (!said) continue
        if (text) text += ' '
        spans.push({ start: text.length, end: text.length + said.length, el: part.el })
        text += said
      }
      if (!text) return Promise.resolve()
      const utterance = new SpeechSynthesisUtterance(text)
      const lang = SCRIPTS.find(([re]) => re.test(text))?.[1]
      const voice = lang ? synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang)) : undefined
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }
      return new Promise<void>((resolve) => {
        const end = () => {
          if (finish !== end) return
          finish = null
          light(null)
          resolve()
        }
        finish = end
        utterance.onboundary = (e) => {
          if (finish !== end || e.name === 'sentence') return
          light(spans.find((s) => e.charIndex >= s.start && e.charIndex < s.end)?.el ?? null)
        }
        utterance.onend = end
        utterance.onerror = end
        synth.speak(utterance)
      })
    },
  }
}
