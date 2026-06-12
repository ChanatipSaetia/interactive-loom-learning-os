import type { TradeoffScenario } from '../../../../sections/tradeoff-sandbox'
import { dddVsCrudScenario } from './ddd-vs-crud'
import { aggregateDesignScenario } from './aggregate-design'

export const dddScenarios: TradeoffScenario[] = [
  dddVsCrudScenario,
  aggregateDesignScenario,
]
