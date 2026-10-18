/**
 * Present mode beats for the process-simulation section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only; every beat
 * plays by itself (decision 101). Beat IDs name the beats for narration files (decision 108).
 */
import { answer, brief, quoted, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { UnifiedFlowchartSchema } from './components/flowchart/types'
import type { ScenarioChoice, ScenarioNode, ScenarioOutcome } from './schema'

export type FlowchartPresentData = { title?: string; schema?: UnifiedFlowchartSchema }
export type ScenarioPresentData = { id?: string; title?: string; intro?: string; nodes?: Record<string, ScenarioNode>; startNode?: string }

/** One beat per step of the first journey (`step1`, `step2`, …), played through the flowchart's own journey playback. */
export function flowchartBeats(data: FlowchartPresentData): Beat[] {
  const steps = data.schema?.journeys?.[0]?.steps ?? []
  return steps.length ? steps.map((_, i) => show(`step${i + 1}`, `Journey step ${i + 1}`)) : [show('chart', 'The chart')]
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

/**
 * What one scenario beat shows: the path walked so far (its last node is the card on stage), the choice
 * picked on that card in this beat if any, and the choice tried there earlier on the weaker walk.
 */
export type ScenarioStep = { id: string; about: string; path: ScenarioPath; picked?: ScenarioChoice; tried?: ScenarioChoice; answer?: 'wrong' | 'right' }

/**
 * The walk the stage performs (decisions 103 and 110): the setup (`start`); when a weaker ending
 * exists, its path first, each choice picked on the card it is asked on (`wrong1`, `wrong2`, …) and
 * then where it leads (`wrong1.next`, …, the last one its outcome); then back at the fork, where the
 * paths part, along the best path the same way (`right1`, `right1.next`, …, the last one its outcome).
 */
export function scenarioPlan(data: ScenarioPresentData): ScenarioStep[] {
  const nodes = data.nodes ?? {}
  const start = data.startNode ?? 'start'
  if (!nodes[start]) return []
  const all = walks(nodes, start)
  const opening: ScenarioStep = { id: 'start', about: 'The setup and the first situation', path: [{ nodeId: start }] }
  if (!all.length) return [opening]
  const best = [...all].sort((a, b) => rank(nodes, b) - rank(nodes, a) || a.length - b.length)[0]
  // The weaker walk that leaves the best one earliest, the weakest of those
  const worse = all
    .filter((w) => rank(nodes, w) < rank(nodes, best))
    .sort((a, b) => shared(a, best) - shared(b, best) || rank(nodes, a) - rank(nodes, b) || a.length - b.length)[0]
  const steps: ScenarioStep[] = [opening]
  const walk = (path: ScenarioPath, from: number, tone: 'wrong' | 'right', tried?: ScenarioChoice) => {
    for (let k = from; k < path.length; k++) {
      const choice = path[k].choice ?? {}
      const id = `${tone}${k - from + 1}`
      const end = k === path.length - 1
      const back = !!tried && k === from
      steps.push({
        id,
        about: `${back ? 'Back at the fork, chooses' : 'Chooses'} ${quoted(scenarioText(choice))}`,
        path: path.slice(0, k),
        picked: choice,
        ...(back && { tried }),
      })
      steps.push({
        id: `${id}.next`,
        about: end ? `The ${tone === 'wrong' ? 'weaker' : 'best'} outcome` : `The next situation: ${brief(nodes[path[k].nodeId]?.prompt ?? nodes[path[k].nodeId]?.text ?? '')}`,
        path: path.slice(0, k + 1),
        ...(end && { answer: tone }),
      })
    }
  }
  if (worse) {
    walk(worse, 1, 'wrong')
    const fork = shared(worse, best)
    walk(best, fork, 'right', worse[fork]?.choice)
  } else {
    walk(best, 1, 'right')
  }
  return steps
}

export function scenarioBeats(data: ScenarioPresentData): Beat[] {
  const plan = scenarioPlan(data)
  return plan.length ? plan.map((s) => (s.answer ? answer(s.answer, s.id, s.about) : show(s.id, s.about))) : [show('start', 'The setup')]
}

export const flowchartPresenter: SectionPresenter<FlowchartPresentData> = {
  toBeats: flowchartBeats,
  load: () => import('./components/flowchart/PresentFlowchart'),
}
export const scenarioPresenter: SectionPresenter<ScenarioPresentData> = {
  toBeats: scenarioBeats,
  load: () => import('./components/scenario/PresentScenario'),
}
