import { Graphics, FillGradient, Container } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawBossLairTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.4 : 0.9

  // 1. Scorched volcanic caldera crater floor
  g.ellipse(0, 5, HEX_RADIUS * 0.82, HEX_RADIUS * 0.46)
    .fill({ color: palette.crustNum, alpha: 0.65 * alphaMod })

  // 2. Magma fissure fractures radiating to the hex perimeter corners
  const fissureAngles = [
    -Math.PI / 2,
    -Math.PI / 6,
    Math.PI / 6,
    Math.PI / 2,
    (5 * Math.PI) / 6,
    (-5 * Math.PI) / 6,
  ]
  for (const angle of fissureAngles) {
    const startX = Math.cos(angle) * (HEX_RADIUS * 0.25)
    const startY = Math.sin(angle) * (HEX_RADIUS * 0.25)
    const midX = Math.cos(angle + 0.1) * (HEX_RADIUS * 0.55)
    const midY = Math.sin(angle + 0.1) * (HEX_RADIUS * 0.55)
    const endX = Math.cos(angle) * (HEX_RADIUS * 0.85)
    const endY = Math.sin(angle) * (HEX_RADIUS * 0.85)

    g.moveTo(startX, startY)
      .quadraticCurveTo(midX, midY, endX, endY)
      .stroke({ width: 1.6, color: palette.redNum, alpha: 0.7 * alphaMod })
    g.moveTo(startX, startY)
      .quadraticCurveTo(midX, midY, endX, endY)
      .stroke({ width: 0.8, color: palette.peachNum, alpha: 0.85 * alphaMod })
  }

  // 3. Basalt rock shards around the rim
  for (let i = 0; i < 4; i++) {
    const rx = (i % 2 === 0 ? -1 : 1) * (16 + i * 2)
    const ry = -10 + i * 8
    g.poly([rx - 3, ry, rx, ry - 4, rx + 3, ry]).fill({ color: palette.surface0Num, alpha: 0.7 * alphaMod })
  }
}

export function drawBossLairInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.redNum)
  const darkC = palette.crustNum
  const basaltDark = palette.surface0Num
  const basaltLight = palette.surface2Num
  const lavaColor = palette.peachNum

  // 1. Jagged Basalt Mountain Crag Platform
  g.ellipse(0, 10, 14, 5).fill({ color: darkC, alpha: 0.65 })
  g.poly([
    -14, 9,
    -11, 4,
    -7, 7,
    0, 2,
    7, 7,
    11, 4,
    14, 9,
    0, 12,
  ]).fill({ color: basaltDark }).stroke({ width: 1.2, color: palette.textNum })

  // Glowing Magma Fissures across crag
  g.moveTo(-11, 6).lineTo(-4, 9).stroke({ width: 1.2, color: c })
  g.moveTo(4, 9).lineTo(11, 6).stroke({ width: 1.2, color: c })
  g.moveTo(0, 4).lineTo(0, 11).stroke({ width: 1, color: lavaColor })

  // 2. Colossal Obsidian Dragon / Demon Skull
  const skullBob = Math.sin(time * 2.2) * 1.5
  const skullY = -3 + skullBob

  // Spiraling Demon Horns
  const hornBob = Math.sin(time * 2.2 + 0.5) * 0.8
  // Left Horn
  g.poly([
    -6, skullY - 4,
    -13, skullY - 11 + hornBob,
    -19, skullY - 21 + hornBob,
    -12, skullY - 16 + hornBob,
    -4, skullY - 7,
  ]).fill({ color: basaltDark }).stroke({ width: 1.3, color: palette.textNum })
  // Right Horn
  g.poly([
    6, skullY - 4,
    13, skullY - 11 + hornBob,
    19, skullY - 21 + hornBob,
    12, skullY - 16 + hornBob,
    4, skullY - 7,
  ]).fill({ color: basaltDark }).stroke({ width: 1.3, color: palette.textNum })

  // Heavy Horn Ridges (Bone growth rings)
  g.moveTo(-10, skullY - 10).lineTo(-13, skullY - 14).stroke({ width: 0.9, color: palette.surface2Num })
  g.moveTo(10, skullY - 10).lineTo(13, skullY - 14).stroke({ width: 0.9, color: palette.surface2Num })

  // 3. Central Skull Brow & Cranium
  g.poly([
    -9, skullY - 8,
    0, skullY - 14,
    9, skullY - 8,
    7, skullY + 2,
    -7, skullY + 2,
  ]).fill({ color: basaltLight }).stroke({ width: 1.4, color: palette.textNum })

  // Temporal Bone Crest
  g.poly([-4, skullY - 9, 0, skullY - 15, 4, skullY - 9]).fill({ color: basaltDark })

  // 4. Glowing Lava Eye Sockets (Fiery Slits)
  const eyeFlare = Math.sin(time * 4) * 0.3 + 0.7
  g.poly([-6, skullY - 5, -2, skullY - 3, -6, skullY - 2]).fill({ color: darkC })
  g.poly([6, skullY - 5, 2, skullY - 3, 6, skullY - 2]).fill({ color: darkC })
  g.circle(-4, skullY - 3.5, 1.4).fill({ color: c, alpha: eyeFlare })
  g.circle(4, skullY - 3.5, 1.4).fill({ color: c, alpha: eyeFlare })
  g.circle(-4, skullY - 3.5, 0.7).fill({ color: lavaColor })
  g.circle(4, skullY - 3.5, 0.7).fill({ color: lavaColor })

  // 5. Spiked Fanged Jaw Portcullis
  g.rect(-6, skullY + 2, 12, 6).fill({ color: darkC }).stroke({ width: 1.1, color: palette.textNum })
  // Upper & Lower Razor Fangs
  g.poly([-5, 3 + hornBob, -3, 3 + hornBob, -4, 6 + hornBob]).fill({ color: palette.textNum })
  g.poly([3, 3 + hornBob, 5, 3 + hornBob, 4, 6 + hornBob]).fill({ color: palette.textNum })
  g.poly([-1, 7 + hornBob, 1, 7 + hornBob, 0, 4.5 + hornBob]).fill({ color: palette.textNum })
}

export function createBossLairGradient(
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
    gradient.addColorStop(1, palette.base)
    return gradient
  }

  if (isLocked) {
    gradient.addColorStop(0, palette.maroon)
    gradient.addColorStop(0.45, palette.base)
    gradient.addColorStop(1, palette.surface0)
    return gradient
  }

  gradient.addColorStop(0, palette.red)
  gradient.addColorStop(0.45, palette.maroon)
  gradient.addColorStop(1, palette.surface0)
  return gradient
}

export function renderBossLairEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers, isLocked, isCleared } = ctx
  if (isLocked || isCleared) return

  const lavaContainer = new Container()
  lavaContainer.label = 'BossMagmaFlares'
  const lavaGfx = new Graphics()
  lavaContainer.addChild(lavaGfx)
  nodeContainer.addChild(lavaContainer)

  const shockwaves = [
    { delay: 0, maxR: HEX_RADIUS + 14 },
    { delay: 0.5, maxR: HEX_RADIUS + 14 },
  ]

  animControllers.push((t) => {
    lavaGfx.clear()

    // 1. Seismic Shockwave pulses
    for (const sw of shockwaves) {
      const progress = ((t * 0.7 + sw.delay) % 1)
      const r = progress * sw.maxR
      const alpha = (1 - progress) * 0.4

      lavaGfx.circle(0, 0, r).stroke({ width: 2, color: palette.redNum, alpha })
    }

    // 2. Magma Ember specks floating from fissures
    for (let i = 0; i < 4; i++) {
      const progress = ((t * 0.9 + i * 0.25) % 1)
      const ey = 8 - progress * 24
      const ex = (i % 2 === 0 ? -1 : 1) * (6 + Math.sin(t * 3 + i) * 6)
      const alpha = (1 - progress) * 0.9

      lavaGfx.circle(ex, ey, 1.2).fill({ color: palette.peachNum, alpha })
    }
  })
}

export const bossLairHex: HexTypeDefinition = {
  type: 'boss_lair',
  title: 'Boss Lair',
  drawTerrainGround: drawBossLairTerrainGround,
  drawInsignia: drawBossLairInsignia,
  createGradient: createBossLairGradient,
  renderEffects: renderBossLairEffects,
  getGlowColor: (palette) => palette.redNum,
}
