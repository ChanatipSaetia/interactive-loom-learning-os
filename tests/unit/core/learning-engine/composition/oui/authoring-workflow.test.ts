import { describe, expect, it } from 'vitest'
import { AUTHORING_WORKFLOW_STAGES, AUTHORING_WORKFLOW_VERSION, getAuthoringWorkflow } from '../../../../../../src/core/learning-engine/composition/oui/authoring-workflow'
import { getTutorGuide, getTutorViewerSkill, LOOM_SERVER_INSTRUCTIONS } from '../../../../../../src/core/learning-engine/composition/oui/tutor-skills'
import { getWriterSkillReferences } from '../../../../../../src/core/learning-engine/composition/oui/skill-references'
import { getLoomAssistantPrompt } from '../../../../../../src/core/learning-engine/composition/oui/assistant-prompt'
import { getCapabilityCatalog } from '../../../../../../src/core/learning-engine/composition/oui/capability-catalog'
import { TopicPlanSchema, readStudioPlan, buildStudioPlanMessage, validateTopicPlan } from '../../../../../../src/core/learning-engine/composition/oui/topic-plan'

export const plan = {
  schemaVersion: 1 as const, topicId: 'evidence', goal: 'Distinguish evidence needs',
  objectives: [{ id: 'compare', description: 'Compare single-span and distributed evidence' }],
  sections: [
    { id: 'examples', title: 'Compare evidence', objectiveRefs: ['compare'], components: ['Svg'], activity: 'Inspect two labelled documents', rationale: 'The evidence positions are a spatial comparison' },
    { id: 'check', title: 'Apply it', objectiveRefs: ['compare'], components: ['Quiz'], activity: 'Choose which question needs both sections', rationale: 'A native quiz records assessment evidence' },
  ],
}

describe('shared authoring workflow and plan', () => {
  it('routes MCP and Studio through discovery, checked planning and scoped contracts', () => {
    expect(LOOM_SERVER_INSTRUCTIONS).toContain('loom://references/index.md')
    expect(LOOM_SERVER_INSTRUCTIONS).not.toContain('get_authoring_guide')
    expect(getTutorGuide()).toContain(getAuthoringWorkflow('mcp'))
    expect(getLoomAssistantPrompt({ app: 'studio', tools: true })).toContain(getAuthoringWorkflow('studio'))
    expect(getTutorViewerSkill()).toContain(getAuthoringWorkflow('files'))
    expect(getWriterSkillReferences()['references/planning/workflow.md']).toContain(getAuthoringWorkflow('files'))
    for (const host of ['mcp', 'studio'] as const) {
      const text = getAuthoringWorkflow(host)
      expect(text.indexOf(host === 'studio' ? 'get_loom_capabilities' : host === 'mcp' ? 'read_reference' : 'get_loom_capabilities')).toBeLessThan(text.indexOf('validate_topic_plan'))
      expect(text).toContain('component contracts')
      expect(text).toContain('For a small edit')
    }
    expect(getCapabilityCatalog().workflow).toEqual({ version: AUTHORING_WORKFLOW_VERSION, stages: AUTHORING_WORKFLOW_STAGES.map((stage) => stage.id) })
  })
  it('uses the same validated TopicPlan and preserves design decisions through selection', () => {
    expect(TopicPlanSchema.safeParse(plan).success).toBe(true)
    const studio = readStudioPlan(JSON.stringify({ plan, actions: { check: 'edit' } }))!
    expect(studio.topicPlan).toEqual(plan)
    expect(studio.items[1]).toMatchObject({ action: 'edit', type: 'page', activity: plan.sections[1].activity, rationale: plan.sections[1].rationale, components: ['Quiz'] })
    const message = buildStudioPlanMessage(studio, [1])
    expect(message).toContain(plan.sections[1].activity)
    expect(message).toContain(plan.sections[1].rationale)
    expect(message).toContain('revalidate objective coverage')
    expect(message).not.toContain(plan.sections[0].activity)
  })
  it('keeps legacy plans and rejects invalid canonical plans and action maps', () => {
    expect(readStudioPlan(JSON.stringify({ goal: 'G', items: [{ action: 'create', name: 'sections/check.oui', type: 'Quiz', title: 'Check', idea: 'Apply the idea' }] }))?.items[0].name).toBe('check')
    for (const actions of [{ missing: 'edit' }, { check: 'delete' }, { check: ['edit'] }]) expect(readStudioPlan(JSON.stringify({ plan, actions }))).toBeNull()
    const invalid = { ...plan, sections: [{ ...plan.sections[0], components: ['MissingComponent'] }] }
    expect(validateTopicPlan(invalid)[0].code).toBe('INVALID_INPUT')
    expect(readStudioPlan(JSON.stringify({ plan: invalid }))).toBeNull()
  })
})

it('supports existing underscore-named topics and sections in shared plans', () => {
  const compatible = { ...plan, topicId: 'evidence_demo', sections: plan.sections.map((section) => ({ ...section, id: section.id === 'examples' ? 'evidence_examples' : section.id })) }
  expect(readStudioPlan(JSON.stringify({ plan: compatible }))?.items[0].name).toBe('evidence_examples')
})
