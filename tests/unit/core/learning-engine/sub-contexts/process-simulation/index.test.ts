import { describe, it, expect } from 'vitest'
import * as ProcessSimulationSubdomain from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation'

describe('ProcessSimulation Bounded Context Entry Point', () => {
  it('exports all Zod schemas', () => {
    expect(ProcessSimulationSubdomain.FlowchartSectionSchema).toBeDefined()
    expect(ProcessSimulationSubdomain.ScenarioSectionSchema).toBeDefined()
  })

  it('exports all section components and modals', () => {
    expect(ProcessSimulationSubdomain.Flowchart).toBeDefined()
    expect(ProcessSimulationSubdomain.ScenarioSection).toBeDefined()
    expect(ProcessSimulationSubdomain.FlowchartHelpModal).toBeDefined()
    expect(ProcessSimulationSubdomain.ScenarioHelpModal).toBeDefined()
  })

  it('schemas are zod objects', () => {
    expect(ProcessSimulationSubdomain.FlowchartSectionSchema._def).toBeDefined()
    expect(ProcessSimulationSubdomain.ScenarioSectionSchema._def).toBeDefined()
  })
})
