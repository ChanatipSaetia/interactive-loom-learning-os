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
  return [...new Set(Object.values(data.nodes ?? {}).map((n) => n.category ?? ''))]
}

export type ConceptMapStep =
  | { kind: 'group'; group: number }
  | { kind: 'relation'; edge: number }
  | { kind: 'map' }

/** Introduce endpoints before explaining each authored relation; edge IDs retain their source-list positions. */
export function conceptMapPlan(data: ConceptMapPresentData): ConceptMapStep[] {
  const groups = conceptCategories(data)
  const nodes = data.nodes ?? {}
  const edges = (data.edges ?? []).map((edge, index) => ({ edge, index }))
    .filter(({ edge }) => nodes[edge.from] && nodes[edge.to])
  if (!groups.length) return [{ kind: 'map' }]
  const plan: ConceptMapStep[] = []
  groups.forEach((_, group) => {
    plan.push({ kind: 'group', group })
    edges.forEach(({ edge, index }) => {
      const from = groups.indexOf(nodes[edge.from].category ?? '')
      const to = groups.indexOf(nodes[edge.to].category ?? '')
      if (Math.max(from, to) === group) plan.push({ kind: 'relation', edge: index })
    })
  })
  if (groups.length > 1 || edges.length) plan.push({ kind: 'map' })
  return plan
}

/** No cause, flow or other meaning is inferred: read the authored from → label → to statement. */
export function conceptRelationText(data: ConceptMapPresentData, edge: ConceptEdge): string {
  const nodes = data.nodes ?? {}
  return `${nodes[edge.from]?.title ?? edge.from} ${edge.label?.trim() || 'is connected to'} ${nodes[edge.to]?.title ?? edge.to}`
}

export function conceptMapBeats(data: ConceptMapPresentData): Beat[] {
  const groups = conceptCategories(data)
  return conceptMapPlan(data).map((step) => {
    if (step.kind === 'group') return show(`group${step.group + 1}`, `The ${quoted(groups[step.group] || 'concept')} concepts`)
    if (step.kind === 'relation') return show(`link${step.edge + 1}`, conceptRelationText(data, data.edges![step.edge]))
    return show('map', 'The whole map')
  })
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
