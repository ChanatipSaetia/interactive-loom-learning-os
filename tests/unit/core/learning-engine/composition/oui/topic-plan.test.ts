import { describe, expect, it } from 'vitest'
import { validateTopicPlan, type TopicPlan } from '../../../../../../src/core/learning-engine/composition/oui/topic-plan'

const supported = new Set(['flowchart', 'openui'])
const base: TopicPlan = {
  schemaVersion: 1, topicId: 'gross-profit', goal: 'Understand gross profit',
  objectives: [{ id: 'calculate-profit', description: 'Calculate gross profit' }],
  sections: [{ id: 'profit-exercise', title: 'Experiment', objectiveRefs: ['calculate-profit'], representation: 'openui', activity: 'Calculate' }],
}
describe('validateTopicPlan', () => {
  it('accepts a covered plan', () => expect(validateTopicPlan(base, supported)).toEqual([]))
  it('reports missing objectives and unsupported representations', () => {
    const plan: TopicPlan = { ...base, sections: [{ ...base.sections[0], objectiveRefs: ['missing'], representation: 'unknown' }] }
    expect(validateTopicPlan(plan, supported).map((e) => e.code)).toEqual(expect.arrayContaining(['MISSING_OBJECTIVE', 'UNKNOWN_SECTION_TYPE', 'UNCOVERED_OBJECTIVE']))
  })
  it('detects prerequisite cycles', () => {
    const plan: TopicPlan = { ...base, objectives: [
      { id: 'calculate-profit', description: 'Calculate', prerequisiteIds: ['understand-cost'] },
      { id: 'understand-cost', description: 'Understand', prerequisiteIds: ['calculate-profit'] },
    ], sections: [{ ...base.sections[0], objectiveRefs: ['calculate-profit', 'understand-cost'] }] }
    expect(validateTopicPlan(plan, supported).some((e) => e.code === 'PREREQUISITE_CYCLE')).toBe(true)
  })
})
