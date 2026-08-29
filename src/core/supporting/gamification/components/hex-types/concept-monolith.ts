import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawConceptMonolithTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Arcane Astral Circle Matrix
  g.circle(0, 0, HEX_RADIUS * 0.7)
    .stroke({ width: 0.9, color: palette.mauveNum, alpha: 0.3 * alphaMod })
  g.circle(0, 0, HEX_RADIUS * 0.42)
    .stroke({ width: 0.8, color: palette.lavenderNum, alpha: 0.25 * alphaMod })

  // 2. Crystal Cluster Ground Deposits
  const crystalFormations = [
    { x: -16, y: -8, r: 4 },
    { x: 16, y: -8, r: 4 },
    { x: -12, y: 16, r: 5 },
    { x: 12, y: 16, r: 5 },
  ]
  for (const c of crystalFormations) {
    g.poly([
      c.x, c.y - c.r,
      c.x + c.r * 0.7, c.y,
      c.x, c.y + c.r * 0.5,
      c.x - c.r * 0.7, c.y,
    ])
      .fill({ color: palette.surface0Num, alpha: 0.7 * alphaMod })
      .stroke({ width: 0.8, color: palette.lavenderNum, alpha: 0.6 * alphaMod })
  }
}

export function drawConceptMonolithInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.lavenderNum)
  const obsidianBody = palette.surface0Num
  const trimColor = palette.surface2Num
  const darkC = palette.crustNum

  // 1. Heavy Stepped Dias
  g.ellipse(0, 11, 15, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 10, 13.5, 3.8).fill({ color: palette.surface1Num }).stroke({ width: 1.1, color: trimColor })

  // 2. Central Carved Obsidian Monolith
  g.poly([
    -5, 9,
    -4, -15,
    0, -19,
    4, -15,
    5, 9,
  ])
    .fill({ color: obsidianBody })
    .stroke({ width: 1.1, color: palette.textNum })

  // Monolith Inscription Runes
  g.moveTo(0, 7).lineTo(0, -17).stroke({ width: 0.9, color: c })
  g.moveTo(-2, -3).lineTo(2, -3).stroke({ width: 0.8, color: c })
  g.moveTo(-2, 3).lineTo(2, 3).stroke({ width: 0.8, color: c })

  // 3. Orbiting Floating Memory Crystals
  const crystalCount = 3
  const rot = time * 1.2

  for (let i = 0; i < crystalCount; i++) {
    const angle = rot + (i * Math.PI * 2) / crystalCount
    const cx = Math.cos(angle) * 13
    const cy = Math.sin(angle) * 6 - 3

    // Floating Crystal Shard
    g.poly([
      cx, cy - 3.5,
      cx + 2.5, cy,
      cx, cy + 3.5,
      cx - 2.5, cy,
    ])
      .fill({ color: palette.mauveNum })
      .stroke({ width: 0.8, color: 0xffffff })
  }

  // 4. Monolith Apex Spark
  const apexGlow = Math.sin(time * 3.0) * 0.2
  g.circle(0, -19, 3.5 + apexGlow).fill({ color: palette.lavenderNum, alpha: 0.35 })
  g.circle(0, -19, 1.8).fill({ color: palette.rosewaterNum })
}

export function createConceptMonolithGradient(
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

  gradient.addColorStop(0, palette.pink)
  gradient.addColorStop(0.45, palette.mauve)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderConceptMonolithEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const monoFx = new Container()
  const ringGfx = new Graphics()
  monoFx.addChild(ringGfx)
  nodeContainer.addChild(monoFx)

  animControllers.push((t) => {
    ringGfx.clear()
    const pulseProgress = (t * 0.7) % 1
    const r = 8 + pulseProgress * 14
    const alpha = (1 - pulseProgress) * 0.7

    ringGfx.ellipse(0, -3, r, r * 0.55).stroke({
      width: 1.5 * (1 - pulseProgress * 0.5),
      color: palette.mauveNum,
      alpha,
    })
  })
}

export const conceptMonolithHex: HexTypeDefinition = {
  type: 'concept_monolith',
  title: 'Concept Monolith',
  drawTerrainGround: drawConceptMonolithTerrainGround,
  drawInsignia: drawConceptMonolithInsignia,
  createGradient: createConceptMonolithGradient,
  renderEffects: renderConceptMonolithEffects,
  getGlowColor: (palette) => palette.lavenderNum,
}
