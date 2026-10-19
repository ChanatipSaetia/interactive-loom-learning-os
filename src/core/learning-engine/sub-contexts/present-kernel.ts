/**
 * Present mode contract shared by every section type (grill-log-presenting-mode.md).
 *
 * A section's `toBeats(data)` turns its compiled props into beats; its Present renderer draws the
 * state at the end of a beat and marks elements with `beatMarks()`. The stage
 * (`src/core/supporting/presentation`) animates the marked elements when a beat is entered, so
 * renderers never animate or style motion themselves.
 */
import type { ComponentType } from 'react'
import type { SoundEffect } from '../../ui-system'

/**
 * One step of a hands-free section (decisions 101–106). Every beat plays by itself: the stage enters
 * it, the narrator reads it, its main content lights up, and autoplay moves on.
 */
export interface Beat {
  /**
   * The beat's name, stable for the section's content: a narration file attaches its steps to it with
   * `NarrationStep("q1.wrong", …)` (decision 108). Unique within the section.
   */
  id: string
  /** The beat performs an answer: a wrong try (and why it is wrong) or the right answer (decision 103). */
  answer?: 'wrong' | 'right'
  /** What the beat shows, in a few words, for authors (Studio's narration template, diagnostics). */
  about?: string
}

/** How a marked element enters (Motion Rules in the grill log). */
export type BeatMotion =
  | 'fade'
  | 'rise'
  | 'words'
  | 'unfold'
  | 'stack'
  | 'pop'
  /** Settles into place from slightly larger: the beat's key statement (a headline, a takeaway). */
  | 'zoom'
  /** Wipes in left to right (top to bottom with `--present-dir: v`); an SVG path with pathLength="1" strokes itself. */
  | 'draw'
  | 'children'

export interface PresentRendererProps<D = Record<string, unknown>> {
  /** The same `SectionConfig.props` the Read component gets. */
  data: D
  beats: Beat[]
  /** The beat to draw the end state of; -1 before the section is reached. */
  beat: number
  sectionIndex: number
  /** This section is the one on stage (not done, not in the overview): timed motion such as a sweep plays. */
  active: boolean
}

export interface SectionPresenter<D = Record<string, unknown>> {
  toBeats: (data: D) => Beat[]
  load: () => Promise<{ default: ComponentType<PresentRendererProps<D>> }>
}

export const show = (id: string, about?: string): Beat => ({ id, ...(about && { about }) })
/**
 * Every section but the intro opens on a `title` beat (decision 114): a card with its kind, title,
 * sub-heading and lead, drawn by the stage before the section's own beats. The intro's own first beat
 * is already its title.
 */
export const TITLE_BEAT = 'title'
export const titleBeatCount = (type: string): number => (type === 'intro' ? 0 : 1)
/** The beats the stage plays for a section: its title beat, then the beats its renderer draws. */
export const withTitleBeat = (type: string, beats: Beat[]): Beat[] =>
  titleBeatCount(type) ? [show(TITLE_BEAT, 'The section title and what it is about'), ...beats] : beats

/** A performed answer: `answer('wrong', …)` tries a wrong choice, `answer('right', …)` gives the right one. */
export const answer = (kind: 'wrong' | 'right', id: string, about?: string): Beat => ({ id, answer: kind, ...(about && { about }) })

export interface BeatMarkOptions {
  motion?: BeatMotion
  /** Delay in ms after the beat starts. Unset rises are staggered among their siblings. */
  delay?: number
  /** Last beat the element is shown in; it leaves when the next beat starts. */
  until?: number
  /** A sound on the moment the element lands (a right or wrong answer, a flip). */
  sound?: SoundEffect
}

export type BeatMarkAttributes = {
  'data-beat': number
  'data-motion': BeatMotion
  'data-delay'?: number
  'data-until'?: number
  'data-sound'?: SoundEffect
  'data-shown'?: ''
}

/**
 * Attributes that tie an element to the beat it appears in:
 * `const mark = beatMarks(beat)` then `<p {...mark(1, { motion: 'words' })}>`.
 */
export function beatMarks(current: number) {
  return (at: number, options: BeatMarkOptions = {}): BeatMarkAttributes => {
    const shown = current >= at && current <= (options.until ?? Infinity)
    return {
      'data-beat': at,
      'data-motion': options.motion ?? 'rise',
      ...(options.delay !== undefined && { 'data-delay': options.delay }),
      ...(options.until !== undefined && { 'data-until': options.until }),
      ...(options.sound && { 'data-sound': options.sound }),
      ...(shown && { 'data-shown': '' as const }),
    }
  }
}

/** Class of the word spans the `words` motion reveals one by one. */
export const PRESENT_WORD_CLASS = 'present-w'

/** Plain text split into words for the `words` motion. */
export function splitWords(text: string): Array<{ word: string; space: string }> {
  return text
    .split(/(\s+)/)
    .reduce<Array<{ word: string; space: string }>>((out, part) => {
      if (!part) return out
      if (/^\s+$/.test(part)) {
        if (out.length) out[out.length - 1].space = part
      } else out.push({ word: part, space: '' })
      return out
    }, [])
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Wrap every word of an HTML fragment (rendered markdown) in a word span, keeping its tags. */
export function wordsHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild as HTMLElement
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = splitWords(child.textContent ?? '')
        if (!parts.length) continue
        const lead = /^\s/.test(child.textContent ?? '') ? ' ' : ''
        const span = doc.createElement('span')
        span.innerHTML = lead + parts.map((p) => `<span class="${PRESENT_WORD_CLASS}">${escapeHtml(p.word)}</span>${p.space}`).join('')
        child.replaceWith(...Array.from(span.childNodes))
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Inline code arrives as one word
        if ((child as Element).tagName === 'CODE') (child as Element).classList.add(PRESENT_WORD_CLASS)
        else walk(child)
      }
    }
  }
  walk(root)
  return root.innerHTML
}

/** Number of words in a beat's text, for the reading-time hold (decision 69). */
export const wordCount = (text: string) => splitWords(text).length

/**
 * Put on a beat's main content, the part the stage lights up while the beat plays (decision 105):
 * `<p {...focus(beat === 2)}>`. A beat with nothing marked lights what it brings on screen.
 */
export const focus = (on: boolean) => (on ? { 'data-focus': '' } : {})

/**
 * Put on what the voice should not read out when a beat has no authored narration (a drawing's
 * labels, slot numbers, a pool the beat only moves): `<svg {...QUIET}>`.
 */
export const QUIET = { 'data-quiet': '' } as const

/**
 * Put on a stage line that frames the beat ("An example walk through the tree", "The result of these
 * decisions"): the voice reads it on its beat even when an authored narration step plays there, unless
 * the step's caption already says it.
 */
export const FRAME = { 'data-present-frame': '' } as const

/** Markdown or HTML as plain text, for a beat's `about`. */
export function plain(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|\*|`)(.+?)\1/g, '$2')
    .replace(/^\s*(#+|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Text cut to a few words, for a beat's `about`. */
export function brief(text: string, max = 60): string {
  const t = plain(text)
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

/** A choice or label quoted inside a beat's `about`. */
export const quoted = (text: string) => `“${brief(text)}”`

/**
 * The opening of a longer text, for the stage (decision 109): its first `sentences` sentences, the rest
 * left to Read. Text without sentence stops (Thai, a single long sentence) comes back whole.
 */
export function lead(text: string | undefined, sentences = 1): string {
  if (!text) return ''
  const parts = text.trim().split(/(?<=[^\s.]{3}[.!?]|[。！？])\s+(?=\S)/)
  return parts.slice(0, sentences).join(' ')
}
