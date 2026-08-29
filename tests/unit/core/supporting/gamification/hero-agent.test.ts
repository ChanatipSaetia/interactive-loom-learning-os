import { describe, it, expect } from 'vitest'
import {
  quadraticBezierPoint,
  idleBobOffset,
  resolveHeroWalkPath,
  DEFAULT_WALK_DURATION,
  IDLE_BOB_AMPLITUDE,
  IDLE_BOB_PERIOD,
} from '../../../../../src/core/supporting/gamification/components/hero-agent'
import { computeArcControlPoint } from '../../../../../src/core/supporting/gamification/components/scene-renderer'

describe('quadraticBezierPoint', () => {
  const p1 = { x: 0, y: 0 }
  const cp = { x: 50, y: -40 }
  const p2 = { x: 100, y: 0 }

  it('starts at p1 at t=0', () => {
    expect(quadraticBezierPoint(p1, cp, p2, 0)).toEqual({ x: 0, y: 0 })
  })

  it('ends at p2 at t=1', () => {
    const p = quadraticBezierPoint(p1, cp, p2, 1)
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(0)
  })

  it('hits the Bézier midpoint (p1 + 2cp + p2)/4 at t=0.5', () => {
    const p = quadraticBezierPoint(p1, cp, p2, 0.5)
    expect(p.x).toBeCloseTo((0 + 2 * 50 + 100) / 4)
    expect(p.y).toBeCloseTo((0 + 2 * -40 + 0) / 4)
  })

  it('traces a curve (midpoint off the straight chord)', () => {
    const mid = quadraticBezierPoint(p1, cp, p2, 0.5)
    const chordMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    expect(mid.y).not.toBeCloseTo(chordMid.y)
  })
})

describe('idleBobOffset', () => {
  it('starts at 0 and stays bounded by the amplitude', () => {
    expect(idleBobOffset(0)).toBeCloseTo(0)
    for (const t of [100, 350, 700, 1050, 1400, 5000]) {
      expect(Math.abs(idleBobOffset(t))).toBeLessThanOrEqual(IDLE_BOB_AMPLITUDE + 1e-9)
    }
  })

  it('peaks at the amplitude at a quarter period', () => {
    expect(idleBobOffset(IDLE_BOB_PERIOD / 4)).toBeCloseTo(IDLE_BOB_AMPLITUDE)
  })

  it('is periodic with IDLE_BOB_PERIOD', () => {
    expect(idleBobOffset(900)).toBeCloseTo(idleBobOffset(900 + IDLE_BOB_PERIOD))
  })
})

describe('resolveHeroWalkPath', () => {
  const from = { x: 0, y: 0 }
  const to = { x: 120, y: 60 }
  const connections = [
    { fromId: 'a', toId: 'b' },
    { fromId: 'b', toId: 'c' },
    { fromId: 'c', toId: 'd' },
  ]

  it('reuses the control point of the matching forward dependency arc', () => {
    const path = resolveHeroWalkPath(from, to, connections, 'b', 'c')
    const expected = computeArcControlPoint(from, to, 1)
    expect(path.synthesized).toBe(false)
    expect(path.connectionIndex).toBe(1)
    expect(path.cp.x).toBeCloseTo(expected.cpX)
    expect(path.cp.y).toBeCloseTo(expected.cpY)
  })

  it('matches a reverse traversal of the same connection', () => {
    const path = resolveHeroWalkPath(from, to, connections, 'c', 'b')
    expect(path.synthesized).toBe(false)
    expect(path.connectionIndex).toBe(1)
  })

  it('synthesizes a gentle arc when no dependency connects the nodes', () => {
    const path = resolveHeroWalkPath(from, to, connections, 'a', 'd')
    expect(path.synthesized).toBe(true)
    expect(path.connectionIndex).toBe(-1)
    const expected = computeArcControlPoint(from, to, 0)
    expect(path.cp.x).toBeCloseTo(expected.cpX)
    expect(path.cp.y).toBeCloseTo(expected.cpY)
  })

  it('synthesizes an arc when the hero has no current node yet', () => {
    const path = resolveHeroWalkPath(from, to, connections, null, 'b')
    expect(path.synthesized).toBe(true)
  })

  it('anchors the path at the hero origin and target hex', () => {
    const path = resolveHeroWalkPath(from, to, connections, 'b', 'c')
    expect(path.start).toBe(from)
    expect(path.end).toBe(to)
  })

  it('curves off the straight chord between nodes', () => {
    const path = resolveHeroWalkPath(from, to, connections, 'b', 'c')
    const chordMidY = (from.y + to.y) / 2
    const mid = quadraticBezierPoint(path.start, path.cp, path.end, 0.5)
    expect(mid.y).not.toBeCloseTo(chordMidY)
  })
})

describe('DEFAULT_WALK_DURATION', () => {
  it('is a snappy but readable walk time', () => {
    expect(DEFAULT_WALK_DURATION).toBeGreaterThanOrEqual(600)
    expect(DEFAULT_WALK_DURATION).toBeLessThanOrEqual(1500)
  })
})
