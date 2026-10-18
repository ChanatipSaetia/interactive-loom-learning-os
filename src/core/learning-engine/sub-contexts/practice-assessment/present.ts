/**
 * Present mode beats for the practice-assessment section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101).
 */
import { answer, listOf, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { QuizChoice, QuizQuestion, WordTermType } from './schema'
import type { ConceptEdge, ConceptNode } from './components/concept-map'

export type QuizPresentData = { title?: string; questions?: QuizQuestion[] }
export type FlashcardsPresentData = { title?: string; terms?: WordTermType[] }
export type ConceptMapPresentData = { title?: string; nodes?: Record<string, ConceptNode>; edges?: ConceptEdge[] }

/** What a quiz beat shows: a question asked, a wrong choice tried, or the right one given (decision 103). */
export type QuizStep = { question: number; step: 'ask' | 'wrong' | 'right'; choice?: QuizChoice }

/** Per question: ask it, try its first wrong choice, then give the right one. */
export function quizPlan(data: QuizPresentData): QuizStep[] {
  return (data.questions ?? []).flatMap((q, question): QuizStep[] => {
    const right = q.choices.find((c) => c.correct)
    const wrong = q.choices.find((c) => !c.correct)
    if (!right) return [{ question, step: 'ask' }]
    return [
      { question, step: 'ask' },
      ...(wrong ? [{ question, step: 'wrong' as const, choice: wrong }] : []),
      { question, step: 'right', choice: right },
    ]
  })
}

export function quizBeats(data: QuizPresentData): Beat[] {
  return quizPlan(data).map((s) => {
    if (s.step === 'ask') return show()
    const text = quoted(s.choice?.text ?? '')
    return s.step === 'wrong' ? answer('wrong', `Suppose we answer ${text}.`) : answer('right', `The right answer is ${text}.`)
  })
}

/** Per card: its front, then it flips to its definition. */
export function flashcardsBeats(data: FlashcardsPresentData): Beat[] {
  const terms = data.terms ?? []
  return terms.length ? terms.flatMap(() => [show(), show()]) : [show()]
}

/** The concepts' categories in order of first appearance; beat `i` brings in the concepts of category `i`. */
export function conceptCategories(data: ConceptMapPresentData): string[] {
  return [...new Set(Object.values(data.nodes ?? {}).map((n) => n.category))]
}

/** One beat per category group, its links drawing once both ends are on screen, then the whole map. */
export function conceptMapBeats(data: ConceptMapPresentData): Beat[] {
  const groups = conceptCategories(data)
  if (!groups.length) return [show()]
  const nodes = Object.values(data.nodes ?? {})
  const beats = groups.map((g) => show(`${g}: ${listOf(nodes.filter((n) => n.category === g).map((n) => n.title))}.`))
  return groups.length > 1 ? [...beats, show('Here is the whole map, every group and how they connect.')] : beats
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
