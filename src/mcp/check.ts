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
}

/** Read and validate `.loom.oui` text with the same steps as Loom Viewer (decision 184). */
export function checkTopic(oui: string): TopicCheck {
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
  }
}
