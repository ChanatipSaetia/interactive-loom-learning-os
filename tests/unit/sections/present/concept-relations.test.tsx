import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { conceptMapBeats, conceptMapPlan, conceptRelationText, type ConceptMapPresentData } from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/present'
import PresentConceptMap from '../../../../src/core/learning-engine/sub-contexts/practice-assessment/components/concept-map/PresentConceptMap'
import { beatSpeech } from '../../../../src/core/supporting/presentation/narration'

const data: ConceptMapPresentData = {
  nodes: {
    renderer: { id: 'renderer', title: 'Renderer', category: 'system' },
    sprite: { id: 'sprite', title: 'Sprite', category: 'system' },
    canvas: { id: 'canvas', title: 'Canvas', category: 'output' },
  },
  edges: [
    { from: 'renderer', to: 'canvas', label: 'draws on' },
    { from: 'sprite', to: 'renderer', label: 'is drawn by' },
  ],
}
const at = (edge: number) => conceptMapPlan(data).findIndex((step) => step.kind === 'relation' && step.edge === edge)
const draw = (beat: number, value = data) => <PresentConceptMap data={value} beats={conceptMapBeats(value)} beat={beat} sectionIndex={0} active />

describe('concept map relationship explanations', () => {
  it('introduces both endpoints first, preserving edge-list IDs rather than presentation-order IDs', () => {
    expect(conceptMapBeats(data).map((b) => b.id)).toEqual(['group1', 'link2', 'group2', 'link1', 'map'])
    expect(conceptMapBeats(data)[3].about).toBe('Renderer draws on Canvas')
    expect(conceptMapBeats({}).map((b) => b.id)).toEqual(['map'])
  })

  it('states the authored direction and relation, with source → line → target entrances', () => {
    const beat = at(0)
    const { container } = render(draw(beat))
    const statement = container.querySelector('[data-testid="present-cm-statement"]')!
    expect([...statement.querySelectorAll('strong')].map((el) => el.textContent)).toEqual(['Renderer', 'Canvas'])
    expect(statement.querySelector('.present-cm-verb')).toHaveTextContent('draws on')
    const active = container.querySelector('.present-cm-edge.is-active')!
    expect(active).toHaveAttribute('data-testid', 'present-cm-link-1')
    expect(active).toHaveAttribute('marker-end')
    expect(container.querySelector('.present-cm-active-label')).toHaveTextContent('draws on')
    expect(container.querySelector('.present-cm-source-ring')).toHaveAttribute('data-delay', '0')
    expect(active).toHaveAttribute('data-delay', '350')
    expect(container.querySelector('.present-cm-target-ring')).toHaveAttribute('data-delay', '1100')
    expect(beatSpeech(container, beat).map((p) => p.text).join(' ')).toBe('Renderer draws on Canvas.')
  })

  it('preserves quiet context and restores the complete map on its last beat', () => {
    const { container, rerender } = render(draw(at(1)))
    expect(container.querySelector('[data-testid="present-cm-link-1"]')).toHaveClass('is-context')
    expect(container.querySelector('[data-testid="present-cm-link-2"]')).toHaveAttribute('data-shown')
    rerender(draw(at(0)))
    expect(container.querySelector('[data-testid="present-cm-node-sprite"]')).toHaveClass('is-context')
    rerender(draw(conceptMapBeats(data).length - 1))
    expect(container.querySelector('.present-cm-edge.is-active')).toBeNull()
    expect(container.querySelectorAll('.present-cm-edge[data-shown]')).toHaveLength(2)
    expect(container.querySelectorAll('.cm-edge-label')).toHaveLength(2)
    rerender(draw(at(1)))
    expect(container.querySelector('.present-cm-verb')).toHaveTextContent('is drawn by')
  })

  it('keeps the camera and positions stable as the explanation moves between relationships', () => {
    const { container, rerender } = render(draw(0))
    const view = container.querySelector('svg')!.getAttribute('viewBox')
    expect(view).toBeTruthy()
    rerender(draw(at(0)))
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe(view)
    rerender(draw(at(1)))
    expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe(view)
  })

  it('does not invent a causal verb for an unlabelled link, or discard self and parallel links', () => {
    const value = { ...data, edges: [
      { from: 'renderer', to: 'renderer' },
      { from: 'renderer', to: 'canvas', label: 'uses' },
      { from: 'renderer', to: 'canvas', label: 'can resize' },
      { from: 'missing', to: 'canvas', label: 'invalid' },
    ] }
    expect(conceptRelationText(value, value.edges[0])).toBe('Renderer is connected to Renderer')
    expect(conceptMapBeats(value).map((b) => b.id)).toEqual(['group1', 'link1', 'group2', 'link2', 'link3', 'map'])
    const { container } = render(draw(1, value))
    expect(container.querySelector('.present-cm-edge.is-active')?.getAttribute('d')).toContain(' C ')
  })
})
