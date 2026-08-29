import { describe, it, expect } from 'vitest'
import { Graphics } from 'pixi.js'
import {
  HEX_TYPE_DEFINITIONS,
  getHexTypeDefinition,
  drawHexInsignia,
  drawHexTerrainGround,
  drawHexTerritory,
  createHexTypeGradient,
  capitalHex,
  readingSanctuaryHex,
  archiveSpireHex,
  simulationNexusHex,
  conceptMonolithHex,
  observatoryGalleryHex,
  quizEncounterHex,
  reflectionDecryptionHex,
  tradeoffWorkshopHex,
  bossLairHex,
} from '../../../../../src/core/supporting/gamification/components/hex-types'
import { getGamificationThemePalette } from '../../../../../src/core/supporting/gamification/theme-palette'

describe('Hex Types Modular Architecture', () => {
  const palette = getGamificationThemePalette('catppuccin')

  it('registers all 10 hex types in HEX_TYPE_DEFINITIONS', () => {
    expect(HEX_TYPE_DEFINITIONS.capital).toBe(capitalHex)
    expect(HEX_TYPE_DEFINITIONS.reading_sanctuary).toBe(readingSanctuaryHex)
    expect(HEX_TYPE_DEFINITIONS.archive_spire).toBe(archiveSpireHex)
    expect(HEX_TYPE_DEFINITIONS.simulation_nexus).toBe(simulationNexusHex)
    expect(HEX_TYPE_DEFINITIONS.concept_monolith).toBe(conceptMonolithHex)
    expect(HEX_TYPE_DEFINITIONS.observatory_gallery).toBe(observatoryGalleryHex)
    expect(HEX_TYPE_DEFINITIONS.quiz_encounter).toBe(quizEncounterHex)
    expect(HEX_TYPE_DEFINITIONS.reflection_decryption).toBe(reflectionDecryptionHex)
    expect(HEX_TYPE_DEFINITIONS.tradeoff_workshop).toBe(tradeoffWorkshopHex)
    expect(HEX_TYPE_DEFINITIONS.boss_lair).toBe(bossLairHex)
  })

  it('falls back to capitalHex for unknown hex types', () => {
    const def = getHexTypeDefinition('unknown_type')
    expect(def).toBe(capitalHex)
  })

  it('draws procedural insignia without crashing for each type', () => {
    const types = [
      'capital',
      'reading_sanctuary',
      'archive_spire',
      'simulation_nexus',
      'concept_monolith',
      'observatory_gallery',
      'quiz_encounter',
      'reflection_decryption',
      'tradeoff_workshop',
      'boss_lair',
    ]

    for (const type of types) {
      const g = new Graphics()
      expect(() => {
        drawHexInsignia(g, type, { palette, isDefeated: false, time: 1.5 })
      }).not.toThrow()

      // Defeated state check
      expect(() => {
        drawHexInsignia(g, type, { palette, isDefeated: true, time: 2.0 })
      }).not.toThrow()
      g.destroy()
    }
  })

  it('draws full terrain grounds without crashing for each type', () => {
    const types = [
      'capital',
      'reading_sanctuary',
      'archive_spire',
      'simulation_nexus',
      'concept_monolith',
      'observatory_gallery',
      'quiz_encounter',
      'reflection_decryption',
      'tradeoff_workshop',
      'boss_lair',
    ]

    for (const type of types) {
      const g = new Graphics()
      expect(() => {
        drawHexTerrainGround(g, type, { palette, isDefeated: false, isLocked: false })
      }).not.toThrow()

      expect(() => {
        drawHexTerrainGround(g, type, { palette, isDefeated: true, isLocked: true })
      }).not.toThrow()
      g.destroy()
    }
  })

  it('creates valid thematic gradients for each hex type', () => {
    const types = [
      'capital',
      'reading_sanctuary',
      'archive_spire',
      'simulation_nexus',
      'concept_monolith',
      'observatory_gallery',
      'quiz_encounter',
      'reflection_decryption',
      'tradeoff_workshop',
      'boss_lair',
    ]

    for (const type of types) {
      const grad = createHexTypeGradient(type, false, false, palette)
      expect(grad).toBeDefined()

      const lockedGrad = createHexTypeGradient(type, true, false, palette)
      expect(lockedGrad).toBeDefined()

      const clearedGrad = createHexTypeGradient(type, false, true, palette)
      expect(clearedGrad).toBeDefined()
    }
  })

  it('provides distinct theme glow colors for each hex type', () => {
    expect(capitalHex.getGlowColor(palette)).toBe(palette.mauveNum)
    expect(readingSanctuaryHex.getGlowColor(palette)).toBe(palette.greenNum)
    expect(quizEncounterHex.getGlowColor(palette)).toBe(palette.redNum)
    expect(reflectionDecryptionHex.getGlowColor(palette)).toBe(palette.mauveNum)
    expect(tradeoffWorkshopHex.getGlowColor(palette)).toBe(palette.yellowNum)
    expect(bossLairHex.getGlowColor(palette)).toBe(palette.redNum)
  })

  it('draws custom thematic territory auras without crashing for each primary site type', () => {
    const siteTypes = [
      'capital',
      'reading_sanctuary',
      'archive_spire',
      'simulation_nexus',
      'concept_monolith',
      'observatory_gallery',
      'tradeoff_workshop',
    ]

    for (const type of siteTypes) {
      const g = new Graphics()
      expect(() => {
        drawHexTerritory(g, type, {
          x: 0,
          y: 0,
          radius: 105,
          palette,
          isCleared: false,
          isUnlocked: true,
          node: { id: 'test-node', title: 'Test', type: type as any, status: 'unlocked', description: 'Test' },
        })
      }).not.toThrow()
      g.destroy()
    }
  })
})
