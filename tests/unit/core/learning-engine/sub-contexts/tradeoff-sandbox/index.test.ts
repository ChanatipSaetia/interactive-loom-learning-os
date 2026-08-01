import { describe, it, expect } from 'vitest'
import * as TradeoffSandboxSubdomain from '../../../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox'

describe('TradeoffSandbox Bounded Context Entry Point', () => {
  it('exports all Zod schemas', () => {
    expect(TradeoffSandboxSubdomain.TradeoffSandboxSectionSchema).toBeDefined()
    expect(TradeoffSandboxSubdomain.FormulaSandboxSectionSchema).toBeDefined()
    expect(TradeoffSandboxSubdomain.DecisionTreeSectionSchema).toBeDefined()
  })

  it('exports all section components', () => {
    expect(TradeoffSandboxSubdomain.TradeoffSandboxSection).toBeDefined()
    expect(TradeoffSandboxSubdomain.FormulaSandboxSection).toBeDefined()
    expect(TradeoffSandboxSubdomain.FormulaSandbox).toBeDefined()
    expect(TradeoffSandboxSubdomain.DecisionTreeSection).toBeDefined()
  })

  it('schemas are zod objects', () => {
    expect(TradeoffSandboxSubdomain.TradeoffSandboxSectionSchema._def).toBeDefined()
    expect(TradeoffSandboxSubdomain.FormulaSandboxSectionSchema._def).toBeDefined()
    expect(TradeoffSandboxSubdomain.DecisionTreeSectionSchema._def).toBeDefined()
  })
})
