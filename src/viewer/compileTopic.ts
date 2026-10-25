/**
 * Compile a topic read from a bundle, zip or folder into renderable sections,
 * using the same OpenUI compiler and validation gateway as the learning app.
 */
import { compileOUITopic, sourceMapOf, type OUISourceMap, type OUITopicManifest } from '../core/learning-engine/composition/oui/compile'
import { bundleToSections } from '../core/learning-engine/composition/okf/sections'
import { validateOUINarration, validateOUISection } from '../core/learning-engine/validation/oui-gateway'
import { NARRATION_FILE, type NarrationData } from '../core/learning-engine/composition/oui/narration'
import type { SectionConfig } from '../core/learning-engine/registry'
import type { TopicFiles } from '../core/supporting/authoring-editor/workspace'
import type { NoteTopic } from '../core/supporting/learner-progress'

export interface ViewerSection {
  name: string
  /** Renderable section, or null when the file is missing or does not compile. */
  config: SectionConfig | null
  /** Where the compiled section data came from (for Pick mode). */
  sourceMap?: OUISourceMap
  error?: string
  /** Its narration for Present mode, from sections/<name>.narrate.oui (decision 91). */
  narration?: NarrationData
}

export interface ViewerTopic {
  topicId: string
  /** The learner's domain it is kept under (`// @loom-domain`), when the topic says. */
  domainId?: string
  manifest: OUITopicManifest | null
  /** Set when topic.oui itself cannot be read. */
  error?: string
  sections: ViewerSection[]
  /** The topic's source files, by path (for Pick mode line hints). */
  files: Record<string, string>
  /** Problems in narration files, including warnings: a narration only plays in Present, so they show here. */
  narrationErrors: Array<{ file: string; error: string }>
}

const formatIssues = (issues: Array<{ line?: number; message: string }>) =>
  issues.map((i) => `${i.line ? `line ${i.line}: ` : ''}${i.message}`).join('\n')

/** The topic's outline for a progress note (Viewer's Copy progress for chat, the app's Save my progress). */
export function noteTopicOf(topic: ViewerTopic): NoteTopic {
  return {
    id: topic.topicId,
    domain: topic.domainId,
    title: topic.manifest?.title,
    sections: topic.sections.map((s) => ({ name: s.name, title: String(s.config?.props.title || s.name) })),
  }
}

export function compileViewerTopic({ topicId, files, domainId }: TopicFiles): ViewerTopic {
  const topic = compileOUITopic(files['topic.oui'] ?? '')
  const topicErrors = topic.issues.filter((i) => i.tier < 3)
  if (!topic.value || topicErrors.length) {
    return { topicId, domainId, manifest: null, error: `topic.oui has errors:\n${formatIssues(topicErrors)}`, sections: [], files, narrationErrors: [] }
  }

  const sections = topic.value.sections.map((name): ViewerSection => {
    const file = `sections/${name}.oui`
    const source = files[file]
    if (source === undefined) return { name, config: null, error: `${file} is missing.` }
    const result = validateOUISection(source, { topicId, sectionName: name, file })
    const blocking = result.diagnostics.filter((d) => d.tier < 3)
    if (!result.payload || blocking.length) return { name, config: null, error: formatIssues(blocking) || `${file} cannot be compiled.` }
    return { name, config: bundleToSections([result.payload])[0], sourceMap: sourceMapOf(result.payload) }
  })

  const narrationErrors: ViewerTopic['narrationErrors'] = []
  const listed = new Set(topic.value.sections)
  for (const path of Object.keys(files).sort()) {
    const name = NARRATION_FILE.exec(path)?.[1]
    if (!name) continue
    const section = sections.find((s) => s.name === name)
    if (!listed.has(name)) {
      narrationErrors.push({ file: path, error: `There is no section "${name}" in topic.oui for this narration.` })
      continue
    }
    const result = validateOUINarration(files[path], files[`sections/${name}.oui`], { topicId, sectionName: name, file: path })
    if (result.diagnostics.length) narrationErrors.push({ file: path, error: formatIssues(result.diagnostics) })
    if (section && result.payload && !result.diagnostics.some((d) => d.tier < 3)) section.narration = result.payload
  }
  return { topicId, domainId, manifest: topic.value, sections, files, narrationErrors }
}

/**
 * A ready-to-paste message for the AI chat that wrote the topic, listing
 * every error Viewer found (topic.oui and each failing section), or null
 * when the topic has none.
 */
export function topicErrorReport(topic: ViewerTopic): string | null {
  const parts: string[] = []
  if (topic.error) parts.push(topic.error)
  for (const section of topic.sections) {
    if (section.error) parts.push(`sections/${section.name}.oui\n${section.error}`)
  }
  for (const { file, error } of topic.narrationErrors) parts.push(`${file}\n${error}`)
  if (parts.length === 0) return null
  return `Loom Viewer found these errors in the topic "${topic.topicId}". Fix only what they point at, keep everything else unchanged, and give me the complete updated topic as one .loom.oui file.\n\n${parts.join('\n\n')}\n`
}

/** Same message for text or a file that could not be opened at all. */
export function loadErrorReport(message: string): string {
  return `Loom Viewer could not open the topic you wrote:\n\n${message}\n\nFix it and give me the complete topic again as one .loom.oui file (first line \`// @loom-topic <topic-id>\`, each file after a \`// === <path> ===\` line).\n`
}
