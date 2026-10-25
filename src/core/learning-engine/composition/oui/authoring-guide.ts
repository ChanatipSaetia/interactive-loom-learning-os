/**
 * The authoring prompt cut down to what one topic needs (decision 188 in
 * grill-log-adaptive-learning.md): the whole prompt is about 72 KB, too much
 * to send with every request, so the Loom MCP server's `get_authoring_guide`
 * returns the core rules plus the components of the section types the model
 * plans to use.
 */
import { getLoomAuthoringPrompt } from './authoring-prompt'
import { OUI_SECTION_TYPES, getLoomOUIComponent } from './library'

/** The standard OpenUI section (`// @openui`), which has no Loom component of its own. */
export const OPENUI_SECTION_TYPE = 'openui'

const COMPONENT_LINE = /^([A-Z][A-Za-z0-9]*)\(/
const SIGNATURES = '## Component Signatures'
const STANDARD_OPENUI = '## Standard OpenUI Sections'
const NARRATION_FILES = '## Narration Files'

export interface GuideSectionType {
  type: string
  /** Its root component, e.g. `Quiz`. */
  component: string
  /** The component's one-line description. */
  summary: string
}

/** Every section type the guide can include, in prompt order. */
export function guideSectionTypes(): GuideSectionType[] {
  const types = [...OUI_SECTION_TYPES].map(([component, type]) => ({
    type,
    component,
    summary: getLoomOUIComponent(component)?.description.split('\n')[0] ?? '',
  }))
  types.push({ type: OPENUI_SECTION_TYPE, component: '// @openui', summary: 'Free-form layout from the standard OpenUI library: cards, tabs, tables, charts and Svg drawings.' })
  return types
}

/** The part of `text` from `start` up to the next `## ` heading (or the end), and the rest around it. */
function cut(text: string, start: string): { before: string; part: string; after: string } {
  const from = text.indexOf(`\n${start}\n`)
  if (from < 0) throw new Error(`Loom authoring guide: the prompt no longer has "${start}"`)
  const next = text.indexOf('\n## ', from + start.length + 2)
  const to = next < 0 ? text.length : next
  return { before: text.slice(0, from), part: text.slice(from, to), after: text.slice(to) }
}

/**
 * Keep the component signatures of the wanted section types: a section's root
 * component and the sub-components listed after it, plus the shared, topic and
 * narration components every topic uses.
 */
function filterSignatures(part: string, wanted: Set<string>): string {
  const out: string[] = []
  let group: string[] = []
  let groupHeader = ''
  let owner = 'core'
  let keep = true
  const flush = () => {
    if (group.length) out.push('', groupHeader, ...group)
    group = []
  }
  for (const line of part.split('\n')) {
    if (line.startsWith('### ')) {
      flush()
      groupHeader = line
      owner = /^### (Shared|Topic & Catalog|Narration)/.test(line) ? 'core' : ''
      continue
    }
    const name = COMPONENT_LINE.exec(line)?.[1]
    if (name) {
      const type = OUI_SECTION_TYPES.get(name)
      if (type) owner = type
      keep = owner === 'core' || wanted.has(owner)
    }
    if (!groupHeader) out.push(line)
    else if (keep && (name || line.startsWith('  '))) group.push(line)
  }
  flush()
  return out.join('\n')
}

/** The prompt never changes while the program runs. */
let prompt: string | undefined

/**
 * The guide for writing a topic with the given section types. With none, the
 * core rules and a list of the section types to choose from, so the model can
 * ask again with the ones it will use. `['all']` returns the whole prompt.
 */
export function getAuthoringGuide(sections: string[] = []): string {
  prompt ??= getLoomAuthoringPrompt()
  if (sections.includes('all')) return prompt
  const known = new Set(guideSectionTypes().map((t) => t.type))
  const wanted = new Set(sections.filter((s) => known.has(s)))
  const unknown = sections.filter((s) => !known.has(s))

  let text = prompt
  if (!wanted.has(OPENUI_SECTION_TYPE)) {
    const { before, after } = cut(text, STANDARD_OPENUI)
    const narration = after.indexOf(`\n${NARRATION_FILES}\n`)
    text = before + (narration < 0 ? after : after.slice(narration))
  }
  const { before, part, after } = cut(text, SIGNATURES)
  const index = guideSectionTypes().map((t) => `- \`${t.type}\` (${t.component}): ${t.summary}`).join('\n')
  const notes = [
    wanted.size === 0
      ? 'No section types were asked for, so only the shared components are listed. Pick the section types this topic needs from the list below and call get_authoring_guide again with them.'
      : `Components are listed for these section types only: ${[...wanted].join(', ')}. Ask again to add others.`,
    ...(unknown.length ? [`Unknown section types ignored: ${unknown.join(', ')}.`] : []),
  ].join(' ')
  return `${before}${filterSignatures(part, wanted)}\n\n### Section types\n\n${notes}\n\n${index}\n${after}`
}
