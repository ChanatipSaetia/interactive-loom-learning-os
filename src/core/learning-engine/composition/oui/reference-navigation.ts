import { REPRESENTATION_AFFORDANCES } from './component-recommendations'
import { MEDIA_COMPOSITION_GUIDE } from './media-composition-guide'
import { LEARNER_REFERENCE_GUIDE } from './learner-reference-guide'
import { IMAGE_DELIVERY_GUIDE, IMAGE_SOURCE_COMPONENTS } from './image-delivery-guide'
import { componentTeachingGuide } from './component-teaching'
import { COMPONENT_PURPOSES } from './component-purpose'
import { DOCUMENT_SYNTAX_GUIDE } from './document-contract'
import { guideReferences } from './reference-guides'
import { SECTION_LEARNING_BEHAVIORS, SECTION_MENTAL_MODELS, FLOWCHART_MODELS, REPRESENTATION_SELECTION_GUIDE, COMPOSITION_DECISION_GUIDE } from './mental-model-guide'
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
    'capabilities/index.md', ...Object.keys(getUnifiedOUISpec().components).map((name) => `capabilities/${name}.md`),
    'contracts/quantitative.md', 'contracts/topic-plan.schema.json', 'contracts/media-composition.md', 'contracts/learner-references.md', 'contracts/images.md', 'contracts/delivery.md', 'contracts/syntax.md', 'contracts/page.md', 'contracts/topic.md', 'contracts/narration.md', 'components/index.md',
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
    content = '# Runtime availability\n\nEvery reference response carries deployment metadata derived from the configured server adapters: storageAvailable, serverValidationAvailable and sectionValidationAvailable. These do not establish permissions in external connectors. Hosted MCP has seven tools; local compiler, editing and learner-memory tools are conditional. The Worker stores no topics by default. Source and progress must be obtained from authorized connectors or current buffers. deployment.imagePolicy reports the requested resourceDomains and connectDomains of this server configuration, the asset mode, and image upload availability. Static image loading uses resourceDomains; HTTPS reachability alone is insufficient. The chat host enforces the final policy. Read contracts/images.md before adding image sources.'
    next = ['contracts/images.md']
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
    const related: Record<string, string[]> = { discover: ['capabilities/index.md'], plan: ['contracts/topic-plan.schema.json'], references: ['contracts/syntax.md', 'contracts/page.md', 'contracts/topic.md', 'contracts/narration.md', 'contracts/learner-references.md', 'components/index.md'], generate: ['contracts/syntax.md'], verify: ['contracts/quantitative.md'], deliver: ['contracts/delivery.md', 'storage/index.md'] }
    next = [...(related[stage.id] ?? []), ...(AUTHORING_WORKFLOW_STAGES[index + 1] ? [`workflow/${AUTHORING_WORKFLOW_STAGES[index + 1].id}.md`] : [])]
    const tools: Record<string, string> = { discover: 'Call recommend_components({learningObjective, knowledgeStructure?, learnerAction?, constraints?}) to compare affordance candidates. Explicit knowledgeStructure uses semantic IDs such as hierarchical_quantity, classification or parameter_sensitivity. Then read only selected capability nodes and requiredContracts.', 'validate-plan': 'Call validate_topic_plan({plan}); repair errors and resolve or explain advisory warnings.', references: 'Read components/index.md and only the component files selected in the plan.', generate: 'Write topic.oui, Page-root section files and narration. For edits supply current authorized buffers to get_topic_context.', verify: 'validate_topic_plan also accepts optional quantitativeModels (trees, formulas, reconciliations) and tokenUsage with explicit provider inclusion semantics. Formula checks sample defaults, boundaries and intermediate values; they are not a proof over continuous domains. Use validate_topic({oui, plan}) and validate_section when available; hosted MCP leaves compilation to the player. Inspect Read/Present layout and report checks not run.', deliver: 'New topics require show_topic({oui, plan}). Missing planned components, invalid source references and unresolved advisories block delivery. Repair missing presentation/evidence fields; design warnings may use advisoryResolutions bound to the current planVersion. Read contracts/delivery.md for the exact contract and storage/index.md for saving accepted source. Existing exact-source replay uses intent: reopen.' }
    content = `# ${stage.id}\n\nRead when: performing the ${stage.id} step.\n\n${stage.task}\n\n${tools[stage.id] ?? ''}\n\nPrerequisite: ${link(index ? `workflow/${AUTHORING_WORKFLOW_STAGES[index - 1].id}.md` : 'index.md', index ? 'Previous step' : 'Entry point')}\n\nNext:\n${next.map((p) => '- ' + link(p, p)).join('\n')}`
  } else if (path === 'capabilities/index.md') {
    next = ['capabilities/selection.md', 'workflow/plan.md']
    content = '# Choose components by learning purpose\n\nOne catalog: text, layouts, charts and prebuilt activities are peers. Start with the learner’s task; inspect plausible alternatives without reading every contract. Prebuilt activities package useful interactions and presentation scenes; their origin does not give them priority. These are candidates, not page types or a required mix.\n\n' + COMPONENT_PURPOSES.map((group) => `## ${group.name}\n\n${group.purpose}\n\n` + group.components.filter((name) => !!getUnifiedOUISpec().components[name]).map((name) => link(`capabilities/${name}.md`, name)).join(', ')).join('\n\n') + '\n\nNext:\n' + next.map((p) => '- ' + link(p, p === 'workflow/plan.md' ? 'Plan pages' : 'Selection criteria')).join('\n')
  } else if (path === 'capabilities/selection.md') {
    next = ['workflow/plan.md', 'contracts/media-composition.md']
    content = 'Before generating OUI, identify the underlying knowledge structure and learner interaction. Call recommend_components for compact candidates; explicit structures and constraints improve its deterministic matching. Specialized components and text/tables are peers. Compare BreakdownTree with Table for contributions versus exact reconciliation, and with TaxonomyBrowser for quantities versus kinds; FormulaSandbox with a static chart for experimentation versus observation; Flowchart with Steps for branching versus instructions; TradeoffSandbox with Table for exploration versus compact attributes; DecisionTree rules with probability-mode BreakdownTree conditional likelihoods. Preserve nuanced prose when a visualization would distort the argument. Never add interactivity solely for decoration.\n\n' + REPRESENTATION_SELECTION_GUIDE.replace(/Retrieve selected section rules[\s\S]*$/, 'Read selected component references through read_reference. If unavailable, correct the path or explicitly revise and revalidate the plan; do not silently substitute prose.') + '\n\n' + COMPOSITION_DECISION_GUIDE
  } else if (path.startsWith('capabilities/')) {
    const name = /^capabilities\/([A-Za-z][A-Za-z0-9]*)\.md$/.exec(path)?.[1]
    if (!name || !Object.prototype.hasOwnProperty.call(getUnifiedOUISpec().components, name)) return missing(path)
    const item = guideSectionTypes().find((c) => c.component === name) ?? { type: 'openui', component: name, summary: getUnifiedOUISpec().components[name]!.description }
    next = ['workflow/plan.md', `components/${name}.md`, ...(IMAGE_SOURCE_COMPONENTS.has(name) ? ['contracts/images.md', 'runtime.md'] : [])]
    const behavior = SECTION_LEARNING_BEHAVIORS[item.type as keyof typeof SECTION_LEARNING_BEHAVIORS]
    const model = SECTION_MENTAL_MODELS.find((entry) => entry.type === item.type)
    const purpose = COMPONENT_PURPOSES.find((group) => (group.components as readonly string[]).includes(name))
    const alternatives = purpose?.components.filter((candidate) => candidate !== name).map((candidate) => link(`capabilities/${candidate}.md`, candidate)).join(', ')
    const affordance = REPRESENTATION_AFFORDANCES.find((entry) => entry.component === name)
    const details = [affordance ? `Knowledge structures: ${affordance.structures.join(', ')}. Model requirements: ${affordance.requires}` : '', purpose?.purpose, componentTeachingGuide(name), alternatives ? `Compare when relevant: ${alternatives}. These are alternatives, not dependencies.` : '', model?.model, model?.question, behavior?.learnerAction, behavior?.presentationConstraint, behavior?.evidenceBoundary, item.component === 'Flowchart' ? FLOWCHART_MODELS.map(([id, purpose]) => `${id}: ${purpose}`).join('\n') : ''].filter(Boolean).join('\n\n')
    content = `# ${item.component}\n\n${item.summary}\n\n${details}\n\nRead when: considering this capability for a learner action. Combine it with supporting components; it does not determine a page type.\n\nBefore authoring, ${link(next[0], 'plan the composition')}. Then read ${link(next[1], 'the exact component contract')}.`
  } else if (path === 'contracts/quantitative.md') {
    next = ['components/BreakdownTree.md', 'components/FormulaSandbox.md', 'workflow/verify.md']
    content = '# Quantitative checks\n\nvalidate_topic_plan keeps valid as structural plan validity. Supply optional quantitativeModels with trees (compiled BreakdownTree data), formulas (compiled FormulaSandbox data), and reconciliations. A reconciliation has modelId, assumptions, provenance (verified/user-supplied/derived/illustrative/unsupported), optional evidenceRefs and observations [{target,value,unit}, ...]. Derive observations from the actual source model; formatted prose is not automatically reconciled. Verified claims need evidenceRefs, and illustrative models need explicit assumptions. Reconciliation tolerance: 1e-9 × max(1,abs(a),abs(b)).\n\nFormulas use declared variables and earlier metrics through the restricted evaluator. Checks sample defaults, minima, maxima, midpoints and in-range zero; they do not prove all continuous values or dimensional correctness. Invalid formula outputs and invalid trees block local/player OUI compilation. Hosted checks of explicit models do not compile source or measure layout.\n\nOptional tokenUsage requires inputTokens, outputTokens and inputIncludesCacheRead, inputIncludesCacheWrite, outputIncludesReasoning booleans. Supply cacheReadTokens/cacheWriteTokens/reasoningTokens when reported, plus separate toolCharges/infrastructureCost/retryCost if needed. Never assume provider categories are exclusive.\n\nRead and Present layout and learning quality remain independent checks. Repair affected statements only, preserve IDs, recheck, and stop after three unsuccessful repairs with remaining diagnostics.\n\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'contracts/media-composition.md') {
    next = ['contracts/page.md', 'contracts/images.md', 'contracts/learner-references.md', 'components/Card.md', 'components/Stack.md', 'components/TextContent.md', 'workflow/plan.md']
    content = MEDIA_COMPOSITION_GUIDE + '\n\nRelated:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'contracts/learner-references.md') {
    next = ['contracts/media-composition.md', 'components/TextContent.md', 'contracts/images.md', 'workflow/verify.md']
    content = LEARNER_REFERENCE_GUIDE + '\n\nRelated:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'contracts/images.md') {
    next = ['runtime.md', 'contracts/media-composition.md', 'contracts/learner-references.md', 'components/Image.md', 'components/ImageGallery.md', 'components/LearningGallery.md', 'components/Svg.md']
    content = IMAGE_DELIVERY_GUIDE + '\n\nRelated:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'contracts/delivery.md') {
    next = ['workflow/validate-plan.md', 'workflow/verify.md', 'storage/index.md']
    content = '# Delivery review\n\nNew topics use show_topic({oui, plan, mode?, advisoryResolutions?}); intent defaults to create. Call validate_topic_plan first and retain its planVersion. Source inspection is limited to 256 Ki characters per topic. Source/plan review follows root dependencies; unused declarations and component names inside prose do not satisfy a planned activity. Source mismatches and missing presentation or learning-evidence fields must be repaired. No component quota is imposed.\n\nDesign warnings REPRESENTATION_ALTERNATIVE_AVAILABLE, KNOWLEDGE_STRUCTURE_MISMATCH, UNJUSTIFIED_TEXT_SELECTION, LIST_STRUCTURE_REVIEW, POSSIBLE_REDUNDANT_SECTION and GOAL_COMPOSITION_REVIEW may be resolved explicitly with {code, path, reason, planVersion}. Use the exact warning code/path and current planVersion; reason must explain the specific exception (40–2000 characters). A changed plan invalidates prior resolutions. Explanations are recorded declarations, not independent judgments of teaching quality. Original advisories remain visible even when delivery accepts a justified exception.\n\nA blocked result has isError: true, deliveryReview.status: blocked, repair targets and unresolved diagnostics; the app must not render or export the rejected draft, and nothing is saved. Accepted source is sent in app-only metadata for the player to compile. accepted-for-player-check is not proof of compiler validity, layout or learning. Local compiler failures block creation too.\n\nExisting topics can be replayed unchanged with show_topic({oui, intent: "reopen"}). Planless replay is explicitly unreviewed; it must not be used for newly authored content. If a plan is supplied, its checks still apply.\n\nRelated:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (path === 'contracts/syntax.md') {
    next = ['contracts/topic.md', 'contracts/page.md', 'contracts/narration.md', 'workflow/verify.md']
    content = DOCUMENT_SYNTAX_GUIDE + '\n\nRelated:\n' + next.map((p) => '- ' + link(p, p)).join('\n')
  } else if (['contracts/page.md', 'contracts/topic.md', 'contracts/narration.md'].includes(path)) {
    const name = { 'contracts/page.md': 'Page', 'contracts/topic.md': 'Topic', 'contracts/narration.md': 'Narration' }[path]!
    next = ['contracts/syntax.md', 'components/index.md', 'workflow/generate.md']
    content = `# ${name} document contract\n\n${getAuthoringGuide([], [name])}\n\nNext: ${next.map((p) => link(p, p)).join(', ')}`
  } else if (path === 'contracts/topic-plan.schema.json') {
    next = ['workflow/validate-plan.md']
    content = JSON.stringify(z.toJSONSchema(TopicPlanSchema), null, 2)
  } else if (path === 'components/index.md') {
    next = ['workflow/generate.md']
    content = '# Component contracts\n\nRead only components selected in your validated plan. Each file includes required signature dependencies; generic child alternatives remain choices.\n\n' + getUnifiedOUISpec().componentGroups.map((group) => `## ${group.name}\n\n` + group.components.map((name) => '- ' + link(`components/${name}.md`, name)).join('\n')).join('\n\n') + '\n\nNext: ' + link(next[0], 'Generate source')
  } else {
    const name = /^components\/([A-Za-z][A-Za-z0-9]*)\.md$/.exec(path)?.[1]
    if (!name || !Object.prototype.hasOwnProperty.call(getUnifiedOUISpec().components, name)) return missing(path)
    next = ['workflow/generate.md']
    content = `# ${name}\n\nRead when: this component is selected for the page composition.\n\n${getAuthoringGuide([], [name])}\n\nNext: ${link(next[0], 'Generate source')}`
  }
  if (path.startsWith('components/') && IMAGE_SOURCE_COMPONENTS.has(path.slice('components/'.length, -3))) {
    next.push('contracts/images.md', 'runtime.md')
    content += '\n\nImage delivery: ' + link('contracts/images.md', 'Source constraints') + '; ' + link('runtime.md', 'Current deployment policy')
  }
  return { schemaVersion: 1, path, uri: referenceUri(path), version: `reference-v1:${textHash(content)}`, mimeType: path.endsWith('.json') ? 'application/json' : 'text/markdown', content, next: next.map((p) => ({ path: p, uri: referenceUri(p) })) }
}
function missing(path: string) {
  return { schemaVersion: 1, path, error: 'REFERENCE_NOT_FOUND', entry: referenceUri('index.md'), entryPath: 'index.md', next: [{ path: 'index.md', uri: referenceUri('index.md') }] }
}
