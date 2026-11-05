import { validateOUISection, validateOUINarration } from '../core/learning-engine/validation/oui-gateway'
import { fileStatements } from '../core/supporting/authoring-editor/assistant/statements'
import { reviewPlanArtifact, type PlanAlignment } from '../core/learning-engine/composition/oui/plan-artifact'
/**
 * The full topic check behind `validate_topic` (decision 184): the same steps
 * as Loom Viewer. Kept apart from `server.ts` so the hosted endpoint, which
 * leaves checking to the app (Workers' 10 ms CPU limit), does not bundle the
 * compiler.
 */
import { readTopicText } from '../core/supporting/authoring-editor/workspace/archive'
import { compileViewerTopic, loadErrorReport, topicErrorReport } from '../viewer/compileTopic'

export interface TopicCheck {
  ok: boolean
  topicId?: string
  title?: string
  sections: string[]
  /** The fix request for the model, or null when the topic has no errors. */
  report: string | null
  /** Advisory design evidence, separate from OUI validity. */
  planAlignment?: PlanAlignment
}

/** Read and validate `.loom.oui` text with the same steps as Loom Viewer (decision 184). */
export function checkTopic(oui: string, plan?: unknown): TopicCheck {
  let topics
  try {
    topics = readTopicText(oui)
  } catch (e) {
    return { ok: false, sections: [], report: loadErrorReport(e instanceof Error ? e.message : String(e)) }
  }
  const topic = compileViewerTopic(topics[0])
  const report = topicErrorReport(topic)
  return {
    ok: report === null,
    topicId: topic.topicId,
    title: topic.manifest?.title,
    sections: topic.sections.map((s) => s.name),
    report,
    planAlignment: reviewPlanArtifact(topic, plan),
  }
}

/** Local/browser validation only. The Worker deliberately does not import this compiler. */
export function checkSection(source: string, file: string, sectionSource?: string) {
  const sectionName = /^sections\/([\w-]+)(?:\.narrate)?\.oui$/.exec(file)?.[1]
  const context = { file, sectionName }
  const result = file.endsWith('.narrate.oui')
    ? validateOUINarration(source, sectionSource, context)
    : validateOUISection(source, context)
  const statements = fileStatements(source)
  return {
    valid: result.status !== 'error', status: result.status,
    diagnostics: result.diagnostics.map((diagnostic) => {
      const names = new Set(statements.map((statement) => statement.name))
      const unresolved = statements.find((statement) => statement.refs.some((ref) => !names.has(ref) && diagnostic.message.includes(ref)))
      const line = diagnostic.line ?? unresolved?.line ?? (statements.length === 1 ? statements[0].line : undefined)
      return {
        ...diagnostic, line, file, section: sectionName,
        statement: [...statements].reverse().find((statement) => line !== undefined && statement.line <= line)?.name,
      }
    }),
  }
}
