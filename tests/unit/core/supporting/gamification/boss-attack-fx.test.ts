import { describe, it, expect, vi } from 'vitest'
import { Container, Graphics } from 'pixi.js'
import {
  BOSS_ATTACK_DURATION,
  computeOrbitPosition,
  drawKeyArtifact,
  drawSingularityCore,
  drawCelestialBeam,
  triggerBossBeamAttackAnimation,
} from '../../../../../src/core/supporting/gamification/components/boss-attack-fx'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

describe('Boss Key Attack & Beam FX', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('has a defined total animation duration', () => {
    expect(BOSS_ATTACK_DURATION).toBeGreaterThanOrEqual(3.0)
  })

  it('computes 2.5D isometric orbit coordinates with 0.88 Y-scaling', () => {
    const p1 = computeOrbitPosition(100, 200, 0, 50, 0.88)
    expect(p1.x).toBeCloseTo(150)
    expect(p1.y).toBeCloseTo(200)

    const p2 = computeOrbitPosition(100, 200, Math.PI / 2, 50, 0.88)
    expect(p2.x).toBeCloseTo(100)
    expect(p2.y).toBeCloseTo(200 + 50 * 0.88)
  })

  it('draws key artifact without throwing', () => {
    const g = new Graphics()
    expect(() => {
      drawKeyArtifact(g, 50, 50, 1.2, palette.yellowNum, 0xffffff, 1.0)
    }).not.toThrow()
    g.destroy()
  })

  it('draws singularity core without throwing', () => {
    const g = new Graphics()
    expect(() => {
      drawSingularityCore(g, 100, 100, 1.5, 0.8, palette)
    }).not.toThrow()
    g.destroy()
  })

  it('draws celestial strike beam without throwing', () => {
    const g = new Graphics()
    expect(() => {
      drawCelestialBeam(g, 100, 50, 100, 200, 0.5, palette, 2.5)
      drawCelestialBeam(g, 100, 50, 100, 200, 0.98, palette, 3.2)
    }).not.toThrow()
    g.destroy()
  })

  it('orchestrates triggerBossBeamAttackAnimation and adds to stage', () => {
    const stage = new Container()
    const onComplete = vi.fn()

    const container = triggerBossBeamAttackAnimation({
      stage,
      bossPixel: { x: 200, y: 300 },
      inventory: [
        { id: 'key-1', name: 'Key of Light', icon: '🔑', description: 'Artifact 1' },
        { id: 'key-2', name: 'Key of Shadows', icon: '🗝️', description: 'Artifact 2' },
      ],
      palette,
      onComplete,
    })

    expect(stage.children).toContain(container)
    expect(container.children.length).toBeGreaterThan(0)
  })

  it('handles 3 or more key items in the animation flawlessly', () => {
    const stage = new Container()
    const onComplete = vi.fn()

    const container = triggerBossBeamAttackAnimation({
      stage,
      bossPixel: { x: 150, y: 250 },
      inventory: [
        { id: 'key-1', name: 'Key 1', icon: '🔑', description: 'Artifact 1' },
        { id: 'key-2', name: 'Key 2', icon: '🗝️', description: 'Artifact 2' },
        { id: 'key-3', name: 'Key 3', icon: '🔮', description: 'Artifact 3' },
        { id: 'key-4', name: 'Key 4', icon: '💎', description: 'Artifact 4' },
      ],
      palette,
      onComplete,
    })

    expect(stage.children).toContain(container)
    expect(container.children.length).toBeGreaterThan(0)
  })
})
