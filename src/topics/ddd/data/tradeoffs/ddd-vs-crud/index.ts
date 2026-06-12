import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { domainComplexityStep } from './domain-complexity'
import { teamSizeStep } from './team-size'
import { lifecycleStep } from './lifecycle'

export const dddVsCrudScenario: TradeoffScenario = {
  id: 'ddd-vs-crud',
  title: 'DDD or Simple CRUD?',
  description: 'Not every project needs DDD. Walk through these decisions to find the right fit for your system.',
  metrics: [
    { id: 'maintainability', label: 'Maintainability', baseValue: 40, min: 0, max: 100, direction: 'higher' },
    { id: 'team-independence', label: 'Team Independence', baseValue: 30, min: 0, max: 100, direction: 'higher' },
    { id: 'time-to-mvp', label: 'Time to MVP', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Code Complexity', baseValue: 40, min: 0, max: 100, direction: 'lower' },
  ],
  steps: [
    domainComplexityStep,
    teamSizeStep,
    lifecycleStep,
  ]
}
