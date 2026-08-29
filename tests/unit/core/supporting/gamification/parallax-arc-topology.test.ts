import { describe, it, expect } from 'vitest'
import { Container, Graphics } from 'pixi.js'
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
  calculateTerritoryRoads,
  renderTerritoryRoads,
  drawMiniHorseCart,
} from '../../../../../src/core/supporting/gamification/components/scene-renderer'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'
import { HexNodeData } from '../../../../../src/core/supporting/gamification/types'

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

describe('Territory Roads to Hub (calculateTerritoryRoads & renderTerritoryRoads)', () => {
  const palette = getGamificationThemePalette('catppuccin')

  const nodes: HexNodeData[] = [
    { id: 'capital', title: 'Capital', type: 'capital', status: 'unlocked', description: 'Cap' },
    { id: 's-reading', title: 'Sanctuary 1', type: 'reading_sanctuary', status: 'unlocked', description: 'S1' },
    { id: 's-spire', title: 'Spire 1', type: 'archive_spire', status: 'cleared', description: 'S2' },
    { id: 's-nexus', title: 'Nexus 1', type: 'simulation_nexus', status: 'locked', description: 'S3' },
    { id: 's-monolith', title: 'Monolith 1', type: 'concept_monolith', status: 'locked', description: 'S4' },
    { id: 's-gallery', title: 'Gallery 1', type: 'observatory_gallery', status: 'locked', description: 'S5' },
    { id: 'quiz-1', title: 'Quiz 1', type: 'quiz_encounter', status: 'locked', description: 'Q1' },
    { id: 'boss-1', title: 'Boss', type: 'boss_lair', status: 'locked', description: 'B' },
  ]

  const coords = new Map<string, { q: number; r: number }>([
    ['capital', { q: 0, r: 0 }],
    ['s-reading', { q: 3, r: 0 }],
    ['s-spire', { q: 0, r: 3 }],
    ['s-nexus', { q: -3, r: 3 }],
    ['s-monolith', { q: -3, r: 0 }],
    ['s-gallery', { q: 0, r: -3 }],
    ['quiz-1', { q: 4, r: 0 }],
    ['boss-1', { q: 0, r: -1 }],
  ])

  it('calculates connecting roads for every sanctuary territory back to the hub', () => {
    const roads = calculateTerritoryRoads(nodes, coords)
    // 5 sanctuaries total
    expect(roads).toHaveLength(5)

    // Each road connects from the edge of a sanctuary territory to the edge of the capital hub
    for (const road of roads) {
      expect(road.toHubNode.id).toBe('capital')
      expect(Math.hypot(road.toPixel.x, road.toPixel.y / 0.88)).toBeCloseTo(135)
      expect(road.controlPoint).toBeDefined()
      expect(road.fromNode.type).not.toBe('capital')
      expect(road.fromNode.type).not.toBe('quiz_encounter')
      expect(road.fromNode.type).not.toBe('boss_lair')
    }

    // Status reflection
    const readingRoad = roads.find((r) => r.fromNode.id === 's-reading')!
    expect(readingRoad.isUnlocked).toBe(true)
    expect(readingRoad.isCleared).toBe(false)

    const spireRoad = roads.find((r) => r.fromNode.id === 's-spire')!
    expect(spireRoad.isUnlocked).toBe(false)
    expect(spireRoad.isCleared).toBe(true)
  })

  it('renders territory roads container and animation controllers without crashing', () => {
    const container = new Container()
    const animControllers: Array<(time: number) => void> = []
    const roads = calculateTerritoryRoads(nodes, coords)

    expect(() => {
      renderTerritoryRoads(container, roads, palette, animControllers)
    }).not.toThrow()

    expect(container.children.length).toBeGreaterThan(0)
    expect(animControllers.length).toBe(1)

    // Execute anim controller
    expect(() => {
      animControllers[0](1.5)
    }).not.toThrow()
  })

  it('draws mini horse cart without throwing', () => {
    const g = new Graphics()
    expect(() => {
      drawMiniHorseCart(g, 50, 50, Math.PI / 4, palette, 2.5, true)
      drawMiniHorseCart(g, 100, 100, -Math.PI / 2, palette, 4.0, false)
    }).not.toThrow()
    g.destroy()
  })
})

