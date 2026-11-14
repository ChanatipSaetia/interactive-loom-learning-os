import { describe, expect, it } from 'vitest'
import { getCapabilityCatalog, getCapabilityIndex } from '../../../../../../src/core/learning-engine/composition/oui/capability-catalog'

describe('capability catalog', () => {
  it('includes a versioned, serializable section index', () => {
    const catalog = getCapabilityCatalog()
    expect(catalog.schemaVersion).toBe(3)
    expect(catalog.components.find((s) => s.component === 'Flowchart')?.mentalModel).toBeTruthy()
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog)
  })

  it('describes actual learner actions and evidence limits for every representation', () => {
    for (const section of getCapabilityCatalog().components) {
      expect(section.learningBehavior?.learnerAction).toBeTruthy()
      expect(section.learningBehavior?.presentationConstraint).toBeTruthy()
      expect(section.learningBehavior?.evidenceBoundary).toBeTruthy()
    }
    const quiz = getCapabilityCatalog().components.find((section) => section.component === 'Quiz')!
    expect(quiz.learningBehavior.presentationConstraint).toContain('Read captures learner attempts')
    expect(quiz.learningBehavior.evidenceBoundary).toContain('not mastery')
  })

  it('offers a bounded initial index without silently changing the full catalog', () => {
    const index = getCapabilityIndex()
    expect(index.componentGroups.flatMap((group) => [...group.components])).toEqual(expect.arrayContaining(['Table', 'TradeoffSandbox', 'TextContent']))
    expect(index).not.toHaveProperty('planSchema')
    expect(getCapabilityCatalog()).toHaveProperty('planSchema')
    // Characters / 4 is an English-oriented estimate, not provider token billing.
    expect(Math.ceil(JSON.stringify(index).length / 4)).toBeLessThanOrEqual(1000)
  })
})

it('surfaces view configurations and OpenUI families before signatures', async () => {
  const { FLOWCHART_VIEW_NAMES } = await import('../../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/abstract-flow/types')
  const { getAuthoringContract } = await import('../../../../../../src/core/learning-engine/composition/oui/authoring-contract')
  const index = getCapabilityIndex()
  expect(index.componentGroups.map((group) => group.name)).toContain('Explore choices and models')
  expect(index.flowchart.views).toEqual(FLOWCHART_VIEW_NAMES)
  expect(index.compositionChoices).toMatch(/tables.*Svg.*Steps.*scatter.*radar/)
  const flow = getCapabilityCatalog().components.find((section) => section.component === 'Flowchart')!
  expect(flow.capabilities?.views.map((view) => view.id)).toEqual(FLOWCHART_VIEW_NAMES)
  const contracts = getAuthoringContract({ detail: 'focused', sections: ['flowchart'], library: 'loom' })
  for (const name of ['Flowchart', 'Journey', 'JourneyStep', 'Branch', 'BranchOption', 'Event', 'StateMachine']) expect(contracts.contracts).toContain(`${name}(`)
  expect(contracts.coreContracts).toContain('NarrationStep(')
  expect(contracts.contracts).toContain('initialView')
})
