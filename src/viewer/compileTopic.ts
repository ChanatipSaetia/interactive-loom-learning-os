/**
 * Compile a topic read from a bundle, zip or folder into renderable sections,
 * using the same OpenUI compiler and validation gateway as the learning app.
 */
import { compileOUITopic, type OUITopicManifest } from '../core/learning-engine/composition/oui/compile'
import { bundleToSections } from '../core/learning-engine/composition/okf/sections'
import { validateOUISection } from '../core/learning-engine/validation/oui-gateway'
import type { SectionConfig } from '../core/learning-engine/registry'
import type { TopicFiles } from '../core/supporting/authoring-editor/workspace'

export interface ViewerSection {
  name: string
  /** Renderable section, or null when the file is missing or does not compile. */
  config: SectionConfig | null
  error?: string
}

export interface ViewerTopic {
  topicId: string
  manifest: OUITopicManifest | null
  /** Set when topic.oui itself cannot be read. */
  error?: string
  sections: ViewerSection[]
}

const formatIssues = (issues: Array<{ line?: number; message: string }>) =>
  issues.map((i) => `${i.line ? `line ${i.line}: ` : ''}${i.message}`).join('\n')

export function compileViewerTopic({ topicId, files }: TopicFiles): ViewerTopic {
  const topic = compileOUITopic(files['topic.oui'] ?? '')
  const topicErrors = topic.issues.filter((i) => i.tier < 3)
  if (!topic.value || topicErrors.length) {
    return { topicId, manifest: null, error: `topic.oui has errors:\n${formatIssues(topicErrors)}`, sections: [] }
  }

  const sections = topic.value.sections.map((name): ViewerSection => {
    const file = `sections/${name}.oui`
    const source = files[file]
    if (source === undefined) return { name, config: null, error: `${file} is missing.` }
    const result = validateOUISection(source, { topicId, sectionName: name, file })
    const blocking = result.diagnostics.filter((d) => d.tier < 3)
    if (!result.payload || blocking.length) return { name, config: null, error: formatIssues(blocking) || `${file} cannot be compiled.` }
    return { name, config: bundleToSections([result.payload])[0] }
  })
  return { topicId, manifest: topic.value, sections }
}
