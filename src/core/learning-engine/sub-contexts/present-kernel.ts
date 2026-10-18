/**
 * Present mode contract shared by every section type (grill-log-presenting-mode.md).
 *
 * A section's `toBeats(data)` turns its compiled props into beats; its Present renderer draws the
 * state at the end of a beat and marks elements with `beatMarks()`. The stage
 * (`src/core/supporting/presentation`) animates the marked elements when a beat is entered, so
 * renderers never animate or style motion themselves.
 */
import type { ComponentType } from 'react'

/** `show` plays by itself, `gate` waits for the learner, `explore` runs live until Continue (decision 69). */
export type BeatKind = 'show' | 'gate' | 'explore'

export interface Beat {
  kind: BeatKind
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

export interface PresentGate {
  /** The gate at the current beat has been solved (always true for show and explore beats). */
  solved: boolean
  /** Mark the gate at the current beat solved; the stage then lets the learner move on. */
  solve: () => void
}

export interface PresentRendererProps<D = Record<string, unknown>> {
  /** The same `SectionConfig.props` the Read component gets. */
  data: D
  beats: Beat[]
  /** The beat to draw the end state of; -1 before the section is reached. */
  beat: number
  sectionIndex: number
  gate: PresentGate
  /** This section is the one on stage (not done, not in the overview): its explore and gate beats take input. */
  active: boolean
  /** The section's domain events, the same ones its Read component emits (decision 71). */
  onEvent?: (event: { type: string; [key: string]: unknown }) => void
}

export interface SectionPresenter<D = Record<string, unknown>> {
  toBeats: (data: D) => Beat[]
  load: () => Promise<{ default: ComponentType<PresentRendererProps<D>> }>
}

export const show = (): Beat => ({ kind: 'show' })
export const gate = (): Beat => ({ kind: 'gate' })
export const explore = (): Beat => ({ kind: 'explore' })

export interface BeatMarkOptions {
  motion?: BeatMotion
  /** Delay in ms after the beat starts. Unset rises are staggered among their siblings. */
  delay?: number
  /** Last beat the element is shown in; it leaves when the next beat starts. */
  until?: number
}

export type BeatMarkAttributes = {
  'data-beat': number
  'data-motion': BeatMotion
  'data-delay'?: number
  'data-until'?: number
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
 * Put on what narration should read once a gate is solved (an explanation, an outcome, a
 * recommendation): `<p {...SAY}>`.
 */
export const SAY = { 'data-say': '' } as const
