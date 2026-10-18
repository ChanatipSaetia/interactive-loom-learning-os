/**
 * Present mode beats for the process-simulation section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101).
 */
import { answer, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { UnifiedFlowchartSchema } from './components/flowchart/types'
import type { ScenarioChoice, ScenarioNode, ScenarioOutcome } from './schema'

export type FlowchartPresentData = { title?: string; schema?: UnifiedFlowchartSchema }
export type ScenarioPresentData = { id?: string; title?: string; intro?: string; nodes?: Record<string, ScenarioNode>; startNode?: string }

/** One beat per step of the first journey, played through the flowchart's own journey playback. */
export function flowchartBeats(data: FlowchartPresentData): Beat[] {
  const steps = data.schema?.journeys?.[0]?.steps ?? []
  return steps.length ? steps.map(() => show()) : [show()]
}

export const scenarioNext = (c: ScenarioChoice) => c.next ?? c.nextNode ?? ''
export const scenarioText = (c: ScenarioChoice) => c.text ?? c.label ?? ''

/** The nodes walked so far, each with the choice that led there. */
export type ScenarioPath = Array<{ nodeId: string; choice?: ScenarioChoice }>

const RANK: Record<ScenarioOutcome['rating'], number> = { 'a': 3, 'b-plus': 2, 'b-minus': 1, 'c': 0 }
const MAX_DEPTH = 12
const MAX_WALKS = 200

/** Every walk from the start to an outcome, without loops. */
function walks(nodes: Record<string, ScenarioNode>, start: string): ScenarioPath[] {
  const out: ScenarioPath[] = []
  const visit = (path: ScenarioPath) => {
    if (out.length >= MAX_WALKS) return
    const here = nodes[path[path.length - 1].nodeId]
    if (here?.outcome) return void out.push(path)
    if (path.length > MAX_DEPTH) return
    for (const choice of here?.choices ?? []) {
      const to = scenarioNext(choice)
      if (!nodes[to] || path.some((p) => p.nodeId === to)) continue
      visit([...path, { nodeId: to, choice }])
    }
  }
  if (nodes[start]) visit([{ nodeId: start }])
  return out
}

const rank = (nodes: Record<string, ScenarioNode>, path: ScenarioPath) => RANK[nodes[path[path.length - 1].nodeId]?.outcome?.rating ?? 'c']
const shared = (a: ScenarioPath, b: ScenarioPath) => {
  let n = 0
  while (n < a.length && n < b.length && a[n].nodeId === b[n].nodeId) n++
  return n
}

/** What one scenario beat shows: the path walked so far. */
export type ScenarioStep = { path: ScenarioPath; say?: string; answer?: 'wrong' | 'right' }

/**
 * The walk the stage performs (decision 103): the setup; when a weaker ending exists, the path to it
 * first, choice by choice; then back to where the paths part and on along the best path to its outcome.
 */
export function scenarioPlan(data: ScenarioPresentData): ScenarioStep[] {
  const nodes = data.nodes ?? {}
  const start = data.startNode ?? 'start'
  if (!nodes[start]) return []
  const all = walks(nodes, start)
  const opening: ScenarioStep = { path: [{ nodeId: start }] }
  if (!all.length) return [opening]
  const best = [...all].sort((a, b) => rank(nodes, b) - rank(nodes, a) || a.length - b.length)[0]
  // The weaker walk that leaves the best one earliest, the weakest of those
  const worse = all
    .filter((w) => rank(nodes, w) < rank(nodes, best))
    .sort((a, b) => shared(a, best) - shared(b, best) || rank(nodes, a) - rank(nodes, b) || a.length - b.length)[0]
  const steps: ScenarioStep[] = [opening]
  const walk = (path: ScenarioPath, from: number, tone: 'wrong' | 'right', back: boolean) => {
    for (let k = from; k < path.length; k++) {
      const text = quoted(scenarioText(path[k].choice ?? {}))
      const end = k === path.length - 1
      steps.push({
        path: path.slice(0, k + 1),
        say: back && k === from ? `Let's go back and choose ${text} instead.` : `We choose ${text}.`,
        ...(end && { answer: tone }),
      })
    }
  }
  if (worse) {
    walk(worse, 1, 'wrong', false)
    walk(best, shared(worse, best), 'right', true)
  } else {
    walk(best, 1, 'right', false)
  }
  return steps
}

export function scenarioBeats(data: ScenarioPresentData): Beat[] {
  const plan = scenarioPlan(data)
  return plan.length ? plan.map((s) => (s.answer ? answer(s.answer, s.say) : show(s.say))) : [show()]
}

export const flowchartPresenter: SectionPresenter<FlowchartPresentData> = {
  toBeats: flowchartBeats,
  load: () => import('./components/flowchart/PresentFlowchart'),
}
export const scenarioPresenter: SectionPresenter<ScenarioPresentData> = {
  toBeats: scenarioBeats,
  load: () => import('./components/scenario/PresentScenario'),
}
