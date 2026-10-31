import { describe, it, expect } from 'vitest'
import { formulaBeats, formulaTrends, tradeoffBeats, tradeoffPlan, tradeoffSummaries, type FormulaPresentData, type TradeoffPresentData } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import { content, ids, kinds, propsOf } from './helpers'

describe('sandbox beats', () => {
  it('tradeoff: per step its choices, the gains and costs of each choice, its recommended choice, then where the recommendations land', () => {
    const props = propsOf<TradeoffPresentData>(content('storybook/sections/tradeoffs.oui'))
    const steps = (props.scenarios ?? []).flatMap((s) => s.steps)
    const recommended = steps.filter((s) => s.recommended).length
    const weighed = steps.flatMap((s) => s.choices).filter((c) => c.pros.length || c.cons.length).length
    expect(weighed).toBeGreaterThan(0)
    expect(tradeoffPlan(props)).toHaveLength(steps.length + weighed + recommended + (props.scenarios ?? []).length)
    const first = steps[0]
    const firstWeighed = first.choices.flatMap((c, i) => (c.pros.length || c.cons.length ? [i] : []))
    expect(tradeoffPlan(props).slice(1, firstWeighed.length + 3)).toEqual([
      { scenario: 0, step: 0, show: 'choices' },
      ...firstWeighed.map((choice) => ({ scenario: 0, step: 0, show: 'choice', choice })),
      { scenario: 0, step: 0, show: 'recommended' },
    ])
    const beats = tradeoffBeats(props)
    expect(beats).toHaveLength(tradeoffPlan(props).length + (props.scenarios ?? []).length)
    expect(ids(beats).slice(1, firstWeighed.length + 4)).toEqual(['step1', ...firstWeighed.map((i) => `step1.choice${i + 1}`), 'step1.recommended', 'step2'])
    expect(ids(beats).slice(-(props.scenarios ?? []).length)).toEqual((props.scenarios ?? []).map((_, i) => `result${i + 1}`))
    expect(kinds(tradeoffBeats({ scenarios: [] }))).toEqual(['show'])
  })

  it('tradeoff: a step without a recommendation gets one beat', () => {
    const props = propsOf<TradeoffPresentData>(content('system-design/sections/tradeoff.oui'))
    const steps = (props.scenarios ?? []).flatMap((s) => s.steps)
    expect(steps.every((s) => !s.recommended)).toBe(true)
    const weighed = steps.flatMap((s) => s.choices).filter((c) => c.pros.length || c.cons.length).length
    expect(tradeoffPlan(props).filter((b) => b.show === 'choices')).toHaveLength(steps.length)
    expect(tradeoffPlan(props).filter((b) => b.show === 'recommended')).toEqual([])
    expect(tradeoffSummaries(props)).toEqual([])
    expect(tradeoffBeats(props)).toHaveLength(steps.length + weighed + (props.scenarios ?? []).length)
  })

  it('formula: variables and metrics, then one sweep per variable that can move', () => {
    const props = propsOf<FormulaPresentData>(content('kamado-beef/sections/formula-sandbox.oui'))
    const moving = (props.variables ?? []).filter((v) => v.max > v.min)
    expect(moving.length).toBeGreaterThan(0)
    expect(ids(formulaBeats(props))).toEqual(['formulas', ...moving.map((_, i) => `sweep${i + 1}`)])
    const v = props.variables![0]
    expect(ids(formulaBeats({ ...props, variables: [{ ...v, min: 3, max: 3 }] }))).toEqual(['formulas'])
    expect(kinds(formulaBeats({ variables: [], metrics: [] }))).toEqual(['show'])
  })

  it('formula: states how each metric moves over a sweep, skipping the ones that stay put', () => {
    const variables = [{ id: 'x', label: 'X', min: 0, max: 10, step: 1, defaultValue: 5 }, { id: 'y', label: 'Y', min: 0, max: 4, step: 1, defaultValue: 2 }]
    const metric = (id: string, formula: string) => ({ id, label: id, formula, description: '' })
    const data = { variables, metrics: [metric('up', 'x * 2'), metric('down', '100 - x'), metric('hill', '25 - (x - 5) * (x - 5)'), metric('flat', 'y + 1'), metric('derived', 'up + 1')] }
    const trends = formulaTrends(data, variables[0])
    expect(trends.map((t) => [t.metric.id, t.shape, t.from, t.to])).toEqual([
      ['up', 'rises', 0, 20],
      ['down', 'falls', 100, 90],
      ['hill', 'peak', 0, 0],
      ['derived', 'rises', 1, 21],
    ])
    expect(trends[2].turn).toBe(25)
    expect(formulaTrends(data, variables[1]).map((t) => t.metric.id)).toEqual(['flat'])
  })
})
