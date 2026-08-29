import { Graphics, Container, FillGradient } from 'pixi.js'
import { HEX_RADIUS } from '../hex-geometry'
import { GamificationThemePalette, getGamificationThemePalette } from '../../theme-palette'
import { HexInsigniaOptions, HexTypeDefinition, HexTypeEffectContext } from './types'

export function drawArchiveSpireTerrainGround(
  g: Graphics,
  options: HexInsigniaOptions = {},
) {
  if (!g || g.destroyed) return
  g.clear()

  const { palette = getGamificationThemePalette(), isLocked = false } = options
  const alphaMod = isLocked ? 0.35 : 0.85

  // 1. Geometric Library Mosaic Flagstones
  const tileRadius = HEX_RADIUS * 0.72
  g.poly([
    -tileRadius, 0,
    -tileRadius / 2, -tileRadius * 0.7,
    tileRadius / 2, -tileRadius * 0.7,
    tileRadius, 0,
    tileRadius / 2, tileRadius * 0.7,
    -tileRadius / 2, tileRadius * 0.7,
  ])
    .fill({ color: palette.surface0Num, alpha: 0.35 * alphaMod })
    .stroke({ width: 1.0, color: palette.skyNum, alpha: 0.25 * alphaMod })

  // 2. Concentric Runic Index Ring
  g.circle(0, 0, HEX_RADIUS * 0.45)
    .stroke({ width: 0.8, color: palette.sapphireNum, alpha: 0.3 * alphaMod })

  // 3. Ambient Codex Glyph Points
  const glyphDots = [
    { x: -14, y: -10 },
    { x: 14, y: -10 },
    { x: -16, y: 12 },
    { x: 16, y: 12 },
    { x: 0, y: -18 },
    { x: 0, y: 18 },
  ]
  for (const pt of glyphDots) {
    g.circle(pt.x, pt.y, 1.2).fill({ color: palette.skyNum, alpha: 0.6 * alphaMod })
  }
}

export function drawArchiveSpireInsignia(
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

  const c = isDefeated ? palette.overlay2Num : (color ?? palette.skyNum)
  const spireBaseColor = palette.surface1Num
  const spireTrimColor = palette.surface2Num
  const darkC = palette.crustNum
  const glowColor = palette.skyNum

  // 1. Heavy Stone Base Terrace
  g.ellipse(0, 11, 15, 4.5).fill({ color: darkC, alpha: 0.55 })
  g.ellipse(0, 10, 14, 3.8).fill({ color: spireBaseColor }).stroke({ width: 1.1, color: spireTrimColor })
  g.ellipse(0, 8, 10, 2.8).fill({ color: palette.surface0Num }).stroke({ width: 0.9, color: spireTrimColor })

  // 2. Central Archive Spire / Library Obelisk
  g.poly([
    -6, 8,
    -4, -14,
    0, -20,
    4, -14,
    6, 8,
  ])
    .fill({ color: spireBaseColor })
    .stroke({ width: 1.1, color: palette.textNum })

  // Spire Rib Lines & Windows
  g.moveTo(0, 8).lineTo(0, -18).stroke({ width: 0.9, color: palette.textNum })
  g.rect(-2, -5, 4, 6).fill({ color: darkC }).stroke({ width: 0.8, color: c })

  // 3. Floating Winged Scrolls / Taxonomy Codexes
  const bob1 = Math.sin(time * 2.2) * 1.5
  const bob2 = Math.sin(time * 2.2 + Math.PI) * 1.5

  // Left Floating Scroll
  g.poly([
    -14, -2 + bob1,
    -8, -5 + bob1,
    -8, 1 + bob1,
    -14, 4 + bob1,
  ])
    .fill({ color: palette.surface0Num })
    .stroke({ width: 0.9, color: c })
  g.moveTo(-12, 0 + bob1).lineTo(-10, -1 + bob1).stroke({ width: 0.7, color: palette.textNum })

  // Right Floating Scroll
  g.poly([
    8, -5 + bob2,
    14, -2 + bob2,
    14, 4 + bob2,
    8, 1 + bob2,
  ])
    .fill({ color: palette.surface0Num })
    .stroke({ width: 0.9, color: c })
  g.moveTo(10, -1 + bob2).lineTo(12, 0 + bob2).stroke({ width: 0.7, color: palette.textNum })

  // 4. Arcane Astral Beacon Lantern at Apex
  const pulse = Math.sin(time * 3.0) * 0.2
  g.circle(0, -20, 4.5 + pulse).fill({ color: glowColor, alpha: 0.35 })
  g.circle(0, -20, 2.5).fill({ color: palette.rosewaterNum }).stroke({ width: 0.8, color: 0xffffff })
}

export function createArchiveSpireGradient(
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

  gradient.addColorStop(0, palette.sapphire)
  gradient.addColorStop(0.45, palette.sky)
  gradient.addColorStop(1, palette.crust)
  return gradient
}

export function renderArchiveSpireEffects(ctx: HexTypeEffectContext) {
  const { nodeContainer, palette, animControllers } = ctx

  const archiveFx = new Container()
  const dustParticles: Array<{
    gfx: Graphics
    baseX: number
    baseY: number
    speed: number
    phase: number
    radius: number
    color: number
  }> = []

  const colors = [palette.skyNum, palette.sapphireNum, palette.lavenderNum, palette.rosewaterNum]

  for (let i = 0; i < 7; i++) {
    const g = new Graphics()
    const p = {
      gfx: g,
      baseX: (Math.random() - 0.5) * 28,
      baseY: -8 + (Math.random() - 0.5) * 24,
      speed: 0.9 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      radius: 0.9 + Math.random() * 1.1,
      color: colors[i % colors.length],
    }
    archiveFx.addChild(g)
    dustParticles.push(p)
  }

  nodeContainer.addChild(archiveFx)

  animControllers.push((t) => {
    for (const p of dustParticles) {
      const x = p.baseX + Math.sin(t * p.speed + p.phase) * 5
      const y = p.baseY - ((t * 8 * p.speed + p.phase * 6) % 24)
      const alpha = Math.sin((y + 20) / 24 * Math.PI) * 0.7

      p.gfx.clear()
      p.gfx.circle(x, y, p.radius).fill({ color: p.color, alpha: Math.max(0, alpha) })
    }
  })
}

export const archiveSpireHex: HexTypeDefinition = {
  type: 'archive_spire',
  title: 'Archive Spire',
  drawTerrainGround: drawArchiveSpireTerrainGround,
  drawInsignia: drawArchiveSpireInsignia,
  createGradient: createArchiveSpireGradient,
  renderEffects: renderArchiveSpireEffects,
  getGlowColor: (palette) => palette.skyNum,
}
