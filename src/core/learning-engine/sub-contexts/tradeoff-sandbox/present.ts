/**
 * Present mode beats for the tradeoff-sandbox section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { answer, brief, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { DecisionTreeChoice, DecisionTreeNode, FormulaMetric, FormulaVariable, TradeoffScenario } from './schema'
import { evaluateFormula } from './components/formula-sandbox/evaluate'

export type TradeoffPresentData = { title?: string; scenarios?: TradeoffScenario[] }
export type FormulaPresentData = { title?: string; variables?: FormulaVariable[]; metrics?: FormulaMetric[] }
export type DecisionTreePresentData = { id?: string; title?: string; root?: string; nodes?: Record<string, DecisionTreeNode> }

export const choicesOf = (node?: DecisionTreeNode): DecisionTreeChoice[] => node?.choices ?? node?.options ?? []
export const nextOf = (choice: DecisionTreeChoice): string => choice.next ?? choice.target ?? ''

export interface TreeDrawing {
  /** Node positions in grid units: x across the leaves, y the depth. */
  nodes: Array<{ id: string; x: number; y: number; leaf: boolean }>
  /** `cross` links lead to a node already drawn elsewhere in the tree (a shared answer or a loop). */
  links: Array<{ from: string; to: string; choiceId?: string; cross: boolean }>
  width: number
  depth: number
}

/** A tidy top-down drawing of the tree from `root`: leaves side by side, each parent over its children. */
export function drawTree(root: string, nodes: Record<string, DecisionTreeNode>): TreeDrawing {
  const placed = new Map<string, { x: number; y: number; leaf: boolean }>()
  const links: TreeDrawing['links'] = []
  let leaves = 0
  let depth = 0
  const visit = (id: string, y: number): number => {
    const spot = { x: 0, y, leaf: true }
    placed.set(id, spot)
    depth = Math.max(depth, y)
    const xs: number[] = []
    for (const c of choicesOf(nodes[id])) {
      const to = nextOf(c)
      if (!nodes[to]) continue
      if (placed.has(to)) {
        links.push({ from: id, to, choiceId: c.id, cross: true })
        continue
      }
      links.push({ from: id, to, choiceId: c.id, cross: false })
      xs.push(visit(to, y + 1))
    }
    spot.leaf = xs.length === 0
    spot.x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : leaves++
    return spot.x
  }
  if (nodes[root]) visit(root, 0)
  return { nodes: [...placed].map(([id, p]) => ({ id, ...p })), links, width: Math.max(1, leaves), depth }
}

/** A choice the walk takes: the recommended one, else the first that leads somewhere new. */
function walkChoice(nodes: Record<string, DecisionTreeNode>, id: string, seen: string[]): DecisionTreeChoice | undefined {
  const open = choicesOf(nodes[id]).filter((c) => nodes[nextOf(c)] && !seen.includes(nextOf(c)))
  return open.find((c) => c.recommended) ?? open[0]
}

/** The path the stage answers its way down (decision 103): node ids from the root to a leaf, with the choice taken into each. */
export function decisionTreeWalk(data: DecisionTreePresentData): Array<{ nodeId: string; choice?: DecisionTreeChoice }> {
  const nodes = data.nodes ?? {}
  if (!data.root || !nodes[data.root]) return []
  const path: Array<{ nodeId: string; choice?: DecisionTreeChoice }> = [{ nodeId: data.root }]
  for (;;) {
    const choice = walkChoice(nodes, path[path.length - 1].nodeId, path.map((p) => p.nodeId))
    if (!choice) return path
    path.push({ nodeId: nextOf(choice), choice })
  }
}

/**
 * What one decision-tree beat shows: the card of `walk[node]`, and whether the choice the walk takes
 * there is picked on it (an answer beat) or not yet (a question, or the recommendation at a leaf).
 */
export type DecisionTreeStep = { id: string; about: string; node: number; picked: boolean }

/**
 * Ask, then answer on the same card, so the choice is shown and explained while it is made (decision
 * 110): the tree with the first question (`start`), the answer taken there (`answer1`), the next
 * question (`q2`), its answer (`answer2`), …, then the recommendation the walk reaches (`result`).
 */
export function decisionTreePlan(data: DecisionTreePresentData): DecisionTreeStep[] {
  const walk = decisionTreeWalk(data)
  if (!walk.length) return []
  const nodes = data.nodes ?? {}
  const steps: DecisionTreeStep[] = [{ id: 'start', about: 'The tree and the first question', node: 0, picked: false }]
  for (let i = 1; i < walk.length; i++) {
    const choice = walk[i].choice
    steps.push({ id: `answer${i}`, about: `Answers ${quoted(choice?.text ?? choice?.label ?? '')}`, node: i - 1, picked: true })
    const next = nodes[walk[i].nodeId]
    steps.push(next?.leaf && !choicesOf(next).length
      ? { id: 'result', about: `The recommendation: ${brief(next.leaf.recommendation ?? '')}`, node: i, picked: false }
      : { id: `q${i + 1}`, about: `Question ${i + 1}: ${brief(next?.prompt ?? next?.text ?? next?.title ?? '')}`, node: i, picked: false })
  }
  return steps
}

export function decisionTreeBeats(data: DecisionTreePresentData): Beat[] {
  const plan = decisionTreePlan(data)
  return plan.length ? plan.map((s) => (s.id === 'result' ? answer('right', s.id, s.about) : show(s.id, s.about))) : [show('start', 'The tree')]
}

/**
 * What each tradeoff beat shows: a step's choices, one choice's gains and costs (`choice` is its index
 * in the step), or the step's recommended choice.
 */
export type TradeoffBeat = { scenario: number; step: number; show: 'choices' | 'choice' | 'recommended'; choice?: number }

/**
 * Per TradeoffStep: its choices with their effects, then each choice that has gains or costs in turn
 * (decision 112), then its `recommended` choice when it has one.
 */
export function tradeoffPlan(data: TradeoffPresentData): TradeoffBeat[] {
  return (data.scenarios ?? []).flatMap((sc, scenario) => sc.steps.flatMap((st, step): TradeoffBeat[] => [
    { scenario, step, show: 'choices' },
    ...st.choices.flatMap((c, choice): TradeoffBeat[] => (c.pros.length || c.cons.length ? [{ scenario, step, show: 'choice', choice }] : [])),
    ...(st.recommended && st.choices.some((c) => c.id === st.recommended) ? [{ scenario, step, show: 'recommended' as const }] : []),
  ]))
}

/** Scenarios with a recommended choice somewhere: each ends on the metrics those choices add up to. */
export const tradeoffSummaries = (data: TradeoffPresentData): number[] =>
  (data.scenarios ?? []).flatMap((sc, i) => (sc.steps.some((st) => st.recommended && st.choices.some((c) => c.id === st.recommended)) ? [i] : []))

/**
 * Every step's choices (`step1`, `step2`, … numbered across scenarios), the gains and costs of each
 * choice that has some (`step1.choice1`, `step1.choice2`, … numbered in the step), and the step's
 * recommendation (`step1.recommended`, …); then where the recommended choices leave each scenario's
 * metrics (`result1`, `result2`, …).
 */
export function tradeoffBeats(data: TradeoffPresentData): Beat[] {
  const plan = tradeoffPlan(data)
  if (!plan.length) return [show('sandbox', 'The sandbox')]
  let k = 0
  const steps = plan.map((b) => {
    const step = data.scenarios?.[b.scenario].steps[b.step]
    if (b.show === 'choices') {
      k += 1
      return show(`step${k}`, `Step ${k}: ${brief(step?.title ?? '')} and its choices`)
    }
    if (b.show === 'choice') {
      const choice = step?.choices[b.choice ?? 0]
      return show(`step${k}.choice${(b.choice ?? 0) + 1}`, `Step ${k}: the gains and costs of ${quoted(choice?.label ?? '')}`)
    }
    const choice = step?.choices.find((c) => c.id === step.recommended)
    return show(`step${k}.recommended`, `Step ${k}: the recommended choice ${quoted(choice?.label ?? '')}`)
  })
  const results = tradeoffSummaries(data).map((i, n) => show(`result${n + 1}`, `The metrics with every recommended choice in ${quoted(data.scenarios?.[i].title ?? '')}`))
  return [...steps, ...results]
}

/** Metrics in order, so a later formula can use an earlier metric (as the Read sandbox does). */
export function computeFormulas(metrics: FormulaMetric[], values: Record<string, number>): Record<string, number> {
  const scope = { ...values }
  const out: Record<string, number> = {}
  for (const m of metrics) {
    out[m.id] = evaluateFormula(m.formula, scope)
    scope[m.id] = out[m.id]
  }
  return out
}

/** Variables the stage sweeps: each one that can move, in order. */
export const sweptVariables = (data: FormulaPresentData): FormulaVariable[] => (data.variables ?? []).filter((v) => v.max > v.min)

/** How a metric moves while one variable sweeps from its min to its max, the others at their defaults. */
export interface FormulaTrend {
  metric: FormulaMetric
  from: number
  to: number
  /** `peak` / `dip`: it turns on the way, at `turn`. */
  shape: 'rises' | 'falls' | 'peak' | 'dip'
  turn?: number
}

const TREND_SAMPLES = 24
const close = (a: number, b: number, scale: number) => Math.abs(a - b) <= scale * 1e-6

/** The trend of every metric that changes as `variable` sweeps (decision 112), in metric order. */
export function formulaTrends(data: FormulaPresentData, variable: FormulaVariable): FormulaTrend[] {
  const metrics = data.metrics ?? []
  const defaults = Object.fromEntries((data.variables ?? []).map((v) => [v.id, v.defaultValue]))
  const runs = Array.from({ length: TREND_SAMPLES + 1 }, (_, i) =>
    computeFormulas(metrics, { ...defaults, [variable.id]: variable.min + ((variable.max - variable.min) * i) / TREND_SAMPLES }))
  return metrics.flatMap((metric): FormulaTrend[] => {
    const ys = runs.map((r) => r[metric.id])
    if (ys.some((y) => !Number.isFinite(y))) return []
    const from = ys[0]
    const to = ys[ys.length - 1]
    const hi = Math.max(...ys)
    const lo = Math.min(...ys)
    const scale = Math.max(1, Math.abs(hi), Math.abs(lo))
    if (close(hi, lo, scale)) return []
    if (!close(hi, Math.max(from, to), scale)) return [{ metric, from, to, shape: 'peak', turn: hi }]
    if (!close(lo, Math.min(from, to), scale)) return [{ metric, from, to, shape: 'dip', turn: lo }]
    return [{ metric, from, to, shape: to > from ? 'rises' : 'falls' }]
  })
}

/**
 * The variables and metrics (`formulas`), then one sweep per variable that can move, from its min to its
 * max while the metrics follow and their trends are stated (`sweep1`, `sweep2`, …).
 */
export function formulaBeats(data: FormulaPresentData): Beat[] {
  if (!data.variables?.length || !data.metrics?.length) return [show('formulas', 'The formulas')]
  return [
    show('formulas', 'The formulas, sliders and metrics'),
    ...sweptVariables(data).map((v, i) => show(`sweep${i + 1}`, `${quoted(v.label)} moves from ${v.min} to ${v.max}, and how each metric follows`)),
  ]
}

export const tradeoffPresenter: SectionPresenter<TradeoffPresentData> = {
  toBeats: tradeoffBeats,
  load: () => import('./components/tradeoff-sandbox/PresentTradeoff'),
}
export const formulaPresenter: SectionPresenter<FormulaPresentData> = {
  toBeats: formulaBeats,
  load: () => import('./components/formula-sandbox/PresentFormula'),
}
export const decisionTreePresenter: SectionPresenter<DecisionTreePresentData> = {
  toBeats: decisionTreeBeats,
  load: () => import('./components/decision-tree/PresentDecisionTree'),
}
