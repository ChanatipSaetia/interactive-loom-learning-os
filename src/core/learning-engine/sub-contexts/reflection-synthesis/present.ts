/**
 * Present mode beats for the reflection-synthesis section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only.
 */
import { gate, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { ReflectionSequenceChallenge, ReflectionTemplateChallenge } from './schema'

export type SequencePresentData = { title?: string; challenges?: ReflectionSequenceChallenge[] }
export type TemplatePresentData = { title?: string; challenges?: ReflectionTemplateChallenge[] }

/** Per challenge: the prompt and its items, then the learner orders them. */
export function sequenceBeats(data: SequencePresentData): Beat[] {
  return (data.challenges ?? []).flatMap(() => [show(), gate()])
}

/** Per challenge: the prompt and its template, then the learner fills the blanks. */
export function templateBeats(data: TemplatePresentData): Beat[] {
  return (data.challenges ?? []).flatMap(() => [show(), gate()])
}

export const sequencePresenter: SectionPresenter<SequencePresentData> = {
  toBeats: sequenceBeats,
  load: () => import('./components/reflection-sequence/PresentSequence'),
}
export const templatePresenter: SectionPresenter<TemplatePresentData> = {
  toBeats: templateBeats,
  load: () => import('./components/reflection-template/PresentTemplate'),
}
