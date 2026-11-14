import { REPRESENTATION_AFFORDANCES } from './component-recommendations'
import { componentTeachingProfile } from './component-teaching'
import { COMPONENT_PURPOSES } from './component-purpose'
import { z } from 'zod'
import { TopicPlanSchema } from './topic-plan'
import { AUTHORING_WORKFLOW_VERSION, AUTHORING_WORKFLOW_STAGES } from './authoring-workflow'
/** Small, serializable capability index for stateless MCP runtimes. */
import { FLOWCHART_MODELS, OPENUI_MODELS, REPRESENTATION_SELECTION_GUIDE, SECTION_MENTAL_MODELS, SECTION_LEARNING_BEHAVIORS } from './mental-model-guide'
import { guideSectionTypes } from './authoring-guide'
import { getUnifiedOUISpec } from './library'

export const CAPABILITY_CATALOG_VERSION = 3

export function getCapabilityCatalog() {
  const sections = guideSectionTypes()
  const models = new Map<string, { model: string; question: string }>(
    SECTION_MENTAL_MODELS.map(({ type, model, question }) => [type, { model, question }]),
  )
  return {
    navigation: { entry: "loom://references/index.md", fallback: { tool: "read_reference", arguments: { path: "index.md" } }, strategy: "Read one linked reference at a time; follow relevant branches, never recursively expand the tree." },
    schemaVersion: CAPABILITY_CATALOG_VERSION,
    page: { root: 'Page', boundary: 'one section = one compositional learning page; no authored section type', focus: 'one main visual/activity plus supporting text; advisory warnings', presentation: 'hands-free automatic scenes/beats; mode-specific views of shared content' },
    componentGroups: getUnifiedOUISpec().componentGroups,
    planSchema: z.toJSONSchema(TopicPlanSchema),
    workflow: { version: AUTHORING_WORKFLOW_VERSION, stages: AUTHORING_WORKFLOW_STAGES.map((stage) => stage.id) },
    selectionGuidance: REPRESENTATION_SELECTION_GUIDE,
    visualChoices: OPENUI_MODELS.map(([learningGoal, components]) => ({ learningGoal, components })),
    components: sections.filter((section) => section.component !== 'Page').map((section) => ({
      component: section.component, summary: section.summary,
      ...(() => { const affordances = REPRESENTATION_AFFORDANCES.find((entry) => entry.component === section.component); return affordances ? { affordances } : {} })(),
      teaching: componentTeachingProfile(section.component),
      mentalModel: models.get(section.type)?.model ?? '',
      selectionQuestion: models.get(section.type)?.question ?? '',
      learningBehavior: SECTION_LEARNING_BEHAVIORS[section.type as keyof typeof SECTION_LEARNING_BEHAVIORS],
      ...(section.type === 'flowchart' ? { capabilities: {
        views: FLOWCHART_MODELS.map(([id, purpose]) => ({ id, purpose })),
        interactions: ['Journey/JourneyStep guided paths', 'Branch/BranchOption alternatives', 'async commands and sendsTo messages'],
        narration: 'Flowchart.initialView selects the primary view; NarrationStep.view may change views on the same beat for a distinct teaching purpose.',
        modelingConstraints: 'Use real participants and event → policy → command → handler → event cycles. Data Flow uses Event.data; State Machine requires StateMachine and Event.enters. JourneyStep.processGroup is a phase label, not a state. Never invent model detail to activate views.',
      } } : {}),
    })),
  }
}

/** Initial discovery without the full plan schema, long prose or detailed behaviors. */
export function getCapabilityIndex() {
  return {
    navigation: { entry: "loom://references/index.md", fallback: { tool: "read_reference", arguments: { path: "index.md" } }, strategy: "Read one linked reference at a time; follow relevant branches, never recursively expand the tree." },
    schemaVersion: CAPABILITY_CATALOG_VERSION,
    page: 'Page(title, body, heading?): one compositional learning page per section; no authored section type; one main activity with supporting components; local state; automatic beats.',
    workflow: { version: AUTHORING_WORKFLOW_VERSION, stages: AUTHORING_WORKFLOW_STAGES.map((stage) => stage.id) },
    componentGroups: COMPONENT_PURPOSES.map(({ name, purpose, components }) => ({ name, purpose, components })),
    flowchart: { views: FLOWCHART_MODELS.map(([id]) => id), configuration: 'initialView; NarrationStep.view; Journey/JourneyStep; Branch/BranchOption; Event.data; StateMachine/Event.enters' },
    compositionChoices: 'tables (Table/Col) for factual attributes; cards/stacks (Card/Stack) for examples; labelled Svg for spatial mechanisms; Steps for visual stages; bar/horizontal, line/area, pie/donut/stacked, scatter, radar charts for supplied/verified or labelled illustrative data',
    discovery: { tool: 'recommend_components', inputs: ['learningObjective', 'knowledgeStructure', 'learnerAction', 'constraints'], strategy: 'Compare bounded candidates, then retrieve selected contracts.' },
    selection: 'Objective → structure → learner action → capabilities → simplest faithful configuration; no rankings or quotas.',
    next: 'Use detail: full for learner actions, presentation constraints, evidence boundaries and the exact TopicPlan schema; fetch exact component contracts after planning the page composition.',
  }
}
