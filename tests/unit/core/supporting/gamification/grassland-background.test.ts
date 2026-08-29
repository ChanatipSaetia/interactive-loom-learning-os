import { describe, it, expect } from 'vitest'
import { Graphics } from 'pixi.js'
import {
  generateAstrolabeRings,
  generateStardust,
  drawAstrolabe,
  drawCartographyGrid,
  drawStardust,
  createCartographyBackground,
  createParallaxBackground,
  generateGrassTufts,
  generateTerrainContours,
  drawGrassTufts,
  drawTerrainContours,
  createGrasslandBackground,
} from '../../../../../src/core/supporting/gamification/components/background'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

describe('Tactical Cartography & Astrolabe Background System', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('generates astrolabe rings and stardust deterministically', () => {
    const rings = generateAstrolabeRings(880, 580, palette)
    expect(rings.length).toBeGreaterThan(0)
    expect(rings[0].radius).toBeGreaterThan(0)

    const starsA = generateStardust(880, 580, palette, 1337)
    const starsB = generateStardust(880, 580, palette, 1337)
    expect(starsA.length).toBeGreaterThan(0)
    expect(starsA).toEqual(starsB)
  })

  it('draws astrolabe, blueprint grid, and stardust without errors', () => {
    const rings = generateAstrolabeRings(880, 580, palette)
    const stars = generateStardust(880, 580, palette, 1337)
    const g = new Graphics()

    expect(() => {
      drawCartographyGrid(g, 880, 580, palette)
      drawAstrolabe(g, rings, 0, palette)
      drawAstrolabe(g, rings, 2.5, palette)
      drawStardust(g, stars, 0)
      drawStardust(g, stars, 1.8)
    }).not.toThrow()

    g.destroy()
  })

  it('creates and manages CartographyBackgroundLayer lifecycle', () => {
    const layer = createCartographyBackground(880, 580, palette)
    expect(layer.container).toBeDefined()
    expect(layer.container.destroyed).toBe(false)

    expect(() => {
      layer.updateTransform({ x: 100, y: -50 })
      layer.tick(1.0)
    }).not.toThrow()

    layer.destroy()
    expect(layer.container.destroyed).toBe(true)
  })

  it('creates tactical astrolabe parallax background container with tick handler', () => {
    const container = createParallaxBackground(palette, 880, 580)
    expect(container).toBeDefined()
    expect(container.label).toBe('TacticalAstrolabeBackdrop')
    container.destroy({ children: true })
  })

  it('preserves backward compatibility helper functions', () => {
    const tufts = generateGrassTufts(880, 580, palette, 2024)
    const patches = generateTerrainContours(880, 580, palette, 777)
    const g = new Graphics()

    expect(() => {
      drawTerrainContours(g, patches)
      drawGrassTufts(g, tufts, 0, palette)
    }).not.toThrow()

    const legacyLayer = createGrasslandBackground(880, 580, palette)
    expect(legacyLayer.container).toBeDefined()
    legacyLayer.destroy()
    g.destroy()
  })
})
