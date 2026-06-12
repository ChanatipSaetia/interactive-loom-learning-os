import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { autonomyTierStep } from './autonomy-tier'
import { scopeDefinitionStep } from './scope-definition'

export const autonomyTierScenario: TradeoffScenario = {
  id: 'autonomy-tier',
  title: 'Scope and Authority Design',
  description: 'Define how independently the agent operates and how narrowly its scope is bounded. Balance autonomy, safety, and operational cost.',
  metrics: [
    { id: 'speed', label: 'Execution Speed', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'safety', label: 'Safety & Control', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'cost', label: 'Cost Efficiency', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Operational Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
  ],
  steps: [
    scopeDefinitionStep,
    autonomyTierStep,
  ],
}
