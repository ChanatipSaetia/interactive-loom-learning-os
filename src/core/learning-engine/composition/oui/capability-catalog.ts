import { z } from 'zod'
import { TopicPlanSchema } from './topic-plan'
import { AUTHORING_WORKFLOW_VERSION, AUTHORING_WORKFLOW_STAGES } from './authoring-workflow'
/** Small, serializable capability index for stateless MCP runtimes. */
import { OPENUI_MODELS, REPRESENTATION_SELECTION_GUIDE, SECTION_MENTAL_MODELS, SECTION_LEARNING_BEHAVIORS } from './mental-model-guide'
import { guideSectionTypes } from './authoring-guide'

export const CAPABILITY_CATALOG_VERSION = 1

export function getCapabilityCatalog() {
  const sections = guideSectionTypes()
  const models = new Map<string, { model: string; question: string }>(
    SECTION_MENTAL_MODELS.map(({ type, model, question }) => [type, { model, question }]),
  )
  return {
    schemaVersion: CAPABILITY_CATALOG_VERSION,
    planSchema: z.toJSONSchema(TopicPlanSchema),
    workflow: { version: AUTHORING_WORKFLOW_VERSION, stages: AUTHORING_WORKFLOW_STAGES.map((stage) => stage.id) },
    selectionGuidance: REPRESENTATION_SELECTION_GUIDE,
    openuiVisuals: OPENUI_MODELS.map(([learningGoal, components]) => ({ learningGoal, components })),
    sections: sections.map((section) => ({
      ...section,
      mentalModel: models.get(section.type)?.model ?? '',
      selectionQuestion: models.get(section.type)?.question ?? '',
      learningBehavior: SECTION_LEARNING_BEHAVIORS[section.type as keyof typeof SECTION_LEARNING_BEHAVIORS],
    })),
  }
}

/** Initial discovery without the full plan schema, long prose or detailed behaviors. */
export function getCapabilityIndex() {
  const models = new Map(SECTION_MENTAL_MODELS.map(({ type, model }) => [type as string, model]))
  return {
    schemaVersion: CAPABILITY_CATALOG_VERSION,
    workflow: { version: AUTHORING_WORKFLOW_VERSION, stages: AUTHORING_WORKFLOW_STAGES.map((stage) => stage.id) },
    sections: guideSectionTypes().map(({ type, component }) => ({ type, component, mentalModel: models.get(type) ?? '' })),
    next: 'Use detail: full for learner actions, presentation constraints, evidence boundaries and the exact TopicPlan schema; fetch library-scoped authoring contracts after choosing representations.',
  }
}
