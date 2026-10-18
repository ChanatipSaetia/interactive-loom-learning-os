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
   * The narrator's line for the beat, derived from the content: shown as the caption and read before
   * what the beat puts on screen. Unset when the on-screen text says it all (a paragraph, a bullet).
   */
  say?: string
  /** The beat performs an answer: a wrong try (and why it is wrong) or the right answer (decision 103). */
  answer?: 'wrong' | 'right'
}

/** How a marked element enters (Motion Rules in the grill log). */
export type BeatMotion =
  | 'fade'
  | 'rise'
  | 'words'
  | 'unfold'
  | 'stack'
  | 'pop'
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

export const show = (say?: string): Beat => (say ? { say } : {})
/** A performed answer: `answer('wrong', …)` tries a wrong choice, `answer('right', …)` gives the right one. */
export const answer = (kind: 'wrong' | 'right', say?: string): Beat => ({ ...(say && { say }), answer: kind })

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
 * Put on what the voice should not read out, because the beat's `say` line already says it (a
 * drawing's labels, a choice the line quotes): `<svg {...QUIET}>`.
 */
export const QUIET = { 'data-quiet': '' } as const

/** Markdown or HTML as plain text for a narrator's line. */
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

/** A choice or label quoted inside a narrator's line. */
export const quoted = (text: string) => `“${plain(text)}”`

/** Items joined for speech: "a, b and c". */
export const listOf = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

/** Ends a line with a full stop unless it already ends a sentence. */
export const sentence = (text: string) => {
  const t = plain(text)
  return !t || /[.!?…:]$/.test(t) ? t : `${t}.`
}
