import { describe, expect, it } from 'vitest'
import { getCapabilityCatalog, getCapabilityIndex } from '../../../../../../src/core/learning-engine/composition/oui/capability-catalog'

describe('capability catalog', () => {
  it('includes a versioned, serializable section index', () => {
    const catalog = getCapabilityCatalog()
    expect(catalog.schemaVersion).toBe(1)
    expect(catalog.sections.find((s) => s.type === 'flowchart')?.mentalModel).toBeTruthy()
    expect(JSON.parse(JSON.stringify(catalog))).toEqual(catalog)
  })

  it('describes actual learner actions and evidence limits for every representation', () => {
    for (const section of getCapabilityCatalog().sections) {
      expect(section.learningBehavior?.learnerAction).toBeTruthy()
      expect(section.learningBehavior?.presentationConstraint).toBeTruthy()
      expect(section.learningBehavior?.evidenceBoundary).toBeTruthy()
    }
    const quiz = getCapabilityCatalog().sections.find((section) => section.type === 'quiz')!
    expect(quiz.learningBehavior.presentationConstraint).toContain('Read captures learner attempts')
    expect(quiz.learningBehavior.evidenceBoundary).toContain('not mastery')
  })

  it('offers a bounded initial index without silently changing the full catalog', () => {
    const index = getCapabilityIndex()
    expect(index.sections.map((s) => s.type)).toEqual(getCapabilityCatalog().sections.map((s) => s.type))
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
  expect(index.sections).toHaveLength(20)
  expect(index.flowchart.views).toEqual(FLOWCHART_VIEW_NAMES)
  expect(index.openui).toMatch(/tables.*Svg.*Steps.*scatter.*radar/)
  const flow = getCapabilityCatalog().sections.find((section) => section.type === 'flowchart')!
  expect(flow.capabilities?.views.map((view) => view.id)).toEqual(FLOWCHART_VIEW_NAMES)
  const contracts = getAuthoringContract({ detail: 'focused', sections: ['flowchart'], library: 'loom' })
  for (const name of ['Flowchart', 'Journey', 'JourneyStep', 'Branch', 'BranchOption', 'Event', 'StateMachine']) expect(contracts.contracts).toContain(`${name}(`)
  expect(contracts.coreContracts).toContain('NarrationStep(')
  expect(contracts.contracts).toContain('initialView')
})
