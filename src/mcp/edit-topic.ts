/**
 * `edit_topic` for the local server: the model sends only the statements it
 * changes, so fixing one question costs a few lines instead of the whole
 * topic again. Edits are whole statements by name, as in Loom Studio's
 * assistant (`oui-edit` blocks, grill-log-ai-assistant.md decisions 54 and
 * 58): a name in the file replaces its statement, a new name is added,
 * `name = DELETE` removes one, and `create` makes a new section file. The
 * server applies them to the topic it saved in the memory folder, checks the
 * whole topic, saves it and shows the new version.
 *
 * Only the local server has it: the hosted endpoint keeps no topics.
 */
import type { McpServer } from '@modelcontextprotocol/server'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import { applyEditBlock, applyOrder, checkProposal, parseEditBlock } from '../core/supporting/authoring-editor/assistant/edits'
import { createTopicSource, parseTopicSource } from '../core/supporting/authoring-editor/workspace/archive'
import { APP_URI, type LearnerStore } from './server'
import type { TopicCheck } from './check'

const DESCRIPTION = `Change a Loom topic shown before (by its topic ID) by sending only what changes, instead of the whole topic again. Each edit names one file (topic.oui, sections/<name>.oui or sections/<name>.narrate.oui) and holds whole statements in that file's syntax: a statement whose name exists replaces it, a new name is added, \`name = DELETE\` removes one. Set create to add a new section file, and add its SectionRef to topic.oui in another edit. Shows the edited topic and answers with any errors to fix.`

export interface TopicEdit {
  file: string
  statements: string
  create?: boolean
}

export type EditOutcome =
  | { ok: true; oui: string; changed: string[] }
  | { ok: false; error: string }

/** Apply statement edits to a topic's `.loom.oui` text. */
export function editTopicSource(topicId: string, oui: string, edits: TopicEdit[]): EditOutcome {
  const files = { ...parseTopicSource(oui, topicId)[0].files }
  const blocks = edits.map((edit, index) => parseEditBlock(`oui-edit file=${edit.file}${edit.create ? ' mode=create' : ''}`, edit.statements, index))
  // Refuse the whole change when any edit cannot be placed, so nothing half-applied is saved
  const failed = checkProposal(topicId, blocks, files).results
    .map((result, i) => (result.ok ? null : `${blocks[i].file || `edit ${i + 1}`}: ${result.error}`))
    .filter((e): e is string => !!e)
  if (failed.length) return { ok: false, error: `Nothing was changed:\n${failed.map((e) => `- ${e}`).join('\n')}` }
  const changed: string[] = []
  for (const block of applyOrder(blocks)) {
    const result = applyEditBlock(files[block.file], block)
    files[block.file] = result.source
    for (const change of result.changes) changed.push(`${change.kind} ${change.kind === 'create' ? change.name : `${change.name} in ${block.file}`}`)
  }
  return { ok: true, oui: createTopicSource([{ topicId, files }]), changed }
}

export function registerEditTool(server: McpServer, store: LearnerStore, check: (oui: string) => TopicCheck) {
  registerAppTool(server, 'edit_topic', {
    title: 'Edit a Loom topic',
    description: DESCRIPTION,
    inputSchema: z.object({
      id: z.string().describe('Topic ID (the `// @loom-topic` line of a topic shown before; see list_topics).'),
      edits: z.array(z.object({
        file: z.string().describe('topic.oui, sections/<name>.oui or sections/<name>.narrate.oui.'),
        statements: z.string().describe('Whole statements for that file, one or more `name = …` lines; `name = DELETE` removes one.'),
        create: z.boolean().optional().describe('The file is a new section.'),
      })).min(1),
    }),
    _meta: { ui: { resourceUri: APP_URI } },
  }, async ({ id, edits }) => {
    const saved = await store.readTopic(id)
    if (!saved) return { content: [{ type: 'text', text: `No saved topic "${id}". Call list_topics for the IDs, or show_topic with the whole topic.` }], isError: true }
    const outcome = editTopicSource(id, saved, edits)
    if (!outcome.ok) return { content: [{ type: 'text', text: outcome.error }], isError: true }
    await store.saveTopic({ id, oui: outcome.oui })
    const result = check(outcome.oui)
    const text = [
      `Showing the edited topic "${result.title ?? id}". Changed: ${outcome.changed.join('; ')}.`,
      ...(result.ok ? [] : ['', 'It has errors; the learner sees them in the app. Fix them with edit_topic:', '', result.report!]),
    ].join('\n')
    return { content: [{ type: 'text', text }], structuredContent: { oui: outcome.oui } }
  })
}
