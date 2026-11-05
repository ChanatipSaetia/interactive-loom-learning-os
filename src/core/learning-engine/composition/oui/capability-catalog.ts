/** Small, serializable capability index for stateless MCP runtimes. */
import { OPENUI_MODELS, REPRESENTATION_SELECTION_GUIDE, SECTION_MENTAL_MODELS } from './mental-model-guide'
import { guideSectionTypes } from './authoring-guide'

export const CAPABILITY_CATALOG_VERSION = 1

export function getCapabilityCatalog() {
  const sections = guideSectionTypes()
  const models = new Map<string, { model: string; question: string }>(
    SECTION_MENTAL_MODELS.map(({ type, model, question }) => [type, { model, question }]),
  )
  return {
    schemaVersion: CAPABILITY_CATALOG_VERSION,
    selectionGuidance: REPRESENTATION_SELECTION_GUIDE,
    openuiVisuals: OPENUI_MODELS.map(([learningGoal, components]) => ({ learningGoal, components })),
    sections: sections.map((section) => ({
      ...section,
      mentalModel: models.get(section.type)?.model ?? '',
      selectionQuestion: models.get(section.type)?.question ?? '',
    })),
  }
}
