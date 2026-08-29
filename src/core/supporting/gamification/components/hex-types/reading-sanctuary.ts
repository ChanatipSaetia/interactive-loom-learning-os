import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawReadingSanctuaryTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Lush grove moss & clover turf patches across the hex
  g.ellipse(0, 8, HEX_RADIUS * 0.75, HEX_RADIUS * 0.45)
    .fill({ color: palette.greenNum, alpha: 0.22 * alphaMod })
  g.ellipse(-12, -10, 10, 6)
    .fill({ color: palette.tealNum, alpha: 0.18 * alphaMod })
  g.ellipse(12, -10, 10, 6)
    .fill({ color: palette.tealNum, alpha: 0.18 * alphaMod })

  // 2. Stepped stone garden path stones leading to dais
  const pathCoords = [
    { x: 0, y: 24, r: 3.5 },
    { x: -2, y: 19, r: 4 },
    { x: 1, y: 14, r: 4.5 },
  ]
  for (const pt of pathCoords) {
    g.ellipse(pt.x, pt.y, pt.r, pt.r * 0.6)
      .fill({ color: palette.surface1Num, alpha: 0.55 * alphaMod })
      .stroke({ width: 0.8, color: palette.surface2Num, alpha: 0.5 * alphaMod })
  }

  // 3. Ambient herbal flora dots
  const flowerDots = [
    { x: -20, y: 4, c: palette.lavenderNum },
    { x: 20, y: 4, c: palette.peachNum },
    { x: -16, y: 16, c: palette.yellowNum },
    { x: 16, y: 16, c: palette.lavenderNum },
  ]
  for (const f of flowerDots) {
    g.circle(f.x, f.y, 1.2).fill({ color: f.c, alpha: 0.65 * alphaMod })
  }
}

export function drawReadingSanctuaryInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.greenNum)
  const marbleColor = palette.surface1Num
  const marbleTrim = palette.surface2Num
  const darkC = palette.crustNum
  const goldColor = palette.yellowNum

  // 1. Stepped Circular Marble Terrace / Plinth
  g.ellipse(0, 10, 14, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 9, 13, 3.8).fill({ color: marbleColor }).stroke({ width: 1.1, color: marbleTrim })
  g.ellipse(0, 7, 10, 3).fill({ color: palette.surface0Num }).stroke({ width: 0.9, color: marbleTrim })

  // 2. Classical Fluted Marble Columns
  // Left Pillar
  g.rect(-11, -11, 4, 17).fill({ color: marbleColor }).stroke({ width: 1.1, color: palette.textNum })
  g.rect(-12, -13, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.rect(-12, 5, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.moveTo(-9, -10).lineTo(-9, 5).stroke({ width: 0.8, color: palette.surface0Num })

  // Right Pillar
  g.rect(7, -11, 4, 17).fill({ color: marbleColor }).stroke({ width: 1.1, color: palette.textNum })
  g.rect(6, -13, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.rect(6, 5, 6, 2.5).fill({ color: marbleTrim }).stroke({ width: 0.9, color: palette.textNum })
  g.moveTo(9, -10).lineTo(9, 5).stroke({ width: 0.8, color: palette.surface0Num })

  // Architrave / Pediment Beam
  g.rect(-13, -15, 26, 3).fill({ color: marbleColor }).stroke({ width: 1, color: palette.textNum })
  g.poly([-14, -15, 0, -20, 14, -15]).fill({ color: marbleTrim }).stroke({ width: 1, color: palette.textNum })

  // 3. Floating Open Ancient Grimoire / Tome
  const bookBob = Math.sin(time * 2.5) * 1.5
  const bookY = -2 + bookBob

  // Tome drop shadow on dais
  g.ellipse(0, 5, 8, 2.5).fill({ color: darkC, alpha: 0.4 })

  // Hardcover spine & back
  g.poly([
    -8, bookY - 4,
    0, bookY - 1,
    8, bookY - 4,
    8, bookY + 4,
    0, bookY + 7,
    -8, bookY + 4,
  ]).fill({ color: palette.surface0Num }).stroke({ width: 1.2, color: goldColor })

  // Left Page Block (fluttering edge)
  const leftPageFlutter = Math.sin(time * 3 + 1) * 0.6
  g.poly([
    -7.5, bookY - 3 + leftPageFlutter,
    -0.5, bookY - 0.5,
    -0.5, bookY + 5.5,
    -7.5, bookY + 3 + leftPageFlutter,
  ]).fill({ color: palette.textNum, alpha: 0.95 })
  // Right Page Block
  const rightPageFlutter = Math.sin(time * 3 + 2.5) * 0.6
  g.poly([
    0.5, bookY - 0.5,
    7.5, bookY - 3 + rightPageFlutter,
    7.5, bookY + 3 + rightPageFlutter,
    0.5, bookY + 5.5,
  ]).fill({ color: palette.textNum, alpha: 0.95 })

  // Golden Ribbon Bookmark
  g.poly([
    0, bookY + 6,
    2, bookY + 9,
    0, bookY + 11,
    -1, bookY + 9,
  ]).fill({ color: goldColor }).stroke({ width: 0.7, color: palette.textNum })

  // 4. Hovering Glowing Mana Crystal Core
  const crystalBob = Math.sin(time * 3) * 2
  const crystalY = -12 + crystalBob
  g.poly([
    0, crystalY - 5,
    3.5, crystalY,
    0, crystalY + 5,
    -3.5, crystalY,
  ]).fill({ color: c, alpha: 0.95 }).stroke({ width: 0.8, color: palette.textNum })
  g.circle(0, crystalY, 1.2).fill({ color: palette.textNum, alpha: 0.9 })
}

export function createReadingSanctuaryGradient(
  isLocked: boolean,
  _isCleared: boolean,
  palette: GamificationThemePalette,
): FillGradient {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isLocked) {
    gradient.addColorStop(0, palette.surface0)
    gradient.addColorStop(0.5, palette.base)
    gradient.addColorStop(1, palette.crust)
    return gradient
  }

  gradient.addColorStop(0, palette.teal)
  gradient.addColorStop(0.45, palette.green)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderReadingSanctuaryEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked } = ctx
  if (isLocked) return

  const sporeContainer = new Container()
  sporeContainer.label = 'SanctuaryHealingSpores'
  const sporeGfx = new Graphics()
  sporeContainer.addChild(sporeGfx)
  nodeContainer.addChild(sporeContainer)

  const spores = Array.from({ length: 7 }, (_, i) => ({
    angle: (i * Math.PI * 2) / 7,
    radius: 12 + (i % 3) * 6,
    speed: 0.6 + (i % 4) * 0.2,
    size: 1.2 + (i % 2) * 0.8,
    phase: i * 1.1,
  }))

  animControllers.push((t) => {
    sporeGfx.clear()
    for (const sp of spores) {
      const curAngle = sp.angle + t * sp.speed
      const x = Math.cos(curAngle) * sp.radius
      const y = Math.sin(curAngle) * (sp.radius * 0.7) + Math.sin(t * 2 + sp.phase) * 3
      const alpha = 0.4 + 0.4 * Math.sin(t * 3 + sp.phase)

      sporeGfx.circle(x, y, sp.size).fill({ color: palette.tealNum, alpha })
      sporeGfx.circle(x, y, sp.size * 0.5).fill({ color: palette.textNum, alpha: alpha + 0.2 })
    }
  })
}

export const readingSanctuaryHex: HexTypeDefinition = {
  type: 'reading_sanctuary',
  title: 'Reading Sanctuary',
  drawTerrainGround: drawReadingSanctuaryTerrainGround,
  drawInsignia: drawReadingSanctuaryInsignia,
  createGradient: createReadingSanctuaryGradient,
  renderEffects: renderReadingSanctuaryEffects,
  getGlowColor: (palette) => palette.greenNum,
}
