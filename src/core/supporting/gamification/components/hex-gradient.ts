import { FillGradient } from 'pixi.js'
import { HEX_RADIUS } from './hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../theme-palette'

// Create thematic top-to-bottom gradients for each node type
export function createHexGradient(type: string, isLocked: boolean, isCleared: boolean = false, palette: GamificationThemePalette = getGamificationThemePalette()) {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isLocked && type !== 'boss_lair') {
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  // Defeated / Beaten Hostile Encounter Gradient
  if (isCleared && (type === 'quiz_encounter' || type === 'reflection_decryption')) {
    gradient.addColorStop(0, palette.surface2)
    gradient.addColorStop(0.45, palette.surface0)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  switch (type) {
    case 'capital':
      gradient.addColorStop(0, palette.sapphire)
      gradient.addColorStop(0.45, palette.blue)
      gradient.addColorStop(1, palette.crust)
      break
    case 'reading_sanctuary':
      gradient.addColorStop(0, palette.green)
      gradient.addColorStop(0.45, palette.surface0)
      gradient.addColorStop(1, palette.crust)
      break
    case 'quiz_encounter':
      gradient.addColorStop(0, palette.red)
      gradient.addColorStop(0.45, palette.maroon)
      gradient.addColorStop(1, palette.crust)
      break
    case 'reflection_decryption':
      gradient.addColorStop(0, palette.red)
      gradient.addColorStop(0.35, palette.mauve)
      gradient.addColorStop(0.7, palette.maroon)
      gradient.addColorStop(1, palette.crust)
      break
    case 'tradeoff_workshop':
      gradient.addColorStop(0, palette.yellow)
      gradient.addColorStop(0.45, palette.peach)
      gradient.addColorStop(1, palette.crust)
      break
    case 'boss_lair':
      gradient.addColorStop(0, palette.maroon)
      gradient.addColorStop(0.45, palette.red)
      gradient.addColorStop(1, palette.base)
      break
    default:
      gradient.addColorStop(0, palette.sapphire)
      gradient.addColorStop(1, palette.crust)
      break
  }
  return gradient
}
