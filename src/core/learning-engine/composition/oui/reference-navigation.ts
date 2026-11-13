/** Stateless linked references. Reading a node never expands its outgoing links. */
import { z } from 'zod'
import { AUTHORING_WORKFLOW_STAGES } from './authoring-workflow'
import { guideSectionTypes, getAuthoringGuide } from './authoring-guide'
import { getUnifiedOUISpec } from './library'
import { TopicPlanSchema } from './topic-plan'
import { textHash } from '../../../supporting/authoring-editor/assistant/statements'

export const REFERENCE_ROOT = 'loom://references/'
export const referenceUri = (path: string) => `${REFERENCE_ROOT}${path}`
const link = (path: string, label: string) => `[${label}](${referenceUri(path)})`
export function referencePaths(): string[] {
  return ['index.md', ...AUTHORING_WORKFLOW_STAGES.map((stage) => `workflow/${stage.id}.md`),
    'capabilities/index.md', ...guideSectionTypes().map((item) => `capabilities/${item.component}.md`),
    'contracts/topic-plan.schema.json', 'contracts/page.md', 'contracts/topic.md', 'contracts/narration.md', 'components/index.md',
    ...Object.keys(getUnifiedOUISpec().components).map((name) => `components/${name}.md`)]
}
export function readReference(path: string) {
  let content: string
  let next: string[] = []
  if (path === 'index.md') {
    next = ['workflow/understand.md']
    content = '# Loom authoring\n\nOne section is one compositional Page, with one main learning activity and supporting components. There is no authored section type or library choice.\n\nRead one reference at a time. Follow prerequisite and next links; open capability alternatives only when relevant. Do not recursively load the reference tree.\n\nStart: ' + link(next[0], 'Understand the request') + '\n\nTools execute validation and delivery; these references guide decisions. For tutoring read get_tutor_guide, and for persistence read get_storage_guide when needed.'
  } else if (path.startsWith('workflow/')) {
    const index = AUTHORING_WORKFLOW_STAGES.findIndex((stage) => path === `workflow/${stage.id}.md`)
    if (index < 0) return missing(path)
    const stage = AUTHORING_WORKFLOW_STAGES[index]
    const related: Record<string, string[]> = { discover: ['capabilities/index.md'], plan: ['contracts/topic-plan.schema.json'], references: ['contracts/page.md', 'contracts/topic.md', 'contracts/narration.md', 'components/index.md'] }
    next = [...(related[stage.id] ?? []), ...(AUTHORING_WORKFLOW_STAGES[index + 1] ? [`workflow/${AUTHORING_WORKFLOW_STAGES[index + 1].id}.md`] : [])]
    const tools: Record<string, string> = { discover: 'Browse capabilities/index.md, then read only relevant capability nodes.', 'validate-plan': 'Call validate_topic_plan({plan}); repair errors and resolve or explain advisory warnings.', references: 'Read components/index.md and only the component files selected in the plan.', generate: 'Write topic.oui, Page-root section files and narration. For edits supply current authorized buffers to get_topic_context.', verify: 'Use validate_topic({oui, plan}) and validate_section when available; hosted MCP leaves compilation to the player. Inspect Read/Present layout and report checks not run.', deliver: 'Call show_topic({oui, plan}); follow get_storage_guide and save exact source separately. Showing is not saving.' }
    content = `# ${stage.id}\n\nRead when: performing the ${stage.id} step.\n\n${stage.task}\n\n${tools[stage.id] ?? ''}\n\nPrerequisite: ${link(index ? `workflow/${AUTHORING_WORKFLOW_STAGES[index - 1].id}.md` : 'index.md', index ? 'Previous step' : 'Entry point')}\n\nNext:\n${next.map((p) => '- ' + link(p, p)).join('\n')}`
  } else if (path === 'capabilities/index.md') {
    next = ['workflow/plan.md']
    content = '# Choose learning capabilities\n\nMap the objective to a learner action and knowledge structure. Read only relevant alternatives below; these are capabilities to compose, not page types.\n\n' + guideSectionTypes().map((c) => '- ' + link(`capabilities/${c.component}.md`, c.component) + ': ' + c.summary).join('\n') + '\n\nNext: ' + link(next[0], 'Plan pages')
  } else if (path.startsWith('capabilities/')) {
    const item = guideSectionTypes().find((c) => path === `capabilities/${c.component}.md`)
    if (!item) return missing(path)
    next = ['workflow/plan.md', `components/${item.component}.md`]
    content = `# ${item.component}\n\n${item.summary}\n\nRead when: considering this capability for a learner action. Combine it with supporting components; it does not determine a page type.\n\nBefore authoring, ${link(next[0], 'plan the composition')}. Then read ${link(next[1], 'the exact component contract')}.`
  } else if (['contracts/page.md', 'contracts/topic.md', 'contracts/narration.md'].includes(path)) {
    const name = { 'contracts/page.md': 'Page', 'contracts/topic.md': 'Topic', 'contracts/narration.md': 'Narration' }[path]!
    next = ['components/index.md', 'workflow/generate.md']
    content = `# ${name} document contract\n\n${getAuthoringGuide([], [name])}\n\nNext: ${next.map((p) => link(p, p)).join(', ')}`
  } else if (path === 'contracts/topic-plan.schema.json') {
    next = ['workflow/validate-plan.md']
    content = JSON.stringify(z.toJSONSchema(TopicPlanSchema), null, 2)
  } else if (path === 'components/index.md') {
    next = ['workflow/generate.md']
    content = '# Component contracts\n\nRead only components selected in your validated plan. Each file includes required signature dependencies; generic child alternatives remain choices.\n\n' + Object.keys(getUnifiedOUISpec().components).map((name) => '- ' + link(`components/${name}.md`, name)).join('\n') + '\n\nNext: ' + link(next[0], 'Generate source')
  } else {
    const name = /^components\/([A-Za-z][A-Za-z0-9]*)\.md$/.exec(path)?.[1]
    if (!name || !getUnifiedOUISpec().components[name]) return missing(path)
    next = ['workflow/generate.md']
    content = `# ${name}\n\nRead when: this component is selected for the page composition.\n\n${getAuthoringGuide([], [name])}\n\nNext: ${link(next[0], 'Generate source')}`
  }
  return { schemaVersion: 1, path, uri: referenceUri(path), version: `reference-v1:${textHash(content)}`, mimeType: path.endsWith('.json') ? 'application/json' : 'text/markdown', content, next: next.map((p) => ({ path: p, uri: referenceUri(p) })) }
}
function missing(path: string) {
  return { schemaVersion: 1, path, error: 'REFERENCE_NOT_FOUND', entry: referenceUri('index.md') }
}
