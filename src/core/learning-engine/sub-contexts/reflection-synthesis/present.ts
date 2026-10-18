/**
 * Present mode beats for the reflection-synthesis section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { answer, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { ReflectionSequenceChallenge, ReflectionTemplateChallenge } from './schema'

export type SequencePresentData = { title?: string; challenges?: ReflectionSequenceChallenge[] }
export type TemplatePresentData = { title?: string; challenges?: ReflectionTemplateChallenge[] }

/** Per challenge n: the prompt and its items (`cn`), then the stage puts them in the right order (`cn.solved`, decision 103). */
export function sequenceBeats(data: SequencePresentData): Beat[] {
  return (data.challenges ?? []).flatMap((_, i) => [show(`c${i + 1}`, `Challenge ${i + 1}: the steps to order`), answer('right', `c${i + 1}.solved`, `Challenge ${i + 1}: the right order`)])
}

/** Per challenge n: the prompt and its template (`cn`), then the stage fills the blanks with the right chips (`cn.solved`). */
export function templateBeats(data: TemplatePresentData): Beat[] {
  return (data.challenges ?? []).flatMap((_, i) => [show(`c${i + 1}`, `Challenge ${i + 1}: the sentence with blanks`), answer('right', `c${i + 1}.solved`, `Challenge ${i + 1}: the blanks filled in`)])
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
