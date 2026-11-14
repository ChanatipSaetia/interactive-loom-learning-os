import { componentTeachingGuide } from './component-teaching'
import { COMPONENT_PURPOSES } from './component-purpose'
import { getUnifiedOUISpec } from './library'
import { DOCUMENT_ROOT_RULES } from './document-contract'
/** Focused contracts from one catalog. Internal domain types are not authoring modes. */
import { OPENUI_FOCUSED_RULES } from './openui-focused-rules'
import { getLoomAuthoringPrompt } from './authoring-prompt'
import { componentClosure, componentEntries, componentIndex } from './assistant-prompt'
import { OUI_SECTION_TYPES, getLoomOUIComponent, type ComponentLibrary } from './library'
import { BULLET_AUTHORING_GUIDE } from './bullet-authoring'
import { LAYER_AUTHORING_GUIDE } from './layer-authoring'
import { USER_JOURNEY_AUTHORING_GUIDE } from './user-journey-authoring'
import { TIMELINE_AUTHORING_GUIDE } from './timeline-authoring'
import { BREAKDOWN_TREE_AUTHORING_GUIDE } from './breakdown-tree-authoring'
import { MENTAL_MODEL_GUIDE, TRADEOFF_COMPARISON_GUIDE, PROCEDURE_TEACHING_GUIDE, TAXONOMY_TEACHING_GUIDE, FLASHCARD_TEACHING_GUIDE } from './mental-model-guide'
import { BEAT_IDS } from './narration'

export const OPENUI_SECTION_TYPE = 'openui'
export interface GuideSectionType { type: string; component: string; summary: string }

export function guideSectionTypes(): GuideSectionType[] {
  return [...OUI_SECTION_TYPES].map(([component, type]) => ({
    type, component, summary: getLoomOUIComponent(component)?.description.split('\n')[0] ?? '',
  })).concat([...new Set(COMPONENT_PURPOSES.flatMap((group) => [...group.components]))].filter((name) => !OUI_SECTION_TYPES.has(name)).map((name) => ({ type: name === 'TextContent' ? 'text' : 'openui', component: name, summary: getUnifiedOUISpec().components[name]?.description ?? '' }))).concat({ type: 'openui', component: 'Page', summary: 'One page composed from the shared catalog: tables, charts, cards, drawings and local controls.' })
}

export function getAuthoringGuide(sections: string[] = [], components?: string[], _library?: ComponentLibrary, genericChildren: 'all' | 'selected' = 'selected'): string {
  if (sections.includes('all')) return getLoomAuthoringPrompt()
  const selected = components ?? guideSectionTypes().filter((entry) => sections.includes(entry.type)).map((entry) => entry.component)
  if (!selected.length) return `${OPENUI_FOCUSED_RULES}\n\n${MENTAL_MODEL_GUIDE}\n\n${componentEntries(componentClosure(['Page', 'Topic', 'Narration']))}\n\n## Component discovery\n\n${componentIndex()}\n\nRequest exact component names with components; no library selection is needed.`
  const known = selected.filter((name) => componentClosure([name]).includes(name))
  const unknown = selected.filter((name) => !known.includes(name))
  const guidance: Record<string, string> = { TradeoffSandbox: TRADEOFF_COMPARISON_GUIDE, Steps: PROCEDURE_TEACHING_GUIDE, Flowchart: PROCEDURE_TEACHING_GUIDE, ReflectionSequence: PROCEDURE_TEACHING_GUIDE, TaxonomyBrowser: TAXONOMY_TEACHING_GUIDE, Flashcards: FLASHCARD_TEACHING_GUIDE, Flashcard: FLASHCARD_TEACHING_GUIDE, Bullets: BULLET_AUTHORING_GUIDE + '\n\n' + PROCEDURE_TEACHING_GUIDE, PillarLayer: LAYER_AUTHORING_GUIDE, UserJourney: USER_JOURNEY_AUTHORING_GUIDE, Timeline: TIMELINE_AUTHORING_GUIDE, BreakdownTree: BREAKDOWN_TREE_AUTHORING_GUIDE }
  return [
    '## Focused component contracts',
    ...known.filter((name) => DOCUMENT_ROOT_RULES[name]).map((name) => DOCUMENT_ROOT_RULES[name]),
    ...(!known.every((name) => ['Topic', 'Narration'].includes(name)) ? [OPENUI_FOCUSED_RULES] : []), ...(components === undefined ? [MENTAL_MODEL_GUIDE] : []),
    '## Component Signatures',
    componentEntries(componentClosure([...known, ...(components === undefined ? ['Page', 'Topic', 'Narration'] : [])], undefined, genericChildren)),
    ...known.map(componentTeachingGuide),
    ...known.flatMap((name) => guidance[name] ? [guidance[name]] : []),
    ...(components === undefined && sections.includes('openui') ? [getLoomAuthoringPrompt().split('## Page Composition')[1]?.split('## Narration Files')[0] ?? ''] : []),
    ...(!known.every((name) => name === 'Topic') ? ['## Narration Files', 'Present is hands-free. Use root = Narration([NarrationStep(beat, caption, effects)]). Effects: Highlight, NarrationCallout, Spotlight. Keep Read and Present content shared and state separate.'] : []),
    ...known.flatMap((name) => {
      const type = OUI_SECTION_TYPES.get(name)
      if (name === 'TextContent') return ['### TextContent presentation beats\n' + BEAT_IDS.text + ' A prose-only Stack uses one pN per TextContent block; mixed pages use their layout beats for supporting text.']
      return type ? [`### ${name} presentation beats\n${type === 'intro' ? '' : '`title`, then '}${BEAT_IDS[type] ?? 'Retrieve the component presentation guide.'}`] : []
    }),
    ...(unknown.length ? [`Unknown components: ${unknown.join(', ')}.`] : []),
  ].join('\n\n')
}
