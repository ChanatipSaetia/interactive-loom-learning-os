import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { agentCommStep } from './agent-comm'
import { uiStrategyStep } from './ui-strategy'
import { toolAccessStep } from './tool-access'

export const protocolChoiceScenario: TradeoffScenario = {
  id: 'protocol-choice',
  title: 'Building an AI Agent Application',
  description: 'You are designing an AI-powered application. Which protocols do you need, and how do they fit together?',
  metrics: [
    { id: 'interop', label: 'Interoperability', baseValue: 30, min: 0, max: 100, direction: 'higher' },
    { id: 'safety', label: 'Safety', baseValue: 30, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Implementation Complexity', baseValue: 50, min: 0, max: 100, direction: 'lower' },
  ],
  steps: [
    agentCommStep,
    uiStrategyStep,
    toolAccessStep,
  ],
}
