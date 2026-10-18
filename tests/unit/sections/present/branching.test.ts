import { describe, it, expect } from 'vitest'
import { flowchartBeats, scenarioBeats, scenarioPlan, type FlowchartPresentData, type ScenarioPresentData } from '../../../../src/core/learning-engine/sub-contexts/process-simulation/present'
import { conceptCategories, conceptMapBeats, type ConceptMapPresentData } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/present'
import { decisionTreeBeats, decisionTreeWalk, drawTree, type DecisionTreePresentData } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import { layoutConceptMap } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map'
import { content, ids, kinds, propsOf } from './helpers'

describe('spatial and branching beats', () => {
  it('flowchart: one beat per step of the first journey', () => {
    const props = propsOf<FlowchartPresentData>(content('kamado-beef/sections/flowchart.oui'))
    const steps = props.schema?.journeys[0]?.steps ?? []
    expect(steps.length).toBeGreaterThan(1)
    expect(flowchartBeats(props)).toHaveLength(steps.length)
    expect(kinds(flowchartBeats({}))).toEqual(['show'])
  })

  it('concept map: a beat per category in first-appearance order, then the whole map', () => {
    const props = propsOf<ConceptMapPresentData>(content('pixijs/sections/concept-map.oui'))
    const groups = conceptCategories(props)
    expect(groups.length).toBeGreaterThan(1)
    expect(groups[0]).toBe(Object.values(props.nodes ?? {})[0].category)
    const beats = conceptMapBeats(props)
    expect(beats).toHaveLength(groups.length + 1)
    expect(ids(beats)).toEqual([...groups.map((_, i) => `group${i + 1}`), 'map'])
    expect(kinds(conceptMapBeats({ nodes: {} }))).toEqual(['show'])
    expect(ids(conceptMapBeats({ nodes: { a: { id: 'a', title: 'A', category: 'x' }, b: { id: 'b', title: 'B', category: 'x' } } }))).toEqual(['group1'])
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

  it('scenario: the setup, a weaker path to its outcome, then back to the fork and on along the best path', () => {
    const nodes = {
      start: { prompt: 'Lid?', choices: [{ id: 'open', text: 'Open it', next: 'burnt' }, { id: 'shut', text: 'Keep it shut', next: 'vents' }] },
      vents: { prompt: 'Vents?', choices: [{ id: 'small', text: 'Small', next: 'great' }] },
      burnt: { outcome: { verdict: 'Flare-up.', lesson: 'Air feeds fire.', rating: 'c' as const } },
      great: { outcome: { verdict: 'Even heat.', lesson: 'Control the air.', rating: 'a' as const } },
    }
    const plan = scenarioPlan({ nodes, startNode: 'start' })
    expect(plan.map((s) => s.path.map((p) => p.nodeId).join('>'))).toEqual(['start', 'start>burnt', 'start>vents', 'start>vents>great'])
    expect(plan.map((s) => s.id)).toEqual(['start', 'wrong1', 'right1', 'right2'])
    expect(plan[2].about).toBe('Back to the fork, then chooses “Keep it shut”')
    expect(kinds(scenarioBeats({ nodes, startNode: 'start' }))).toEqual(['show', 'wrong', 'show', 'right'])
    // Only good endings: straight down the best path
    const only = { start: { prompt: 'Go?', choices: [{ id: 'y', text: 'Yes', next: 'great' }] }, great: nodes.great }
    expect(kinds(scenarioBeats({ nodes: only, startNode: 'start' }))).toEqual(['show', 'right'])
    expect(kinds(scenarioBeats({}))).toEqual(['show'])
  })

  it('scenario: the repo topic walks to an outcome', () => {
    const props = propsOf<ScenarioPresentData>(content('kamado-beef/sections/scenario.oui'))
    const beats = kinds(scenarioBeats(props))
    expect(beats[0]).toBe('show')
    expect(beats[beats.length - 1]).toBe('right')
  })

  it('decision tree: the tree and first question, then the recommended answer at every step to a leaf', () => {
    const nodes = {
      q: { prompt: 'Q', choices: [{ id: 'a', text: 'A', next: 'l1' }, { id: 'b', text: 'B', next: 'q2', recommended: true }] },
      q2: { prompt: 'Q2', choices: [{ id: 'c', text: 'C', next: 'l2' }] },
      l1: { leaf: { recommendation: 'One', explanation: '' } },
      l2: { leaf: { recommendation: 'Two', explanation: '' } },
    }
    expect(decisionTreeWalk({ root: 'q', nodes }).map((p) => p.nodeId)).toEqual(['q', 'q2', 'l2'])
    expect(ids(decisionTreeBeats({ root: 'q', nodes }))).toEqual(['start', 'answer1', 'answer2'])
    const props = propsOf<DecisionTreePresentData>(content('pixijs/sections/decision-tree.oui'))
    expect(decisionTreeBeats(props).length).toBeGreaterThan(1)
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
