/** Split the canonical prompt into focused, non-overlapping installed-skill references. */
import { getLoomAuthoringPrompt } from './authoring-prompt'
import { OUI_SECTION_TYPES } from './library'
import { BEAT_IDS } from './narration'
import { SECTION_MENTAL_MODELS } from './mental-model-guide'
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

  put('planning/mental-models', take('Start Here: Mental Model and Section Selection'))
  put('planning/visuals', WRITER_VISUAL_PLANNING)
  put('core/formats', take('Topic Layout'), take('Output Formats'))
  put('core/syntax', take('Syntax Rules'), take('Hoisting & Statement Order'))
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
  for (const line of signatures.split('\n').slice(1)) {
    if (line.startsWith('### ')) { owner = line.startsWith('### Narration') ? 'narration' : 'core'; continue }
    const component = /^([A-Z][A-Za-z0-9]*)\(/.exec(line)?.[1]
    if (component) owner = OUI_SECTION_TYPES.get(component) ?? owner
    if (component || line.startsWith('  ')) {
      const lines = groups.get(owner) ?? []
      lines.push(line)
      groups.set(owner, lines)
    }
  }
  put('core/components', '# Topic and shared components', 'Arguments marked with ? are optional. Read core/syntax.md for positional argument rules.', (groups.get('core') ?? []).join('\n'))

  const narration = take('Narration Files')
    .replace(/Beat IDs by section type[^\n]*\n\n\| Section type \| Beats \|\n\|---\|---\|\n(?:\|[^\n]*\n)+/, 'Beat IDs are in each selected section reference under Presentation beats.\n')
  put('core/narration', narration, '## Narration component signatures', (groups.get('narration') ?? []).join('\n'))

  const composition: Record<string, string> = {
    bullets: take('Bullet Composition'),
    'pillar-layer': take('Layer Composition'),
    timeline: take('Measured Timeline'),
    'breakdown-tree': take('Breakdown Trees'),
  }
  for (const { type, model, question } of SECTION_MENTAL_MODELS) {
    if (type === 'openui') continue
    const components = groups.get(type)
    if (!components?.length) throw new Error(`Missing skill signatures: ${type}`)
    put(`sections/${type}`, `# ${type}\n\n${model}. ${question}`, 'Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.', '## Component signatures', components.join('\n'), '## Presentation beats', (type === 'intro' ? '' : '`title`, then ') + BEAT_IDS[type], ...(composition[type] ? [composition[type]] : []))
  }
  // Standard OpenUI has its own library. Keep the introduction small and route
  // to visual families; no other section needs their signatures or examples.
  const standard = take('Standard OpenUI Sections')
  const family = standard.indexOf('\n### Tables and Charts')
  const layouts = standard.indexOf('\n### Layouts for Other Content')
  const drawings = standard.indexOf('\n### Drawings')
  if (family < 0 || layouts < family || drawings < layouts) throw new Error('OpenUI skill reference families changed')
  put('sections/openui', standard.slice(0, family), '## Visual references', '- [Tables and charts](../openui/charts.md)\n- [Layouts](../openui/layouts.md)\n- [SVG drawings](../openui/drawings.md)\n- [Time, shares and utilization](../openui/time-usage.md)', '## Presentation beats', '`title`, then ' + BEAT_IDS.openui, 'Read [narration](../core/narration.md) for effects and targets.')
  put('openui/charts', standard.slice(family, layouts))
  put('openui/layouts', standard.slice(layouts, drawings))
  put('openui/drawings', standard.slice(drawings))
  put('openui/time-usage', take('Time and Usage Visuals'))
  if (parts.size) throw new Error(`Unrouted skill reference headings: ${[...parts.keys()].join(', ')}`)
  return files
}
