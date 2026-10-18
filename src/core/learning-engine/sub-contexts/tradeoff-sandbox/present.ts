/**
 * Present mode beats for the tradeoff-sandbox section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only.
 */
import { explore, gate, show, type Beat, type SectionPresenter } from '../present-kernel'
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

/** The tree drawing in with the first question, then the learner answers until a recommendation. */
export function decisionTreeBeats(data: DecisionTreePresentData): Beat[] {
  return data.root && data.nodes?.[data.root] ? [show(), gate()] : [show()]
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

/** Every step's choices and recommendation, then the sandbox to try combinations in. */
export function tradeoffBeats(data: TradeoffPresentData): Beat[] {
  const plan = tradeoffPlan(data)
  return plan.length ? [...plan.map(() => show()), explore()] : [show()]
}

/** The variables and metrics, a sweep of the first variable from its default to its max, then the sliders. */
export function formulaBeats(data: FormulaPresentData): Beat[] {
  if (!data.variables?.length || !data.metrics?.length) return [show()]
  const first = data.variables[0]
  return first.max !== first.defaultValue ? [show(), show(), explore()] : [show(), explore()]
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
