/**
 * Present mode beats for the reflection-synthesis section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101).
 */
import { answer, sentence, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { ReflectionSequenceChallenge, ReflectionTemplateChallenge } from './schema'

export type SequencePresentData = { title?: string; challenges?: ReflectionSequenceChallenge[] }
export type TemplatePresentData = { title?: string; challenges?: ReflectionTemplateChallenge[] }

/** Per challenge: the prompt and its items, then the stage puts them in the right order (decision 103). */
export function sequenceBeats(data: SequencePresentData): Beat[] {
  return (data.challenges ?? []).flatMap(() => [show(), answer('right', 'Here is the right order:')])
}

/** A template's sentence with each blank filled by its right chip. */
export function filledTemplate(challenge: ReflectionTemplateChallenge): string {
  const chip = (id: string) => challenge.chips.find((c) => c.id === id)?.text ?? id
  return challenge.template.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_, zone: string) => chip(challenge.solution[zone] ?? ''))
}

/** Per challenge: the prompt and its template, then the stage fills the blanks with the right chips. */
export function templateBeats(data: TemplatePresentData): Beat[] {
  return (data.challenges ?? []).flatMap((c) => [show(), answer('right', `Filled in, it reads: ${sentence(filledTemplate(c))}`)])
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
