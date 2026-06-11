import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { computeStep } from './compute'
import { stateStep } from './state'
import { orchestrationStep } from './orchestration'

export const realtimeChatScenario: TradeoffScenario = {
  id: 'realtime-chat',
  title: 'Real-Time Chat & Collab System',
  description: 'Design a real-time collaborative system: WebAssembly compute, Node.js services, Redis pub/sub, Kubernetes orchestration. Balance latency, consistency, and cost.',
  metrics: [
    { id: 'latency', label: 'Low Latency', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'consistency', label: 'Consistency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'devex', label: 'Developer Experience', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'ops-cost', label: 'Ops Cost', baseValue: 50, min: 0, max: 100, direction: 'higher' },
  ],
  steps: [
    computeStep,
    stateStep,
    orchestrationStep,
  ],
}
