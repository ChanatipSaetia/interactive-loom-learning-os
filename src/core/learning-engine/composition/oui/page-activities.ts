import { proseBlocks } from './page-prose'
/** Automatic activity scenes inside visual page layouts. No learner state is read. */
import type { ElementNode } from '@openuidev/lang-core'
import { compileSectionElement, parseOUIElements } from './compile'
import { bundleToSections } from '../okf/sections'
import { OUI_SECTION_TYPES } from './library'
import { CORE_PRESENTERS } from '../../registry/register-core-presenters'
import { show, type Beat } from '../../sub-contexts/present-kernel'
import type { SectionConfig } from '../../registry'

export interface PageActivity {
  statementId?: string
  config: SectionConfig
  beats: Beat[]
  start: number
  part: number
}
export function pageActivityPlan(source: string): { activities: PageActivity[]; beats: Beat[]; starts: number[] } {
  const root = parseOUIElements(source)
  const activities: PageActivity[] = [], beats: Beat[] = [], starts: number[] = []
  const prose = root && proseBlocks(root)
  if (prose) return { activities: [], beats: CORE_PRESENTERS.text.toBeats({ paragraphs: prose.map((block) => block.props.text) }), starts: [] }
  const body = root?.typeName === 'Page' ? root.props.body as ElementNode : root
  const children = body && ['Stack', 'Card'].includes(body.typeName) && Array.isArray(body.props.children)
    ? body.props.children : body ? [body] : []
  const visit = (value: unknown, part: number): void => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach((child) => visit(child, part)); return }
    const node = value as ElementNode
    if (node.type === 'element' && OUI_SECTION_TYPES.has(node.typeName)) {
      const payload = compileSectionElement(node)
      if (!payload) return
      const config = bundleToSections([payload])[0]
      const bodyBeats = CORE_PRESENTERS[config.type]?.toBeats(config.props) ?? [show('all')]
      const prefix = node.statementId ?? `activity${activities.length + 1}`
      activities.push({ statementId: node.statementId, config, beats: bodyBeats, start: beats.length, part })
      beats.push(...bodyBeats.map((beat) => ({ ...beat, id: `${prefix}.${beat.id}` })))
      return
    }
    Object.values(value).forEach((child) => visit(child, part))
  }
  children.forEach((child, part) => {
    starts.push(beats.length)
    const before = beats.length
    visit(child, part)
    if (before === beats.length) beats.push(show(children.length > 1 ? `part${part + 1}` : 'all', 'Page content'))
  })
  return { activities, beats, starts }
}
