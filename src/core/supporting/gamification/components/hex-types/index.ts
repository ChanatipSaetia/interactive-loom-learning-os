import { Graphics, FillGradient } from 'pixi.js'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexNodeType } from '../../types'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'
import { capitalHex } from './capital'
import { readingSanctuaryHex } from './reading-sanctuary'
import { archiveSpireHex } from './archive-spire'
import { simulationNexusHex } from './simulation-nexus'
import { conceptMonolithHex } from './concept-monolith'
import { observatoryGalleryHex } from './observatory-gallery'
import { quizEncounterHex } from './quiz-encounter'
import { reflectionDecryptionHex } from './reflection-decryption'
import { tradeoffWorkshopHex } from './tradeoff-workshop'
import { bossLairHex } from './boss-lair'

export * from './types'
export * from './capital'
export * from './reading-sanctuary'
export * from './archive-spire'
export * from './simulation-nexus'
export * from './concept-monolith'
export * from './observatory-gallery'
export * from './quiz-encounter'
export * from './reflection-decryption'
export * from './tradeoff-workshop'
export * from './boss-lair'

export const HEX_TYPE_DEFINITIONS: Record<string, HexTypeDefinition> = {
  capital: capitalHex,
  reading_sanctuary: readingSanctuaryHex,
  archive_spire: archiveSpireHex,
  simulation_nexus: simulationNexusHex,
  concept_monolith: conceptMonolithHex,
  observatory_gallery: observatoryGalleryHex,
  quiz_encounter: quizEncounterHex,
  reflection_decryption: reflectionDecryptionHex,
  tradeoff_workshop: tradeoffWorkshopHex,
  boss_lair: bossLairHex,
}

export function getHexTypeDefinition(type: string): HexTypeDefinition {
  return HEX_TYPE_DEFINITIONS[type] || HEX_TYPE_DEFINITIONS.capital
}

export function drawHexTerrainGround(
  g: Graphics,
  type: string,
  options: HexInsigniaOptions = {},
) {
  const def = getHexTypeDefinition(type)
  if (def.drawTerrainGround) {
    def.drawTerrainGround(g, options)
  }
}

export function drawHexTerritory(
  g: Graphics,
  type: string,
  ctx: import('./types').HexTerritoryContext,
) {
  const def = getHexTypeDefinition(type)
  if (def.drawTerritory) {
    def.drawTerritory(g, ctx)
  }
}

export function drawHexInsignia(
  g: Graphics,
  type: string,
  options: HexInsigniaOptions = {},
) {
  const def = getHexTypeDefinition(type)
  def.drawInsignia(g, options)
}

/**
 * Backward compatibility facade for drawVectorInsignia
 */
export function drawVectorInsignia(
  g: Graphics,
  type: string,
  color?: number,
  isDefeated: boolean = false,
  time: number = 0,
  palette: GamificationThemePalette = getGamificationThemePalette(),
) {
  drawHexInsignia(g, type, { color, isDefeated, palette, time })
}

export function createHexTypeGradient(
  type: string,
  isLocked: boolean,
  isCleared: boolean = false,
  palette: GamificationThemePalette = getGamificationThemePalette(),
): FillGradient {
  const def = getHexTypeDefinition(type)
  return def.createGradient(isLocked, isCleared, palette)
}

export function renderHexTypeEffects(
  type: HexNodeType,
  ctx: HexTypeEffectContext,
) {
  const def = getHexTypeDefinition(type)
  if (def.renderEffects) {
    def.renderEffects(ctx)
  }
}
