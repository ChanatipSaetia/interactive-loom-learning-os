import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawReflectionDecryptionTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Concentric astronomical circle engravings across the full hex
  g.circle(0, 0, HEX_RADIUS * 0.86)
    .stroke({ width: 0.9, color: palette.mauveNum, alpha: 0.35 * alphaMod })
  g.circle(0, 0, HEX_RADIUS * 0.6)
    .stroke({ width: 0.8, color: palette.lavenderNum, alpha: 0.4 * alphaMod })

  // 2. Star chart 6-point radial axis rays connecting hex vertices
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const x1 = Math.cos(angle) * (HEX_RADIUS * 0.3)
    const y1 = Math.sin(angle) * (HEX_RADIUS * 0.3)
    const x2 = Math.cos(angle) * (HEX_RADIUS * 0.86)
    const y2 = Math.sin(angle) * (HEX_RADIUS * 0.86)
    g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 0.8, color: palette.mauveNum, alpha: 0.45 * alphaMod })
  }

  // 3. Runic star glyphs on the periphery
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6
    const gx = Math.cos(angle) * (HEX_RADIUS * 0.72)
    const gy = Math.sin(angle) * (HEX_RADIUS * 0.72)
    g.circle(gx, gy, 1.2).fill({ color: palette.lavenderNum, alpha: 0.6 * alphaMod })
  }
}

export function drawReflectionDecryptionInsignia(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const {
    color,
    isDefeated = false,
    palette = getGamificationThemePalette(),
    time = 0,
  } = options

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.mauveNum)
  const darkC = palette.crustNum
  const stoneColor = palette.surface2Num
  const brassColor = palette.yellowNum

  // 1. Ancient Star Dais Platform
  g.ellipse(0, 9, 14, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.poly([
    -12, 8,
    -8, 11,
    8, 11,
    12, 8,
    8, 5,
    -8, 5,
  ]).fill({ color: stoneColor }).stroke({ width: 1.1, color: palette.textNum })

  // 2. Weathered Tapered Runic Obelisk
  g.poly([
    -4.5, 7,
    -2.5, -16,
    0, -22,
    2.5, -16,
    4.5, 7,
  ]).fill({ color: stoneColor }).stroke({ width: 1.2, color: palette.textNum })

  // Central Vertical Glowing Mana Rune Channel
  g.moveTo(0, 5).lineTo(0, -16).stroke({ width: 1.2, color: c })
  g.circle(0, -6, 1.5).fill({ color: palette.lavenderNum })
  g.circle(0, -12, 1.2).fill({ color: palette.lavenderNum })

  // 3. Astrolabe Armillary Rings (Concentric Rotating Brass Vector Ellipses)
  const rot1 = time * 1.5
  const rot2 = -time * 1.2
  const rX = 11
  const rY = 5

  // Outer Ring
  g.ellipse(0, -4, rX * Math.abs(Math.cos(rot1)) + 2, rY)
    .stroke({ width: 1.2, color: brassColor, alpha: 0.9 })
  // Inner Ring
  g.ellipse(0, -4, (rX - 3) * Math.abs(Math.cos(rot2)) + 1.5, rY - 1.5)
    .stroke({ width: 1, color: palette.lavenderNum, alpha: 0.85 })

  // 4. Central Cryptographic Diamond Core (Pulsing Mana Eye)
  const diamondPulse = Math.sin(time * 3.5) * 0.8
  g.poly([
    0, -8 - diamondPulse,
    3.5 + diamondPulse * 0.5, -4,
    0, 0 + diamondPulse,
    -3.5 - diamondPulse * 0.5, -4,
  ]).fill({ color: palette.textNum, alpha: 0.95 }).stroke({ width: 1, color: palette.redNum })
  g.circle(0, -4, 1.2).fill({ color: c })
}

export function createReflectionDecryptionGradient(
  isLocked: boolean,
  isCleared: boolean,
  palette: GamificationThemePalette,
): FillGradient {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isCleared) {
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  if (isLocked) {
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  gradient.addColorStop(0, palette.mauve)
  gradient.addColorStop(0.45, palette.lavender)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderReflectionDecryptionEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked, isCleared } = ctx
  if (isLocked || isCleared) return

  const glowContainer = new Container()
  glowContainer.label = 'AstrolabePulsingHalo'
  const glowGfx = new Graphics()
  glowContainer.addChild(glowGfx)
  nodeContainer.addChild(glowContainer)

  animControllers.push((t) => {
    glowGfx.clear()
    const pulse = 0.6 + 0.4 * Math.sin(t * 3)
    glowGfx.circle(0, -4, 13 + pulse * 4).stroke({ width: 1.5, color: palette.mauveNum, alpha: 0.25 * pulse })
    glowGfx.circle(0, -4, 8 + pulse * 2).stroke({ width: 2, color: palette.lavenderNum, alpha: 0.4 * pulse })
  })
}

export const reflectionDecryptionHex: HexTypeDefinition = {
  type: 'reflection_decryption',
  title: 'Reflection Decryption',
  drawTerrainGround: drawReflectionDecryptionTerrainGround,
  drawInsignia: drawReflectionDecryptionInsignia,
  createGradient: createReflectionDecryptionGradient,
  renderEffects: renderReflectionDecryptionEffects,
  getGlowColor: (palette) => palette.mauveNum,
}
