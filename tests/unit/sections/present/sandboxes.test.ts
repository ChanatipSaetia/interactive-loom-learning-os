import { describe, it, expect } from 'vitest'
import { formulaBeats, tradeoffBeats, tradeoffPlan, tradeoffSummaries, type FormulaPresentData, type TradeoffPresentData } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import { content, ids, kinds, propsOf } from './helpers'

describe('sandbox beats', () => {
  it('tradeoff: per step its choices, then its recommended choice, then where the recommendations land', () => {
    const props = propsOf<TradeoffPresentData>(content('storybook/sections/tradeoffs.oui'))
    const steps = (props.scenarios ?? []).flatMap((s) => s.steps)
    const recommended = steps.filter((s) => s.recommended).length
    expect(tradeoffPlan(props)).toHaveLength(steps.length + recommended)
    expect(tradeoffPlan(props).slice(0, 2)).toEqual([
      { scenario: 0, step: 0, recommended: false },
      { scenario: 0, step: 0, recommended: true },
    ])
    const beats = tradeoffBeats(props)
    expect(beats).toHaveLength(tradeoffPlan(props).length + (props.scenarios ?? []).length)
    expect(ids(beats).slice(0, 3)).toEqual(['step1', 'step1.recommended', 'step2'])
    expect(ids(beats).slice(-(props.scenarios ?? []).length)).toEqual((props.scenarios ?? []).map((_, i) => `result${i + 1}`))
    expect(kinds(tradeoffBeats({ scenarios: [] }))).toEqual(['show'])
  })

  it('tradeoff: a step without a recommendation gets one beat', () => {
    const props = propsOf<TradeoffPresentData>(content('system-design/sections/tradeoff.oui'))
    const steps = (props.scenarios ?? []).flatMap((s) => s.steps)
    expect(steps.every((s) => !s.recommended)).toBe(true)
    expect(tradeoffPlan(props)).toHaveLength(steps.length)
    expect(tradeoffSummaries(props)).toEqual([])
    expect(tradeoffBeats(props)).toHaveLength(steps.length)
  })

  it('formula: variables and metrics, then the sweep', () => {
    const props = propsOf<FormulaPresentData>(content('kamado-beef/sections/formula-sandbox.oui'))
    const beats = formulaBeats(props)
    const v = props.variables?.[0]
    if (!v) throw new Error('fixture has no variables')
    expect(kinds(beats)).toEqual(['show', 'show'])
    expect(ids(beats)).toEqual(['formulas', 'sweep'])
    expect(kinds(formulaBeats({ ...props, variables: [{ ...v, defaultValue: v.max }] }))).toEqual(['show'])
    expect(kinds(formulaBeats({ variables: [], metrics: [] }))).toEqual(['show'])
  })
})
