import { describe, it, expect } from 'vitest'
import { formulaBeats, tradeoffBeats, tradeoffPlan, type FormulaPresentData, type TradeoffPresentData } from '../../../../src/core/learning-engine/sub-contexts/tradeoff-sandbox/present'
import { content, kinds, propsOf } from './helpers'

describe('sandbox beats', () => {
  it('tradeoff: per step its choices, then its recommended choice, then the sandbox', () => {
    const props = propsOf<TradeoffPresentData>(content('storybook/sections/tradeoffs.oui'))
    const steps = (props.scenarios ?? []).flatMap((s) => s.steps)
    const recommended = steps.filter((s) => s.recommended).length
    expect(tradeoffPlan(props)).toHaveLength(steps.length + recommended)
    expect(tradeoffPlan(props).slice(0, 2)).toEqual([
      { scenario: 0, step: 0, recommended: false },
      { scenario: 0, step: 0, recommended: true },
    ])
    expect(kinds(tradeoffBeats(props)).at(-1)).toBe('explore')
    expect(kinds(tradeoffBeats({ scenarios: [] }))).toEqual(['show'])
  })

  it('tradeoff: a step without a recommendation gets one beat', () => {
    const props = propsOf<TradeoffPresentData>(content('system-design/sections/tradeoff.oui'))
    const steps = (props.scenarios ?? []).flatMap((s) => s.steps)
    expect(steps.every((s) => !s.recommended)).toBe(true)
    expect(tradeoffPlan(props)).toHaveLength(steps.length)
  })

  it('formula: variables and metrics, the sweep, then the sliders', () => {
    const props = propsOf<FormulaPresentData>(content('kamado-beef/sections/formula-sandbox.oui'))
    expect(kinds(formulaBeats(props))).toEqual(['show', 'show', 'explore'])
    const v = props.variables?.[0]
    if (!v) throw new Error('fixture has no variables')
    expect(kinds(formulaBeats({ ...props, variables: [{ ...v, defaultValue: v.max }] }))).toEqual(['show', 'explore'])
    expect(kinds(formulaBeats({ variables: [], metrics: [] }))).toEqual(['show'])
  })
})
