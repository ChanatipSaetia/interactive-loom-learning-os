import { describe, it, expect } from 'vitest'
import {
  isVictorySetPieceNode,
  getVictoryFxColors,
  computeVictoryRingState,
  computeVictoryParticleState,
  VICTORY_FX_DURATION,
  VICTORY_FX_RING_COUNT,
  VICTORY_FX_PARTICLE_COUNT,
  VICTORY_FX_BASE_RADIUS,
} from '../../../../../src/core/supporting/gamification/components/victory-fx'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

describe('isVictorySetPieceNode', () => {
  it('returns true for boss_lair nodes', () => {
    expect(isVictorySetPieceNode({ type: 'boss_lair' })).toBe(true)
  })

  it('returns true for capital nodes', () => {
    expect(isVictorySetPieceNode({ type: 'capital' })).toBe(true)
  })

  it('returns false for regular encounter / reading node types', () => {
    for (const type of [
      'quiz_encounter',
      'reflection_decryption',
      'tradeoff_workshop',
      'reading_sanctuary',
    ]) {
      expect(isVictorySetPieceNode({ type })).toBe(false)
    }
  })
})

describe('getVictoryFxColors', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('uses Frappé yellow, peach, and mauve palette colors', () => {
    const colors = getVictoryFxColors(palette)
    expect(colors).toHaveLength(3)
    expect(colors).toContain(palette.yellowNum)
    expect(colors).toContain(palette.peachNum)
    expect(colors).toContain(palette.mauveNum)
  })

  it('derives colors from the supplied theme palette, not hardcoded values', () => {
    const other = getGamificationThemePalette('medicare')
    const colors = getVictoryFxColors(other)
    expect(colors).toContain(other.yellowNum)
    expect(colors).toContain(other.peachNum)
    expect(colors).toContain(other.mauveNum)
  })
})

describe('computeVictoryRingState', () => {
  it('starts at the base radius with high alpha', () => {
    const s = computeVictoryRingState(0, VICTORY_FX_BASE_RADIUS, 220)
    expect(s.radius).toBeCloseTo(VICTORY_FX_BASE_RADIUS)
    expect(s.alpha).toBeGreaterThan(0.7)
    expect(s.width).toBeGreaterThan(4)
  })

  it('expands monotonically outward toward the max radius', () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map((p) =>
      computeVictoryRingState(p, VICTORY_FX_BASE_RADIUS, 220),
    )
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].radius).toBeGreaterThan(samples[i - 1].radius)
    }
    expect(samples[samples.length - 1].radius).toBeCloseTo(220)
  })

  it('fades alpha and thins stroke width as it expands', () => {
    const early = computeVictoryRingState(0.2, 26, 220)
    const late = computeVictoryRingState(0.9, 26, 220)
    expect(late.alpha).toBeLessThan(early.alpha)
    expect(late.width).toBeLessThan(early.width)
    expect(computeVictoryRingState(1, 26, 220).alpha).toBeCloseTo(0)
  })

  it('clamps out-of-range progress', () => {
    expect(computeVictoryRingState(-0.5, 26, 220).radius).toBeCloseTo(26)
    expect(computeVictoryRingState(1.5, 26, 220).radius).toBeCloseTo(220)
  })
})

describe('computeVictoryParticleState', () => {
  const particle = { angle: 0, speed: 100, spin: 1 }

  it('starts at the burst origin', () => {
    const s = computeVictoryParticleState(particle, 0)
    expect(s.x).toBeCloseTo(0)
    expect(s.y).toBeCloseTo(0)
    expect(s.alpha).toBeGreaterThan(0)
  })

  it('flies outward along the emission angle with gravity fall', () => {
    const mid = computeVictoryParticleState({ angle: 0, speed: 100, spin: 1 }, 0.5)
    expect(mid.x).toBeGreaterThan(0)
    const up = computeVictoryParticleState({ angle: -Math.PI / 2, speed: 100, spin: 1 }, 1)
    // Straight-up particle with gravity: net displacement still pulled down by gravity term
    expect(up.y).toBeLessThan(0)
    const straight = computeVictoryParticleState({ angle: 0, speed: 100, spin: 1 }, 1, 300)
    expect(straight.y).toBeGreaterThan(0) // gravity pulls sideways-fired particles down
  })

  it('spins and shrinks while fading out', () => {
    const early = computeVictoryParticleState(particle, 0.2)
    const late = computeVictoryParticleState(particle, 0.8)
    expect(Math.abs(late.rotation)).toBeGreaterThan(Math.abs(early.rotation))
    expect(late.scale).toBeLessThan(early.scale)
    expect(late.alpha).toBeLessThan(early.alpha)
    expect(computeVictoryParticleState(particle, 1).alpha).toBeCloseTo(0)
  })

  it('travels monotonically outward (ease-out) and clamps progress', () => {
    const dists = [0, 0.25, 0.5, 0.75, 1].map((p) => computeVictoryParticleState(particle, p).x)
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThan(dists[i - 1])
    }
    expect(computeVictoryParticleState(particle, -1).x).toBeCloseTo(0)
    expect(computeVictoryParticleState(particle, 1).x).toBeCloseTo(
      computeVictoryParticleState(particle, 2).x,
    )
  })
})

describe('set piece constants', () => {
  it('runs the full set piece for ~2 seconds', () => {
    expect(VICTORY_FX_DURATION).toBeCloseTo(2, 0)
  })

  it('renders multiple rings and a dense confetti burst', () => {
    expect(VICTORY_FX_RING_COUNT).toBeGreaterThanOrEqual(3)
    expect(VICTORY_FX_PARTICLE_COUNT).toBeGreaterThanOrEqual(24)
  })
})
