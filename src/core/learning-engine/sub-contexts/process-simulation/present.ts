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
 * picked on that card in this beat if any, the choices tried there on earlier paths, and, on an ending,
 * which ending it is.
 */
export type ScenarioStep = {
  id: string
  about: string
  path: ScenarioPath
  picked?: ScenarioChoice
  tried?: ScenarioChoice[]
  ending?: { index: number; count: number }
  answer?: 'wrong' | 'right'
}

/**
 * The walks the stage performs (decisions 103, 110 and 113): the setup (`start`), then one path to every
 * ending (the shortest walk to it), weaker endings first in branch order so each path leaves the last
 * one as late as possible, the best ending last. Along path P each choice is picked on the card it is
 * asked on (`pathP.choiceN`), then where it leads (`pathP.choiceN.next`, the last one its ending); a
 * later path starts back at the fork where it leaves the one before, with the choices tried there
 * struck through.
 */
export function scenarioPlan(data: ScenarioPresentData): ScenarioStep[] {
  const nodes = data.nodes ?? {}
  const start = data.startNode ?? 'start'
  if (!nodes[start]) return []
  const all = walks(nodes, start)
  const opening: ScenarioStep = { id: 'start', about: 'The setup and the first situation', path: [{ nodeId: start }] }
  if (!all.length) return [opening]
  // One walk per ending: the shortest that reaches it
  const byEnd = new Map<string, ScenarioPath>()
  for (const w of all) {
    const end = w[w.length - 1].nodeId
    const known = byEnd.get(end)
    if (!known || w.length < known.length) byEnd.set(end, w)
  }
  const endings = [...byEnd.values()]
  const best = [...endings].sort((a, b) => rank(nodes, b) - rank(nodes, a) || a.length - b.length)[0]
  const order = [...endings.filter((w) => w !== best).sort((a, b) => all.indexOf(a) - all.indexOf(b)), best]
  const top = rank(nodes, best)
  const steps: ScenarioStep[] = [opening]
  order.forEach((path, p) => {
    const from = p === 0 ? 1 : shared(order[p - 1], path)
    for (let k = from; k < path.length; k++) {
      const choice = path[k].choice ?? {}
      const id = `path${p + 1}.choice${k - from + 1}`
      const end = k === path.length - 1
      // Choices taken from this card on the paths before
      const tried = order.slice(0, p).flatMap((w) => (w[k - 1]?.nodeId === path[k - 1].nodeId && w[k]?.choice && w[k].choice !== choice ? [w[k].choice as ScenarioChoice] : []))
      const unique = tried.filter((c, i) => tried.indexOf(c) === i)
      steps.push({
        id,
        about: `Path ${p + 1}: ${p > 0 && k === from ? 'back at the fork, chooses' : 'chooses'} ${quoted(scenarioText(choice))}`,
        path: path.slice(0, k),
        picked: choice,
        ...(unique.length && { tried: unique }),
      })
      steps.push({
        id: `${id}.next`,
        about: end ? `Path ${p + 1}: ending ${p + 1} of ${order.length}` : `Path ${p + 1}: the next situation: ${brief(nodes[path[k].nodeId]?.prompt ?? nodes[path[k].nodeId]?.text ?? '')}`,
        path: path.slice(0, k + 1),
        ...(end && { ending: { index: p + 1, count: order.length }, answer: rank(nodes, path) >= top ? 'right' as const : 'wrong' as const }),
      })
    }
  })
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
