import { describe, it, expect } from 'vitest'
import { compileOUISection } from '../../../../../../src/core/learning-engine/composition/oui/compile'
import { bundleToSections } from '../../../../../../src/core/learning-engine/composition/okf/sections'
import {
  entityPickSources,
  pickFirst,
  relationPickSources,
} from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/pick-source'
import type { UnifiedFlowchartSchema } from '../../../../../../src/core/learning-engine/sub-contexts/process-simulation/components/flowchart/types'
import type { PickAnchorFn } from '../../../../../../src/core/ui-system/pick-anchor'

const FILES = import.meta.glob<string>('/public/content/demo/sections/flowchart-feedback.oui', { query: '?raw', import: 'default', eager: true })
const source = Object.values(FILES)[0]
const { value, sourceMap } = compileOUISection(source)
const schema = bundleToSections([value!])[0].props.schema as UnifiedFlowchartSchema

/** The same lookup `usePickAnchors()` does inside a PickSection. */
const pick: PickAnchorFn = Object.assign(() => ({}), {
  byId: (components: string | readonly string[], id: string, prop?: string | number) => {
    for (const component of typeof components === 'string' ? [components] : components) {
      const anchor = sourceMap.anchorOfId(component, id)
      if (anchor) {
        const suffix = prop === undefined ? '' : String(prop).startsWith('[') ? String(prop) : `.${prop}`
        return { 'data-oui-anchor': `${anchor.statement}${anchor.path}${suffix}` }
      }
    }
    return {}
  },
})

const entityAnchor = (id: string) => pickFirst(pick, entityPickSources(id, schema.rawSteps))['data-oui-anchor']

describe('Flowchart pick sources', () => {
  it('points nodes at the statement and prop that declared them', () => {
    expect(entityAnchor('qa_user')).toBe('qaUser')
    expect(entityAnchor('evaluator')).toBe('evaluator')
    expect(entityAnchor('pol_fb_check')).toBe('fbCheck.policy')
    expect(entityAnchor('cmd_fb_check')).toBe('fbCheck.command')
    expect(entityAnchor('cmd_fb_pass')).toBe('fbPass.command')
    expect(entityAnchor('evt_fb_evaluated')).toBe('fbCheck.events[0]')
    expect(entityAnchor('evt_fb_revision')).toBe('fbFail.events[0]')
  })

  it('points every copy of a system at its declaring statement', () => {
    const copies = Object.keys(schema.entities).filter((id) => /^orch_feedback\d+$/.test(id))
    expect(copies.length).toBeGreaterThan(0)
    for (const id of copies) expect(entityAnchor(id)).toBe('orchFeedback')
  })

  it('resolves every node', () => {
    const missing = Object.keys(schema.entities).filter((id) => !entityAnchor(id))
    expect(missing).toEqual([])
  })

  it('points Event Storming lines at the step prop that drew them', () => {
    const anchorOf = (from: string, to: string) => {
      const rel = schema.relations.find((r) => r.from === from && r.to === to)!
      return pickFirst(pick, relationPickSources(rel, schema.rawSteps))['data-oui-anchor']
    }
    expect(anchorOf('qa_user', 'pol_fb_check')).toBe('fbCheck.initiatedBy')
    expect(anchorOf('pol_fb_check', 'cmd_fb_check')).toBe('fbCheck.command')
    expect(anchorOf('cmd_fb_check', 'evaluator')).toBe('fbCheck.handledBy')
    expect(anchorOf('evaluator', 'evt_fb_evaluated')).toBe('fbCheck.events[0]')
    expect(anchorOf('evt_fb_evaluated', 'pol_fb_pass')).toBe('fbPass')
  })
})
