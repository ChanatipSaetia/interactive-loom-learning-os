/**
 * Present mode beats for the practice-assessment section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only.
 */
import { gate, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { QuizQuestion, WordTermType } from './schema'

export type QuizPresentData = { title?: string; questions?: QuizQuestion[] }
export type FlashcardsPresentData = { title?: string; terms?: WordTermType[] }

/** Per question: the question and its choices, then the learner answers. */
export function quizBeats(data: QuizPresentData): Beat[] {
  return (data.questions ?? []).flatMap(() => [show(), gate()])
}

/** The deck, then the learner flips and grades every card. */
export function flashcardsBeats(data: FlashcardsPresentData): Beat[] {
  return data.terms?.length ? [show(), gate()] : [show()]
}

export const quizPresenter: SectionPresenter<QuizPresentData> = {
  toBeats: quizBeats,
  load: () => import('./components/quiz/PresentQuiz'),
}
export const flashcardsPresenter: SectionPresenter<FlashcardsPresentData> = {
  toBeats: flashcardsBeats,
  load: () => import('./components/flashcards/PresentFlashcards'),
}
