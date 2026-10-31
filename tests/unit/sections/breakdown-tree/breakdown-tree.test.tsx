import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { BREAKDOWN_TREE_EXAMPLE, BREAKDOWN_TREE_NARRATION, PROBABILITY_TREE_EXAMPLE, PROBABILITY_TREE_NARRATION } from '../../../../src/core/learning-engine/composition/oui/breakdown-tree-authoring'
import { validateOUISection, validateOUINarration, sectionBeatsOf } from '../../../../src/core/learning-engine/validation/oui-gateway'
import { printOUISection } from '../../../../src/core/learning-engine/composition/oui/print'
import { getAuthoringGuide } from '../../../../src/core/learning-engine/composition/oui/authoring-guide'
import { BreakdownTreeSectionSchema, breakdownModel, breakdownPercent, validateBreakdownTree, type BreakdownTreeSectionData } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/breakdown-tree'
import { layoutBreakdownTree } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/breakdown-tree-layout'
import { breakdownTreeBeats } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/present'
import BreakdownTreeSection from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/breakdown-tree'
import PresentBreakdownTree from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/breakdown-tree/PresentBreakdownTree'
import { BreakdownTreeFormEditor } from '../../../../src/core/learning-engine/sub-contexts/progressive-content/components/breakdown-tree/BreakdownTreeFormEditor'

const sample = (source = BREAKDOWN_TREE_EXAMPLE) => structuredClone(validateOUISection(source).payload!.data) as BreakdownTreeSectionData

describe('breakdown trees', () => {
  it.each([['quantity', BREAKDOWN_TREE_EXAMPLE, BREAKDOWN_TREE_NARRATION], ['probability', PROBABILITY_TREE_EXAMPLE, PROBABILITY_TREE_NARRATION]])('%s example compiles, round-trips and narrates every split', (_, source, narration) => {
    const result = validateOUISection(source)
    expect(result.diagnostics).toEqual([])
    const back = validateOUISection(printOUISection(result.payload!.meta, result.payload!.data))
    expect(back.diagnostics).toEqual([])
    expect(back.payload!.data).toEqual(result.payload!.data)
    expect(sectionBeatsOf(source)!.map((b) => b.id)).toEqual(['title', 'overview', 'split1', 'split2', 'split3', 'summary'])
    const script = validateOUINarration(narration, source)
    expect(script.diagnostics).toEqual([])
    expect([...new Set(script.payload!.steps.map((s) => s.beat))]).toEqual(['title', 'overview', 'split1', 'split2', 'split3', 'summary'])
  })

  it('distinguishes share of a dish from share of the meal', () => {
    const model = breakdownModel(sample())
    const protein = model.metrics(model.nodes.get('protein')!)
    expect(protein.parentShare).toBeCloseTo(2 / 3)
    expect(protein.totalShare).toBe(.4)
    expect(breakdownPercent(protein.parentShare)).toBe('66.7%')
    expect(model.metrics(model.nodes.get('rice')!).totalShare).toBe(.15)
  })

  it('multiplies conditional probabilities along the path, rather than adding branches', () => {
    const model = breakdownModel(sample(PROBABILITY_TREE_EXAMPLE))
    expect(model.metrics(model.nodes.get('cachedFailure')!).parentShare).toBe(.01)
    expect(model.metrics(model.nodes.get('cachedFailure')!).totalShare).toBeCloseTo(.006)
    expect(model.metrics(model.nodes.get('uncachedFailure')!).totalShare).toBeCloseTo(.02)
    const totalLeafProbability = [...model.nodes.values()].filter((n) => !model.children(n.id).length).reduce((sum, n) => sum + (model.metrics(n).totalShare ?? 0), 0)
    expect(totalLeafProbability).toBeCloseTo(1)
  })

  it('handles a zero quantity total without NaN or Infinity', () => {
    const data = sample()
    data.nodes.forEach((n) => { n.value = 0 })
    expect(validateBreakdownTree(data)).toEqual([])
    const model = breakdownModel(data)
    expect(model.metrics(model.nodes.get('protein')!).parentShare).toBeUndefined()
    expect(model.metrics(model.nodes.get('protein')!).totalShare).toBeUndefined()
    render(<BreakdownTreeSection section={data} />)
    expect(screen.getByTestId('breakdown-tree-section')).not.toHaveTextContent(/NaN|Infinity/)
  })

  it('does not round a rare nonzero probability to zero', () => {
    expect(breakdownPercent(0.000001)).toBe('0.0001%')
    expect(breakdownPercent(0)).toBe('0%')
  })

  it('allows ordinary decimal rounding without silently accepting incomplete totals', () => {
    const data = BreakdownTreeSectionSchema.parse({ type: 'breakdown-tree', nodes: [{ id: 'root', title: 'Total', value: .3 }, { id: 'a', title: 'A', value: .1, parent: 'root' }, { id: 'b', title: 'B', value: .2, parent: 'root' }] })
    expect(validateBreakdownTree(data)).toEqual([])
    data.nodes[2].value = .19
    expect(validateBreakdownTree(data).some((d) => /sum to/.test(d.message))).toBe(true)
  })

  it('keeps the original whole as denominator when Present enlarges a subtree', () => {
    const data = { section: sample() }, props = { data, beats: breakdownTreeBeats(data), sectionIndex: 0, active: true }
    const { container, rerender } = render(<PresentBreakdownTree {...props} beat={0} />)
    expect(container.querySelectorAll('.breakdown-node')).toHaveLength(7)
    rerender(<PresentBreakdownTree {...props} beat={2} />)
    expect(container.querySelectorAll('.breakdown-node')).toHaveLength(3)
    expect(within(screen.getByTestId('breakdown-node-protein')).getByText('40% of total')).toBeInTheDocument()
    expect(screen.getByTestId('breakdown-link-main-protein')).toHaveTextContent('66.7%')
    expect(container).toHaveTextContent('Whole meal · 20 USD')
    expect(container).toHaveTextContent('Whole meal › Main dish')
    rerender(<PresentBreakdownTree {...props} beat={4} />)
    expect(container.querySelectorAll('.breakdown-node')).toHaveLength(7)
    rerender(<PresentBreakdownTree {...props} beat={1} />)
    expect(screen.getByTestId('breakdown-node-meal')).toBeInTheDocument()
  })

  it('opens an ingredient by keyboard and emits its selection', () => {
    const onEvent = vi.fn()
    render(<BreakdownTreeSection section={sample()} onEvent={onEvent} />)
    fireEvent.keyDown(screen.getByTestId('breakdown-node-protein'), { key: 'Enter' })
    expect(screen.getByTestId('breakdown-node-protein')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('breakdown-node-meal')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('66.7% of Main dish · 40% of Whole meal')).toBeInTheDocument()
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'BreakdownNodeSelected', nodeId: 'protein' }))
  })

  it('shows the conditional multiplication for a selected probability outcome', () => {
    render(<BreakdownTreeSection section={sample(PROBABILITY_TREE_EXAMPLE)} />)
    fireEvent.click(screen.getByTestId('breakdown-node-cachedFailure'))
    expect(screen.getByText('60% × 1% = 0.6% overall')).toBeInTheDocument()
  })

  it('creates a valid first child without losing the parent amount in Studio', () => {
    const onChange = vi.fn()
    render(<BreakdownTreeFormEditor data={sample()} onChange={onChange} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Add child' })[3])
    const data = onChange.mock.calls[0][0] as BreakdownTreeSectionData
    expect(data.nodes[data.nodes.length - 1]).toEqual(expect.objectContaining({ parent: 'protein', value: 8 }))
    expect(validateBreakdownTree(data)).toEqual([])
  })

  it('lays out siblings without overlap and gives long names enough card height', () => {
    const data = sample()
    data.nodes[3].title = 'Locally sourced protein ingredients for the main dish'
    const { placed, cardHeight } = layoutBreakdownTree(data)
    expect(cardHeight).toBeGreaterThan(132)
    for (const a of placed) for (const b of placed) {
      if (a.node.id === b.node.id || a.depth !== b.depth) continue
      expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(246)
    }
  })

  it('includes its guide and examples only when that section type is requested', () => {
    const guide = getAuthoringGuide(['breakdown-tree'])
    expect(guide).toContain(BREAKDOWN_TREE_EXAMPLE)
    expect(guide).toContain(PROBABILITY_TREE_EXAMPLE)
    expect(getAuthoringGuide(['quiz'])).not.toContain('## Breakdown Trees')
  })
})

describe('breakdown validation', () => {
  it.each([
    ['missing root', (d: BreakdownTreeSectionData) => { d.nodes[0].parent = 'protein' }, /root|cycle/],
    ['extra root', (d: BreakdownTreeSectionData) => { d.nodes[1].parent = undefined }, /exactly one root/],
    ['unknown parent', (d: BreakdownTreeSectionData) => { d.nodes[1].parent = 'missing' }, /Unknown parent/],
    ['self-parent', (d: BreakdownTreeSectionData) => { d.nodes[1].parent = 'main' }, /own parent/],
    ['cycle', (d: BreakdownTreeSectionData) => { d.nodes[1].parent = 'protein' }, /cycle/],
    ['duplicate ID', (d: BreakdownTreeSectionData) => { d.nodes[3].id = 'main' }, /Duplicate/],
    ['incomplete quantity', (d: BreakdownTreeSectionData) => { d.nodes[1].value = 11 }, /sum to/],
  ])('rejects %s', (_, mutate, message) => {
    const data = sample(); mutate(data)
    expect(validateBreakdownTree(data).some((d) => message.test(d.message))).toBe(true)
  })
  it('requires complete conditional distributions, a unitless root of 1, and probabilities below 1', () => {
    const data = sample(PROBABILITY_TREE_EXAMPLE)
    data.nodes[0].value = .9; data.nodes[1].value = 60; data.unit = 'USD'
    const messages = validateBreakdownTree(data).map((d) => d.message).join(' ')
    expect(messages).toMatch(/root probability must be 1/)
    expect(messages).toMatch(/between 0 and 1/)
    expect(messages).toMatch(/fractions of 1/)
    expect(messages).toMatch(/sum to/)
  })
  it.each([-1, NaN, Infinity])('rejects invalid value %s', (value) => {
    const data = sample(); data.nodes[0].value = value
    expect(BreakdownTreeSectionSchema.safeParse(data).success).toBe(false)
  })
})
