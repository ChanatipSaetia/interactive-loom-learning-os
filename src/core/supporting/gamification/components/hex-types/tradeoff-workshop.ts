import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawTradeoffWorkshopTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Crushed dark cinder & gravel forge yard ground
  g.ellipse(0, 6, HEX_RADIUS * 0.78, HEX_RADIUS * 0.44)
    .fill({ color: palette.crustNum, alpha: 0.55 * alphaMod })

  // 2. Heavy timber workshop plank beams under the anvil
  g.rect(-18, 9, 36, 4)
    .fill({ color: palette.surface0Num, alpha: 0.45 * alphaMod })
    .stroke({ width: 0.8, color: palette.surface1Num, alpha: 0.4 * alphaMod })

  // 3. Charcoal dust specks and cooling water barrel rim
  g.ellipse(18, 2, 4, 2.5)
    .fill({ color: palette.surface1Num, alpha: 0.5 * alphaMod })
    .stroke({ width: 0.7, color: palette.tealNum, alpha: 0.6 * alphaMod })
}

export function drawTradeoffWorkshopInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.yellowNum)
  const darkC = palette.crustNum
  const anvilSteel = palette.overlay0Num
  const anvilDark = palette.surface2Num
  const timberColor = palette.surface1Num
  const heatOrange = palette.peachNum

  // 1. Heavy Oak Tree Stump Base
  g.ellipse(0, 10, 13, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.poly([
    -10, 10,
    -8, 3,
    8, 3,
    10, 10,
  ]).fill({ color: timberColor }).stroke({ width: 1.2, color: palette.textNum })
  // Bark grain lines
  g.moveTo(-4, 3).lineTo(-5, 10).stroke({ width: 0.8, color: palette.surface0Num })
  g.moveTo(4, 3).lineTo(5, 10).stroke({ width: 0.8, color: palette.surface0Num })

  // 2. Master Armorer Steel Anvil
  // Anvil Foot
  g.rect(-9, 1, 18, 3).fill({ color: anvilDark }).stroke({ width: 1, color: palette.textNum })
  // Anvil Waist
  g.rect(-5, -3, 10, 4).fill({ color: anvilSteel }).stroke({ width: 1, color: palette.textNum })
  // Anvil Top Face & Horn (Left horn conical point, right square heel)
  g.poly([
    -12, -7,
    -5, -3,
    9, -3,
    11, -5,
    11, -7,
    -12, -7,
  ]).fill({ color: anvilSteel }).stroke({ width: 1.3, color: palette.textNum })
  // Top Face Highlight Rim
  g.moveTo(-6, -3).lineTo(8, -3).stroke({ width: 1, color: palette.textNum, alpha: 0.8 })

  // 3. Glowing Heated Blade Blank on Anvil (Pulsing Forge Heat)
  const heatGlow = Math.sin(time * 4) * 0.3 + 0.7
  g.poly([
    -3, -8,
    7, -8,
    9, -10,
    -1, -10,
  ]).fill({ color: heatOrange, alpha: heatGlow }).stroke({ width: 0.9, color: c })

  // 4. Steel Cross-Peen Smithing Hammer (Angled striking pose)
  const hammerBob = Math.sin(time * 3) * 2

  // Hammer Handle (Ash wood)
  g.moveTo(2, -10 + hammerBob)
    .lineTo(13, -22 + hammerBob)
    .stroke({ width: 2, color: timberColor, cap: 'round' })
    .stroke({ width: 0.8, color: palette.textNum })

  // Hammer Head (Steel)
  g.poly([
    -2, -13 + hammerBob,
    6, -10 + hammerBob,
    4, -7 + hammerBob,
    -4, -10 + hammerBob,
  ]).fill({ color: anvilDark }).stroke({ width: 1.1, color: palette.textNum })
  // Hammer Wedge Pin
  g.circle(1, -10 + hammerBob, 0.8).fill({ color: c })
}

export function createTradeoffWorkshopGradient(
  isLocked: boolean,
  _isCleared: boolean,
  palette: GamificationThemePalette,
): FillGradient {
  const gradient = new FillGradient({
    start: { x: 0, y: -HEX_RADIUS },
    end: { x: 0, y: HEX_RADIUS },
  })

  if (isLocked) {
    gradient.addColorStop(0, palette.surface1)
    gradient.addColorStop(0.5, palette.surface0)
    gradient.addColorStop(1, palette.base)
    return gradient
  }

  gradient.addColorStop(0, palette.yellow)
  gradient.addColorStop(0.45, palette.peach)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderTradeoffWorkshopEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked } = ctx
  if (isLocked) return

  const sparkContainer = new Container()
  sparkContainer.label = 'ForgeFlyingSparks'
  const sparkGfx = new Graphics()
  sparkContainer.addChild(sparkGfx)
  nodeContainer.addChild(sparkContainer)

  const forgeSparks = Array.from({ length: 6 }, (_, i) => ({
    x: (i % 2 === 0 ? -1 : 1) * (4 + i * 2),
    speedY: 10 + i * 3,
    size: 1 + (i % 2) * 0.6,
    phase: i * 0.7,
  }))

  animControllers.push((t) => {
    sparkGfx.clear()
    for (const sp of forgeSparks) {
      const progress = ((t * 0.9 + sp.phase) % 1)
      const sy = -8 - progress * sp.speedY
      const sx = sp.x + Math.sin(t * 4 + sp.phase) * 4
      const alpha = (1 - progress) * 0.85

      sparkGfx.circle(sx, sy, sp.size).fill({ color: palette.peachNum, alpha })
      sparkGfx.circle(sx, sy, sp.size * 0.5).fill({ color: palette.textNum, alpha: alpha + 0.2 })
    }
  })
}

export const tradeoffWorkshopHex: HexTypeDefinition = {
  type: 'tradeoff_workshop',
  title: 'Tradeoff Workshop',
  drawTerrainGround: drawTradeoffWorkshopTerrainGround,
  drawInsignia: drawTradeoffWorkshopInsignia,
  createGradient: createTradeoffWorkshopGradient,
  renderEffects: renderTradeoffWorkshopEffects,
  getGlowColor: (palette) => palette.yellowNum,
}
