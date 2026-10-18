/**
 * Present mode beats for the tradeoff-sandbox section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { brief, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { DecisionTreeChoice, DecisionTreeNode, FormulaMetric, FormulaVariable, TradeoffScenario } from './schema'

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

/** The tree drawing in with the first question (`start`), then one answer per beat until a recommendation (`answer1`, `answer2`, …). */
export function decisionTreeBeats(data: DecisionTreePresentData): Beat[] {
  const walk = decisionTreeWalk(data)
  if (!walk.length) return [show('start', 'The tree')]
  const last = walk.length - 1
  return [
    show('start', 'The tree and the first question'),
    ...walk.slice(1).map((p, i) => show(`answer${i + 1}`, `Answers ${quoted(p.choice?.text ?? p.choice?.label ?? '')}${i + 1 === last ? ', reaching the recommendation' : ''}`)),
  ]
}

/** What each tradeoff beat shows: a step's choices, or that step's recommended choice. */
export type TradeoffBeat = { scenario: number; step: number; recommended: boolean }

/** Per TradeoffStep: its choices with their effects, then its `recommended` choice when it has one. */
export function tradeoffPlan(data: TradeoffPresentData): TradeoffBeat[] {
  return (data.scenarios ?? []).flatMap((sc, scenario) => sc.steps.flatMap((st, step) => [
    { scenario, step, recommended: false },
    ...(st.recommended && st.choices.some((c) => c.id === st.recommended) ? [{ scenario, step, recommended: true }] : []),
  ]))
}

/** Scenarios with a recommended choice somewhere: each ends on the metrics those choices add up to. */
export const tradeoffSummaries = (data: TradeoffPresentData): number[] =>
  (data.scenarios ?? []).flatMap((sc, i) => (sc.steps.some((st) => st.recommended && st.choices.some((c) => c.id === st.recommended)) ? [i] : []))

/**
 * Every step's choices (`step1`, `step2`, … numbered across scenarios) and its recommendation
 * (`step1.recommended`, …), then where the recommended choices leave each scenario's metrics
 * (`result1`, `result2`, …).
 */
export function tradeoffBeats(data: TradeoffPresentData): Beat[] {
  const plan = tradeoffPlan(data)
  if (!plan.length) return [show('sandbox', 'The sandbox')]
  let k = 0
  const steps = plan.map((b) => {
    const step = data.scenarios?.[b.scenario].steps[b.step]
    if (!b.recommended) k += 1
    const choice = step?.choices.find((c) => c.id === step.recommended)
    return b.recommended
      ? show(`step${k}.recommended`, `Step ${k}: the recommended choice ${quoted(choice?.label ?? '')}`)
      : show(`step${k}`, `Step ${k}: ${brief(step?.title ?? '')} and its choices`)
  })
  const results = tradeoffSummaries(data).map((i, n) => show(`result${n + 1}`, `The metrics with every recommended choice in ${quoted(data.scenarios?.[i].title ?? '')}`))
  return [...steps, ...results]
}

/** The variables and metrics (`formulas`), then a sweep of the first variable from its default to its max (`sweep`). */
export function formulaBeats(data: FormulaPresentData): Beat[] {
  if (!data.variables?.length || !data.metrics?.length) return [show('formulas', 'The formulas')]
  const first = data.variables[0]
  return first.max !== first.defaultValue
    ? [show('formulas', 'The formulas, sliders and metrics'), show('sweep', `${quoted(first.label)} moves from ${first.defaultValue} to ${first.max}`)]
    : [show('formulas', 'The formulas, sliders and metrics')]
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
