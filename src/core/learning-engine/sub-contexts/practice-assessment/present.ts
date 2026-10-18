/**
 * Present mode beats for the practice-assessment section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only.
 */
import { explore, gate, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { QuizQuestion, WordTermType } from './schema'
import type { ConceptEdge, ConceptNode } from './components/concept-map'

export type QuizPresentData = { title?: string; questions?: QuizQuestion[] }
export type FlashcardsPresentData = { title?: string; terms?: WordTermType[] }
export type ConceptMapPresentData = { title?: string; nodes?: Record<string, ConceptNode>; edges?: ConceptEdge[] }

/** Per question: the question and its choices, then the learner answers. */
export function quizBeats(data: QuizPresentData): Beat[] {
  return (data.questions ?? []).flatMap(() => [show(), gate()])
}

/** The deck, then the learner flips and grades every card. */
export function flashcardsBeats(data: FlashcardsPresentData): Beat[] {
  return data.terms?.length ? [show(), gate()] : [show()]
}

/** The concepts' categories in order of first appearance; beat `i` brings in the concepts of category `i`. */
export function conceptCategories(data: ConceptMapPresentData): string[] {
  return [...new Set(Object.values(data.nodes ?? {}).map((n) => n.category))]
}

/** One beat per category group, its links drawing once both ends are on screen, then free exploring. */
export function conceptMapBeats(data: ConceptMapPresentData): Beat[] {
  const groups = conceptCategories(data)
  return groups.length ? [...groups.map(() => show()), explore()] : [show()]
}

export const quizPresenter: SectionPresenter<QuizPresentData> = {
  toBeats: quizBeats,
  load: () => import('./components/quiz/PresentQuiz'),
}
export const flashcardsPresenter: SectionPresenter<FlashcardsPresentData> = {
  toBeats: flashcardsBeats,
  load: () => import('./components/flashcards/PresentFlashcards'),
}
export const conceptMapPresenter: SectionPresenter<ConceptMapPresentData> = {
  toBeats: conceptMapBeats,
  load: () => import('./components/concept-map/PresentConceptMap'),
}
