import type { TradeoffScenario } from '../../../../sections/tradeoff-sandbox'
import { retrievalStep } from './retrieval'
import { documentStoreStep } from './document-store'
import { pipelinePatternStep } from './pipeline-pattern'

export const haystackTradeoffScenario: TradeoffScenario = {
  id: 'haystack-architecture',
  title: 'Haystack Architecture Decisions',
  description: 'Design a production search system with Haystack. Evaluate trade-offs across retrieval strategy, document store choice, and pipeline pattern.',
  metrics: [
    { id: 'accuracy', label: 'Search Accuracy', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'latency', label: 'Low Latency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
    { id: 'cost', label: 'Cost Efficiency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
  ],
  steps: [
    retrievalStep,
    documentStoreStep,
    pipelinePatternStep,
  ],
}
