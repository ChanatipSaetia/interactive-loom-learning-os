import { textHash } from '../../../supporting/authoring-editor/assistant/statements'

/** Canonical source equality hint across bundle/folder readers, never a CAS/auth token. */
export function topicSourceVersion(topic: { topicId: string; files: Record<string, string> }) {
  return `topic-v1:${textHash(JSON.stringify([topic.topicId, Object.entries(topic.files).sort(([a], [b]) => a.localeCompare(b))]))}`
}
