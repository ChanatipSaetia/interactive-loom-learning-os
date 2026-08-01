import { describe, it, expect } from 'vitest'
import type {
  ProcessSimulationEvents,
  StepChanged,
  SimulationReset,
} from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/events'

describe('ProcessSimulationEvents', () => {
  it('StepChanged has correct structure', () => {
    const event: StepChanged = {
      type: 'StepChanged',
      stepIndex: 2,
      journeyId: 'journey-1',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('StepChanged')
    expect(event.stepIndex).toBe(2)
    const unionEvent: ProcessSimulationEvents = event
    expect(unionEvent.type).toBe('StepChanged')
  })

  it('SimulationReset has correct structure', () => {
    const event: SimulationReset = {
      type: 'SimulationReset',
      simulationId: 'flowchart-1',
      timestamp: Date.now(),
    }
    expect(event.type).toBe('SimulationReset')
    expect(event.simulationId).toBe('flowchart-1')
  })
})
