import { describe, it, expect } from 'vitest'
import type {
  TradeoffSandboxEvents,
  SliderValueChanged,
  MetricRecalculated,
  DecisionNodeSelected,
} from '../../../../../src/core/subdomains/tradeoff-sandbox/events'

describe('TradeoffSandboxEvents', () => {
  it('SliderValueChanged has correct structure', () => {
    const event: SliderValueChanged = {
      type: 'SliderValueChanged',
      variableId: 'x',
      newValue: 75,
      oldValue: 50,
      timestamp: Date.now(),
    }
    expect(event.type).toBe('SliderValueChanged')
    expect(event.variableId).toBe('x')
    const unionEvent: TradeoffSandboxEvents = event
    expect(unionEvent.type).toBe('SliderValueChanged')
  })

  it('MetricRecalculated has correct structure', () => {
    const event: MetricRecalculated = {
      type: 'MetricRecalculated',
      metricId: 'y',
      newValue: 150,
      formula: 'x * 2',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('MetricRecalculated')
    expect(event.formula).toBe('x * 2')
  })

  it('DecisionNodeSelected has correct structure', () => {
    const event: DecisionNodeSelected = {
      type: 'DecisionNodeSelected',
      nodeId: 'root',
      choiceId: 'c1',
      nextNodeId: 'leaf1',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('DecisionNodeSelected')
    expect(event.nextNodeId).toBe('leaf1')
  })
})
