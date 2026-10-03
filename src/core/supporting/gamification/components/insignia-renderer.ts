import { Graphics } from 'pixi.js'
import { GamificationThemePalette, getGamificationThemePalette } from '../theme-palette'
import { drawHexInsignia } from './hex-types'

export function drawVectorInsignia(
  g: Graphics,
  type: string,
  color: number,
  isDefeated: boolean = false,
  palette: GamificationThemePalette = getGamificationThemePalette(),
  time: number = 0,
) {
  drawHexInsignia(g, type, {
    color,
    isDefeated,
    palette,
    time,
  })
}

export * from './hex-types'
