import { MEDIA_COMPOSITION_GUIDE } from './media-composition-guide'
import { LEARNER_REFERENCE_GUIDE } from './learner-reference-guide'
import { IMAGE_DELIVERY_GUIDE } from './image-delivery-guide'
import { getAuthoringGuide } from './authoring-guide'
import { COMPONENT_PURPOSES } from './component-purpose'
import { getUnifiedOUISpec } from './library'
import { componentClosure } from './assistant-prompt'
import { NARRATION_COMPONENTS } from './narration'
import { getAuthoringWorkflow } from './authoring-workflow'
/** Split the canonical prompt into focused, non-overlapping installed-skill references. */
import { getLoomAuthoringPrompt } from './authoring-prompt'
import { OUI_SECTION_TYPES } from './library'
import { BEAT_IDS } from './narration'
import { standardOpenUISpec } from '../../sub-contexts/progressive-content/openui-standard'
import { SECTION_MENTAL_MODELS, TRADEOFF_COMPARISON_GUIDE, PROCEDURE_TEACHING_GUIDE, TAXONOMY_TEACHING_GUIDE, FLASHCARD_TEACHING_GUIDE } from './mental-model-guide'
import { WRITER_OUTPUT, WRITER_PICK, WRITER_VALIDATION, WRITER_VISUAL_PLANNING } from './skill-workflow'

/** Fail on prompt changes rather than silently omitting new authoring guidance. */
function promptParts(prompt: string): Map<string, string> {
  const parts = new Map<string, string>()
  for (const part of prompt.split(/(?=^## )/m).slice(1)) {
    const heading = part.slice(3, part.indexOf('\n')).trim()
    if (parts.has(heading)) throw new Error(`Duplicate skill reference heading: ${heading}`)
    parts.set(heading, part.trim())
  }
  return parts
}

export function getWriterSkillReferences(): Record<string, string> {
  const parts = promptParts(getLoomAuthoringPrompt())
  const take = (heading: string): string => {
    const text = parts.get(heading)
    if (!text) throw new Error(`Missing skill reference heading: ${heading}`)
    parts.delete(heading)
    return text
  }
  const files: Record<string, string> = {}
  const put = (path: string, ...text: string[]) => { files[`references/${path}.md`] = text.join('\n\n').trim() + '\n' }

  put('planning/media-composition', MEDIA_COMPOSITION_GUIDE)
  put('core/learner-references', LEARNER_REFERENCE_GUIDE)
  put('core/images', IMAGE_DELIVERY_GUIDE)
  put('planning/component-purposes', '# Choose components by learning purpose', 'Ask what each candidate introduces, lets the learner explore, can demonstrate through a response, and cannot establish. Follow only relevant component links; each focused reference includes its exact contracts and required dependencies.', ...COMPONENT_PURPOSES.map((group) => `## ${group.name}\n\n${group.purpose}\n\n` + group.components.map((name) => `[${name}](../components/${name}.md)`).join(', ')))
  for (const name of Object.keys(getUnifiedOUISpec().components)) put(`components/${name}`, getAuthoringGuide([], [name]))

  put('planning/workflow', getAuthoringWorkflow('files'))
  put('planning/mental-models', take('Start Here: Mental Model and Section Selection'))
  put('planning/visuals', WRITER_VISUAL_PLANNING)
  put('core/formats', take('Topic Layout'), take('Output Formats'))
  put('core/syntax', take('Syntax Rules'), take('Hoisting & Statement Order'))
  put('core/actions', take('Action — Button Behavior'), 'Page-local state actions work without a model call. Query/Mutation host connections are deferred; do not assume a host handles assistant-conversation actions.')
  put('core/rules', take('Important Rules'), take('Final Verification'), take('Loom Authoring Rules'))
  put('examples/topic', take('Examples'))
  put('workflow/output', WRITER_OUTPUT)
  put('workflow/pick', WRITER_PICK)
  put('workflow/validation', WRITER_VALIDATION)

  // Preserve every exact signature + field description once. Root components
  // own the following helpers until the next root or library group heading.
  const signatures = take('Component Signatures')
  const groups = new Map<string, string[]>()
  let owner = 'core'
  const owners = new Map<string, string>()
  for (const [name, type] of OUI_SECTION_TYPES) for (const dependency of componentClosure([name])) { if (!owners.has(dependency)) owners.set(dependency, type) }
  for (const component of NARRATION_COMPONENTS) owners.set(component.name, 'narration')
  for (const line of signatures.split('\n').slice(1)) {
    if (line.startsWith('### ')) continue
    const component = /^([A-Z][A-Za-z0-9]*)\(/.exec(line)?.[1]
    if (component) owner = standardOpenUISpec.components[component] ? 'visuals' : owners.get(component) ?? 'core'
    if (component || line.startsWith('  ')) {
      const lines = groups.get(owner) ?? []
      lines.push(line)
      groups.set(owner, lines)
    }
  }
  put('core/components', '# Topic and shared components', 'Arguments marked with ? are optional. Read core/syntax.md for positional argument rules.', (groups.get('core') ?? []).join('\n'))
  put('openui/components', '# Canonical visual component contracts', 'Text, layouts, charts and prebuilt activities share one catalog. Retrieve selected contracts only; a page does not choose a library.', (groups.get('visuals') ?? []).join('\n'))

  const narration = take('Narration Files')
    .replace(/Beat IDs by section type[^\n]*\n\n\| Section type \| Beats \|\n\|---\|---\|\n(?:\|[^\n]*\n)+/, 'Beat IDs are in each selected section reference under Presentation beats.\n')
  put('core/narration', narration, '## Narration component signatures', (groups.get('narration') ?? []).join('\n'))

  const composition: Record<string, string> = {
    'tradeoff-sandbox': TRADEOFF_COMPARISON_GUIDE,
    bullets: take('Bullet Composition') + '\n\n' + PROCEDURE_TEACHING_GUIDE,
    flowchart: PROCEDURE_TEACHING_GUIDE,
    'reflection-sequence': PROCEDURE_TEACHING_GUIDE,
    'taxonomy-browser': TAXONOMY_TEACHING_GUIDE,
    flashcards: FLASHCARD_TEACHING_GUIDE,
    'pillar-layer': take('Layer Composition'),
    'user-journey': take('User Journeys'),
    timeline: take('Measured Timeline'),
    'breakdown-tree': take('Breakdown Trees'),
  }
  for (const { type, model, question } of SECTION_MENTAL_MODELS) {
    if (type === 'openui') continue
    const components = type === 'text' ? ['Read TextContent and Stack in [component contracts](../openui/components.md). These are the same components used throughout the catalog.'] : groups.get(type)
    if (!components?.length) throw new Error(`Missing skill signatures: ${type}`)
    put(`sections/${type}`, `# ${type}\n\n${model}. ${question}`, 'Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.', '## Component signatures', components.join('\n'), '## Presentation beats', (type === 'intro' ? '' : '`title`, then ') + BEAT_IDS[type], ...(composition[type] ? [composition[type]] : []))
  }
  // Keep family references focused; they belong to the shared catalog.
  const standard = take('Page Composition')
  const family = standard.indexOf('\n### Tables and Charts')
  const layouts = standard.indexOf('\n### Layouts for Other Content')
  const drawings = standard.indexOf('\n### Drawings')
  if (family < 0 || layouts < family || drawings < layouts) throw new Error('OpenUI skill reference families changed')
  put('sections/openui', standard.slice(0, family), '## Visual references', '- [Canonical visual contracts](../openui/components.md)\n- [Tables and charts](../openui/charts.md)\n- [Layouts](../openui/layouts.md)\n- [SVG drawings](../openui/drawings.md)\n- [Time, shares and utilization](../openui/time-usage.md)', '## Presentation beats', '`title`, then ' + BEAT_IDS.openui, 'Read [narration](../core/narration.md) for effects and targets.')
  put('openui/charts', standard.slice(family, layouts))
  put('openui/layouts', standard.slice(layouts, drawings), PROCEDURE_TEACHING_GUIDE)
  put('openui/drawings', standard.slice(drawings))
  put('openui/time-usage', take('Time and Usage Visuals'))
  if (parts.size) throw new Error(`Unrouted skill reference headings: ${[...parts.keys()].join(', ')}`)
  return files
}
