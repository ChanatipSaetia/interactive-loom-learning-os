import { FillGradient } from 'pixi.js'
import { GamificationThemePalette, getGamificationThemePalette } from '../theme-palette'
import { createHexTypeGradient } from './hex-types'

// Create thematic top-to-bottom gradients for each node type
export function createHexGradient(
  type: string,
  isLocked: boolean,
  isCleared: boolean = false,
  palette: GamificationThemePalette = getGamificationThemePalette(),
): FillGradient {
  return createHexTypeGradient(type, isLocked, isCleared, palette)
}
