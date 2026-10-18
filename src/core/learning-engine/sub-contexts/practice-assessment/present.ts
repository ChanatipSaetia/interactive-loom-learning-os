/**
 * Present mode beats for the practice-assessment section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { answer, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { QuizChoice, QuizQuestion, WordTermType } from './schema'
import type { ConceptEdge, ConceptNode } from './components/concept-map'

export type QuizPresentData = { title?: string; questions?: QuizQuestion[] }
export type FlashcardsPresentData = { title?: string; terms?: WordTermType[] }
export type ConceptMapPresentData = { title?: string; nodes?: Record<string, ConceptNode>; edges?: ConceptEdge[] }

/** What a quiz beat shows: a question asked, a wrong choice tried, or the right one given (decision 103). */
export type QuizStep = { question: number; step: 'ask' | 'wrong' | 'right'; choice?: QuizChoice }

/** Per question n: ask it (`qn`), try its first wrong choice (`qn.wrong`), then give the right one (`qn.right`). */
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
    const q = `q${s.question + 1}`
    if (s.step === 'ask') return show(q, `Question ${s.question + 1} asked`)
    const text = quoted(s.choice?.text ?? '')
    return s.step === 'wrong'
      ? answer('wrong', `${q}.wrong`, `Question ${s.question + 1}: tries ${text}, which is wrong`)
      : answer('right', `${q}.right`, `Question ${s.question + 1}: the right answer ${text}`)
  })
}

/** Per card n: its front (`cardn`), then it flips to its definition (`cardn.back`). */
export function flashcardsBeats(data: FlashcardsPresentData): Beat[] {
  const terms = data.terms ?? []
  if (!terms.length) return [show('deck', 'The empty deck')]
  return terms.flatMap((t, i) => [show(`card${i + 1}`, `Card ${i + 1}: ${quoted(t.word)}`), show(`card${i + 1}.back`, `Card ${i + 1} turned: its definition`)])
}

/** The concepts' categories in order of first appearance; beat `i` brings in the concepts of category `i`. */
export function conceptCategories(data: ConceptMapPresentData): string[] {
  return [...new Set(Object.values(data.nodes ?? {}).map((n) => n.category))]
}

/**
 * One beat per category group (`group1`, `group2`, …), its links drawing once both ends are on screen,
 * then the whole map (`map`) when there is more than one group.
 */
export function conceptMapBeats(data: ConceptMapPresentData): Beat[] {
  const groups = conceptCategories(data)
  if (!groups.length) return [show('map', 'The map')]
  const beats = groups.map((g, i) => show(`group${i + 1}`, `The ${quoted(g)} concepts`))
  return groups.length > 1 ? [...beats, show('map', 'The whole map')] : beats
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
