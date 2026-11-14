import { guideReferences } from './reference-guides'
import { SECTION_LEARNING_BEHAVIORS, SECTION_MENTAL_MODELS, FLOWCHART_MODELS, REPRESENTATION_SELECTION_GUIDE } from './mental-model-guide'
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
  return ['index.md', 'workflow/edit.md', 'display/library.md', 'display/domain.md', 'runtime.md', 'tutoring/index.md', 'storage/index.md', 'capabilities/selection.md', ...Object.keys(guideReferences()), ...AUTHORING_WORKFLOW_STAGES.map((stage) => `workflow/${stage.id}.md`),
    'capabilities/index.md', ...guideSectionTypes().map((item) => `capabilities/${item.component}.md`),
    'contracts/topic-plan.schema.json', 'contracts/page.md', 'contracts/topic.md', 'contracts/narration.md', 'components/index.md',
    ...Object.keys(getUnifiedOUISpec().components).map((name) => `components/${name}.md`)]
}
export function readReference(input = 'index.md') {
  // Tool arguments and resource links identify the same virtual file. Never fetch
  // arbitrary URLs or let URL normalization turn traversal into a valid path.
  let path = input.startsWith(REFERENCE_ROOT) ? input.slice(REFERENCE_ROOT.length) : input
  try { path = decodeURIComponent(path) } catch { return missing(input) }
  if (!path || path.length > 240 || /[\\?#:]/.test(path) || [...path].some((char) => char.charCodeAt(0) < 32) || path.split('/').some((part) => !part || part === '.' || part === '..')) return missing(input)

  let content: string
  let next: string[] = []
  if (path === 'index.md') {
    next = ['workflow/understand.md', 'workflow/edit.md', 'tutoring/index.md', 'display/library.md', 'display/domain.md', 'storage/index.md', 'runtime.md']
    content = '# Loom: start here\n\nOne section is one compositional Page. Read one reference at a time and select the intent below; do not crawl the tree.\n\n' + [
      ['Create a topic', next[0]], ['Edit or inspect a topic', next[1]], ['Learn or continue learning', next[2]], ['Show the library', next[3]], ['Show one domain', next[4]], ['Save a topic or progress', next[5]], ['Inspect runtime availability', next[6]],
    ].map(([label, path]) => '- ' + link(path, label)).join('\n')
  } else if (path === 'runtime.md') {
    content = '# Runtime availability\n\nEvery reference response carries deployment metadata derived from the configured server adapters: storageAvailable, serverValidationAvailable and sectionValidationAvailable. These do not establish permissions in external connectors. Hosted MCP has six tools; local compiler, editing and learner-memory tools are conditional. The Worker stores no topics by default. Source and progress must be obtained from authorized connectors or current buffers.'
  } else if (path === 'workflow/edit.md') {
    next = ['contracts/page.md', 'workflow/verify.md', 'storage/index.md']
    content = '# Edit or inspect an existing topic\n\nObtain current authorized source files, including unsaved buffers. Call get_topic_context({files}) for an overview, then supply roots such as sections/exchange.oui#diagram. Follow omittedReferences with narrower calls when truncated; resupply current files and expectedHash when applicable. Component references lead to components/<Name>.md. Hashes are change hints, not permissions or write tokens.\n\nChange only relevant statements; preserve learner actions, IDs and narration targets. For a small edit do not reload all references or rebuild a plan unnecessarily. Validate the page and narration locally when available, otherwise use the player and report unrun checks. Local edit_topic can apply targeted changes when exposed.\n\nNext:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'storage/index.md' || path === 'tutoring/index.md') {
    const folder = path.split('/')[0]
    const nodes = Object.keys(guideReferences()).filter((p) => p.startsWith(folder + '/'))
    next = folder === 'storage' ? ['storage/overview.md', 'storage/layout.md', 'storage/ids.md', 'storage/the-files.md', 'storage/saving.md'] : ['tutoring/overview.md', 'tutoring/the-routine.md', 'tutoring/planning-the-next-topic.md', 'tutoring/progress-notes.md', 'tutoring/reopen-the-same-lesson.md']
    content = `# ${folder} references\n\nRead only the policy needed for the current intent. Storage uses the learner's authorized drive; showing is not saving. Keep short topics focused; honor full-lesson requests.\n\n` + nodes.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path.startsWith('storage/') || path.startsWith('tutoring/')) {
    const policy = guideReferences()[path]
    if (!policy) return missing(path)
    next = path.startsWith('tutoring/') ? ['storage/index.md', 'workflow/understand.md'] : ['storage/index.md']
    content = policy + '\n\nRelated:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'display/library.md' || path === 'display/domain.md') {
    const domain = path === 'display/domain.md'
    next = ['storage/the-files.md', 'storage/showing-the-learner-where-they-are.md']
    content = `# Show ${domain ? 'one domain' : 'the library'}\n\nOnly show this view when the learner asks. Call ${domain ? 'show_domain({domain, files})' : 'show_library({files})'} with authorized learner-drive files. ${domain ? 'Use paths relative to the selected domain: domain.oui, topics/<id>.loom.oui headers and progress/<note>.md.' : 'Use paths relative to Loom/: index.oui, <domain>/domain.oui, topic headers and latest progress notes.'} Local servers with learner storage may read files themselves. Displaying is not saving or granting access.\n\nRead:\n` + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path.startsWith('workflow/')) {
    const index = AUTHORING_WORKFLOW_STAGES.findIndex((stage) => path === `workflow/${stage.id}.md`)
    if (index < 0) return missing(path)
    const stage = AUTHORING_WORKFLOW_STAGES[index]
    const related: Record<string, string[]> = { discover: ['capabilities/index.md'], plan: ['contracts/topic-plan.schema.json'], references: ['contracts/page.md', 'contracts/topic.md', 'contracts/narration.md', 'components/index.md'], deliver: ['storage/index.md'] }
    next = [...(related[stage.id] ?? []), ...(AUTHORING_WORKFLOW_STAGES[index + 1] ? [`workflow/${AUTHORING_WORKFLOW_STAGES[index + 1].id}.md`] : [])]
    const tools: Record<string, string> = { discover: 'Browse capabilities/index.md, then read only relevant capability nodes.', 'validate-plan': 'Call validate_topic_plan({plan}); repair errors and resolve or explain advisory warnings.', references: 'Read components/index.md and only the component files selected in the plan.', generate: 'Write topic.oui, Page-root section files and narration. For edits supply current authorized buffers to get_topic_context.', verify: 'Use validate_topic({oui, plan}) and validate_section when available; hosted MCP leaves compilation to the player. Inspect Read/Present layout and report checks not run.', deliver: 'Call show_topic({oui, plan}); read storage/index.md and save exact source separately. Showing is not saving.' }
    content = `# ${stage.id}\n\nRead when: performing the ${stage.id} step.\n\n${stage.task}\n\n${tools[stage.id] ?? ''}\n\nPrerequisite: ${link(index ? `workflow/${AUTHORING_WORKFLOW_STAGES[index - 1].id}.md` : 'index.md', index ? 'Previous step' : 'Entry point')}\n\nNext:\n${next.map((p) => '- ' + link(p, p)).join('\n')}`
  } else if (path === 'capabilities/index.md') {
    next = ['capabilities/selection.md', 'workflow/plan.md']
    content = '# Choose learning capabilities\n\nMap the objective to a learner action and knowledge structure. Read only relevant alternatives below; these are capabilities to compose, not page types.\n\n' + guideSectionTypes().map((c) => '- ' + link(`capabilities/${c.component}.md`, c.component) + ': ' + c.summary).join('\n') + '\n\nNext: ' + link(next[0], 'Plan pages')
  } else if (path === 'capabilities/selection.md') {
    next = ['workflow/plan.md']
    content = REPRESENTATION_SELECTION_GUIDE.replace(/Retrieve selected section rules[\s\S]*$/, 'Read selected component references through read_reference. If unavailable, correct the path or explicitly revise and revalidate the plan; do not silently substitute prose.')
  } else if (path.startsWith('capabilities/')) {
    const item = guideSectionTypes().find((c) => path === `capabilities/${c.component}.md`)
    if (!item) return missing(path)
    next = ['workflow/plan.md', `components/${item.component}.md`]
    const behavior = SECTION_LEARNING_BEHAVIORS[item.type as keyof typeof SECTION_LEARNING_BEHAVIORS]
    const model = SECTION_MENTAL_MODELS.find((entry) => entry.type === item.type)
    const details = [model?.model, model?.question, behavior?.learnerAction, behavior?.presentationConstraint, behavior?.evidenceBoundary, item.component === 'Flowchart' ? FLOWCHART_MODELS.map(([id, purpose]) => `${id}: ${purpose}`).join('\n') : ''].filter(Boolean).join('\n\n')
    content = `# ${item.component}\n\n${item.summary}\n\n${details}\n\nRead when: considering this capability for a learner action. Combine it with supporting components; it does not determine a page type.\n\nBefore authoring, ${link(next[0], 'plan the composition')}. Then read ${link(next[1], 'the exact component contract')}.`
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
    if (!name || !Object.prototype.hasOwnProperty.call(getUnifiedOUISpec().components, name)) return missing(path)
    next = ['workflow/generate.md']
    content = `# ${name}\n\nRead when: this component is selected for the page composition.\n\n${getAuthoringGuide([], [name])}\n\nNext: ${link(next[0], 'Generate source')}`
  }
  return { schemaVersion: 1, path, uri: referenceUri(path), version: `reference-v1:${textHash(content)}`, mimeType: path.endsWith('.json') ? 'application/json' : 'text/markdown', content, next: next.map((p) => ({ path: p, uri: referenceUri(p) })) }
}
function missing(path: string) {
  return { schemaVersion: 1, path, error: 'REFERENCE_NOT_FOUND', entry: referenceUri('index.md'), entryPath: 'index.md', next: [{ path: 'index.md', uri: referenceUri('index.md') }] }
}
