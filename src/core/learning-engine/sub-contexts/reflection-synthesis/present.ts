/**
 * Present mode beats for the reflection-synthesis section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { answer, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { ReflectionSequenceChallenge, ReflectionTemplateChallenge } from './schema'

export type SequencePresentData = { title?: string; challenges?: ReflectionSequenceChallenge[] }
export type TemplatePresentData = { title?: string; challenges?: ReflectionTemplateChallenge[] }

const ZONE = /(\{[a-zA-Z0-9_-]+\})/g
/** The template split into text and `{zone}` segments, in order. */
export const templateSegments = (template: string): string[] => template.split(ZONE)
export const isZone = (segment: string): boolean => /^\{[a-zA-Z0-9_-]+\}$/.test(segment)
/** The template's blanks (zone IDs), in reading order. */
export const templateZones = (template: string): string[] => templateSegments(template).filter(isZone).map((s) => s.slice(1, -1))

/**
 * The beat each challenge starts on (decision 115): its prompt (`cn`), one beat per item placed or
 * blank filled (`cn.stepK`), then `cn.solved`, so a challenge with `size` steps has `size + 2` beats.
 */
export function challengeStarts(sizes: number[]): number[] {
  let at = 0
  return sizes.map((size) => {
    const start = at
    at += size + 2
    return start
  })
}

/**
 * Per challenge n: the prompt and its items (`cn`); then the stage places the items in the right order,
 * one slot per beat (`cn.step1`, `cn.step2`, …), so narration can explain each step; then the order is
 * confirmed (`cn.solved`, decisions 103 and 115).
 */
export function sequenceBeats(data: SequencePresentData): Beat[] {
  return (data.challenges ?? []).flatMap((c, i) => {
    const n = i + 1
    const text = new Map(c.items.map((it) => [it.id, it.text]))
    return [
      show(`c${n}`, `Challenge ${n}: the steps to order`),
      ...c.solution.map((id, k) => show(`c${n}.step${k + 1}`, `Challenge ${n}: step ${k + 1} placed, ${quoted(text.get(id) ?? id)}`)),
      answer('right', `c${n}.solved`, `Challenge ${n}: the right order`),
    ]
  })
}

/**
 * Per challenge n: the prompt and its template (`cn`); then the stage fills the blanks with the right
 * chips, one blank per beat in reading order (`cn.step1`, …); then the sentence is confirmed with its
 * explanation (`cn.solved`, decision 115).
 */
export function templateBeats(data: TemplatePresentData): Beat[] {
  return (data.challenges ?? []).flatMap((c, i) => {
    const n = i + 1
    const text = new Map(c.chips.map((chip) => [chip.id, chip.text]))
    return [
      show(`c${n}`, `Challenge ${n}: the sentence with blanks`),
      ...templateZones(c.template).map((z, k) => show(`c${n}.step${k + 1}`, `Challenge ${n}: blank ${k + 1} filled with ${quoted(text.get(c.solution[z] ?? '') ?? '?')}`)),
      answer('right', `c${n}.solved`, `Challenge ${n}: the blanks filled in`),
    ]
  })
}

/** Items in a starting order that is not already the answer. */
export function startingOrder(ids: string[], solution: string[]): string[] {
  if (ids.length > 1 && ids.every((id, i) => id === solution[i])) return [...ids.slice(1), ids[0]]
  return ids
}

export const sequencePresenter: SectionPresenter<SequencePresentData> = {
  toBeats: sequenceBeats,
  load: () => import('./components/reflection-sequence/PresentSequence'),
}
export const templatePresenter: SectionPresenter<TemplatePresentData> = {
  toBeats: templateBeats,
  load: () => import('./components/reflection-template/PresentTemplate'),
}
