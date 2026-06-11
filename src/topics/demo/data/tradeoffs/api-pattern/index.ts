import type { TradeoffScenario } from '../../../../../sections/tradeoff-sandbox'
import { realtimeCommStep } from './realtime-comm'
import { batchProcessingStep } from './batch-processing'

export const apiPatternScenario: TradeoffScenario = {
  id: 'api-pattern',
  title: 'API Communication Pattern',
  description: 'Evaluate communication patterns for real-time and batch workloads.',
  metrics: [
    { id: 'latency', label: 'Low Latency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'throughput', label: 'Throughput', baseValue: 50, min: 0, max: 100, direction: 'higher' },
    { id: 'complexity', label: 'Complexity', baseValue: 30, min: 0, max: 100, direction: 'lower' },
    { id: 'cost', label: 'Cost Efficiency', baseValue: 50, min: 0, max: 100, direction: 'higher' },
  ],
  steps: [
    realtimeCommStep,
    batchProcessingStep,
  ],
}
