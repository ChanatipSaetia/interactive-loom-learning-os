import { describe, it, expect } from 'vitest'
import { flowchartBeats, scenarioBeats, type FlowchartPresentData, type ScenarioPresentData } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/present'
import { conceptCategories, conceptMapBeats, type ConceptMapPresentData } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/present'
import { decisionTreeBeats, drawTree, type DecisionTreePresentData } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import { layoutConceptMap } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map'
import { content, kinds, propsOf } from './helpers'

describe('spatial and branching beats', () => {
  it('flowchart: one beat per step of the first journey', () => {
    const props = propsOf<FlowchartPresentData>(content('kamado-beef/sections/flowchart.oui'))
    const steps = props.schema?.journeys[0]?.steps ?? []
    expect(steps.length).toBeGreaterThan(1)
    expect(flowchartBeats(props)).toHaveLength(steps.length)
    expect(kinds(flowchartBeats({}))).toEqual(['show'])
  })

  it('concept map: a beat per category in first-appearance order, then exploring', () => {
    const props = propsOf<ConceptMapPresentData>(content('pixijs/sections/concept-map.oui'))
    const groups = conceptCategories(props)
    expect(groups[0]).toBe(Object.values(props.nodes ?? {})[0].category)
    expect(kinds(conceptMapBeats(props))).toEqual([...groups.map(() => 'show'), 'explore'])
    expect(kinds(conceptMapBeats({ nodes: {} }))).toEqual(['show'])
  })

  it('concept map layout places every group side by side from 0,0', () => {
    const nodes = {
      a: { id: 'a', title: 'A', category: 'x' }, b: { id: 'b', title: 'B', category: 'x' },
      c: { id: 'c', title: 'C', category: 'y' }, d: { id: 'd', title: 'D', category: 'y' },
    }
    const layout = layoutConceptMap(nodes, [{ from: 'a', to: 'b' }, { from: 'c', to: 'd' }])
    expect(Object.keys(layout.nodes).sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(Object.keys(layout.edgeAnchors).sort()).toEqual(['a->b', 'c->d'])
    const left = Math.min(...Object.values(layout.nodes).map((n) => (n.x ?? 0) - 50))
    expect(left).toBeCloseTo(0)
    expect(Math.max(layout.nodes.a.x ?? 0, layout.nodes.b.x ?? 0)).toBeLessThan(Math.min(layout.nodes.c.x ?? 0, layout.nodes.d.x ?? 0))
  })

  it('scenario: the setup, then the learner chooses', () => {
    const props = propsOf<ScenarioPresentData>(content('kamado-beef/sections/scenario.oui'))
    expect(kinds(scenarioBeats(props))).toEqual(['show', 'gate'])
    expect(kinds(scenarioBeats({}))).toEqual(['show'])
  })

  it('decision tree: the tree and first question, then the learner answers', () => {
    const props = propsOf<DecisionTreePresentData>(content('pixijs/sections/decision-tree.oui'))
    expect(kinds(decisionTreeBeats(props))).toEqual(['show', 'gate'])
    expect(kinds(decisionTreeBeats({ root: 'missing', nodes: {} }))).toEqual(['show'])
  })

  it('draws the tree with leaves side by side and shared answers as cross links', () => {
    const tree = drawTree('q', {
      q: { prompt: 'Q', choices: [{ id: 'a', next: 'l1' }, { id: 'b', next: 'q2' }] },
      q2: { prompt: 'Q2', choices: [{ id: 'c', next: 'l1' }, { id: 'd', next: 'l2' }] },
      l1: { leaf: { recommendation: 'One', explanation: '' } },
      l2: { leaf: { recommendation: 'Two', explanation: '' } },
    })
    const at = Object.fromEntries(tree.nodes.map((n) => [n.id, n]))
    expect(at.q.y).toBe(0)
    expect(at.l2.y).toBe(2)
    expect(at.l1.leaf && at.l2.leaf && !at.q.leaf).toBe(true)
    expect(tree.width).toBe(2)
    expect(at.q.x).toBe((at.l1.x + at.q2.x) / 2)
    expect(tree.links.filter((l) => l.cross)).toEqual([{ from: 'q2', to: 'l1', choiceId: 'c', cross: true }])
  })
})
