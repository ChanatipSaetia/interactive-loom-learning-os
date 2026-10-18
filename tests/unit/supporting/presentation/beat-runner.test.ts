import { describe, it, expect } from 'vitest'
import {
  beatToDraw,
  holdMs,
  initialRunnerState,
  isComplete,
  runnerReducer,
  type RunnerState,
} from '../../../../src/core/supporting/presentation/beat-runner'
import { answer, show } from '../../../../src/core/learning-engine/sub-contexts/present-kernel'

const sections = [[show(), show()], [show(), answer('wrong'), answer('right')], [show('Here is the map.')]]
const reduce = runnerReducer(sections)
const at = (section: number, beat: number, extra: Partial<RunnerState> = {}): RunnerState => ({ ...initialRunnerState(), section, beat, ...extra })

describe('beat runner', () => {
  it('steps through beats, then into the next section, entering each beat', () => {
    let s = initialRunnerState()
    s = reduce(s, { type: 'next' })
    expect([s.section, s.beat, s.mode]).toEqual([0, 1, 'enter'])
    s = reduce(s, { type: 'next' })
    expect([s.section, s.beat]).toEqual([1, 0])
  })

  it('never blocks: performed answers play on like any beat (decision 101)', () => {
    let s = at(1, 1)
    s = reduce(s, { type: 'next' })
    expect([s.section, s.beat]).toEqual([1, 2])
    s = reduce(s, { type: 'next' })
    expect([s.section, s.beat]).toEqual([2, 0])
    const done = reduce(s, { type: 'next' })
    expect(isComplete(done, sections)).toBe(true)
    expect(reduce(done, { type: 'next' })).toBe(done)
  })

  it('goes back by settling, across sections and out of the complete state', () => {
    expect(reduce(at(1, 0), { type: 'prev' })).toMatchObject({ section: 0, beat: 1, mode: 'settle' })
    expect(reduce(at(3, 0), { type: 'prev' })).toMatchObject({ section: 2, beat: 0, mode: 'settle' })
    const start = at(0, 0)
    expect(reduce(start, { type: 'prev' })).toBe(start)
  })

  it('jumps anywhere, clamping to real beats (decision 89)', () => {
    expect(reduce(at(0, 0), { type: 'jump', section: 2 })).toMatchObject({ section: 2, beat: 0, mode: 'settle' })
    expect(reduce(at(0, 0), { type: 'jump', section: 9, beat: 9 })).toMatchObject({ section: 2, beat: 0 })
    expect(reduce(at(0, 0), { type: 'jump', section: 1, beat: 5 })).toMatchObject({ section: 1, beat: 2 })
  })

  it('restarts from the first section', () => {
    expect(reduce(at(2, 0), { type: 'restart' })).toEqual({ section: 0, beat: 0, mode: 'enter' })
  })

  it('draws done sections at their last beat and later ones not at all', () => {
    const s = at(1, 0)
    expect([0, 1, 2].map((i) => beatToDraw(s, sections, i))).toEqual([1, 0, -1])
  })

  it('holds a beat for its reading time, within bounds', () => {
    expect(holdMs(0)).toBe(1500)
    expect(holdMs(23)).toBe(800 + 6000)
    expect(holdMs(1000)).toBe(9000)
  })
})
