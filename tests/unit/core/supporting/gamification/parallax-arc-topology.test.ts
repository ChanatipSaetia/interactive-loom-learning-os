import { describe, it, expect } from 'vitest'
import {
  PARALLAX_PARTICLE_COUNT,
  PARALLAX_FACTOR,
  PARALLAX_SPREAD_FACTOR,
  getParallaxParticleColors,
  computeParallaxOffset,
  generateParallaxParticles,
} from '../../../../../src/core/supporting/gamification/components/parallax-background'
import {
  FULL_ARC_ALPHA,
  computeArcControlPoint,
} from '../../../../../src/core/supporting/gamification/components/scene-renderer'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

describe('parallax background constants', () => {
  it('caps ambient particle count at ~60', () => {
    expect(PARALLAX_PARTICLE_COUNT).toBe(60)
  })

  it('uses a reduced ~0.25x parallax factor', () => {
    expect(PARALLAX_FACTOR).toBeCloseTo(0.25)
  })

  it('spreads the particle field wider than the viewport', () => {
    expect(PARALLAX_SPREAD_FACTOR).toBeGreaterThan(1)
  })
})

describe('getParallaxParticleColors', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('uses only muted Frappé surface0 / subtext tones', () => {
    const colors = getParallaxParticleColors(palette)
    expect(colors).toContain(palette.surface0Num)
    expect(colors).toContain(palette.subtext0Num)
    expect(colors).not.toContain(palette.redNum)
    expect(colors).not.toContain(palette.blueNum)
  })

  it('derives colors from the supplied theme palette', () => {
    const other = getGamificationThemePalette('medicare')
    expect(getParallaxParticleColors(other)).toContain(other.surface0Num)
  })
})

describe('computeParallaxOffset', () => {
  it('translates pan at the reduced parallax rate', () => {
    const offset = computeParallaxOffset({ x: 200, y: -80 })
    expect(offset.x).toBeCloseTo(200 * PARALLAX_FACTOR)
    expect(offset.y).toBeCloseTo(-80 * PARALLAX_FACTOR)
  })

  it('returns zero offset for zero pan', () => {
    expect(computeParallaxOffset({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('accepts a custom factor', () => {
    expect(computeParallaxOffset({ x: 100, y: 100 }, 0.5)).toEqual({ x: 50, y: 50 })
  })
})

describe('generateParallaxParticles', () => {
  it('generates the capped count of particles', () => {
    expect(generateParallaxParticles(880, 580)).toHaveLength(PARALLAX_PARTICLE_COUNT)
    expect(generateParallaxParticles(880, 580, 500)).toHaveLength(PARALLAX_PARTICLE_COUNT)
  })

  it('is deterministic for the same seed', () => {
    const a = generateParallaxParticles(880, 580)
    const b = generateParallaxParticles(880, 580)
    expect(a).toEqual(b)
  })

  it('spreads particles within the parallax field bounds', () => {
    const particles = generateParallaxParticles(800, 600)
    for (const p of particles) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual((800 * PARALLAX_SPREAD_FACTOR) / 2)
      expect(Math.abs(p.y)).toBeLessThanOrEqual((600 * PARALLAX_SPREAD_FACTOR) / 2)
    }
  })

  it('keeps particles small and subtly alpha-blended', () => {
    for (const p of generateParallaxParticles(880, 580)) {
      expect(p.radius).toBeGreaterThan(0)
      expect(p.radius).toBeLessThanOrEqual(5)
      expect(p.alpha).toBeGreaterThan(0)
      expect(p.alpha).toBeLessThan(0.5)
    }
  })
})

describe('FULL_ARC_ALPHA', () => {
  it('renders the full topology layer at low alpha (0.15–0.25)', () => {
    expect(FULL_ARC_ALPHA).toBeGreaterThanOrEqual(0.15)
    expect(FULL_ARC_ALPHA).toBeLessThanOrEqual(0.25)
  })
})

describe('computeArcControlPoint', () => {
  it('places the control point near the midpoint, offset perpendicularly', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 100, y: 0 }
    const cp = computeArcControlPoint(p1, p2, 0)
    expect(cp.cpX).toBeCloseTo(50)
    expect(Math.abs(cp.cpY)).toBeGreaterThan(0)
    expect(Math.abs(cp.cpY)).toBeLessThanOrEqual(32)
  })

  it('alternates curvature side for even vs odd connection index', () => {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: 100, y: 0 }
    const even = computeArcControlPoint(p1, p2, 0)
    const odd = computeArcControlPoint(p1, p2, 1)
    expect(Math.sign(even.cpY)).toBe(-Math.sign(odd.cpY))
  })

  it('clamps the curvature offset between 18 and 32', () => {
    const near = computeArcControlPoint({ x: 0, y: 0 }, { x: 10, y: 0 }, 0)
    const far = computeArcControlPoint({ x: 0, y: 0 }, { x: 2000, y: 0 }, 0)
    expect(Math.abs(near.curveOffset)).toBeGreaterThanOrEqual(18)
    expect(Math.abs(far.curveOffset)).toBeLessThanOrEqual(32)
  })
})
