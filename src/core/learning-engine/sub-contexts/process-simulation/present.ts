/**
 * Present mode beats for the process-simulation section types (Beat Derivation in
 * grill-log-presenting-mode.md). Each function reads the compiled section props only.
 */
import { gate, show, type Beat, type SectionPresenter } from '../present-kernel'
import type { UnifiedFlowchartSchema } from './components/flowchart/types'
import type { ScenarioNode } from './schema'

export type FlowchartPresentData = { title?: string; schema?: UnifiedFlowchartSchema }
export type ScenarioPresentData = { id?: string; title?: string; intro?: string; nodes?: Record<string, ScenarioNode>; startNode?: string }

/** One beat per step of the first journey, played through the flowchart's own journey playback. */
export function flowchartBeats(data: FlowchartPresentData): Beat[] {
  const steps = data.schema?.journeys?.[0]?.steps ?? []
  return steps.length ? steps.map(() => show()) : [show()]
}

/** The setup and the first situation, then the learner chooses until an outcome. */
export function scenarioBeats(data: ScenarioPresentData): Beat[] {
  return data.nodes && Object.keys(data.nodes).length ? [show(), gate()] : [show()]
}

export const flowchartPresenter: SectionPresenter<FlowchartPresentData> = {
  toBeats: flowchartBeats,
  load: () => import('./components/flowchart/PresentFlowchart'),
}
export const scenarioPresenter: SectionPresenter<ScenarioPresentData> = {
  toBeats: scenarioBeats,
  load: () => import('./components/scenario/PresentScenario'),
}
