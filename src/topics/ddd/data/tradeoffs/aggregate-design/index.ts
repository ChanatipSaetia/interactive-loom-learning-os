import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { aggregateSizeStep } from './aggregate-size'
import { historyStep } from './history-handling'

export const aggregateDesignScenario: TradeoffScenario = {
  id: 'aggregate-design',
  title: 'Aggregate Design Under Pressure',
  description: 'Aggregates are the consistency boundary in DDD. Design them wrong and you get performance problems, concurrency issues, and maintenance nightmares.',
  metrics: [
    { id: 'performance', label: 'Performance', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'consistency', label: 'Consistency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'maintainability', label: 'Maintainability', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Complexity', baseValue: 50, min: 0, max: 100, direction: 'lower' },
  ],
  steps: [
    aggregateSizeStep,
    historyStep,
  ]
}
